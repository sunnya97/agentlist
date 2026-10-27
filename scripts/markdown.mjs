// A Markdown edition of the catalogue, for readers that are language models:
// /llms.txt as the entry point, /llms-full.txt for everything at once, one
// record per agent, a directory table and the method. Every line is derived
// from the dataset — no fact is written here that does not live in JSON.
import {fieldGroups,fields,companyTypes,launchKinds} from '../src/catalog.js';
import {channelLabels,channelOrder} from '../src/channels.js';
import {platformLabels,platformStatusLabels} from '../src/platforms.js';
import {accessStates,accessRestrictions} from '../src/access.js';
import {computeFacets,agentScreenAccess} from '../src/compute.js';
import {continuityFacets} from '../src/continuity.js';
import {thirdPartyAccess,accessPaths} from '../src/datasources.js';
import {sortedNews} from '../src/domain.js';

// app.js keeps the browser copy of these labels under the same names, and the
// standalone bundle concatenates modules, so they cannot be shared from src/.
const categoryLabels={managed:'Hosted agent',runtime:'Self-hosted runtime',local:'Local-first app',watchlist:'Under review',adjacent:'Coding tool (adjacent)'};
const relationshipLabels={'built-on':'Built on',fork:'Code fork',renamed:'Renamed'};
const newsTypeLabels={release:'Release',launch:'Launch',research:'Research',availability:'Availability change'};
const hardwareStates={available:'Shipping hardware',optional:'Optional hardware',announced:'Announced, not shipping',none:'No hardware',unknown:'Not established'};

const fieldLabels=Object.fromEntries(fields);
// The questions a reader asks before anything else.
const keyFactFields=['availability','pricing','bundledPlan','hosting','license','onYourComputer','agentComputer','whileYouAreOff','worksWithoutVendor','remoteDisable','dataAfterExit','companyType','launchDate'];
// A limited claim must never read like a documented one.
const tag=status=>status==='limited'?'`limited` (partial or conditional only)':`\`${status}\``;
const unknownNote='no reviewed source answers this, which is a gap in the catalogue rather than a "no".';

const cell=v=>String(v??'').replace(/\s*\n+\s*/g,' ').replace(/\|/g,'\\|');
const table=(head,rows)=>[`| ${head.join(' | ')} |`,`|${head.map(()=>' --- ').join('|')}|`,...rows.map(r=>`| ${r.map(cell).join(' | ')} |`)].join('\n');
const bullets=items=>items.filter(Boolean).map(x=>`- ${x}`).join('\n');
const link=(text,url)=>`[${cell(text)}](${url})`;

export const recordPath=id=>`/agents/${id}.md`;

