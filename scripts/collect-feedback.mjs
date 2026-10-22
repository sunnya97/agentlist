// Collects the per-area breakdown behind each Feedback Bench sentiment snapshot.
// Numbers and labels only: the quoted posts stay on Feedback Bench, which is
// where the people who wrote them are credited and linked.
//
// Deliberately does NOT import the Feedback Score or the ranking. Half of that
// score is popularity, and this catalogue does not rank by popularity.
//
//   npm run collect:feedback              review candidates in research/
//   npm run collect:feedback -- --write   apply them to data/agents/
//   npm run collect:feedback -- --from-file personal.json
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const DATA_URL='https://feedbackbench.com/data/personal.json';
const write=process.argv.includes('--write');
const fromIndex=process.argv.indexOf('--from-file');
if(fromIndex>=0&&!process.argv[fromIndex+1])throw new Error('--from-file requires a path to a saved personal.json');
const fromFile=fromIndex>=0?resolve(process.argv[fromIndex+1]):null;

// Feedback Bench names Hermes differently; every other id already matches.
const idMap={'hermes-agent':'hermes'};

const root=new URL('../',import.meta.url);
const catalog=JSON.parse(await readFile(new URL('dist/data.json',root),'utf8'));
const ours=new Set(catalog.agents.map(a=>a.id));

const bench=fromFile
  ? JSON.parse(await readFile(fromFile,'utf8'))
  : await fetch(DATA_URL,{headers:{'User-Agent':'agentlist-research'},signal:AbortSignal.timeout(30000)})
      .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()});

const meta=bench.meta||{};
const areaNames=Object.fromEntries((meta.criteria||[]).map(c=>[c.code,c.name]));
const [windowStart,windowEnd]=meta.window||[];
const attribution={provider:'Feedback Bench',version:String(meta.version??''),builtOn:meta.builtOn||''};

const candidates=[],skipped=[];
for(const agent of bench.agents||[]){
  const id=idMap[agent.id]||agent.id;
  if(!ours.has(id)){skipped.push(agent.id);continue}
  const areas=Object.entries(agent.criteria||{})
    // Top-level areas only. The 53 leaf criteria belong on Feedback Bench.
    .filter(([code])=>!code.includes('.')&&areaNames[code])
    .map(([code,v])=>({
      code,
      label:areaNames[code],
      praise:v.praise,
      complaint:v.complaint,
      praiseShare:Number(v.praiseShare?.toFixed?.(1)??v.praiseShare),
      url:`https://feedbackbench.com/criteria/${code}.md`
    }))
    .filter(a=>Number.isInteger(a.praise)&&Number.isInteger(a.complaint)&&a.praise+a.complaint>0)
    .sort((x,y)=>(y.praise+y.complaint)-(x.praise+x.complaint));
  if(areas.length)candidates.push({id,benchId:agent.id,areas});
}

const report={...attribution,windowStart,windowEnd,collectedAt:new Date().toISOString().slice(0,10),
  citation:`Feedback Bench ${meta.version}, Personal agents, built ${meta.builtOn}, https://feedbackbench.com.`,
  agents:candidates};

if(!write){
  await mkdir(new URL('research/',root),{recursive:true});
  await writeFile(new URL('research/feedback-inbox.json',root),JSON.stringify(report,null,2)+'\n');
  console.log(`Wrote research/feedback-inbox.json: ${candidates.length} agents, ${skipped.length} not in the catalogue (${skipped.join(', ')||'none'}).`);
  console.log('Review, then re-run with --write to apply.');
} else {
  let applied=0;
  for(const candidate of candidates){
    const path=new URL(`data/agents/${candidate.id}.json`,root);
    const record=JSON.parse(await readFile(path,'utf8'));
    // Only annotates an existing snapshot; never invents one.
    if(!record.sentiment){console.warn(`  ${candidate.id}: no sentiment snapshot, skipped`);continue}
    record.sentiment.areas=candidate.areas;
    record.sentiment.version=attribution.version;
    record.sentiment.builtOn=attribution.builtOn;
    await writeFile(path,JSON.stringify(record,null,2)+'\n');
    applied++;
  }
  console.log(`Applied per-area feedback to ${applied} agents. Cite: ${report.citation}`);
}
