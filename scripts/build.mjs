import {cp,mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {validate} from './validate.mjs';
import {fields} from '../src/catalog.js';
const root=new URL('../',import.meta.url);
const metadata=JSON.parse(await readFile(new URL('data/catalog.json',root),'utf8'));
const files=(await readdir(new URL('data/agents/',root))).filter(name=>name.endsWith('.json')).sort();
const agents=await Promise.all(files.map(async file=>{
  const record=JSON.parse(await readFile(new URL(`data/agents/${file}`,root),'utf8'));
  if(file!==`${record.id}.json`)throw new Error(`${file}: filename must match agent ID`);
  if(new Set(record.claims.map(c=>c.field)).size!==record.claims.length)throw new Error(`${file}: duplicate claim`);
  const knownFields=new Set(fields.map(([key])=>key));
  for(const claim of record.claims)if(!knownFields.has(claim.field))throw new Error(`${file}: unrecognized field ${claim.field}`);
  const hardware=record.hardware||{status:'unknown',name:'',detail:'',sourceIds:[]};
  const claims=fields.map(([field])=>{
    if(field==='hardware'&&hardware.detail&&hardware.sourceIds.length)return {field,value:hardware.detail,shortValue:hardware.name?`${hardware.name} · ${hardware.status==='announced'?'announced':hardware.status==='unknown'?'availability unclear':hardware.status}`:hardware.status,status:['announced','unknown'].includes(hardware.status)?'limited':'documented',sourceIds:hardware.sourceIds,checkedAt:metadata.checkedAt};
    return {field,value:'Not specified',status:'unknown',sourceIds:[],checkedAt:metadata.checkedAt,...record.claims.find(c=>c.field===field)};
  });
  const agent={...record,claims,hardware,plans:record.plans||[],discussions:record.discussions||[],platforms:record.platforms||[]};
  const logo=await readFile(new URL(`src/${agent.logo.path}`,root));
  if(!logo.length)throw new Error(`${file}: empty logo`);
  return agent;
}));
agents.sort((a,b)=>a.name.localeCompare(b.name));
const dataset={...metadata,agents};
const {news,relationships}=dataset;
validate(dataset);
await mkdir(new URL('../dist',import.meta.url),{recursive:true});
await cp(new URL('../src/',import.meta.url),new URL('../dist/',import.meta.url),{recursive:true});
await writeFile(new URL('../dist/data.json',import.meta.url),JSON.stringify(dataset,null,2)+'\n');
const xml=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const origin=metadata.siteUrl||'http://127.0.0.1:4173';
const rss=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Agentlist — ecosystem updates</title><link>${origin}/#news</link><description>Curated primary-source updates about persistent personal agents. Snapshot checked October 21, 2026.</description><lastBuildDate>Wed, 21 Oct 2026 12:00:00 GMT</lastBuildDate>${news.map(n=>`<item><title>${xml(n.title)}</title><link>${xml(n.url)}</link><guid isPermaLink="false">${xml(n.id)}</guid><pubDate>${new Date(n.date+'T12:00:00Z').toUTCString()}</pubDate><description>${xml(n.summary)}</description></item>`).join('')}</channel></rss>`;
await writeFile(new URL('../dist/feed.xml',import.meta.url),rss);
// A standalone edition remains usable when hosting or a local server is unavailable.
const [html,css,app,domain,catalog,platformModule]=await Promise.all(['index.html','styles.css','app.js','domain.js','catalog.js','platforms.js'].map(name=>readFile(new URL(`../src/${name}`,import.meta.url),'utf8')));
const bundledJS=[catalog,platformModule,domain].map(code=>code.replace(/^export /gm,'')).join('\n')+'\n'+app.replace(/^import .*?;\n/gm,'');
const embeddedData=structuredClone(dataset);
for(const a of embeddedData.agents){const bytes=await readFile(new URL(`../src/${a.logo.path}`,import.meta.url));const mime=a.logo.path.endsWith('.svg')?'image/svg+xml':a.logo.path.endsWith('.webp')?'image/webp':'image/png';a.logo.path=`data:${mime};base64,${bytes.toString('base64')}`}
const standalone=html.replace('<link rel="stylesheet" href="./styles.css">',`<style>${css}</style>`).replace('<script type="module" src="./app.js"></script>','').replace('</body>',`<script id="agentlist-data" type="application/json">${JSON.stringify(embeddedData).replaceAll('<','\\u003c')}</script><script type="module">${bundledJS.replaceAll('</script','<\\/script')}</script></body>`);
await writeFile(new URL('../dist/agentlist.html',import.meta.url),standalone);
console.log(`Built ${agents.length} profiles, ${relationships.length} relationships, ${news.length} updates.`);
