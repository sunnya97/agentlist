export const companyTypes = {public:'Public company',lab:'Major AI lab',startup:'Startup',established:'Established company',independent:'Independent project',research:'Research group'};
export const launchKinds = {launch:'Public launch',preview:'Research preview',beta:'Public beta',announcement:'Announcement',release:'Open-source release',update:'Major update'};

export const fieldGroups = [
  {id:'company',label:'Company & launch',fields:[['companyType','Company type'],['companyStage','Company stage'],['funding','Disclosed funding'],['launchDate','Launch date']]},
  {id:'capabilities',label:'What it can do',fields:[
    ['uniqueFeatures','What stands out'],
    ['computerUse','Computer use'],
    ['onYourComputer','Controls your computer'],
    ['agentComputer','Its own computer'],
    ['whileYouAreOff','Works while your computer is off'],
    ['browserUse','Browser control'],
    ['voice','Voice & ambient listening'],
    ['scheduling','Background work & triggers']
  ]},
  {id:'access',label:'Apps & access',fields:[
    ['desktopApps','Native desktop apps'],
    ['mobileApps','iPhone & Android apps'],
    ['channels','Web & messaging'],
    ['messaging','Messaging services'],
    ['hardware','Native hardware'],
    ['api','Developer API']
  ]},
  {id:'models',label:'Models & plans',fields:[
    ['models','Models & providers'],
    ['byom','Bring your own model'],
    ['bundledPlan','Included in another plan'],
    ['pricing','Price & usage costs']
  ]},
  {id:'continuity',label:'If it goes away',fields:[
    ['worksWithoutVendor','If the vendor stops'],
    ['remoteDisable','Remote shut-off'],
    ['dataAfterExit','What you keep']
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
export const compositeFields = {nativeApps:['desktopApps','mobileApps','channels'],computerControl:['onYourComputer','agentComputer','whileYouAreOff']};
export const structuredFields = {messaging:'messaging'};

// Editorial overview: the original flagship shortlist, then distinct personal
// agents. Unlisted projects follow alphabetically; this is not a quality score.
export const featuredOrder = [
  'dots','claude-duet','grok-bot','hark','muse','hermes','openclaw',
  'underdog','poke','ambi','cue','town','wabi','instinct','lindy'
];

// Every column a reader can switch on, grouped the way the picker shows them.
// Short labels: a table header is not the place for a full question.
export const columnCatalog = [
  {label:'What it does',columns:[
    ['computerUse','Computer use'],['computerControl','Control'],['onYourComputer','Your computer'],['agentComputer','Its own computer'],
    ['whileYouAreOff','Works when off'],['browserUse','Browser'],['voice','Voice'],['scheduling','Background work'],
    ['uniqueFeatures','What stands out']
  ]},
  {label:'Apps & access',columns:[
    ['nativeApps','Apps'],['messaging','Messaging'],['channels','Web & messaging'],
    ['hardware','Hardware'],['api','API'],['availability','Availability']
  ]},
  {label:'Models & price',columns:[
    ['pricing','Price'],['models','Models'],['byom','BYO model'],['bundledPlan','Bundled with']
  ]},
  {label:'Control & privacy',columns:[
    ['hosting','Where it runs'],['license','Open source'],['memory','Memory'],
    ['approvals','Approvals'],['passwordManager','Passwords'],['portability','Export'],['security','Privacy']
  ]},
  {label:'If it goes away',columns:[
    ['worksWithoutVendor','If vendor stops'],['remoteDisable','Remote shut-off'],['dataAfterExit','What you keep']
  ]},
  {label:'Company',columns:[
    ['companyType','Company'],['companyStage','Stage'],['funding','Funding'],['launchDate','Launched']
  ]}
];

export const columnLabels = Object.fromEntries(columnCatalog.flatMap(g=>g.columns));

// Opening set: well-covered, short, and the questions people ask first.
export const defaultColumns = ['nativeApps','messaging','computerControl','pricing','hosting','worksWithoutVendor'];
export const maxColumns = 8;