// One Markdown record for one agent: key facts, every claim in its group with
// evidence, then the structured lists and a numbered source table.
export function agentRecord(agent,data,base){
  const num=new Map(agent.sources.map((source,index)=>[source.id,index+1]));
  const order=ids=>(ids||[]).map(id=>num.get(id)??'?').sort((a,b)=>a-b);
  const ref=ids=>ids?.length?` [${order(ids).join(', ')}]`:'';
  const refs=ids=>ids?.length?order(ids).join(', '):'—';
  const claim=field=>agent.claims.find(c=>c.field===field)||{field,value:'Not specified',status:'unknown',sourceIds:[]};
  const short=c=>c.status==='unknown'?'unknown':(c.shortValue||c.value);
  const sources=new Map(data.dataSources.items.map(item=>[item.id,item]));
  const out=[`# ${agent.name}`,'',`> ${agent.summary}`,''];
  out.push(bullets([
    `**Maker:** ${agent.organization}`,
    `**Catalogue type:** ${categoryLabels[agent.category]||agent.category}`,
    `**Website:** ${agent.website}`,
    `**Source code:** ${agent.repository||'unknown — no public repository recorded'}`,
    `**Also known as:** ${agent.aliases?.length?agent.aliases.join(', '):'unknown — no other names recorded'}`,
    `**Evidence:** ${agent.sources.length} sources, checked ${agent.oldestSource} to ${agent.checkedAt}`,
    `**Profile:** ${base}/agent/${agent.id}/`,
    `**This record:** ${base}${recordPath(agent.id)}`
  ]),'');
  out.push('## Key facts','',table(['Field','Value','Status','Sources'],
    keyFactFields.map(field=>{const c=claim(field);return [fieldLabels[field],short(c),c.status,refs(c.sourceIds)]})),'');
  out.push(`Status marks — ${['documented','limited','unknown'].map(key=>`\`${key}\`: ${data.methodology[key]}`).join(' ')}`,'');
  for(const group of fieldGroups){
    out.push(`## ${group.label}`,'',`*${group.note}*`,'');
    out.push(group.fields.map(([field,label])=>{
      const c=claim(field);
      const text=c.status==='unknown'?`Not specified — ${unknownNote}`:c.value;
      return `- **${label}** ${tag(c.status)} — ${text}${ref(c.sourceIds)}`;
    }).join('\n'),'');
    if(group.id==='company'){
      out.push('**Launch history**','',agent.launches.length
        ? bullets([...agent.launches].sort((a,b)=>a.date.localeCompare(b.date))
            .map(event=>`${event.date} · ${launchKinds[event.kind]}${event.label?` · ${event.label}`:''}${ref(event.sourceIds)}`))
        : 'unknown — no dated launch event is recorded.','');
    }
  }
  out.push('## Plans','',agent.plans.length
    ? table(['Plan','Price','Billing','Includes','Limits','Sources'],agent.plans.map(plan=>
        [plan.name,plan.price,plan.billing,plan.includes.join('; ')||'—',plan.limits.join('; ')||'—',refs(plan.sourceIds)]))
    : `unknown — no published plan or price list is recorded. See the ${fieldLabels.pricing} claim above.`,'');
  out.push('## Native apps and web access','',
    '*Messaging services are channels, not native apps, and are listed separately below.*','',
    agent.platforms.length
      ? table(['Platform','Status','Detail','Sources'],agent.platforms.map(p=>
          [platformLabels[p.platform]||p.platform,platformStatusLabels[p.status]||p.status,p.detail,refs(p.sourceIds)]))
      : 'unknown — no native app or web client is recorded.','');
  out.push('## Messaging services','',agent.messaging.length
    ? table(['Service','Status','Detail','Sources'],agent.messaging.map(m=>
        [channelLabels[m.service]||m.service,platformStatusLabels[m.status]||m.status,m.detail,refs(m.sourceIds)]))
    : 'unknown — no messaging service is recorded for this agent.','');
  const hardware=agent.hardware;
  out.push('## Hardware','',hardware.status==='unknown'&&!hardware.detail
    ? '`unknown` — no dedicated hardware is established by the reviewed sources.'
    : `\`${hardware.status}\` ${hardwareStates[hardware.status]||hardware.status}${hardware.name?` — **${hardware.name}**`:''}: ${hardware.detail||unknownNote}${ref(hardware.sourceIds)}`,'');
  out.push('## Data reach','',
    '*What personal data this agent can reach, and whether anyone else could reach the same source.*','',
    agent.dataAccess.length
      ? table(['Data source','Open to third parties?','This agent\'s route','Detail','Sources'],agent.dataAccess.map(entry=>{
          const item=sources.get(entry.source);
          return [item?.label||entry.source,thirdPartyAccess[item?.thirdParty]||'unknown',accessPaths[entry.path]||entry.path,entry.detail,refs(entry.sourceIds)];
        }))
      : 'unknown — no first-party or exclusive data reach is recorded for this agent.','');
  out.push('## Discussion','',agent.discussions.length
    ? table(['Date','Thread','Platform','Kind','Sentiment','Summary'],agent.discussions.map(d=>
        [d.date,link(d.title,d.url),d.platform,d.kind,d.sentiment,d.summary]))
    : 'unknown — no dated public threads are recorded for this agent.','');
  const s=agent.sentiment;
  out.push('## Feedback snapshot','',s
    ? [`Provider: ${s.provider} (${s.url}); data: ${s.dataUrl}. Window ${s.windowStart} to ${s.windowEnd}; checked ${s.checkedAt}.`,
       `Sample: ${s.posts} posts, ${s.positiveUserWeeks} positive and ${s.negativeUserWeeks} negative rated user-weeks — ${s.positiveShare}% positive.`,
       'That percentage is the raw positive share of rated user-weeks, not the provider\'s composite score or ranking.',
       `Channels: ${s.channels.join(', ')}.${s.version?` Build ${s.version}, built ${s.builtOn}.`:''}`,
       ...(s.areas?.length?['',table(['Area','Praise','Complaint','Positive share','Area method'],s.areas.map(area=>
          [area.label,area.praise,area.complaint,`${area.praiseShare}%`,area.url]))]:[])].join('\n')
    : 'unknown — no attributed feedback snapshot is recorded for this agent.','');
  const feed=sortedNews(data.news,{agent:agent.id});
  out.push('## Updates','',agent.newsSource
    ? `**Where updates come from:** ${agent.newsSource.url||'no public release notes found'} — ${agent.newsSource.note} (checked ${agent.newsSource.checkedAt})`
    : '**Where updates come from:** unknown — no update source has been recorded for this agent.','');
  out.push(feed.length
    ? bullets(feed.map(n=>`${n.date} · ${newsTypeLabels[n.type]||n.type} · ${link(n.title,n.url)}${n.publisher?` · ${n.publisher}`:''} — ${n.summary}`))
    : 'No dated catalogue updates mention this agent yet.','');
  const edges=data.relationships.filter(r=>r.from===agent.id||r.to===agent.id);
  if(edges.length)out.push('## Ecosystem','',bullets(edges.map(r=>{
    const name=id=>data.agents.find(a=>a.id===id)?.name||data.externalNodes.find(n=>n.id===id)?.name||id;
    return `${relationshipLabels[r.type]}: ${name(r.from)} → ${name(r.to)} — ${r.note} (${r.sourceUrl})`;
  })),'');
  out.push('## Sources','',agent.sources.map((source,index)=>
    `${index+1}. ${link(source.title,source.url)} — checked ${source.checkedAt}`).join('\n'),'');
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}

