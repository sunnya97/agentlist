export const fieldGroups = [
  {id:'capabilities',label:'What it can do',fields:[
    ['uniqueFeatures','What stands out'],
    ['computerUse','Computer use'],
    ['browserUse','Browser control'],
    ['voice','Voice & ambient listening'],
    ['scheduling','Background work & triggers']
  ]},
  {id:'access',label:'Apps & access',fields:[
    ['desktopApps','Native desktop apps'],
    ['mobileApps','iPhone & Android apps'],
    ['channels','Web & messaging'],
    ['hardware','Native hardware'],
    ['api','Developer API']
  ]},
  {id:'models',label:'Models & plans',fields:[
    ['models','Models & providers'],
    ['byom','Bring your own model'],
    ['bundledPlan','Included in another plan'],
    ['pricing','Price & usage costs']
  ]},
  {id:'control',label:'Ownership & control',fields:[
    ['license','Open source & license'],
    ['hosting','Where it runs'],
    ['passwordManager','Passwords & credentials'],
    ['approvals','Approval before actions'],
    ['memory','What it remembers'],
    ['portability','Edit & export your data'],
    ['security','Privacy & isolation'],
    ['availability','Availability & access']
  ]}
];

export const fields = fieldGroups.flatMap(group=>group.fields);

// Compact directory columns can combine several detailed comparison fields.
export const compositeFields = {nativeApps:['desktopApps','mobileApps','channels']};

// Editorial overview: the original flagship shortlist, then distinct personal
// agents. Unlisted projects follow alphabetically; this is not a quality score.
export const featuredOrder = [
  'dots','claude-duet','grok-bot','hark','muse','hermes','openclaw',
  'underdog','poke','ambi','cue','town','wabi','instinct','lindy'
];

export const directoryViews = {
  overview:{label:'Overview',fields:[['uniqueFeatures','What stands out'],['computerUse','Computer use'],['nativeApps','Native apps']]},
  capabilities:{label:'Capabilities',fields:[['browserUse','Browser control'],['passwordManager','Passwords'],['api','Developer API'],['voice','Voice & listening']]},
  models:{label:'Models & plans',fields:[['models','Models'],['byom','Bring your own model'],['bundledPlan','Bundled with'],['pricing','Cost']]},
  access:{label:'Apps & hardware',fields:[['nativeApps','Native apps'],['hardware','Native hardware'],['channels','Web & messaging'],['api','Developer API']]},
  control:{label:'Ownership & control',fields:[['license','Open source'],['hosting','Where it runs'],['memory','Memory'],['scheduling','Background work']]}
};
