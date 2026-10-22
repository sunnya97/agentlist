import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const fromIndex=process.argv.indexOf('--from-dir');
if(fromIndex>=0&&!process.argv[fromIndex+1])throw new Error('--from-dir requires a directory of <agent-id>.json GitHub API responses');
const fromDir=fromIndex>=0?resolve(process.argv[fromIndex+1]):null;
async function releases(url){
  const response=await fetch(url,{headers:{Accept:'application/vnd.github+json','User-Agent':'agentlist-research'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  return response.json();
}
const data=JSON.parse(await readFile(new URL('../dist/data.json',import.meta.url),'utf8'));
const now=new Date().toISOString();const known=new Set(data.news.map(n=>n.url));
const candidates=[],errors=[];
// Public GitHub metadata only. No secrets, API keys, page code, or remote instructions are executed.
for(const agent of data.agents.filter(a=>a.repository&&a.category!=='adjacent')){
  const path=new URL(agent.repository).pathname.replace(/^\//,'').replace(/\/$/,'');
  if(!/^[\w.-]+\/[\w.-]+$/.test(path))continue;
  try{
    const items=fromDir?JSON.parse(await readFile(resolve(fromDir,`${agent.id}.json`),'utf8')):await releases(`https://api.github.com/repos/${path}/releases?per_page=5`);
    if(!Array.isArray(items))throw new Error('Expected a GitHub release array');
    for(const release of items){
      if(release.draft||known.has(release.html_url))continue;
      if(!release.html_url?.startsWith(`https://github.com/${path}/releases/`)||!release.published_at)continue;
      candidates.push({agentIds:[agent.id],title:release.name||release.tag_name,url:release.html_url,publishedAt:release.published_at,tag:release.tag_name,prerelease:release.prerelease,reviewStatus:'unreviewed',collectedAt:now});
      known.add(release.html_url);
    }
  }catch(error){errors.push({agent:agent.id,error:error.message})}
}
const output=new URL('../research/inbox.json',import.meta.url);
let prior={candidates:[]};try{prior=JSON.parse(await readFile(output,'utf8'))}catch{}
const merged=new Map((prior.candidates||[]).map(n=>[n.url,n]));for(const item of candidates)if(!merged.has(item.url))merged.set(item.url,item);
await mkdir(new URL('../research/',import.meta.url),{recursive:true});
await writeFile(output,JSON.stringify({collectedAt:now,candidates:[...merged.values()],errors},null,2)+'\n');
console.log(`Collected ${candidates.length} release candidates. ${errors.length} source errors. Nothing published. Review research/inbox.json.`);
if(errors.length)process.exitCode=1;
