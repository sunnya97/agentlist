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