// Directory table: the columns a reader compares before opening any record.
function directory(data,base){
  // A partly established answer must not read like a documented one, even in
  // a table cell.
  const pick=(agent,field)=>{
    const c=agent.claims.find(x=>x.field===field);
    if(!c||c.status==='unknown')return 'unknown';
    return (c.shortValue||c.value)+(c.status==='limited'?' (limited)':'');
  };
  return [`# Agentlist — the directory`,'',
    `> Every agent in the catalogue: ${data.agents.length} records, sources checked ${data.checkedFrom} to ${data.checkedTo}. \`unknown\` means no reviewed source answered that question — never that the answer is no, and \`(limited)\` marks an answer only partly established.`,'',
    table(['Agent','Maker','Availability','Price','Where it runs','What you keep','Record'],data.agents.map(agent=>[
      agent.name,agent.organization,pick(agent,'availability'),pick(agent,'pricing'),pick(agent,'hosting'),pick(agent,'dataAfterExit'),
      link(`${agent.id}.md`,base+recordPath(agent.id))
    ])),'',
    `Fields, states and evidence rules: ${base}/method.md. Structured dataset: ${base}/data.json.`,''].join('\n');
}

const vocabulary=(label,map)=>`**${label}:** ${Object.entries(map).map(([key,value])=>`\`${key}\` ${value}`).join('; ')}`;

// What the fields mean, generated from the same definitions the site renders.
function dimensions(){
  return fieldGroups.flatMap(group=>[`### ${group.label}`,'',group.note,'',
    bullets(group.fields.map(([field,label])=>`**${label}** (\`${field}\`)`)),'']).join('\n');
}

