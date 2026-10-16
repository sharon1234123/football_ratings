'use strict';
// Static snapshot adapter. No network API, write operations or rating calculations.
const snapshotCache=new Map();
async function snapshotFile(path){if(!snapshotCache.has(path))snapshotCache.set(path,fetch(path).then(r=>{if(!r.ok)throw Error('Snapshot unavailable');return r.json()}));return snapshotCache.get(path)}
async function snapshot(key){const index=await snapshotFile('snapshot/index.json');if(!index[key])throw Error('Read-only snapshot: page unavailable');return snapshotFile(index[key])}
const publicGroups={centre_backs:['RCB','LCB'],full_backs:['RB','LB'],central_midfield:['DM','CM'],wings:['RW','LW'],behind_striker:['RW','LW','AM'],attack:['AM','RW','LW','CF'],midfield:['DM','CM','AM'],defence:['RB','LB','RCB','LCB']};
const publicMean=rows=>rows.length?String(rows.reduce((s,v)=>s+Number(v),0)/rows.length):null;
async function publicRanking(q){
 const metric=q.get('metric')||'overall',base=await snapshot('ranking:'+metric),all=(await snapshot('ranking:overall')).rows;
 const matches=r=>['club','country','position','style'].every(k=>!q.get(k)||r[k]===q.get(k))&&(!q.get('search')||r.name.toLowerCase().includes(q.get('search').toLowerCase()))&&(!q.get('position_group')||q.get('position')||!publicGroups[q.get('position_group')]||publicGroups[q.get('position_group')].includes(r.position));
 const filtered=base.rows.filter(matches),quality=all.filter(matches).slice(0,20),boot=await snapshot('bootstrap'),byId=new Map(boot.players.map(p=>[p.id,p]));
 const summary={count:all.filter(matches).length,average:publicMean(quality.map(r=>r.overall))};
 for(const k of boot.active_main_ratings)summary[k]=publicMean(quality.filter(r=>r.position!=='GK').map(r=>byId.get(r.id)?.rating?.final_main_ratings?.[k]).filter(v=>v!=null));
 const size=[25,50,100].includes(Number(q.get('size')))?Number(q.get('size')):25,page=Math.max(1,Math.min(Number(q.get('page'))||1,Math.max(1,Math.ceil(filtered.length/size))));
 let comparison=null;if(base.balance&&['club','country'].includes(q.get('entity_kind'))&&q.get('entity_key')){const team=base.rows.filter(r=>r[q.get('entity_kind')]===q.get('entity_key')).slice(0,12),db=base.rows.slice(0,150);comparison={team:{count:team.length,average:publicMean(team.map(r=>r.value))},database:{count:db.length,average:publicMean(db.map(r=>r.value))}}}
 return {...base,summary,comparison,total:filtered.length,page,size,rows:filtered.slice((page-1)*size,page*size)};
}
api=async function(path,body){
 if(body!==undefined)throw Error('גרסה לצפייה בלבד · העריכה נעשית במחשב המקומי');
 const [route,query='']=path.split('?'),q=new URLSearchParams(query);
 if(route==='bootstrap'||route==='draft-bootstrap')return structuredClone(await snapshot('bootstrap'));
 if(route.startsWith('player/')){const p=(await snapshot('bootstrap')).players.find(p=>p.id===decodeURIComponent(route.slice(7)));if(!p)throw Error('Player unavailable');return structuredClone(p)}
 if(route==='entity-directory')return snapshot(route);
 if(route==='entity-ranking')return publicRanking(q);
 if(route==='entity-overview')return snapshot('overview:'+q.get('kind')+':'+q.get('key'));
 if(route==='entity-lineup')return snapshot('lineup:'+q.get('kind')+':'+q.get('key')+':'+q.get('formation'));
 if(route==='analytics')return snapshot('analytics:'+(q.get('position')||''));
 if(route==='analytics-skills')return snapshot('skills:'+(q.get('skill')||''));
 if(route==='gk'){const rows=await snapshot('gk');return q.has('id')?rows.find(r=>r.id===q.get('id')||r.player_id===q.get('id')):rows}
 throw Error('גרסה לצפייה בלבד');
};
// GK profile uses stored values without exposing the editor or source metadata.
gkPage=async function(id){const rows=await api('gk');if(!id){gkScope='players';renderGKRanking(rows);return}const p=rows.find(r=>r.id===id||r.player_id===id);if(!p){app.innerHTML=UI.EmptyState(t('empty'));return}const f=p.current.fields;app.innerHTML=`<div class="compact-player"><div class="ui-player-hero"><div class="profile-portrait">${UI.Portrait(p.player_id)}</div>${UI.RatingBadge(p.rating.display_overall,{large:true})}<div class="ui-identity"><h1>${esc(f.full_name)}</h1><p>GK · ${entityLink('country',f.country)} · ${entityLink('club',f.primary_club)}</p>${gkRankFacts(player(p.player_id),rows.indexOf(p)+1)}${playerHonours(p.player_id)}<div class="ui-identity-facts">${['height_cm','strong_foot'].map(k=>`<span>${fieldName(k)}: ${k==='height_cm'?esc(f[k]):identityFact(k,f[k])}</span>`).join(' · ')}</div></div></div><section class="panel"><div class="ui-ability-groups">${Object.entries(p.current.inputs).map(([k,v])=>`<div class="ability"><span>${t('gk.'+k)}</span>${UI.AbilityValue(v)}</div>`).join('')}</div></section><section class="panel"><div class="fields">${gkFields.filter(k=>k!=='full_name').map(k=>`<div><label>${fieldName(k)}</label><p>${esc(shown(k,f[k]))}</p></div>`).join('')}</div></section></div>`};
const publicShell=shell;shell=function(){publicShell();document.querySelector('.aside-bottom').textContent='גרסה לצפייה בלבד';snapshotFile('snapshot/status.json').then(s=>{document.querySelector('#header').innerHTML=`<span>${t('project')}</span><span class="tag">לצפייה בלבד · עודכן ${new Date(s.published_at).toLocaleDateString('he-IL')}</span>`})};
// Capture before existing editor handlers; navigation and filters remain usable.
const forbidden='[data-edit],[data-quick-edit],[data-save],[data-save-card],[data-propose-player],[data-review-player],[data-er-save],[data-bulk-apply],[data-reset-lineup],[data-pick],[data-remove-skill],[data-gk-promote],#gk-save,#gk-cancel';
document.addEventListener('click',e=>{if(e.target.closest(forbidden)){e.preventDefault();e.stopImmediatePropagation()}},true);
document.addEventListener('click',e=>{const slot=e.target.closest('[data-slot]');if(slot){e.preventDefault();e.stopImmediatePropagation()}},true);
