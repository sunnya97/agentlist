// Three questions the single computerUse field used to answer at once:
// can it act on your machine, does it have a machine of its own that you can
// reach, and does any of it continue when your machine is off.
// Each facet is optional. An absent facet means unknown, never "no".

export const onYourComputer = {
  full:'Controls your computer',
  partial:'Limited access to your computer',
  none:'No access to your computer'
};

export const agentComputer = {
  cloud:'Has its own cloud computer',
  local:'Runs on hardware you own',
  none:'No computer of its own'
};

// Whether you can see or drive the agent's own machine, not just read results.
export const agentScreenAccess = {
  takeover:'Watch and take over',
  view:'Watch only',
  none:'No remote access'
};

export const whileYouAreOff = {
  yes:'Keeps working',
  no:'Stops',
  partial:'Partly continues'
};

export const computeFacets = {onYourComputer,agentComputer,whileYouAreOff};

export const computeLabels = {
  onYourComputer:'Your computer',
  agentComputer:'Its own computer',
  whileYouAreOff:'Works while your computer is off'
};

// One compact cell instead of three columns: a slot per question, filled when
// the answer is yes, outlined when it is no, dashed when nobody has said.
export const computeTone = (facet, value) => {
  if(!value) return 'unknown';
  if(facet === 'onYourComputer') return {full:'yes',partial:'partial',none:'no'}[value.state];
  if(facet === 'agentComputer') return {cloud:'yes',local:'yes',none:'no'}[value.state];
  return {yes:'yes',partial:'partial',no:'no'}[value.state];
};

export const computeIcons = {
  onYourComputer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="11" rx="2"/><path d="M2 20h20"/></svg>',
  agentComputer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
  whileYouAreOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v8"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/></svg>'
};

// Table wording. The full sentence stays in the claim value.
const short = {
  onYourComputer:{full:'Yes',partial:'Limited',none:'No'},
  agentComputer:{cloud:'Cloud',local:'Own hardware',none:'None'},
  whileYouAreOff:{yes:'Keeps working',no:'Stops',partial:'Partly'}
};
const platformShort = {macos:'Mac',windows:'Windows',linux:'Linux',ios:'iOS',android:'Android'};
export const computeSummary = (facet, value) => {
  if(!value) return 'Not specified';
  const base = short[facet]?.[value.state] || computeFacets[facet]?.[value.state] || value.state;
  if(facet === 'onYourComputer' && value.platforms?.length)
    return `${base} · ${value.platforms.map(p=>platformShort[p]||p).join(', ')}`;
  if(facet === 'agentComputer' && value.remote === 'none') return `${base} · no remote view`;
  if(facet === 'agentComputer' && value.remote) return `${base} · ${agentScreenAccess[value.remote]}`;
  return base;
};
