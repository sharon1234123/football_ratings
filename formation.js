'use strict';
// Rendering only. Callers supply the selected slots; no player-selection logic here.
const Formation={
 pitch(slots,{label='הרכב',home=false}={}){
  const rows=[...new Set(slots.map(s=>s.row))].sort((a,b)=>b-a);
  return `<div class="entity-pitch${home?' home-lineup-pitch':''}" aria-label="${esc(label)}"><svg viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".35"><rect x="2" y="2" width="96" height="136"/><path d="M2 70H98"/><circle cx="50" cy="70" r="13"/><circle cx="50" cy="70" r=".6"/><rect x="22" y="2" width="56" height="22"/><rect x="36" y="2" width="28" height="9"/><rect x="22" y="116" width="56" height="22"/><rect x="36" y="129" width="28" height="9"/><path d="M40 24Q50 33 60 24M40 116Q50 107 60 116M44 2V0H56V2M44 138V140H56V138"/></g></svg><div class="pitch-rows">${rows.map(row=>{const line=slots.filter(s=>s.row===row),mid=line.length===3&&(['DM','CM','AM'].every(p=>line.some(s=>s.label===p))||line.every(s=>s.triangle));return `<div class="pitch-row${mid?' pitch-midfield-trio':''}">${line.map(s=>{const p=s.player;return `<button class="pitch-player${p?'':' is-vacant'}" data-position="${esc(s.label)}" ${s.triangle?`data-triangle="${s.triangle}"`:""} ${home?(p?`data-quick="${esc(p.id)}"`:'disabled'):`data-slot="${esc(s.slot)}"`} aria-label="${esc(s.label)} · ${p?esc(p.name):'עמדה פנויה'}" title="${p?esc(p.name):esc(s.label)}">${UI.Portrait(p?.id)}<span class="pitch-name">${p?esc(p.name):esc(s.label)}</span><span class="pitch-player-meta">${p?UI.RatingBadge(p.rating):'<b>—</b>'}<small dir="ltr">${esc(p?.position||s.label)}</small></span></button>`}).join('')}</div>`}).join('')}</div></div>`;
 },
 preview(team){
  const layout=[['GK'],['LB','LCB','RCB','RB'],['DM','CM','AM'],['LW','CF','RW']];
  return this.pitch(layout.flatMap((line,row)=>line.map(label=>{const p=team.slots.find(s=>s.position===label)?.player;return {row,label,player:p?{id:p.id,name:p.full_name,rating:overall(p)}:null}})),{home:true,label:'הרכב נבחר · 4-3-3'});
 },

 render(team,{translate,escape,overall}){
  const positions=['LW','CF','RW','AM','CM','DM','LB','LCB','RCB','RB','GK'];
  return `<div class="formation" aria-label="${translate('formation_433')}"><svg class="formation-lines" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".3"><rect x="2" y="2" width="96" height="136"/><path d="M2 70H98"/><ellipse cx="50" cy="70" rx="13" ry="13"/><rect x="23" y="2" width="54" height="20"/><rect x="37" y="2" width="26" height="8"/><rect x="23" y="118" width="54" height="20"/><rect x="37" y="130" width="26" height="8"/><path d="M39 22Q50 33 61 22M39 118Q50 107 61 118"/></g></svg>${positions.map(pos=>{const p=team.slots.find(s=>s.position===pos)?.player;return `<div class="formation-slot formation-${pos}">${p?`<button class="formation-card" data-quick="${escape(p.id)}" title="${escape(p.full_name)}"><span class="formation-position">${translate('position.'+pos)}</span><span class="formation-name">${escape(p.full_name)}</span><strong>${overall(p)}</strong></button>`:`<div class="formation-card formation-empty"><span class="formation-position">${translate('position.'+pos)}</span><span>${translate('vacancy')}</span><strong>—</strong></div>`}</div>`}).join('')}</div>`;
 }
};
