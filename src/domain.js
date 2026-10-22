export function filterAgents(agents, {search='', category='all', hosting='all', adjacent=false, watching=false, watchlist=[]}={}) {
  const q = search.trim().toLocaleLowerCase();
  return agents.filter(a => (adjacent || a.category !== 'adjacent') &&
    (category === 'all' || a.category === category) &&
    (hosting === 'all' || (hosting === 'self' ? a.category === 'runtime' : a.category === 'managed')) &&
    (!watching || watchlist.includes(a.id)) &&
    (!q || [a.name,a.organization,a.summary,...(a.aliases||[]),...(a.plans||[]).flatMap(p=>[p.name,p.price,...p.includes,...p.limits]),...a.claims.filter(c=>c.status!=='unknown').flatMap(c=>[c.value,c.shortValue||''])].join(' ').toLocaleLowerCase().includes(q)));
}
export function parseSelection(hash, ids) {
  const query = hash.split('?')[1] || '';
  return [...new Set((new URLSearchParams(query).get('agents') || '').split(','))].filter(id=>ids.has(id)).slice(0,4);
}
export function getClaim(agent, field) {
  return agent.claims.find(c=>c.field===field) || {field,value:'Not specified',status:'unknown',sourceIds:[]};
}
export function sortAgents(agents, sort='featured', featuredOrder=[]) {
  const priority=new Map(featuredOrder.map((id,index)=>[id,index]));
  const alphabetical=(a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
  return [...agents].sort((a,b)=>{
    if(sort==='name')return alphabetical(a,b);
    if(sort==='category')return a.category.localeCompare(b.category)||alphabetical(a,b);
    const aRank=priority.get(a.id)??Infinity,bRank=priority.get(b.id)??Infinity;
    return aRank===bRank?alphabetical(a,b):aRank-bRank;
  });
}
export function compareRows(agents, fields, differencesOnly=false) {
  return fields.map(([key,label])=>({key,label,values:agents.map(a=>getClaim(a,key))})).filter(r=>!differencesOnly || new Set(r.values.map(v=>v.value)).size>1);
}
export function sortedNews(news, {agent='all',type='all',search='',watchlist=null}={}) {
  const q=search.toLowerCase().trim();
  return news.filter(n=>(agent==='all'||n.agentIds.includes(agent))&&(type==='all'||n.type===type)&&(!watchlist||n.agentIds.some(id=>watchlist.includes(id)))&&(!q||`${n.title} ${n.summary}`.toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date));
}
