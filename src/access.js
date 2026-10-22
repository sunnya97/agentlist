// Can you actually get it? Kept separate from the agent category and from the
// prose availability claim, so "shipping" is never inferred from "listed".
export const accessStates = {
  available:'Available',
  waitlist:'Waitlist',
  reservation:'Reservation',
  announced:'Announced',
  unverified:'Access unverified'
};

// Catches that survive an otherwise open signup. A product can carry several.
export const accessRestrictions = {
  plan:'Requires a paid plan',
  region:'Limited regions',
  age:'Age restricted',
  rollout:'Gradual rollout',
  invite:'Invite required'
};

// Short directory wording. `available` with no catch needs no qualifier.
export const accessSummary = access => {
  if(!access) return '';
  const caveats = (access.restrictions||[]).map(key=>({plan:'paid plan',region:'some regions',age:'age limits',rollout:'rolling out',invite:'invite'})[key]).filter(Boolean);
  const base = accessStates[access.state];
  return caveats.length ? `${base} · ${caveats.join(', ')}` : base;
};
