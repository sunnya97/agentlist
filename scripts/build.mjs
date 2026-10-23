import {cp,mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {validate} from './validate.mjs';
import {fields} from '../src/catalog.js';
import {channelLabels,channelOrder} from '../src/channels.js';
import {accessSummary} from '../src/access.js';
import {computeFacets,computeSummary} from '../src/compute.js';
import {continuityFacets,continuitySummary} from '../src/continuity.js';
import {platformStatusLabels} from '../src/platforms.js';
import {contextClaims} from '../src/domain.js';
const root=new URL('../',import.meta.url);
const metadata=JSON.parse(await readFile(new URL('data/catalog.json',root),'utf8'));
const dataSources=JSON.parse(await readFile(new URL('data/datasources.json',root),'utf8'));
const files=(await readdir(new URL('data/agents/',root))).filter(name=>name.endsWith('.json')).sort();
const agents=await Promise.all(files.map(async file=>{
  const record=JSON.parse(await readFile(new URL(`data/agents/${file}`,root),'utf8'));
  if(file!==`${record.id}.json`)throw new Error(`${file}: filename must match agent ID`);
  if(new Set(record.claims.map(c=>c.field)).size!==record.claims.length)throw new Error(`${file}: duplicate claim`);
  const knownFields=new Set(fields.map(([key])=>key));
  for(const claim of record.claims)if(!knownFields.has(claim.field))throw new Error(`${file}: unrecognized field ${claim.field}`);
  const hardware=record.hardware||{status:'unknown',name:'',detail:'',sourceIds:[]};
  // Messaging services are channels, not native apps, and keep their own list.
  const messaging=[...(record.messaging||[])].sort((x,y)=>channelOrder.indexOf(x.service)-channelOrder.indexOf(y.service));
  const access=record.access||null;
  const compute=record.compute||{};
  const continuity=record.continuity||{};
  const dataAccess=record.dataAccess||[];
  const newsSource=record.newsSource||null;
  const context=contextClaims(record);
  const claims=fields.map(([field])=>{
    if(field==='messaging'&&messaging.length){
      const label=m=>channelLabels[m.service]+(m.status==='available'?'':` · ${platformStatusLabels[m.status]}`);
      return {field,value:messaging.map(label).join(', '),shortValue:messaging.map(m=>channelLabels[m.service]).join(', '),status:messaging.every(m=>m.status==='available')?'documented':'limited',sourceIds:[...new Set(messaging.flatMap(m=>m.sourceIds))],checkedAt:metadata.checkedAt};
    }
    if(Object.hasOwn(continuityFacets,field)){
      const facet=continuity[field];
      if(!facet)return {field,value:'Not specified',status:'unknown',sourceIds:[],checkedAt:metadata.checkedAt};
      return {field,value:facet.detail,shortValue:continuitySummary(field,facet),status:facet.status||'documented',sourceIds:facet.sourceIds,checkedAt:metadata.checkedAt};
    }
    if(Object.hasOwn(computeFacets,field)){
      const facet=compute[field];
      if(!facet)return {field,value:'Not specified',status:'unknown',sourceIds:[],checkedAt:metadata.checkedAt};
      return {field,value:facet.detail,shortValue:computeSummary(field,facet),status:facet.status||'documented',sourceIds:facet.sourceIds,checkedAt:metadata.checkedAt};
    }
    if(field==='availability'&&access){
      const written=record.claims.find(c=>c.field==='availability');
      return {field,value:written?.value||access.detail,shortValue:accessSummary(access),status:written?.status||'documented',sourceIds:written?.sourceIds||access.sourceIds,access,checkedAt:metadata.checkedAt};
    }
    if(field==='hardware'&&hardware.detail&&hardware.sourceIds.length)return {field,value:hardware.detail,shortValue:hardware.name?`${hardware.name} · ${hardware.status==='announced'?'announced':hardware.status==='unknown'?'availability unclear':hardware.status}`:hardware.status,status:['announced','unknown'].includes(hardware.status)?'limited':'documented',sourceIds:hardware.sourceIds,checkedAt:metadata.checkedAt};
    return {field,value:'Not specified',status:'unknown',sourceIds:[],checkedAt:metadata.checkedAt,...(context.find(c=>c.field===field)||record.claims.find(c=>c.field===field))};
  });
  const sourceDates=record.sources.map(source=>source.checkedAt).filter(Boolean).sort();
  const checkedAt=sourceDates[sourceDates.length-1]||metadata.checkedAt;
  const oldestSource=sourceDates[0]||metadata.checkedAt;
  const agent={...record,checkedAt,oldestSource,newsSource,claims,hardware,messaging,access,compute,continuity,dataAccess,plans:record.plans||[],discussions:record.discussions||[],platforms:record.platforms||[],company:record.company||null,launches:record.launches||[]};
  const logo=await readFile(new URL(`src/${agent.logo.path}`,root));
  if(!logo.length)throw new Error(`${file}: empty logo`);
  return agent;
}));
agents.sort((a,b)=>a.name.localeCompare(b.name));
const allDates=agents.flatMap(a=>a.sources.map(s=>s.checkedAt)).filter(Boolean).sort();
const dataset={...metadata,checkedFrom:allDates[0],checkedTo:allDates[allDates.length-1],dataSources,agents};
const {news,relationships}=dataset;
validate(dataset);
await mkdir(new URL('../dist',import.meta.url),{recursive:true});
await cp(new URL('../src/',import.meta.url),new URL('../dist/',import.meta.url),{recursive:true});
await writeFile(new URL('../dist/data.json',import.meta.url),JSON.stringify(dataset,null,2)+'\n');
const xml=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const origin=metadata.siteUrl||'http://127.0.0.1:4173';
const rss=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Agentlist — ecosystem updates</title><link>${origin}/#news</link><description>Curated primary-source updates about persistent personal agents. Snapshot checked ${metadata.checkedAt}.</description><lastBuildDate>${new Date(metadata.checkedAt+'T12:00:00Z').toUTCString()}</lastBuildDate>${news.map(n=>`<item><title>${xml(n.title)}</title><link>${xml(n.url)}</link><guid isPermaLink="false">${xml(n.id)}</guid><pubDate>${new Date(n.date+'T12:00:00Z').toUTCString()}</pubDate><description>${xml(n.summary)}</description></item>`).join('')}</channel></rss>`;
await writeFile(new URL('../dist/feed.xml',import.meta.url),rss);
const [html,css,app,domain,catalog,platformModule,channelModule,accessModule,computeModule,continuityModule,dataSourceModule]=await Promise.all(['index.html','styles.css','app.js','domain.js','catalog.js','platforms.js','channels.js','access.js','compute.js','continuity.js','datasources.js'].map(name=>readFile(new URL(`../src/${name}`,import.meta.url),'utf8')));
// A custom domain needs a CNAME beside the output, and a static host should not
// run Jekyll over it.
if(metadata.siteUrl){
  await writeFile(new URL('../dist/CNAME',import.meta.url),new URL(metadata.siteUrl).hostname+'\n');
  await writeFile(new URL('../dist/.nojekyll',import.meta.url),'');
}
// Every route gets a real page, so each agent is crawlable, linkable and has
// its own preview card. Each one boots the same app.
if(metadata.siteUrl){
  const origin=metadata.siteUrl.replace(/\/$/,'');
  const page=(path,{title,description,extraHead='',body=''})=>{
    const abs=origin+path;
    let out=html
      .replace(/<title>[^<]*<\/title>/,`<title>${xml(title)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${xml(description)}">`)
      .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${xml(abs)}">`)
      .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${xml(title)}">`)
      .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${xml(description)}">`)
      .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${xml(abs)}">`);
    if(extraHead)out=out.replace('</head>',extraHead+'\n</head>');
    // Content for crawlers and for anyone whose JavaScript has not run yet.
    if(body)out=out.replace('<main id="main" tabindex="-1"><div class="loading">Loading agents…</div></main>',
      `<main id="main" tabindex="-1"><div class="page prerender">${body}</div></main>`);
    return out;
  };
  const write=async (path,contents)=>{
    const dir=new URL('../dist'+path,import.meta.url);
    await mkdir(dir,{recursive:true});
    await writeFile(new URL('../dist'+path+'/index.html',import.meta.url),contents);
  };
  const routes=[
    ['/compare','Compare personal agents','Put up to four personal agents side by side: what they can do, what they cost, where they run, and what you keep if you leave.'],
    ['/ecosystem','What personal agents are built on','Verified runtime dependencies, code forks and renames between personal agents.'],
    ['/news','Personal agent news','Dated launches, releases and availability changes across the personal agent ecosystem, each linked to its source.'],
    ['/discussion','What people say about personal agents','Attributed feedback snapshots and linked discussion threads for personal agents.'],
    ['/about','How Agentlist researches agents','Scope, evidence standards, lineage rules and update process behind the catalogue.']
  ];
  for(const [path,title,description] of routes){
    await write(path,page(path+'/',{title:`${title} — Agentlist`,description}));
  }
  const claimOf=(agent,field)=>{const c=agent.claims.find(x=>x.field===field);return c&&c.status!=='unknown'?(c.shortValue||c.value):null};
  for(const agent of agents){
    const facts=[['Where it runs',claimOf(agent,'hosting')],['Price',claimOf(agent,'pricing')],
      ['Computer use',claimOf(agent,'computerUse')],['If the vendor stops',claimOf(agent,'worksWithoutVendor')]]
      .filter(([,v])=>v);
    const description=`${agent.summary} ${facts.map(([k,v])=>`${k}: ${v}.`).join(' ')}`.slice(0,300);
    const body=`<h1>${xml(agent.name)}</h1><p>${xml(agent.summary)}</p>`
      +`<dl>${facts.map(([k,v])=>`<dt>${xml(k)}</dt><dd>${xml(v)}</dd>`).join('')}</dl>`
      +`<p><a href="${xml(agent.website)}">Official website</a> · <a href="/">All agents</a></p>`;
    await write(`/agent/${agent.id}`,page(`/agent/${agent.id}/`,{
      title:`${agent.name} — Agentlist`,
      description,
      body
    }));
  }
  const urls=[origin+'/',...routes.map(([path])=>origin+path+'/'),...agents.map(a=>`${origin}/agent/${a.id}/`)];
  await writeFile(new URL('../dist/sitemap.xml',import.meta.url),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
      urls.map(u=>`<url><loc>${xml(u)}</loc><lastmod>${metadata.checkedAt}</lastmod></url>`).join('')}</urlset>\n`);
  await writeFile(new URL('../dist/robots.txt',import.meta.url),
    `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
}

// A standalone edition remains usable when hosting or a local server is unavailable.

const bundledJS=[catalog,platformModule,channelModule,accessModule,computeModule,continuityModule,dataSourceModule,domain].map(code=>code.replace(/^import .*?;\n/gm,'').replace(/^export /gm,'')).join('\n')+'\n'+app.replace(/^import .*?;\n/gm,'');
const embeddedData=structuredClone(dataset);
for(const a of embeddedData.agents){const bytes=await readFile(new URL(`../src/${a.logo.path}`,import.meta.url));const mime=a.logo.path.endsWith('.svg')?'image/svg+xml':a.logo.path.endsWith('.webp')?'image/webp':'image/png';a.logo.path=`data:${mime};base64,${bytes.toString('base64')}`}
const standalone=html.replace('<link rel="stylesheet" href="/styles.css">',`<style>${css}</style>`).replace('<script type="module" src="/app.js"></script>','').replace('</body>',`<script id="agentlist-data" type="application/json">${JSON.stringify(embeddedData).replaceAll('<','\\u003c')}</script><script type="module">${bundledJS.replaceAll('</script','<\\/script')}</script></body>`);
await writeFile(new URL('../dist/agentlist.html',import.meta.url),standalone);
console.log(`Built ${agents.length} profiles, ${relationships.length} relationships, ${news.length} updates.`);
