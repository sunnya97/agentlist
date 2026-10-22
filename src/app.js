import {filterAgents,parseSelection,getClaim,compareRows,sortedNews,sortAgents,firstLaunch,formatCatalogDate} from './domain.js';
import {fields,fieldGroups,directoryViews,featuredOrder,companyTypes,launchKinds} from './catalog.js';
import {platformLabels,platformIcons,platformStatusLabels} from './platforms.js';
import {channelLabels,channelIcons} from './channels.js';
import {accessStates,accessRestrictions,accessSummary,accessShort} from './access.js';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>{try{const p=new URL(u);return /^https?:$/.test(p.protocol)?esc(p.href):'#'}catch{return '#'}};
const external=(url,label,cls='')=>`<a class="${cls}" href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
const searchIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
const uiIcon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',compare:'<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',sliders:'<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',model:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',exit:'<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 8 6 12l4 4M6 12h9"/>'}[name]||''}</svg>`;
const viewIcons={overview:'grid',capabilities:'sliders',models:'model',access:'grid',company:'grid',continuity:'exit',control:'lock'};
const categoryLabels={managed:'Hosted agent',runtime:'Self-hosted',local:'Local-first app',watchlist:'Under review',adjacent:'Coding tool'};
const typeLabels={'built-on':'Built on',fork:'Code fork',renamed:'Renamed'};
const profileHref=(id,tab='overview')=>`#agent/${encodeURIComponent(id)}${tab==='overview'?'':'?tab='+tab}`;
let profileState={id:null,tab:'overview'};
let data,agents,byId,selected=[],watchlist=[],differences=false,newsState={agent:'all',type:'all',search:'',watching:false};
let directoryState={search:'',category:'all',hosting:'all',companyType:'all',access:'all',adjacent:false,watching:false,sort:'featured',view:'overview'};
try{watchlist=JSON.parse(localStorage.getItem('agentlist:watchlist')||'[]');if(!Array.isArray(watchlist))watchlist=[]}catch{watchlist=[]}
const icon=a=>`<span class="agent-icon ${a.id==='openfang'?'dark-logo':''}" aria-hidden="true"><img src="${esc(a.logo.path)}" alt="" width="40" height="40" loading="lazy"></span>`;
const tag=a=>`<span class="tag ${esc(a.category)}">${categoryLabels[a.category]||esc(a.category)}</span>`;
// Availability rides on the metadata line, not beside the name: a single word
// for the state only. Restrictions are detail and live in the data and profile.
const accessNote=a=>{
  const x=a.access;if(!x||x.state==='available')return '';
  return `<span class="access-note ${esc(x.state)}" title="${esc(accessStates[x.state]+' — '+x.detail)}">${esc(accessShort[x.state]||accessStates[x.state])}</span>`;
};
const formatDate=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
const sourceLinks=(a,c)=>c.sourceIds.map(id=>{const i=a.sources.findIndex(s=>s.id===id);if(i<0)return '';const s=a.sources[i];return external(s.url,`[${i+1}]`,'citation').replace('<a ',`<a aria-label="${esc(s.title)}" title="${esc(s.title)} · checked ${s.checkedAt}" `)}).join('');
const iconListHTML=(a,kind,limit,empty)=>{
  const list=(kind==='platforms'?a.platforms:a.messaging)||[];
  if(!list.length)return `<span class="unknown-value" aria-label="${esc(empty)}" title="${esc(empty)}">—</span>`;
  const isPlatform=kind==='platforms';
  const nameOf=p=>isPlatform?platformLabels[p.platform]:channelLabels[p.service];
  const iconOf=p=>isPlatform?platformIcons[p.platform]:channelIcons[p.service];
  const shown=list.slice(0,limit),rest=list.slice(limit);
  const button=(p,i)=>{
    const label=nameOf(p),state=p.status==='available'?'':` · ${platformStatusLabels[p.status]}`;
    return `<button class="platform-icon ${p.status}" data-platform="${a.id}:${i}:${kind}" aria-label="${esc(label+state)}" title="${esc(label+state+' — '+p.detail)}" aria-haspopup="dialog" aria-controls="platform-popover" aria-expanded="false">${iconOf(p)}${p.status!=='available'?'<span class="platform-status" aria-hidden="true"></span>':''}</button>`;
  };
  const more=rest.length?`<span class="platform-more" title="${esc(rest.map(nameOf).join(', '))}">+${rest.length}</span>`:'';
  return `<div class="platform-list${isPlatform?'':' messaging-list'}">${shown.map(button).join('')}${more}</div>`;
};
const platformListHTML=a=>iconListHTML(a,'platforms',5,'App availability not specified');
const messagingListHTML=a=>iconListHTML(a,'messaging',3,'Messaging services not specified');
function openPlatform(button){
  const [id,index,kind='platforms']=button.dataset.platform.split(':'),a=byId.get(id),p=a?.[kind]?.[Number(index)];if(!p)return;
  const panel=$('#platform-popover');
  if(panel.matches(':popover-open')){panel.hidePopover();if(panel.dataset.trigger===button.dataset.platform)return}
  panel.dataset.trigger=button.dataset.platform;
  document.querySelectorAll('[data-platform][aria-expanded="true"]').forEach(el=>el.setAttribute('aria-expanded','false'));
  panel.innerHTML=`<div class="platform-popover-heading">${entryIcon(p)}<div><h3>${esc(entryLabel(p))}</h3><span>${platformStatusLabels[p.status]}</span></div></div><p>${esc(p.detail)}</p><div class="platform-sources">${sourceLinks(a,p)}</div>`;
  panel.showPopover();button.setAttribute('aria-expanded','true');
  const rect=button.getBoundingClientRect(),width=panel.offsetWidth,height=panel.offsetHeight;
  panel.style.left=`${Math.max(12,Math.min(rect.left,innerWidth-width-12))}px`;
  panel.style.top=`${Math.max(12,rect.bottom+height+20>innerHeight?rect.top-height-8:rect.bottom+8)}px`;
}
const claimHTML=(a,key,compact=false)=>{
  if(key==='nativeApps')return platformListHTML(a);
  if(key==='messaging')return messagingListHTML(a)+(compact||!a.messaging?.length?'':`<div class="platform-sources">${sourceLinks(a,getClaim(a,'messaging'))}</div>`);
  if(compact&&key==='launchDate'&&firstLaunch(a)){const event=firstLaunch(a);return `<div class="claim">${formatCatalogDate(event.date)}<small class="launch-detail">${launchKinds[event.kind]}</small></div>`}
  if(compact&&key==='funding'&&a.company?.funding){const f=a.company.funding;return `<div class="claim">${esc(f.amount)}<small class="launch-detail">${esc(f.round)} · ${formatCatalogDate(f.date)}</small></div>`}
  if(key==='pricing'&&!compact&&a.plans.length)return plansHTML(a,true);
  const c=getClaim(a,key),value=c.status==='unknown'?'Not specified':(compact&&c.shortValue)||c.value;
  if(compact)return `<div class="claim ${c.status==='unknown'?'unknown-value':''}" title="${esc(c.status==='unknown'?value:c.value)}">${c.status==='unknown'?'<span aria-label="Not specified">—</span>':esc(value)}</div>`;
  return `<div class="claim ${c.status==='unknown'?'unknown-value':''}">${esc(value)}${sourceLinks(a,c)}</div>`;
};
const searchBox=(id,value,placeholder)=>`<div class="search">${searchIcon}<input id="${id}" type="search" value="${esc(value)}" placeholder="${placeholder}" aria-label="${placeholder}">${id==='agent-search'?'<kbd>/</kbd>':''}</div>`;
const options=(items,value)=>items.map(([v,l])=>`<option value="${esc(v)}" ${value===v?'selected':''}>${esc(l)}</option>`).join('');
const intro=(kicker,title,description,action='')=>`<div class="page-intro"><div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
function saveWatchlist(){try{localStorage.setItem('agentlist:watchlist',JSON.stringify(watchlist))}catch{toast('Watchlist is available for this visit; browser storage is unavailable.')}}
function route(){
  const hash=location.hash.slice(1)||'directory',page=hash.split('?')[0].split('/')[0];
  const active=page==='agent'?'directory':page;
  document.title='Agentlist — Compare personal agents';
  document.querySelectorAll('[data-nav]').forEach(el=>{el.classList.toggle('active',el.dataset.nav===active);if(el.dataset.nav===active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
  if(page==='agent'){
    let id='';try{id=decodeURIComponent((hash.split('/')[1]||'').split('?')[0])}catch{}
    const tab=new URLSearchParams(hash.split('?')[1]).get('tab');
    if(byId.has(id))renderProfile(id,['overview','plans','discussion','sources'].includes(tab)?tab:'overview');
    else{profileState={id:null,tab:'overview'};document.title='Agent not found — Agentlist';$('#main').innerHTML='<div class="page"><div class="empty"><h1>Agent not found</h1><p>This profile link doesn’t match an agent in the directory.</p><a class="button primary" href="#directory">All agents →</a></div></div>'}
  }else{
    profileState={id:null,tab:'overview'};
    if(page==='compare'){if(hash.includes('?'))selected=parseSelection(hash,new Set(agents.map(a=>a.id)));renderCompare()}
    else if(page==='lineage')renderLineage();else if(page==='news')renderNews();else if(page==='discussion')renderDiscussion();else if(page==='methodology')renderMethodology();else renderDirectory();
  }
  updateTray();
}
function renderDirectory(){
  const view=directoryViews[directoryState.view];
  $('#main').innerHTML=`<div class="page directory-page">
    <section class="directory-intro">
      <div><h1>Personal agents<span class="heading-count">${agents.filter(a=>a.category!=='adjacent').length}</span></h1><p>Find the right agent for the way you work.</p></div>
      <a class="button primary" href="#compare?agents=ambi,underdog,hermes">${uiIcon('compare')} Compare agents</a>
    </section>
    <div class="directory-layout"><section aria-label="Agent directory">
      <div class="filters">
        ${searchBox('agent-search',directoryState.search,'Search agents or features…')}
        <select id="category-filter" aria-label="Filter by agent type">${options([['all','All types'],['managed','Hosted agents'],['runtime','Self-hosted'],['local','Local-first apps'],['watchlist','Under review']],directoryState.category)}</select>
        <select id="company-filter" aria-label="Filter by company type">${options([['all','All companies'],...Object.entries(companyTypes)],directoryState.companyType)}</select>
        <select id="access-filter" aria-label="Filter by availability">${options([['all','Any availability'],['open','Available to anyone'],['gated','Available with limits'],['upcoming','Not yet available'],['unverified','Access unverified']],directoryState.access)}</select>
        <select id="sort-filter" aria-label="Sort agents">${options([['featured','Featured first'],['name','Name A–Z'],['category','Agent type'],['launch','Newest launches']],directoryState.sort)}</select>
        <button class="following-filter ${directoryState.watching?'active':''}" data-action="watch-filter" aria-pressed="${directoryState.watching}">${uiIcon('star')} Following${watchlist.length?` <span>${watchlist.length}</span>`:''}</button>
      </div>
      <div class="table-toolbar"><div class="view-switch" role="group" aria-label="Comparison dimensions">${Object.entries(directoryViews).map(([key,item])=>`<button data-view="${key}" aria-pressed="${directoryState.view===key}" class="${directoryState.view===key?'active':''}">${uiIcon(viewIcons[key])}${item.label}</button>`).join('')}</div><span class="result-count" id="result-count"></span></div>
      <div class="table-wrap"><table class="directory-table ${directoryState.view==='overview'?'overview-table':''}"><caption class="sr-only">Personal agent ${view.label.toLowerCase()}. Select up to four agents for comparison.</caption><colgroup><col class="selection-col"><col class="identity-col">${view.fields.map(([key])=>`<col class="field-col ${key==='uniqueFeatures'?'standout-col':key==='nativeApps'?'platform-col':key==='messaging'?'messaging-col':''}">`).join('')}<col class="follow-col"></colgroup><thead><tr><th class="check"><span class="sr-only">Compare</span></th><th scope="col">Agent</th>${view.fields.map(([,label])=>`<th scope="col">${label}</th>`).join('')}<th><span class="sr-only">Follow</span></th></tr></thead><tbody id="agent-rows"></tbody></table></div>
      <div class="table-note"><label><input type="checkbox" id="include-adjacent" ${directoryState.adjacent?'checked':''}> Include coding tools</label><span>Select up to 4 agents to compare</span></div>
    </section>
    <aside class="sidebar"><div class="section-top"><h2>From the ecosystem</h2><a href="#news">All updates ${uiIcon('arrow')}</a></div>${sortedNews(data.news).slice(0,3).map(n=>external(n.url,`<div class="news-meta"><time datetime="${n.date}">${formatDate(n.date)}</time><span class="type">${esc(n.type||'release')}</span></div><h3>${esc(n.title)} ${uiIcon('arrow')}</h3><span class="publisher">${esc(n.publisher||'Official release notes')}</span>`,'news-mini')).join('')}</aside>
    </div></div>`;
  updateDirectoryRows();
}
function updateDirectoryRows(){
  const list=sortAgents(filterAgents(agents,{...directoryState,watchlist}),directoryState.sort,featuredOrder);
  const view=directoryViews[directoryState.view];
  $('#result-count').textContent=`${list.length} agent${list.length===1?'':'s'}`;
  $('#agent-rows').innerHTML=list.length?list.map(a=>`<tr class="${selected.includes(a.id)?'selected':''}"><td class="check"><input type="checkbox" aria-label="Compare ${esc(a.name)}" data-select="${a.id}" ${selected.includes(a.id)?'checked':''}></td><td><a class="agent-cell" href="${profileHref(a.id)}">${icon(a)}<span><b>${esc(a.name)}</b><small><span class="org">${esc(a.organization)}</span>${accessNote(a)}</small></span></a></td>${view.fields.map(([key,label])=>`<td data-label="${esc(label)}">${claimHTML(a,key,true)}</td>`).join('')}<td><button class="star ${watchlist.includes(a.id)?'saved':''}" data-watch="${a.id}" aria-label="${watchlist.includes(a.id)?'Unfollow':'Follow'} ${esc(a.name)}" aria-pressed="${watchlist.includes(a.id)}">${uiIcon('star')}</button></td></tr>`).join(''):`<tr class="no-results"><td colspan="${view.fields.length+3}">No agents match these filters. <button class="read-more" data-action="reset-filters">Reset filters →</button></td></tr>`;
}
function updateTray(){
  document.querySelectorAll('[data-profile-compare]').forEach(el=>{const active=selected.includes(el.dataset.profileCompare);el.textContent=active?'Remove from comparison':'Add to comparison ＋';el.setAttribute('aria-pressed',String(active))});
  const tray=$('#compare-tray');$('#nav-count').textContent=selected.length?`(${selected.length})`:'';
  const onCompare=location.hash.startsWith('#compare');tray.hidden=!selected.length||onCompare;
  tray.innerHTML=`<span class="tray-label">COMPARE ${selected.length} / 4</span><div class="tray-chips">${selected.map(id=>`<span class="tray-chip">${esc(byId.get(id).name)}<button data-remove="${id}" aria-label="Remove ${esc(byId.get(id).name)}">×</button></span>`).join('')}</div><button class="tray-clear" data-action="clear-selection">Clear</button><a class="button primary" href="#compare?agents=${selected.join(',')}">Compare agents →</a>`;
  document.querySelectorAll('[data-select]').forEach(el=>{el.checked=selected.includes(el.dataset.select);el.closest('tr').classList.toggle('selected',el.checked)});
}
function selectAgent(id){if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<4)selected.push(id);else toast('Compare up to four agents. Remove one to add another.');updateTray()}
function renderCompare(){
  const list=selected.map(id=>byId.get(id));
  $('#main').innerHTML=`<div class="page">${intro('SIDE BY SIDE','Side by side','A closer look at what each agent can do.',`<button class="button" data-action="copy-comparison">Copy comparison link ↗</button>`)}<div class="page-toolbar"><label><input type="checkbox" id="differences-only" ${differences?'checked':''}> Show differences only</label><div><a href="#directory" class="button small ghost">← Choose agents</a> <button class="button small" data-action="export-comparison" ${list.length?'':'disabled'}>Export CSV ↓</button></div></div>${!list.length?`<div class="empty"><div class="empty-symbol">⌘</div><h2>Choose agents to compare</h2><p>Select up to four agents to see their capabilities side by side.</p><a class="button primary" href="#compare?agents=openclaw,hermes,claude-duet">Compare OpenClaw, Hermes & Claude Duet →</a></div>`:`<div class="comparison-wrap"><table class="comparison" style="min-width:${Math.max(650,175+list.length*240)}px"><caption style="position:absolute;clip:rect(0,0,0,0)">Comparison of ${list.map(a=>esc(a.name)).join(', ')}</caption><thead><tr><th>Features<span class="comparison-date">Updated ${formatDate(data.checkedAt)}</span></th>${list.map(a=>`<th><div class="compare-head">${icon(a)}<button class="remove" data-remove="${a.id}" aria-label="Remove ${esc(a.name)}">×</button><h3><a href="${profileHref(a.id)}">${esc(a.name)}</a></h3>${tag(a)}<select data-swap="${a.id}" aria-label="Replace ${esc(a.name)}">${options(agents.filter(x=>!selected.includes(x.id)||x.id===a.id).map(x=>[x.id,x.name]),a.id)}</select></div></th>`).join('')}</tr></thead><tbody>${fieldGroups.map(group=>{const rows=compareRows(list,group.fields,differences);return rows.length?`<tr class="compare-section"><th colspan="${list.length+1}" scope="colgroup">${group.label}</th></tr>${rows.map(row=>`<tr><th scope="row">${row.label}</th>${list.map(a=>`<td>${claimHTML(a,row.key)}</td>`).join('')}</tr>`).join('')}`:''}).join('')}</tbody></table></div>`}</div>`;
}
function renderNews(){
  $('#main').innerHTML=`<div class="page">${intro('THE CHANGELOG','An ecosystem in motion.','Launches, releases, and updates from across the agent ecosystem.',`<a class="button" href="./feed.xml">Follow via RSS ↗</a>`)}<div class="news-controls">${searchBox('news-search',newsState.search,'Search the news…')}<select id="news-agent" class="filter-select" aria-label="Filter news by agent">${options([['all','All agents'],...agents.filter(a=>data.news.some(n=>n.agentIds.includes(a.id))).map(a=>[a.id,a.name])],newsState.agent)}</select><select id="news-type" class="filter-select" aria-label="Filter news by type">${options([['all','All updates'],...Array.from(new Set(data.news.map(n=>n.type))).map(t=>[t,t[0].toUpperCase()+t.slice(1)])],newsState.type)}</select></div><div class="page-toolbar"><span class="subtle" id="news-count"></span><label><input type="checkbox" id="news-watching" ${newsState.watching?'checked':''}> Only agents I follow</label></div><div id="news-results"></div><p class="fine-print">Manually curated. Last updated ${formatDate(data.checkedAt)}.</p></div>`;updateNews();
}
function updateNews(){
  const list=sortedNews(data.news,{...newsState,watchlist:newsState.watching?watchlist:null});$('#news-count').textContent=`${list.length} UPDATES`;
  $('#news-results').innerHTML=list.length?`<div class="news-list">${list.map(n=>`<article class="news-card"><div class="news-meta"><time datetime="${n.date}">${formatDate(n.date)}</time><span>·</span><span class="type">${esc(n.type)}</span></div><h2>${external(n.url,esc(n.title)+' ↗')}</h2><p>${esc(n.summary)}</p><div class="news-bottom"><span>${n.agentIds.map(id=>`<a href="${profileHref(id)}">${esc(byId.get(id)?.name||id)}</a>`).join(' · ')}</span>${external(n.url,'Read source ↗')}</div></article>`).join('')}</div>`:'<div class="empty"><h2>No matching updates.</h2><p>Try another filter, or follow agents using the stars in the directory.</p></div>';
}
function renderLineage(){
  const relationships=data.relationships;
  const positions={openclaw:[45,105],'kimi-claw':[340,45],maxclaw:[340,165],antigravity:[640,105],'gemini-spark':[935,105]};
  const nodes=[...new Set(relationships.flatMap(r=>[r.from,r.to]))];
  const name=id=>byId.get(id)?.name||data.externalNodes.find(n=>n.id===id)?.name||id;
  const graphNodes=nodes.filter(id=>positions[id]).map(id=>{const a=byId.get(id),[x,y]=positions[id];return `<a ${a?`href="${profileHref(id)}" aria-label="View ${esc(a.name)}"`:`aria-label="${esc(name(id))}"`}><g class="node" transform="translate(${x},${y})"><rect width="185" height="68" rx="7" fill="#fff" stroke="#dce1eb"/>${a?`<image href="${esc(a.logo.path)}" x="14" y="14" width="22" height="22"/>`:''}<text x="${a?44:14}" y="29" fill="#303b4f" font-size="13" font-weight="600">${esc(name(id))}</text><text x="14" y="51" fill="#758096" font-size="10">${esc(a?categoryLabels[a.category]:'Agent harness')}</text></g></a>`}).join('');
  const graphEdges=relationships.filter(r=>positions[r.from]&&positions[r.to]).map(r=>{const [x,y]=positions[r.from],[tx,ty]=positions[r.to],start=x+185,sy=y+34,ey=ty+34,m=(start+tx)/2;return `<path d="M${start},${sy} C${m},${sy} ${m},${ey} ${tx},${ey}" fill="none" stroke="#8494be" stroke-width="1.7" marker-end="url(#arrow)"><title>${esc(r.note)}</title></path>`}).join('');
  $('#main').innerHTML=`<div class="page">${intro('THE FAMILY TREE','What’s built on what','The runtimes and code behind personal agents.')}<div class="page-toolbar"><div class="lineage-legend"><span class="legend-item"><i class="legend-line"></i>Runtime → product</span></div><span class="subtle">${relationships.length} RELATIONSHIPS</span></div><div class="lineage-panel"><svg viewBox="0 0 1160 285" aria-label="Agent runtime relationships"><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="none" stroke="#8494be"/></marker></defs>${graphEdges}${graphNodes}</svg></div><div class="relationship-list">${relationships.map(r=>`<article class="relationship"><div class="relation-title">${byId.has(r.from)?`<a href="${profileHref(r.from)}"><b>${esc(name(r.from))}</b></a>`:`<b>${esc(name(r.from))}</b>`}<span>→</span><a href="${profileHref(r.to)}"><b>${esc(name(r.to))}</b></a><span class="tag">${typeLabels[r.type]}</span></div><p>${esc(r.note)}</p>${external(r.sourceUrl,'View source ↗')}</article>`).join('')}</div></div>`;
}
function renderMethodology(){
  $('#main').innerHTML=`<div class="page">${intro('HOW WE LOOK AT AGENTS','How we research agents','Our scope, sources, and update process.')}<div class="method-layout"><nav class="method-nav" aria-label="Methodology sections"><a href="#" data-section="scope">01 / Scope</a><a href="#" data-section="evidence">02 / Evidence</a><a href="#" data-section="lineage-rules">03 / Lineage</a><a href="#" data-section="updates">04 / Keeping up</a><a href="#" data-section="independence">05 / Disclosure</a></nav><div class="prose"><section id="scope"><h2>What counts as a personal agent?</h2><p>Our core category is a system that maintains a relationship with a person over time: it carries personal state across interactions and can take actions using tools. Background activity is recorded separately, because remembering a conversation is different from waking up to do work.</p><div class="principles"><div class="principle"><b>01 / CONTINUITY</b><h3>It remembers.</h3><p>Preferences, people, projects, instructions, or a durable workspace survive beyond one task.</p></div><div class="principle"><b>02 / AGENCY</b><h3>It can act.</h3><p>It uses tools, apps, a browser, or a computer to carry out work under a person’s direction.</p></div><div class="principle"><b>03 / INITIATIVE</b><h3>It can return.</h3><p>Schedules, events, heartbeats, or continuing goals bring it back between conversations.</p></div><div class="principle"><b>04 / RELATIONSHIP</b><h3>It works for someone.</h3><p>Personal context and permissions shape the work. A generic workflow engine alone is adjacent.</p></div></div><p>Products with incomplete evidence stay visible as “Under review.” Managed services, local apps, and open runtimes have different operating responsibilities. These are editorial categories, not quality rankings.</p><h3>Where do Claude Code and Codex fit?</h3><p>We include them as adjacent harnesses, hidden by default. Calling them “non-persistent” would be too broad: coding harnesses can have saved memory, scheduled execution, and cloud sessions. The distinction is their main product scope and deployment, not whether they have any persistence. A personal agent can also use a coding harness underneath.</p><p>${external('https://code.claude.com/docs/en/overview','Claude Code documentation')} describes memory, scheduled tasks, and cloud work. ${external('https://github.com/openai/codex','Codex source')} is tracked as an adjacent coding harness.</p></section><section id="evidence"><h2>Reading the comparisons</h2><p>Each cell describes what the agent does. The numbered links open the sources behind that description. “Not specified” means the sources reviewed did not answer that question.</p><p>Computer use distinguishes your own desktop, a cloud computer, and browser-only control. App listings distinguish native apps from websites and messaging integrations. Password storage, a password-manager connector, and saved browser logins are listed separately in each description.</p><p>Model choice and bringing your own API key are separate from an included subscription. Cost descriptions include model charges and hosting where relevant.</p></section><section id="lineage-rules"><h2>A graph with precise relationships.</h2><ul><li><strong>Code fork:</strong> verified repository ancestry or an explicit, corroborated derivation statement. None established in this edition.</li><li><strong>Built on:</strong> a product runs or integrates a named runtime. It may add hosting, an interface, or proprietary features.</li><li><strong>Renamed:</strong> the same project under another identity, not a new descendant. Alias history needs dated evidence.</li></ul><p>The graph tracks code ancestry and runtime dependencies. Similar products and credited ideas belong in product notes, rather than family-tree arrows.</p></section><section id="updates"><h2>From a snapshot to an observatory.</h2><p>This edition was checked on ${formatDate(data.checkedAt)}. The news log and RSS feed are curated snapshots. The source includes a release collector that fetches official GitHub releases into a review inbox; it does not publish unchecked updates.</p><ol><li>Collect official releases, product announcements, documentation changes, and security advisories. Keep publication date separate from event date.</li><li>Match each item to a stable product ID. Separate the company, product, runtime, model, and hosting provider.</li><li>Review changed claims, store the source and date, and update the affected profile and graph edges.</li><li>Publish a new data version, retain history, and refresh the feed. Re-check volatile pricing and access fields more frequently.</li></ol><h3>The next research queue</h3><div class="queue">${data.researchQueue.map(x=>`<span>${esc(x)}</span>`).join('')}</div><p>Next: independent task evaluations, permission revocation tests, export / restore checks, event history, and reproducible ancestry audits.</p><p><a href="./data.json" download>Download the structured dataset →</a></p></section><section id="independence"><h2>Open about our starting point.</h2><p>The project creator is affiliated with Ambi. Ambi is included under the same evidence rules as other products. “Featured first” presents an editorial overview of flagship personal agents, open runtimes, and distinct alternatives; A–Z ordering is also available. A company affiliation is disclosed in its profile.</p><p>The structure is inspired by ${external('https://l2beat.com','L2BEAT’s')} transparent risk dimensions and ${external('https://models.dev','models.dev’s')} structured comparison data. Agentlist is an independent research project and is not affiliated with either.</p><p>Profiles, plans, hardware, and discussion links are maintained as individual JSON files. Contributions are reviewed through GitHub pull requests. Your followed agents are saved in this browser.</p><button class="button" data-action="contribute">Contribute on GitHub ↗</button></section></div></div></div>`;
}
function plansHTML(a,compact=false){
  if(!a.plans.length)return `<p class="section-empty">${esc(getClaim(a,'pricing').value)} ${sourceLinks(a,getClaim(a,'pricing'))}</p>${external(a.website,'View plans on the official site ↗','read-more')}`;
  return `<div class="plan-list ${compact?'compact-plans':''}">${a.plans.map(p=>`<article class="plan-card"><div class="plan-top"><h3>${esc(p.name)}</h3><strong>${esc(p.price)}</strong></div><p class="plan-billing">${esc(p.billing)}</p>${compact?'<details><summary>What’s included</summary>':''}${p.includes.length?`<ul>${p.includes.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:''}${p.limits.length?`<div class="plan-limits">${p.limits.map(v=>`<p>${esc(v)}</p>`).join('')}</div>`:''}${sourceLinks(a,p)}${compact?'</details>':''}</article>`).join('')}</div>`;
}
function sentimentHTML(a,compact=false){
  const s=a.sentiment;if(!s)return '';
  const count=s.positiveUserWeeks+s.negativeUserWeeks;
  return `<div class="sentiment-panel"><div class="sentiment-head"><div><strong>${s.positiveShare.toFixed(1)}%</strong><span title="One rating per person, platform and week">positive feedback</span></div><span class="sample-count">${count.toLocaleString()} weekly ratings</span></div><div class="sentiment-bar" role="img" aria-label="${s.positiveShare}% positive user-weeks"><span style="width:${s.positiveShare}%"></span></div><div class="sentiment-caption">${external(s.url,esc(s.provider)+' ↗')}<span>${formatDate(s.windowStart)} – ${formatDate(s.windowEnd)}</span></div>${compact?'':`<details class="sentiment-method"><summary>Sample & method</summary><p>${s.posts.toLocaleString()} posts across ${s.channels.map(esc).join(', ')}. A user-week groups one person’s feedback on one platform within a week. ${s.positiveUserWeeks.toLocaleString()} positive and ${s.negativeUserWeeks.toLocaleString()} negative user-weeks; ties are excluded from this percentage. Labels are automated. This is the raw positive share, not Feedback Bench’s ranking score. Source coverage differs by agent.</p>${external(s.dataUrl,'View the source dataset ↗')}</details>`}</div>`;
}
function discussionHTML(a){
  return a.discussions.length?`<div class="discussion-list">${[...a.discussions].sort((x,y)=>y.date.localeCompare(x.date)).map(d=>`<article class="discussion-item"><div class="news-meta"><span>${esc(d.platform)}</span><time datetime="${d.date}">${formatDate(d.date)}</time><span class="discussion-tone ${d.kind==='community'?esc(d.sentiment):'neutral'}">${d.kind==='announcement'?'From the team':({positive:'Positive',mixed:'Mixed',critical:'Critical',neutral:'Discussion'})[d.sentiment]}</span></div><h3>${external(d.url,esc(d.title)+' ↗')}</h3><p>${esc(d.summary)}</p></article>`).join('')}</div>`:'<p class="section-empty">No discussion threads added yet.</p>';
}
const latestDiscussion=a=>[...a.discussions].sort((x,y)=>y.date.localeCompare(x.date))[0];
function renderDiscussion(){
  const list=sortAgents(agents.filter(a=>a.sentiment||a.discussions.length),'featured',featuredOrder);
  $('#main').innerHTML=`<div class="page">${intro('COMMUNITY','What people are saying','User feedback and conversations from across the ecosystem.')}<div class="discussion-grid">${list.map(a=>`<article class="community-card"><a class="community-agent" href="${profileHref(a.id,'discussion')}">${icon(a)}<span><b>${esc(a.name)}</b><small>${a.discussions.length?`${a.discussions.length} discussion${a.discussions.length===1?'':'s'}`:'Feedback snapshot'}</small></span>${uiIcon('arrow')}</a>${sentimentHTML(a,true)}${a.discussions.length?`<div class="news-meta community-thread-meta"><time datetime="${latestDiscussion(a).date}">${formatDate(latestDiscussion(a).date)}</time><span>${latestDiscussion(a).kind==='announcement'?'From the team':esc(latestDiscussion(a).platform)}</span></div><h3>${external(latestDiscussion(a).url,esc(latestDiscussion(a).title)+' ↗')}</h3><p>${esc(latestDiscussion(a).summary)}</p>`:''}<a class="read-more" href="${profileHref(a.id,'discussion')}">See feedback & discussions →</a></article>`).join('')}</div></div>`;
}
function companyFactsHTML(a){
  const company=a.company,launch=firstLaunch(a),funding=company?.funding;
  const access=a.access;
  return `<dl class="company-facts"><div><dt>Availability</dt><dd>${access?`${esc(accessSummary(access))}${sourceLinks(a,getClaim(a,'availability'))}${access.expected?`<small>Expected ${formatCatalogDate(access.expected)}</small>`:''}`:'—'}</dd></div><div><dt>Company</dt><dd>${esc(a.organization)}${company?sourceLinks(a,company):''}${company?`<small>${esc(companyTypes[company.type])}${company.parent?' · '+esc(company.parent):''}</small>`:''}</dd></div><div><dt>Company stage</dt><dd>${company?.stage?esc(company.stage):'—'}</dd></div><div><dt>Disclosed funding</dt><dd>${funding?`${esc(funding.amount)}${sourceLinks(a,funding)}<small>${esc(funding.round)} · ${formatCatalogDate(funding.date)}</small>${funding.note?`<small>${esc(funding.note)}</small>`:''}`:'—'}</dd></div><div><dt>Launch date</dt><dd>${launch?`${formatCatalogDate(launch.date)}${sourceLinks(a,launch)}<small>${launchKinds[launch.kind]}${launch.label?' · '+esc(launch.label):''}</small>`:'—'}</dd></div></dl>`;
}
function timelineHTML(a){
  if(!a.launches.length)return '';
  return `<section class="profile-group"><h3>Launch history</h3><ol class="profile-timeline">${[...a.launches].sort((x,y)=>y.date.localeCompare(x.date)).map(event=>`<li><time datetime="${event.date}">${formatCatalogDate(event.date)}</time><div><b>${esc(event.label||launchKinds[event.kind])}</b>${event.label?`<span class="launch-detail">${launchKinds[event.kind]}</span>`:''}${sourceLinks(a,event)}</div></li>`).join('')}</ol></section>`;
}
function renderProfile(id,tab='overview'){
  const a=byId.get(id);if(!a)return;
  document.title=`${a.name}${tab==='overview'?'':' · '+tab[0].toUpperCase()+tab.slice(1)} — Agentlist`;
  profileState={id,tab};
  const tabs=[['overview','Overview'],['plans','Plans'],['discussion','Discussion'],['sources','Sources']];
  let content='';
  if(tab==='plans')content=`<div class="profile-section-heading"><h3>Plans & pricing</h3><span>Checked ${formatDate(data.checkedAt)}</span></div>${plansHTML(a)}`;
  else if(tab==='discussion')content=`${sentimentHTML(a)}<div class="profile-section-heading"><h3>In the conversation</h3>${data.repository?external(data.repository+'/issues/new?template=correction.yml&title='+encodeURIComponent('Discussion: '+a.name),'Add a thread ↗','read-more'):''}</div>${discussionHTML(a)}`;
  else if(tab==='sources')content=`<ol class="source-list">${a.sources.map(source=>`<li>${external(source.url,esc(source.title)+' ↗')} <span>· checked ${source.checkedAt}</span></li>`).join('')}</ol>`;
  else content=`${fieldGroups.filter(group=>group.id!=='company').map(group=>`<section class="profile-group"><h3>${group.label}</h3><div class="profile-fields">${group.fields.map(([key,label])=>`<section class="profile-field"><h4>${label}</h4>${key==='pricing'&&a.plans.length?`<a class="read-more" href="${profileHref(a.id,'plans')}">${a.plans.length} plans · View prices & limits →</a>`:claimHTML(a,key)}</section>`).join('')}</div></section>`).join('')}${timelineHTML(a)}`;
  $('#main').innerHTML=`<article class="page agent-page"><nav class="profile-breadcrumb" aria-label="Breadcrumb"><a href="#directory">All agents</a><span aria-hidden="true">/</span><span>${esc(a.name)}</span></nav><header class="profile-header"><div class="profile-heading">${icon(a)}<div><h1>${esc(a.name)}</h1><small>${esc(a.organization)}</small></div></div>${tag(a)}<p class="profile-summary">${esc(a.summary)}</p>${a.identityNote?`<div class="disclosure">${esc(a.identityNote)}</div>`:''}${a.disclosure?`<div class="disclosure">${esc(a.disclosure)}</div>`:''}<div class="profile-actions">${external(a.website,'Official website ↗','button small')}${a.repository?external(a.repository,'Source code ↗','button small'):''}<button class="button small" data-profile-compare="${a.id}">${selected.includes(a.id)?'Remove from comparison':'Add to comparison ＋'}</button><button class="button small" data-watch="${a.id}" aria-pressed="${watchlist.includes(a.id)}">${watchlist.includes(a.id)?'★ Following':'☆ Follow updates'}</button>${data.repository?external(data.repository+'/edit/main/data/agents/'+a.id+'.json','Edit on GitHub ↗','button small ghost'):''}<button class="button small ghost" data-copy-profile="${a.id}">Copy link ↗</button></div>${companyFactsHTML(a)}</header><div class="profile-tabs" role="tablist" aria-label="Agent details">${tabs.map(([key,label])=>`<a href="${profileHref(a.id,key)}" role="tab" id="profile-tab-${key}" aria-controls="profile-panel" aria-selected="${key===tab}" tabindex="${key===tab?0:-1}" >${label}${key==='discussion'&&a.discussions.length?` <span>${a.discussions.length}</span>`:''}</a>`).join('')}</div><section id="profile-panel" role="tabpanel" aria-labelledby="profile-tab-${tab}">${content}</section></article>`;
}
function configureContributions(){
  $('#edition-note').textContent=`Edition ${String(data.edition).padStart(3,'0')} · Sources checked ${formatDate(data.checkedAt)}`;
  if(!data.repository)return;
  $('#repository-link').href=data.repository;$('#repository-link').hidden=false;
  $('#contribute-dialog').innerHTML=`<button class="close" data-action="close-contribute" aria-label="Close contribution options">×</button><h2 id="contribute-title">Help build the directory</h2><p>Each agent lives in one JSON file. Add an agent, update a plan, or share a useful discussion.</p><div class="contribution-options">${external(data.repository+'/issues/new?template=add-agent.yml','Suggest an agent ↗','button primary')}${external(data.repository+'/blob/main/CONTRIBUTING.md','Make a pull request ↗','button')}${external(data.repository+'/issues/new?template=correction.yml','Suggest a correction ↗','button')}</div>`;
}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Link copied')}catch{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch{}t.remove();if(ok)toast('Link copied');else window.prompt('Copy this link:',text)}}
function download(name,contents,type){const url=URL.createObjectURL(new Blob([contents],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function csvCell(value){let s=String(value??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
document.addEventListener('click',e=>{
  const target=e.target.closest('button,a,[data-profile]');if(!target)return;
  if(target.classList.contains('skip-link')){e.preventDefault();$('#main').focus();return}
  if(target.dataset.platform){openPlatform(target);return}
  if(target.dataset.watch){const id=target.dataset.watch;watchlist=watchlist.includes(id)?watchlist.filter(x=>x!==id):[...watchlist,id];saveWatchlist();if(profileState.id===id){target.textContent=watchlist.includes(id)?'★ Following':'☆ Follow updates';target.setAttribute('aria-pressed',String(watchlist.includes(id)))}if($('#agent-rows'))renderDirectory();if($('#news-results'))updateNews();toast(watchlist.includes(id)?'Following agent':'Removed from following');return}
  if(target.dataset.view){directoryState.view=target.dataset.view;renderDirectory();return}
  if(target.dataset.category){directoryState.category=target.dataset.category;directoryState.watching=false;renderDirectory();return}
  if(target.dataset.remove){selected=selected.filter(x=>x!==target.dataset.remove);if(location.hash.startsWith('#compare')){history.replaceState(null,'',`#compare?agents=${selected.join(',')}`);renderCompare()}updateTray();return}
  if(target.dataset.profileCompare){selectAgent(target.dataset.profileCompare);return}
  if(target.dataset.copyProfile){copy(`${location.protocol==='file:'?'file://':location.origin}${location.pathname}#agent/${target.dataset.copyProfile}${profileState.tab==='overview'?'':'?tab='+profileState.tab}`);return}
  if(target.dataset.section){e.preventDefault();document.getElementById(target.dataset.section)?.scrollIntoView({behavior:'smooth'});return}
  switch(target.dataset.action){
    case 'contribute':$('#contribute-dialog').showModal();break;
    case 'close-contribute':$('#contribute-dialog').close();break;
    case 'watch-filter':directoryState.watching=!directoryState.watching;directoryState.category='all';renderDirectory();break;
    case 'reset-filters':directoryState={search:'',category:'all',hosting:'all',companyType:'all',access:'all',adjacent:false,watching:false,sort:'featured',view:'overview'};renderDirectory();break;
    case 'clear-selection':selected=[];updateTray();break;
    case 'copy-comparison':copy(`${location.protocol==='file:'?'file://':location.origin}${location.pathname}#compare?agents=${selected.join(',')}`);break;
    case 'export-comparison':{const list=selected.map(id=>byId.get(id));const rows=[['Field',...list.map(a=>a.name)],...fields.flatMap(([k,l])=>[[l,...list.map(a=>getClaim(a,k).value)],[`${l}: evidence`,...list.map(a=>getClaim(a,k).status)],[`${l}: sources`,...list.map(a=>getClaim(a,k).sourceIds.map(id=>a.sources.find(s=>s.id===id)?.url).filter(Boolean).join(' '))]]),['Checked at',...list.map(()=>data.checkedAt)]];download('agentlist-comparison.csv','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');toast('Comparison exported');break}
  }
});
document.addEventListener('input',e=>{if(e.target.id==='agent-search'){directoryState.search=e.target.value;updateDirectoryRows()}if(e.target.id==='news-search'){newsState.search=e.target.value;updateNews()}});
document.addEventListener('change',e=>{
  const t=e.target;if(t.dataset.select)selectAgent(t.dataset.select);
  if(t.id==='company-filter'){directoryState.companyType=t.value;updateDirectoryRows()}
  if(t.id==='category-filter'){directoryState.category=t.value;updateDirectoryRows()}
  if(t.id==='hosting-filter'){directoryState.hosting=t.value;updateDirectoryRows()}
  if(t.id==='access-filter'){directoryState.access=t.value;updateDirectoryRows()}
  if(t.id==='sort-filter'){directoryState.sort=t.value;updateDirectoryRows()}
  if(t.id==='include-adjacent'){directoryState.adjacent=t.checked;updateDirectoryRows()}
  if(t.id==='differences-only'){differences=t.checked;renderCompare()}
  if(t.dataset.swap){selected=selected.map(id=>id===t.dataset.swap?t.value:id);history.replaceState(null,'',`#compare?agents=${selected.join(',')}`);renderCompare();updateTray()}
  if(t.id==='news-agent'){newsState.agent=t.value;updateNews()}
  if(t.id==='news-type'){newsState.type=t.value;updateNews()}
  if(t.id==='news-watching'){newsState.watching=t.checked;updateNews()}
});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#contribute-dialog').open){if($('#agent-search')){e.preventDefault();$('#agent-search').focus()}}});
$('#suggest-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);const url=String(f.get('website'));if(!/^https?:\/\//i.test(url)){toast('Use an http or https website URL.');return}download('agentlist-suggestion.json',JSON.stringify({name:f.get('name'),website:url,notes:f.get('notes'),createdAt:new Date().toISOString(),status:'unreviewed'},null,2),'application/json');$('#contribute-dialog').close();toast('Suggestion draft downloaded');e.target.reset()});
$('#platform-popover').addEventListener('toggle',e=>{document.querySelectorAll('[data-platform]').forEach(el=>el.setAttribute('aria-expanded',String(e.newState==='open'&&el.dataset.platform===e.target.dataset.trigger)))});
window.addEventListener('hashchange',()=>{if($('#platform-popover').matches(':popover-open'))$('#platform-popover').hidePopover();const previous=profileState.id,tabFocused=document.activeElement.matches('.profile-tabs [role=tab]');route();if(previous&&previous===profileState.id){if(tabFocused)$('#profile-tab-'+profileState.tab)?.focus()}else{$('#main').focus({preventScroll:true});window.scrollTo(0,0)}});
try{const embedded=$('#agentlist-data');if(embedded){data=JSON.parse(embedded.textContent)}else{const response=await fetch('./data.json');if(!response.ok)throw new Error('Dataset unavailable');data=await response.json()}agents=data.agents;byId=new Map(agents.map(a=>[a.id,a]));watchlist=watchlist.filter(id=>byId.has(id));configureContributions();route()}catch(err){$('#main').innerHTML='<div class="error"><h1>The index could not load.</h1><p>Please refresh, or check the local server and data.json.</p></div>';console.error(err)}

document.addEventListener('keydown',e=>{if(!e.target.matches('.profile-tabs [role=tab]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=['overview','plans','discussion','sources'],i=tabs.indexOf(profileState.tab);const next=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;if(tabs[next]!==profileState.tab)location.hash=profileHref(profileState.id,tabs[next]);else $('#profile-tab-'+tabs[next]).focus()});
