import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterAgents,parseSelection,compareRows,sortedNews,sortAgents} from '../src/domain.js';
import {validate} from './validate.mjs';
import {fields,directoryViews,featuredOrder,compositeFields} from '../src/catalog.js';
const data=JSON.parse(await readFile(new URL('../dist/data.json',import.meta.url),'utf8'));
test('every user-named anchor is represented without collapsing distinct products',()=>{for(const id of ['dots','claude-duet','grok-bot','hark','muse','hermes','openclaw','nanoclaw','ironclaw','instinct','poke','underdog','town','ambi','cue','wabi'])assert(data.agents.some(a=>a.id===id),id);assert.equal(data.agents.find(a=>a.id==='underdog').category,'local')});
test('adjacent harnesses are opt-in and aliases resolve',()=>{assert(!filterAgents(data.agents).some(a=>a.category==='adjacent'));assert(filterAgents(data.agents,{adjacent:true}).some(a=>a.id==='codex'));assert.equal(filterAgents(data.agents,{search:'Grokbot'})[0].id,'grok-bot')});
test('shared comparisons reject unknown IDs, duplicates, and a fifth entry',()=>{const ids=new Set(data.agents.map(a=>a.id));assert.deepEqual(parseSelection('#compare?agents=bad,openclaw,openclaw,hermes,poke,ambi,hark',ids),['openclaw','hermes','poke','ambi']);assert.deepEqual(parseSelection('#compare?agents=%3Cscript%3E',ids),[])});
test('unknown never becomes an unsupported feature',()=>{const inst=data.agents.find(a=>a.id==='instinct');assert.equal(inst.claims.find(c=>c.field==='scheduling').status,'unknown');assert(!inst.claims.some(c=>c.value===false))});
test('difference filter excludes only matching values',()=>{const a={claims:[{field:'memory',value:'Same'},{field:'hosting',value:'Cloud'}]},b={claims:[{field:'memory',value:'Same'},{field:'hosting',value:'Local'}]};assert.deepEqual(compareRows([a,b],[['memory','Memory'],['hosting','Hosting']],true).map(r=>r.key),['hosting'])});
test('news combines agent, type, search and follow filters',()=>{assert(sortedNews(data.news,{agent:'claude-duet',type:'launch',search:'preview'}).length===1);assert.equal(sortedNews(data.news,{watchlist:[]}).length,0);assert(sortedNews(data.news,{watchlist:['hermes']}).every(n=>n.agentIds.includes('hermes')))});
test('data validation rejects unsupported claims and dangling edges',()=>{assert(validate(data));const bad=structuredClone(data);bad.agents[0].claims[0].sourceIds=['absent'];assert.throws(()=>validate(bad));const edge=structuredClone(data);edge.relationships[0].to='nonexistent';assert.throws(()=>validate(edge))});
test('comparison views use the same complete feature schema',()=>{const keys=new Set(fields.map(([key])=>key));for(const view of Object.values(directoryViews))for(const [key] of view.fields)assert(keys.has(key)||compositeFields[key]?.every(part=>keys.has(part)));for(const a of data.agents)assert.equal(a.claims.length,keys.size)});
test('feature search finds concrete capabilities, with coding tools still opt-in',()=>{assert(filterAgents(data.agents,{search:'ambient listening'}).some(a=>a.id==='ambi'));assert(filterAgents(data.agents,{search:'encrypted login'}).some(a=>a.id==='underdog'));assert(!filterAgents(data.agents,{search:'local models'}).some(a=>a.id==='codex'))});
test('logos are local assets with provenance and unsupported API fields stay explicit',async()=>{for(const a of data.agents){assert((await readFile(new URL(`../src/${a.logo.path}`,import.meta.url))).length>0);assert(a.logo.sourceUrl)}const api=data.agents.find(a=>a.id==='ambi').claims.find(c=>c.field==='api');assert.match(api.value,/API not specified/i);assert.match(api.shortValue,/API not specified/i)});
test('featured sorting preserves filters and input order, with stable alphabetical fallback',()=>{
  const rows=[{id:'z',name:'Zulu',category:'runtime'},{id:'a',name:'Alpha',category:'managed'},{id:'f',name:'Featured',category:'managed'}];
  assert.deepEqual(sortAgents(rows,'featured',['missing','f']).map(a=>a.id),['f','a','z']);
  assert.deepEqual(sortAgents(rows,'name',['f']).map(a=>a.id),['a','f','z']);
  assert.deepEqual(sortAgents(rows.filter(a=>a.id!=='f'),'featured',['f']).map(a=>a.id),['a','z']);
  assert.deepEqual(rows.map(a=>a.id),['z','a','f']);
  assert.equal(new Set(featuredOrder).size,featuredOrder.length);
  assert(featuredOrder.every(id=>data.agents.some(a=>a.id===id)));
});

