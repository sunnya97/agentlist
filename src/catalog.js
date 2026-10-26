export const companyTypes = {public:'Public company',lab:'Major AI lab',startup:'Startup',established:'Established company',independent:'Independent project',research:'Research group'};
export const launchKinds = {launch:'Public launch',preview:'Research preview',beta:'Public beta',announcement:'Announcement',release:'Open-source release',update:'Major update'};

export const fieldGroups = [
  {id:'company',label:'Company & launch',note:'Who makes it and when it arrived. Company type and funding are context, not a quality score: an open-source project and a public company carry different risks, not better or worse ones.',fields:[['companyType','Company type'],['companyStage','Company stage'],['funding','Disclosed funding'],['launchDate','Launch date']]},
  {id:'capabilities',label:'What it can do',note:'What this agent can actually operate — a machine of its own, yours, or neither. Computer control is three separate questions, and most products answer only some of them.',fields:[
    ['uniqueFeatures','What stands out'],
    ['computerUse','Computer use'],
    ['onYourComputer','Controls your computer'],
    ['agentComputer','Its own computer'],
    ['whileYouAreOff','Works while your computer is off'],
    ['browserUse','Browser control'],
    ['voice','Voice & ambient listening'],
    ['scheduling','Background work & triggers']
  ]},
  {id:'access',label:'Apps & access',note:'Where you reach it and on what. A messaging integration is not a native app, so the two are tracked apart; an app listed here is a real first-party client.',fields:[
    ['desktopApps','Native desktop apps'],
    ['mobileApps','iPhone & Android apps'],
    ['channels','Web & messaging'],
    ['messaging','Messaging services'],
    ['hardware','Native hardware'],
    ['api','Developer API']
  ]},
  {id:'models',label:'Models & plans',note:"What you pay and what runs underneath. Where an agent is bundled into a larger subscription, the price shown is that subscription's — there is no separate fee for the agent.",fields:[
    ['models','Models & providers'],
    ['byom','Bring your own model'],
    ['bundledPlan','Included in another plan'],
    ['pricing','Price & usage costs']
  ]},
  {id:'continuity',label:'If it goes away',note:'Whether the product survives the company behind it, and what you take with you. Almost no hosted vendor publishes a shutdown commitment, so an answer here is usually read from the architecture rather than from a promise.',fields:[
    ['worksWithoutVendor','If the vendor stops'],
    ['remoteDisable','Remote shut-off'],
    ['dataAfterExit','What you keep']
  ]},
  {id:'control',label:'Ownership & control',note:'What it asks before acting, what it remembers, and who else can see it. These are the questions that decide whether you would hand it your inbox.',fields:[
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
// Rendered from the dataAccess list and the shared source table, not from claims.
export const renderedColumns = ['exclusiveData'];
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
    ['nativeApps','Native apps'],['messaging','Messaging'],['exclusiveData','Exclusive data'],['channels','Web & messaging'],
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
export const defaultColumns = ['nativeApps','messaging','availability','pricing','hosting','dataAfterExit'];
export const maxColumns = 8;
