// Vote counts for Agentlist, keyed to GitHub accounts.
//
// The whole anti-abuse story is one unique constraint: a GitHub account can
// register a single vote per agent, ever. No rate limiting, no IP heuristics,
// no scoring — an account with history is the credential.
//
// Secrets: GITHUB_CLIENT_SECRET and SESSION_SECRET via `wrangler secret put`.
// Never in this file and never in the repository.

const JSON_HEADERS = {'content-type': 'application/json; charset=utf-8'};
const SESSION_DAYS = 30;

const cors = env => ({
  'access-control-allow-origin': env.ALLOWED_ORIGIN,
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'vary': 'Origin',
});

const send = (env, body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {status, headers: {...JSON_HEADERS, ...cors(env), ...extra}});

// ── signed session cookie ───────────────────────────────────────────────────
// A cookie holding the GitHub id, signed so it cannot be forged. We never store
// the GitHub access token: it is used once to read the account id, then dropped.

const encoder = new TextEncoder();

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function seal(payload, secret) {
  const body = btoa(JSON.stringify(payload)).replace(/=+$/, '');
  return `${body}.${await sign(body, secret)}`;
}

async function open(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  if (await sign(body, secret) !== mac) return null;
  try {
    const payload = JSON.parse(atob(body));
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

const readCookie = (request, name) =>
  (request.headers.get('cookie') || '').split(';')
    .map(part => part.trim().split('='))
    .find(([key]) => key === name)?.[1];

const sessionCookie = token =>
  `al_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`;

// ── handlers ────────────────────────────────────────────────────────────────

async function counts(env) {
  const {results} = await env.DB.prepare(
    'SELECT agent_id, COUNT(*) AS votes FROM votes GROUP BY agent_id').all();
  return Object.fromEntries((results || []).map(row => [row.agent_id, row.votes]));
}

async function viewer(request, env) {
  const session = await open(readCookie(request, 'al_session'), env.SESSION_SECRET);
  if (!session) return {signedIn: false, voted: []};
  const {results} = await env.DB.prepare(
    'SELECT agent_id FROM votes WHERE github_id = ?').bind(session.id).all();
  return {signedIn: true, login: session.login, voted: (results || []).map(r => r.agent_id)};
}

async function startSignIn(request, env) {
  const back = new URL(request.url).searchParams.get('back') || env.ALLOWED_ORIGIN;
  // `state` ties the callback to this browser and carries where to return to.
  const state = await seal({back, exp: Date.now() + 10 * 60 * 1000}, env.SESSION_SECRET);
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${new URL(request.url).origin}/auth/callback`);
  authorize.searchParams.set('state', state);
  // No scopes: the default grant reads only public profile data, which is all
  // an identity check needs. Asking for more would be asking for more than we use.
  authorize.searchParams.set('scope', '');
  return Response.redirect(authorize.toString(), 302);
}

async function finishSignIn(request, env) {
  const url = new URL(request.url);
  const state = await open(url.searchParams.get('state'), env.SESSION_SECRET);
  if (!state) return new Response('Sign-in link expired. Please try again.', {status: 400});

  const exchange = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {accept: 'application/json', 'content-type': 'application/json'},
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: url.searchParams.get('code'),
      redirect_uri: `${url.origin}/auth/callback`,
    }),
  }).then(r => r.json()).catch(() => null);

  if (!exchange?.access_token) return new Response('GitHub declined the sign-in.', {status: 400});

  const account = await fetch('https://api.github.com/user', {
    headers: {authorization: `Bearer ${exchange.access_token}`,
      accept: 'application/vnd.github+json', 'user-agent': 'agentlist-votes'},
  }).then(r => r.json()).catch(() => null);

  if (!account?.id) return new Response('Could not read your GitHub account.', {status: 400});

  const token = await seal({id: account.id, login: account.login,
    exp: Date.now() + SESSION_DAYS * 86400 * 1000}, env.SESSION_SECRET);
  return new Response(null, {status: 302,
    headers: {location: state.back, 'set-cookie': sessionCookie(token)}});
}

async function castVote(request, env, method) {
  const session = await open(readCookie(request, 'al_session'), env.SESSION_SECRET);
  if (!session) return send(env, {error: 'Sign in with GitHub to vote.'}, 401);

  const {agent} = await request.json().catch(() => ({}));
  if (typeof agent !== 'string' || !/^[a-z0-9-]{1,64}$/.test(agent))
    return send(env, {error: 'Unknown agent.'}, 400);

  if (method === 'DELETE') {
    await env.DB.prepare('DELETE FROM votes WHERE agent_id = ? AND github_id = ?')
      .bind(agent, session.id).run();
  } else {
    // The primary key makes a second vote a no-op rather than an error.
    await env.DB.prepare('INSERT OR IGNORE INTO votes (agent_id, github_id) VALUES (?, ?)')
      .bind(agent, session.id).run();
  }

  const row = await env.DB.prepare('SELECT COUNT(*) AS votes FROM votes WHERE agent_id = ?')
    .bind(agent).first();
  return send(env, {agent, votes: row?.votes ?? 0, voted: method !== 'DELETE'});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: cors(env)});

    switch (`${request.method} ${url.pathname}`) {
      case 'GET /votes':         return send(env, {counts: await counts(env)});
      case 'GET /me':            return send(env, await viewer(request, env));
      case 'GET /auth/start':    return startSignIn(request, env);
      case 'GET /auth/callback': return finishSignIn(request, env);
      case 'POST /vote':         return castVote(request, env, 'POST');
      case 'DELETE /vote':       return castVote(request, env, 'DELETE');
      case 'POST /auth/signout':
        return send(env, {signedIn: false}, 200,
          {'set-cookie': 'al_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'});
      default: return send(env, {error: 'Not found'}, 404);
    }
  },
};
