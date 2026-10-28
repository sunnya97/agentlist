// What it costs, as structure rather than prose. The `pricing` claim keeps the
// detail — tiers, credits, trial conditions — and this object answers the parts
// a table can sort: which kind of price it is, the lowest recurring amount, and
// what that amount buys. A record with no established price carries no cost
// object at all; absent must never read as "free".
export const costModels = {
  free:'Free',
  freemium:'Free tier and paid tiers',
  paid:'Paid only',
  bundled:'Only inside a larger subscription',
  device:'Hardware purchase'
};

// A free trial is not a free tier, and bundled is not the same as paid: the
// money goes to a subscription bought for more than this agent.
export const costModelNotes = {
  free:'No paid tier for the software itself.',
  freemium:'A usable free tier, with paid tiers above it.',
  paid:'No usable free tier; a trial does not count as one.',
  bundled:'Obtainable only as part of a larger subscription.',
  device:'The main cost is hardware you buy once.'
};

export const costPeriods = {month:'a month',year:'a year',once:'one-time'};
export const periodShort = {month:'/mo',year:'/yr',once:''};
export const currencySymbols = {USD:'$',CNY:'CN¥',EUR:'€'};

// Table wording: one mark per kind, so the column can be scanned down.
export const costTone = {free:'free',freemium:'free',paid:'paid',bundled:'bundled',device:'device'};
export const costPill = {free:'Free',freemium:'Freemium',paid:'Paid',bundled:'Bundled',device:'Device'};

// Keep whole prices whole and cent prices exact: $2,499 and $19.99.
const money = (floor, currency) => {
  const symbol = currencySymbols[currency] || `${currency} `;
  const digits = Number.isInteger(floor) ? 0 : 2;
  return symbol + floor.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:2});
};

// The recurring or one-time amount on its own, or '' where none is published.
export const costAmount = cost =>
  !cost || cost.floor === null || cost.floor === undefined ? '' : money(cost.floor,cost.currency) + (periodShort[cost.period] || '');

// One short cell: `Free`, `Free · $20/mo`, `$49/mo`, `In ChatGPT Pro · $100/mo`,
// `$2,499 device`. An unpublished amount says so instead of inventing one.
export const costShort = cost => {
  if(!cost) return '';
  const price = costAmount(cost);
  if(cost.model === 'free') return 'Free';
  if(cost.model === 'device') return price ? `${price} device` : 'Device purchase';
  if(cost.model === 'freemium') return price ? `Free · ${price}` : 'Free · paid tiers';
  if(cost.model === 'bundled') return price ? `In ${cost.bundledWith} · ${price}` : `In ${cost.bundledWith}`;
  return price || 'Paid · price not published';
};

// Full wording for a profile or a comparison row, where the note fits.
export const costSummary = cost => {
  if(!cost) return 'Not specified';
  const base = costShort(cost);
  return cost.note ? `${base} · ${cost.note}` : base;
};