test('platform icons distinguish native apps, web clients, and announced releases',()=>{
  const platforms=id=>data.agents.find(a=>a.id===id).platforms;
  assert(platforms('ambi').some(p=>p.platform==='android'&&p.status==='announced'));
  assert(platforms('underdog').some(p=>p.platform==='windows'&&p.status==='beta'));
  assert.deepEqual(platforms('nanobot').map(p=>p.platform),['web']);
  assert(!platforms('zeroclaw').some(p=>p.platform==='android'));
  assert(!platforms('poke').some(p=>p.platform==='ios'));
  assert(platforms('cue').some(p=>p.platform==='mobile'));
});

test('new agents stay distinct and Wabi 2.0 updates the existing profile',()=>{
  for(const id of ['rene','lucas','pally','thine','pickle','skye','tomo','eney','persona'])assert(data.agents.some(a=>a.id===id),id);
  assert.equal(data.agents.filter(a=>a.id==='wabi').length,1);
  assert(filterAgents(data.agents,{search:'Wabi 2.0'}).some(a=>a.id==='wabi'));
});
test('plans, hardware and sentiment keep evidence and availability distinctions',()=>{
  const get=id=>data.agents.find(a=>a.id===id);
  assert(get('pickle').plans.length>=4);assert(get('pally').plans.some(p=>p.name==='Free'));
  assert.equal(get('persona').hardware.status,'announced');assert.equal(get('eney').hardware.status,'unknown');
  assert.equal(get('pickle').hardware.status,'unknown');assert.match(get('pickle').claims.find(c=>c.field==='hardware').value,/refunds/i);
  assert(filterAgents(data.agents,{search:'470'}).some(a=>a.id==='pickle'));
  const badPlan=structuredClone(data);badPlan.agents.find(a=>a.plans.length).plans[0].sourceIds=['missing'];assert.throws(()=>validate(badPlan));
  const badHardware=structuredClone(data);badHardware.agents[0].hardware={status:'none',detail:'No hardware',sourceIds:[]};assert.throws(()=>validate(badHardware));
  const badSentiment=structuredClone(data);badSentiment.agents.find(a=>a.sentiment).sentiment.positiveShare=0;assert.throws(()=>validate(badSentiment));
  const badThread=structuredClone(data);badThread.agents.find(a=>a.discussions.length).discussions[0].date='2099-01-01';assert.throws(()=>validate(badThread));
});
test('canonical profile files match IDs and unknown claims are filled at build time',async()=>{
  for(const agent of data.agents){const raw=JSON.parse(await readFile(new URL(`../data/agents/${agent.id}.json`,import.meta.url),'utf8'));assert.equal(raw.id,agent.id);assert.deepEqual(raw.plans,agent.plans)}
  assert.equal(data.agents[0].claims.length,fields.length);
});

test('company filters separate makers without treating open source as a company stage',()=>{
  const startups=filterAgents(data.agents,{companyType:'startup'}).map(a=>a.id);
  assert(startups.includes('town'));assert(startups.includes('hermes'));assert(!startups.includes('muse'));
  assert(filterAgents(data.agents,{companyType:'public'}).some(a=>a.id==='muse'));
  assert(filterAgents(data.agents,{companyType:'independent'}).some(a=>a.id==='openclaw'));
  assert(!filterAgents(data.agents,{companyType:'lab'}).some(a=>a.id==='codex'));
});
test('launch sorting uses debut dates, handles partial dates and puts missing dates last',()=>{
  const rows=[
    {id:'unknown',name:'A unknown',launches:[]},
    {id:'update',name:'B update',launches:[{date:'2026-10-21',kind:'update'}]},
    {id:'older',name:'Older',launches:[{date:'2025',kind:'release'},{date:'2026-10-20',kind:'update'}]},
    {id:'month',name:'Month',launches:[{date:'2026-09',kind:'beta'}]},
    {id:'day',name:'Day',launches:[{date:'2026-09-15',kind:'launch'}]}
  ];
  assert.deepEqual(sortAgents(rows,'launch').map(a=>a.id),['day','month','older','unknown','update']);
  assert.equal(rows[0].id,'unknown');
});
test('company and launch records reject unsupported facts, invalid dates and weak lineage',()=>{
  const invalid=(mutate)=>{const copy=structuredClone(data);mutate(copy);assert.throws(()=>validate(copy))};
  invalid(d=>d.agents.find(a=>a.company).company.sourceIds=[]);
  invalid(d=>d.agents.find(a=>a.company?.funding).company.funding.sourceIds=['missing']);
  invalid(d=>d.agents.find(a=>a.launches.length).launches[0].date='2026-02-30');
  invalid(d=>d.agents.find(a=>a.launches.length).launches[0].date='2027');
  invalid(d=>d.agents.find(a=>a.launches.length).launches[0].sourceIds=[]);
  invalid(d=>d.relationships[0].type='alternative');
  assert(data.agents.some(a=>a.launches.some(e=>e.date.length===7)));
});
