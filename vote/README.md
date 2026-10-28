# Vote service

Upvotes for agentlist.wiki, keyed to GitHub accounts. A Cloudflare Worker with a
D1 table; the whole anti-abuse story is one unique constraint, so a GitHub
account registers a single vote per agent and no scoring or rate limiting is
needed.

The Worker never stores a GitHub access token. It reads the account id once at
sign-in and drops it; the browser keeps a signed cookie holding only that id.
Sign-in requests no scopes, so it sees only public profile data.

## Setup

1. **Create a GitHub OAuth app** — https://github.com/settings/developers → New OAuth App
   - Application name: `Agentlist`
   - Homepage URL: `https://agentlist.wiki`
   - Authorization callback URL: `https://agentlist-votes.<subdomain>.workers.dev/auth/callback`
   - Generate a client secret and keep it to hand.

2. **Create the database and apply the schema**

   ```sh
   npx wrangler d1 create agentlist-votes      # copy the id into wrangler.toml
   npx wrangler d1 execute agentlist-votes --remote --file=schema.sql
   ```

3. **Set the client id and the secrets**

   ```sh
   # client id is public and belongs in wrangler.toml under [vars]
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler secret put SESSION_SECRET      # any long random string
   ```

4. **Deploy**

   ```sh
   npx wrangler deploy
   ```

5. Point `voteApi` in `data/catalog.json` at the deployed Worker URL. Leave it
   unset and the site simply renders without voting.

## Endpoints

| | |
|---|---|
| `GET /votes` | `{counts: {agentId: n}}` for everyone |
| `GET /me` | `{signedIn, login, voted: [agentId]}` for this browser |
| `GET /auth/start?back=<url>` | begins sign-in, returns to `back` |
| `POST /vote` `{agent}` | records a vote |
| `DELETE /vote` `{agent}` | withdraws it |
| `POST /auth/signout` | clears the cookie |
