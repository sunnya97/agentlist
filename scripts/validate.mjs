import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {fields as fieldDefinitions,companyTypes,launchKinds} from '../src/catalog.js';
import {platformLabels,platformStatusLabels} from '../src/platforms.js';
import {channelLabels} from '../src/channels.js';
import {accessStates,accessRestrictions} from '../src/access.js';
export function validate(data){
  const ids=new Set();const fields=fieldDefinitions.map(([key])=>key);
  const url=u=>assert(['https:','http:'].includes(new URL(u).protocol),`Invalid URL ${u}`);
  const date=d=>assert(typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+'T12:00:00Z').toISOString().startsWith(d)&&d<=data.checkedAt,`Invalid or future date ${d}`);
  const partialDate=d=>{assert(typeof d==='string'&&/^\d{4}(-\d{2})?(-\d{2})?$/.test(d),`Invalid date ${d}`);date((d+'-01-01').slice(0,10))};
  if(data.repository)assert(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(data.repository),'Repository must be a GitHub repository URL');
  for(const a of data.agents){
    assert(a.id&&!ids.has(a.id),`Duplicate agent ID ${a.id}`);ids.add(a.id);
    assert(['managed','runtime','local','watchlist','adjacent'].includes(a.category));
    assert(a.name&&a.summary&&a.organization);url(a.website);if(a.repository)url(a.repository);
    assert(/^\.\/logos\/[a-z0-9-]+\.(svg|png|webp)$/.test(a.logo?.path),`${a.id} needs a local logo`);url(a.logo.sourceUrl);url(a.logo.sourcePage);
    const sourceIds=new Set(a.sources.map(s=>s.id));assert(sourceIds.size===a.sources.length);
    for(const s of a.sources){url(s.url);assert(s.title);date(s.checkedAt)}
    const evidence=(item,label)=>{assert(Array.isArray(item.sourceIds)&&item.sourceIds.length,`${a.id}/${label} needs evidence`);for(const id of item.sourceIds)assert(sourceIds.has(id),`${a.id}/${label} references missing source ${id}`)};
    if(a.company){assert(Object.hasOwn(companyTypes,a.company.type));evidence(a.company,'company');if(a.company.stage)assert(typeof a.company.stage==='string');if(a.company.funding){const f=a.company.funding;assert(f.amount&&f.round);partialDate(f.date);evidence(f,'funding')}}
    const launches=new Set();for(const event of a.launches||[]){partialDate(event.date);assert(Object.hasOwn(launchKinds,event.kind));evidence(event,'launch');const key=event.date+':'+event.kind;assert(!launches.has(key),`${a.id}: duplicate launch event`);launches.add(key)}
    assert(Array.isArray(a.plans)&&Array.isArray(a.discussions),`${a.id} needs plans and discussions arrays`);
    const planNames=new Set();for(const p of a.plans){
      assert(p.name&&p.price&&p.billing&&!planNames.has(p.name),`${a.id}: invalid or duplicate plan`);planNames.add(p.name);
      for(const key of ['includes','limits'])assert(Array.isArray(p[key])&&p[key].every(v=>typeof v==='string'&&v.trim()),`${a.id}/${p.name}: invalid ${key}`);
      evidence(p,p.name);
    }
    assert(['available','announced','optional','none','unknown'].includes(a.hardware?.status),`${a.id}: invalid hardware state`);
    if(a.hardware.status!=='unknown'){assert(a.hardware.detail);evidence(a.hardware,'hardware')}
    const discussionUrls=new Set();for(const d of a.discussions){
      url(d.url);date(d.date);assert(d.title&&d.summary&&d.platform&&!discussionUrls.has(d.url));discussionUrls.add(d.url);
      assert(['positive','mixed','critical','neutral'].includes(d.sentiment));assert(['community','announcement'].includes(d.kind));
    }
    if(a.sentiment){const s=a.sentiment;url(s.url);url(s.dataUrl);date(s.windowStart);date(s.windowEnd);date(s.checkedAt);assert(s.windowStart<=s.windowEnd);assert(s.provider&&s.channels?.length);for(const key of ['posts','positiveUserWeeks','negativeUserWeeks'])assert(Number.isInteger(s[key])&&s[key]>=0);assert(s.positiveUserWeeks+s.negativeUserWeeks>0);assert(s.positiveShare>=0&&s.positiveShare<=100);assert(Math.abs(s.positiveShare-100*s.positiveUserWeeks/(s.positiveUserWeeks+s.negativeUserWeeks))<.15,'Sentiment percentage must match sample counts')}
    assert(Array.isArray(a.platforms),`${a.id} missing platforms`);
    const platforms=new Set();for(const p of a.platforms){
      assert(Object.hasOwn(platformLabels,p.platform)&&!platforms.has(p.platform),`${a.id} invalid or duplicate platform`);platforms.add(p.platform);
      assert(Object.hasOwn(platformStatusLabels,p.status));assert(p.detail&&p.sourceIds.length);
      for(const sourceId of p.sourceIds)assert(sourceIds.has(sourceId),`${a.id}/${p.platform} references missing source`);
    }
    assert(Array.isArray(a.messaging||[]),`${a.id} messaging must be a list`);
    const services=new Set();for(const m of a.messaging||[]){
      assert(Object.hasOwn(channelLabels,m.service)&&!services.has(m.service),`${a.id} invalid or duplicate messaging service ${m.service}`);services.add(m.service);
      assert(Object.hasOwn(platformStatusLabels,m.status),`${a.id}/${m.service} invalid status`);
      assert(m.detail,`${a.id}/${m.service} needs a detail`);evidence(m,`messaging:${m.service}`);
    }
    if(a.access){
      const x=a.access;
      assert(Object.hasOwn(accessStates,x.state),`${a.id}: invalid access state ${x.state}`);
      for(const r of x.restrictions||[])assert(Object.hasOwn(accessRestrictions,r),`${a.id}: invalid access restriction ${r}`);
      assert(new Set(x.restrictions||[]).size===(x.restrictions||[]).length,`${a.id}: duplicate access restriction`);
      // An expected date may be in the future, unlike a launch that already happened.
      if(x.expected){assert(/^\d{4}(-\d{2})?(-\d{2})?$/.test(x.expected),`${a.id}: invalid expected date`);assert(x.state!=='available',`${a.id}: an available product needs no expected date`)}
      assert(x.detail,`${a.id}: access needs a detail`);evidence(x,'access');
    }
    for(const field of fields){const matches=a.claims.filter(c=>c.field===field);assert(matches.length===1,`${a.id} missing or duplicate ${field}`);const c=matches[0];assert(['documented','limited','unknown'].includes(c.status));assert(typeof c.value==='string'&&c.value);assert(c.status==='unknown'||c.sourceIds.length,`${a.id}/${field} needs evidence`);for(const s of c.sourceIds)assert(sourceIds.has(s),`${a.id}/${field} references missing source ${s}`)}
  }
  const nodes=new Set([...ids,...data.externalNodes.map(n=>n.id)]);
  for(const r of data.relationships){assert(nodes.has(r.from)&&nodes.has(r.to));assert(r.from!==r.to);assert(['built-on','fork','renamed'].includes(r.type));url(r.sourceUrl);assert(r.note)}
  const newsIds=new Set();for(const n of data.news){assert(!newsIds.has(n.id));newsIds.add(n.id);url(n.url);assert(/^\d{4}-\d{2}-\d{2}$/.test(n.date)&&n.date<=data.checkedAt);assert(n.title&&n.summary&&n.type);assert(n.agentIds.length);n.agentIds.forEach(id=>assert(ids.has(id)))}
  return true;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const d=JSON.parse(await readFile(new URL('../dist/data.json',import.meta.url),'utf8'));validate(d);console.log(`Valid: ${d.agents.length} profiles; all comparison claims and graph edges have consistent evidence references.`)}