// How the catalogue works. The process prose follows CONTRIBUTING.md; every
// list of states, fields and vocabularies is generated from the modules.
function method(data,base){
  const out=['# How Agentlist works','',
    `> Scope, evidence rules and the contribution process behind ${data.agents.length} personal-agent records. Edition ${data.edition}; sources checked ${data.checkedFrom} to ${data.checkedTo}.`,'',
    '## What counts as a personal agent','',
    'A personal agent maintains context about one person over time and uses tools to act on their behalf. Three properties decide inclusion: it remembers (preferences, people, projects or a durable workspace survive one task), it can act (tools, apps, a browser or a computer, under a person\'s direction), and it can return (schedules, events or continuing goals bring it back between conversations).','',
    'Hosted products, local apps and self-hosted runtimes are all in scope. A new version of a product updates the existing record rather than adding one; aliases keep the old name searchable. A separate record exists only for a distinct product. Coding harnesses are catalogued as adjacent and hidden by default: the distinction is their product scope, not whether they have any persistence.','',
    bullets([vocabulary('Catalogue types',categoryLabels)]),'',
    '## Evidence rules','',
    'Every source carries an ID, a title, a direct URL and the date it was checked; every claim references those IDs. Product facts come from official product pages, documentation, repositories, app listings or announcements, paraphrased rather than quoted. Where sources disagree, the product\'s own official page wins over third-party coverage, which goes stale as products reprice and rename — except for facts a vendor has reason to shade (funding, certifications, independent feedback), where a primary filing or the certifying body is the better source.','',
    'A claim nobody has established is omitted from the record and filled in by the build as `unknown`. Descriptions are not independent performance tests.','',
    `## What documented, limited and unknown mean`,'',
    bullets(['documented','limited','unknown'].map(key=>`\`${key}\` — ${data.methodology[key]}`)),'',
    'Capabilities that look similar are kept apart: a public API, an MCP connector, browser automation, a password vault and a saved browser session are five different answers. Computer control is three independent questions, and a cloud computer says nothing about whether the agent can touch your desktop.','',
    '## Dates','',
    'Source dates are the day the source was checked, per agent, so re-checking one product never restates the freshness of the rest. The catalogue reports the span of those dates rather than a single date. Launch events accept year, month or day precision (`2026`, `2026-02`, `2026-02-03`) and a day is never invented. The earliest non-update event is the launch date. A stated future ship date is recorded as an expected date on the availability object, never as a launch.','',
    bullets([vocabulary('Launch kinds',launchKinds)]),'',
    '## Companies and funding','',
    'The organization names the team that makes the product; the company object records its type and stage separately from product availability. Types are editorial groupings, not rankings — open-source software can still come from a funded startup. Funding is a dated, disclosed round at company level: round amount is kept apart from total raised and from valuation, and committed or pre-acquisition capital is labelled. Stage and funding are absent when not established, and each carries its own evidence.','',
    bullets([vocabulary('Company types',companyTypes)]),'',
    '## The comparison fields','',
    `${fields.length} fields in ${fieldGroups.length} groups.`,'',
    dimensions(),
    '## Structured vocabularies','',
    bullets([
      vocabulary('Availability states',accessStates),
      vocabulary('Availability restrictions',accessRestrictions),
      ...Object.entries(computeFacets).map(([facet,states])=>vocabulary(`Computer control · ${fieldLabels[facet]}`,states)),
      vocabulary('Watching the agent\'s own screen',agentScreenAccess),
      ...Object.entries(continuityFacets).map(([facet,states])=>vocabulary(`Vendor lock-in · ${fieldLabels[facet]}`,states)),
      vocabulary('Hardware states',hardwareStates),
      vocabulary('App and messaging statuses',platformStatusLabels),
      vocabulary('Native platforms',platformLabels),
      `**Messaging services:** ${channelOrder.map(key=>`\`${key}\` ${channelLabels[key]}`).join('; ')}`,
      vocabulary('How open a data source is to third parties',thirdPartyAccess),
      vocabulary('How an agent reaches a data source',accessPaths),
      vocabulary('Ecosystem relationships',relationshipLabels),
      vocabulary('Update types',newsTypeLabels)
    ]),'',
    'A messaging integration never establishes a native app, and a listed product is never a shipping product: announced hardware, a paid reservation and an open download are three different answers.','',
    '## Discussion and feedback','',
    'Discussion entries link original dated threads with a short summary, and separate company or creator posts from independent community discussion. The sentiment on a thread describes that thread, not every user of the product.','',
    'Aggregate feedback snapshots are separately attributed, with provider, collection window, source channels, rated user-week counts and the raw positive share. The displayed percentage is that raw share, not the provider\'s composite score, and an area breakdown names the provider build it came from because those numbers change with each build. Snapshots from different dates are never mixed.','',
    '## Updates and the ecosystem graph','',
    'Dated updates and relationships are curated: collection gathers candidates into an ignored review inbox and nothing publishes automatically. The ecosystem graph carries only runtime dependencies, code forks and renames; inspiration, shared model providers, similar names and competing alternatives stay out of it, and fork ancestry needs explicit evidence.','',
    data.researchQueue?.length?`**Open research queue:** ${data.researchQueue.join('; ')}.`:'','',
    '## Contributing','',
    bullets([
      'One JSON file per agent in `data/agents/<id>.json`; the filename matches the stable, lowercase, hyphenated ID.',
      'Run `npm run add:agent -- example-agent "Example Agent" https://example.com`, or copy `templates/agent.json`. The generator never overwrites an existing agent.',
      'Fill in the summary, company context, launch dates, claims, plans, platforms, messaging and sources, each claim referencing its source IDs.',
      'Save an official PNG, SVG or WebP mark in `src/logos/` and record its original URL and the official page. Logos belong to their owners.',
      'Run `npm run verify` — build, data validation and the domain tests — and open a pull request. Maintainers review before merge; CI runs the same checks.'
    ]),'',
    `Repository: ${data.repository||'not configured'}. Generated `+'`dist/`'+` files, including this one, are not committed.`,'',
    '## Independence and licence','',
    `Disclosure: ${data.disclosure}`,'',
    'Code and original catalogue contributions are MIT-licensed. Product marks remain the property of their owners, and third-party source text, linked posts and feedback data keep their original rights and attribution. Credit this catalogue as "Agentlist" with a link when you reuse it.','',
    `Entry point for machines: ${base}/llms.txt. Everything in one file: ${base}/llms-full.txt. Structured dataset: ${base}/data.json.`,''];
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}

