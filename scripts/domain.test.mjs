import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterAgents,parseSelection,compareRows,sortedNews,sortAgents} from '../src/domain.js';
import {validate} from './validate.mjs';
import {fields,directoryViews,featuredOrder,compositeFields} from '../src/catalog.js';
import {channelLabels,channelOrder} from '../src/channels.js';
import {accessStates,accessSummary} from '../src/access.js';
import {computeFacets,computeSummary} from '../src/compute.js';
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

test('messaging services are structured channels, never native apps',()=>{
  const listed=data.agents.filter(a=>a.messaging.length);
  assert(listed.length,'expected structured messaging services');
  for(const a of listed){
    const claim=a.claims.find(c=>c.field==='messaging');
    assert.equal(claim.status==='unknown',false,`${a.id} messaging claim should be derived`);
    // Derived from the list, ordered by channelOrder, and carrying its evidence.
    assert.deepEqual(a.messaging.map(m=>m.service),[...a.messaging.map(m=>m.service)].sort((x,y)=>channelOrder.indexOf(x)-channelOrder.indexOf(y)),`${a.id} messaging order`);
    assert.equal(claim.shortValue,a.messaging.map(m=>channelLabels[m.service]).join(', '));
    assert(claim.sourceIds.length,`${a.id} messaging needs evidence`);
    // A messaging service must not be claimed as a native platform.
    for(const m of a.messaging)assert(!a.platforms.some(p=>p.platform===m.service),`${a.id}: ${m.service} listed as a platform`);
  }
  assert(data.agents.some(a=>a.messaging.some(m=>m.service==='imessage')),'iMessage should be tracked');
});

test('messaging records reject unknown services, duplicates and missing evidence',()=>{
  const invalid=(mutate)=>{const copy=structuredClone(data);mutate(copy);assert.throws(()=>validate(copy))};
  const pick=d=>d.agents.find(a=>a.messaging.length);
  invalid(d=>pick(d).messaging[0].service='carrierpigeon');
  invalid(d=>{const a=pick(d);a.messaging.push({...a.messaging[0]})});
  invalid(d=>pick(d).messaging[0].sourceIds=[]);
  invalid(d=>pick(d).messaging[0].sourceIds=['missing']);
  invalid(d=>pick(d).messaging[0].status='someday');
  invalid(d=>pick(d).messaging[0].detail='');
});

test('availability separates shipping products from waitlists and reservations',()=>{
  for(const a of data.agents){
    assert(a.access,`${a.id} needs an access state`);
    assert(Object.hasOwn(accessStates,a.access.state),`${a.id} access state`);
    assert(a.access.sourceIds.length,`${a.id} access needs evidence`);
    // The prose claim keeps the detail; the short text comes from the structure.
    assert.equal(a.claims.find(c=>c.field==='availability').shortValue,accessSummary(a.access));
  }
  const open=filterAgents(data.agents,{access:'open'}),upcoming=filterAgents(data.agents,{access:'upcoming'});
  assert(open.length&&upcoming.length);
  assert(!open.some(a=>(a.access.restrictions||[]).length),'"available to anyone" must carry no catch');
  assert(upcoming.every(a=>a.access.state!=='available'),'upcoming must not be shipping');
  // A product that is not shipping is never counted as available.
  const vora=data.agents.find(a=>a.id==='vora');
  assert.equal(vora.access.state,'reservation');
  assert.equal(vora.access.expected,'2027-03');
  assert(!filterAgents(data.agents,{access:'open'}).some(a=>a.id==='vora'));
  assert(!vora.launches.length,'a future ship date is not a launch event');
});

test('access records reject unknown states, bad restrictions and unsourced claims',()=>{
  const invalid=(mutate)=>{const copy=structuredClone(data);mutate(copy);assert.throws(()=>validate(copy))};
  const pick=d=>d.agents.find(a=>a.id==='vora');
  invalid(d=>pick(d).access.state='maybe');
  invalid(d=>pick(d).access.restrictions=['vibes']);
  invalid(d=>pick(d).access.restrictions=['region','region']);
  invalid(d=>pick(d).access.sourceIds=[]);
  invalid(d=>pick(d).access.detail='');
  invalid(d=>pick(d).access.expected='not-a-date');
  // An expected date only makes sense for something you cannot have yet.
  invalid(d=>{const a=pick(d);a.access.state='available';a.access.expected='2027-03'});
});

test('computer control splits into three questions and never guesses an answer',()=>{
  const facets=Object.keys(computeFacets);
  for(const a of data.agents){
    for(const facet of facets){
      const claim=a.claims.find(c=>c.field===facet);
      const value=a.compute?.[facet];
      if(!value){
        // Absent evidence stays unknown; it must never read as a "no".
        assert.equal(claim.status,'unknown',`${a.id}/${facet} should be unknown`);
        assert.equal(claim.value,'Not specified');
        continue;
      }
      assert(Object.hasOwn(computeFacets[facet],value.state),`${a.id}/${facet} state`);
      assert(claim.sourceIds.length,`${a.id}/${facet} needs evidence`);
      assert.equal(claim.shortValue,computeSummary(facet,value));
    }
  }
  // The three questions are genuinely independent of one another.
  const duet=data.agents.find(a=>a.id==='claude-duet');
  assert.equal(duet.compute.whileYouAreOff.state,'yes');
  assert.equal(duet.compute.agentComputer.state,'cloud');
  assert(!duet.compute.onYourComputer,'a cloud computer says nothing about your desktop');
  const hermes=data.agents.find(a=>a.id==='hermes');
  assert.equal(hermes.compute.onYourComputer.state,'full');
  assert(!hermes.compute.agentComputer,'desktop control says nothing about a machine of its own');
});

test('compute facets reject invalid states, platforms and impossible combinations',()=>{
  const invalid=(mutate)=>{const copy=structuredClone(data);mutate(copy);assert.throws(()=>validate(copy))};
  const hermes=d=>d.agents.find(a=>a.id==='hermes');
  invalid(d=>hermes(d).compute.onYourComputer.state='sometimes');
  invalid(d=>hermes(d).compute.onYourComputer.platforms=['commodore64']);
  invalid(d=>hermes(d).compute.onYourComputer.sourceIds=[]);
  invalid(d=>hermes(d).compute.onYourComputer.detail='');
  // Claiming remote access to a machine the agent does not have.
  invalid(d=>{d.agents.find(a=>a.id==='bond').compute.agentComputer.remote='takeover'});
  invalid(d=>{d.agents.find(a=>a.id==='vora').compute.agentComputer.remote='beam'});
});
