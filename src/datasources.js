// How open a source of personal data is to anyone who is not its owner.
// This is a property of the platform. An agent's own record says which path
// it takes to that source.
export const thirdPartyAccess = {
  open:'Open to third parties',
  gated:'Open, with review',
  portability:'EU portability only',
  closed:'First-party only',
  none:'Reachable by nobody'
};

// The route a particular agent takes. "none" is a real answer, not a gap.
export const accessPaths = {
  'first-party':'First-party',
  'official-api':'Official API',
  portability:'EU portability',
  automation:'Browser automation',
  none:'Cannot reach it'
};

export const pathTone = {'first-party':'yes','official-api':'yes',portability:'partial',automation:'partial',none:'no'};