function summary(data){
  const byCategory=Object.entries(data.agents.reduce((acc,a)=>({...acc,[a.category]:(acc[a.category]||0)+1}),{}))
    .map(([key,count])=>`${count} ${categoryLabels[key]||key}`).join(', ');
  return [`> An open, source-linked directory of ${data.agents.length} persistent personal AI agents — systems that keep context about one person and act on their behalf. Every comparison field cites a dated primary source, and a field no source answers is recorded as \`unknown\` rather than as a "no". Edition ${data.edition}, snapshot ${data.checkedAt}, sources checked ${data.checkedFrom} to ${data.checkedTo}. Descriptions are read from official documentation, not independently tested. Code and original catalogue contributions are MIT-licensed; product marks belong to their owners and linked source text keeps its original rights — credit "Agentlist" with a link when reusing this.`,'',
    `${data.agents.length} agents (${byCategory}), ${fields.length} comparison fields in ${fieldGroups.length} groups, ${data.news.length} dated updates, ${data.relationships.length} recorded ecosystem relationships, ${data.dataSources.items.length} personal data sources. Disclosure: ${data.disclosure}`].join('\n');
}

// The entry point: a short index of links, one line per agent, nothing else.
function llms(data,base){
  return [`# ${data.title}`,'',summary(data),'',
    '## Start here','',
    bullets([
      `${link('Directory index',base+'/index.md')}: every agent in one table — maker, availability, price, where it runs, what you keep, and a link to its record.`,
      `${link('Method',base+'/method.md')}: scope, evidence rules, what \`documented\`, \`limited\` and \`unknown\` mean, how dates and funding are recorded, and how to contribute.`,
      `${link('Everything in one file',base+'/llms-full.txt')}: this summary, every field definition and all ${data.agents.length} agent records concatenated, with no links to follow.`,
      `${link('Structured dataset (JSON)',base+'/data.json')}: the machine-readable source of every line in this edition.`,
      `${link('Update feed (RSS)',base+'/feed.xml')}: dated ecosystem updates, each linked to its source.`
    ]),'',
    '## Agents','',
    bullets(data.agents.map(agent=>`${link(agent.name,base+recordPath(agent.id))}: ${agent.summary}`)),'',
    '## Comparison dimensions','',
    bullets(fieldGroups.map(group=>`${link(group.label,base+'/method.md')}: ${group.fields.map(([,label])=>label).join(', ')}. ${group.note}`)),'',
    '## Optional','',
    bullets([
      `${link('Interactive directory',base+'/')}: the site this Markdown edition mirrors.`,
      data.repository&&`${link('Repository and contribution guide',data.repository)}: one JSON file per agent, reviewed through pull requests.`
    ]),''].join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}

// Everything at once: summary, field definitions, directory, every record.
function llmsFull(data,base){
  return [`# ${data.title} — complete Markdown edition`,'',summary(data),'',
    `This file contains the whole catalogue: the method, every field definition, the directory table and all ${data.agents.length} agent records. Nothing needs to be fetched to read it. Per-agent files live at ${base}/agents/<id>.md; the structured dataset is at ${base}/data.json.`,'',
    '---','',method(data,base),'','---','',directory(data,base),'','---','',
    ...data.agents.flatMap((agent,index)=>[agentRecord(agent,data,base),...(index<data.agents.length-1?['','---','']:[])])
  ].join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}

// path -> contents, relative to dist/.
export function markdownEdition(data,origin){
  const base=String(origin||data.siteUrl||'').replace(/\/+$/,'');
  const files=new Map([
    ['/llms.txt',llms(data,base)],
    ['/llms-full.txt',llmsFull(data,base)],
    ['/index.md',directory(data,base)],
    ['/method.md',method(data,base)]
  ]);
  for(const agent of data.agents)files.set(recordPath(agent.id),agentRecord(agent,data,base));
  return files;
}
