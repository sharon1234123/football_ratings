'use strict';
// Presentation and lineup persistence only. Reuses the existing entity roster.
let entityPanels=new Map();try{entityPanels=new Map(JSON.parse(localStorage.getItem('entity-panel-preferences')||'[]'))}catch(e){}
function persistEntityPanels(){try{localStorage.setItem('entity-panel-preferences',JSON.stringify([...entityPanels]))}catch(e){}}
async function entityFormation(kind,name,q){
 const page=app.querySelector('.entity-page'),hash=location.hash;
 let d;try{d=await api('entity-overview?'+new URLSearchParams({kind,key:name}))}catch(e){toast('נדרשת הפעלה מחדש של האתר כדי לטעון את מערכת ההרכבים החדשה');return}
 if(!page.isConnected||location.hash!==hash)return;
 const panelKey=kind+':'+name,pref=entityPanels.get(panelKey)||{tab:'overview',formation:'4-3-3'};
 entityPanels.set(panelKey,pref);
 const oldTitle=page.querySelector('.title'),summary=page.querySelector('.entity-summary');
 const summaryHTML=`<b>${d.count} שחקנים רשמיים</b><span>ממוצע Overall <strong>${entityNumber(d.average)}</strong></span>${averageNote(d.count)}`;oldTitle.remove();summary.remove();
 const squad=document.createElement('section');squad.className='entity-squad'+(q.metric==='overall'?' entity-squad-overall':'');squad.id='entity-squad';squad.setAttribute('role','tabpanel');
 while(page.firstChild)squad.append(page.firstChild);
 page.append(squad);
 const openPlayer=async id=>{try{const p=await api('player/'+id);if(location.hash!==hash)return;const i=state.players.findIndex(x=>x.id===p.id);if(i>=0)state.players[i]=p;else state.players.push(p);quick(id)}catch(e){toast(e.message)}};
 page.insertAdjacentHTML('afterbegin',`<header class="entity-hero"><div class="entity-hero-identity">${UI.EntityIcon(kind,name)}<div><small>${kind==='club'?'מועדון כל הזמנים':'נבחרת כל הזמנים'}</small><h1>${esc(name)}</h1><div class="entity-hero-summary">${summaryHTML}</div></div><button data-entity-back class="secondary">${t('back')}</button></div><div class="entity-hero-bottom"><div class="entity-top-three">${d.top.map((r,i)=>`<button data-hero-player="${r.id}" title="${esc(r.name)}"><span class="top-player-order">0${i+1}</span>${UI.Portrait(r.id)}<span class="top-player-name">${esc(r.name)}${UI.PositionChip(r.position)}</span>${UI.RatingBadge(r.display)}</button>`).join('')}</div><div class="department-ratings" aria-label="ממוצעי מחלקות">${['GK','DEF','MID','ATT'].map(k=>[k,d.departments[k]]).map(([k,v])=>`<div><small>${k}</small><b>${v==null?'—':Number(v).toFixed(1)}</b></div>`).join('')}<small class="department-note">ממוצע עד 5 המובילים בכל מחלקה · מידע קבוצתי</small></div></div></header><div class="entity-tabs" role="tablist" aria-label="תצוגת קבוצה">${[['overview','סקירה'],['lineup','הרכב'],['squad','סגל ודירוג יכולות']].map(([key,label])=>`<button role="tab" data-entity-tab="${key}" aria-controls="entity-${key}">${label}</button>`).join('')}</div><section id="entity-lineup" role="tabpanel" class="panel entity-lineup" hidden></section>`);
 page.querySelectorAll('[data-hero-player]').forEach(b=>b.onclick=()=>openPlayer(b.dataset.heroPlayer));
 const lineHost=page.querySelector('#entity-lineup'),cache=new Map();let request=0,busy=false;
 const drawLineup=async()=>{
  if(!d.eligible){lineHost.innerHTML='<p class="muted">הרכב ייפתח כאשר יהיו לפחות 12 שחקנים במאגר</p>';return}
  const formation=pref.formation,seq=++request;
  lineHost.innerHTML=UI.LoadingState(t('loading'));
  try{
   let result=cache.get(formation);
   if(!result){result=await api('entity-lineup?'+new URLSearchParams({kind,key:name,formation}));cache.set(formation,result)}
   if(seq!==request||!page.isConnected)return;
   // One-time migration of the previous manual 4-2-1-3 layout to matching 4-3-3 slots.
   if(false){
    const legacyKey='entity-lineup:'+kind+':'+name;let legacy;try{legacy=JSON.parse(localStorage.getItem(legacyKey))}catch(e){}
    if(legacy){const valid=new Set(d.players.map(p=>p.id)),used=new Set(),values={};for(const s of d.formations[formation]){const id=legacy[s.label];values[s.slot]={player_id:valid.has(id)&&!used.has(id)?id:null,manual:true};if(values[s.slot].player_id)used.add(id)}result=await api('entity-lineup-save',{kind,key:name,formation,slots:values,revision:0});cache.set(formation,result);localStorage.removeItem(legacyKey)}
   }
   if(seq!==request||!page.isConnected)return;
   const definitions=d.formations[formation],rowNumbers=[...new Set(definitions.map(s=>s.row))].reverse();
   lineHost.innerHTML=`<div class="lineup-toolbar"><div><small>מערך</small><strong dir="ltr">${esc(formation)}</strong></div><button class="secondary" data-reset-lineup>איפוס להרכב אוטומטי</button><span class="muted lineup-save-status" role="status">${result.saved?'נשמר במסד':'הרכב אוטומטי'}</span></div><div class="formation-options">${[['CLASSIC',['4-3-3','4-4-2','4-2-3-1']],['CONTROL',['4-3-3 Holding','5-3-2','5-4-1']]].map(([label,items])=>`<div><small>${label}</small><div class="formation-chips">${items.map(f=>`<button data-formation="${esc(f)}" aria-pressed="${f===formation}" dir="ltr">${esc(f)}</button>`).join('')}</div></div>`).join('')}</div>${Formation.pitch(definitions.map(s=>{const p=d.players.find(r=>r.id===result.slots[s.slot].player_id);return {...s,player:p?{id:p.id,name:p.name,rating:p.display}:null}}),{label:"הרכב "+formation})}<div data-lineup-picker></div>`;
   const store=async(values,reset=false)=>{
    if(busy)return;busy=true;lineHost.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{const next=await api(reset?'entity-lineup-reset':'entity-lineup-save',{kind,key:name,formation,slots:values,revision:result.revision});cache.set(formation,next);await drawLineup()}
    catch(e){cache.delete(formation);toast(e.message);await drawLineup()}
    finally{busy=false}
   };
   lineHost.querySelectorAll('[data-formation]').forEach(b=>b.onclick=()=>{if(busy)return;pref.formation=b.dataset.formation;persistEntityPanels();drawLineup()});
   lineHost.querySelector('[data-reset-lineup]').onclick=()=>store(null,true);
   lineHost.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{
    const slot=b.dataset.slot,current=result.slots[slot].player_id,used=new Set(Object.entries(result.slots).filter(([k])=>k!==slot).map(([,v])=>v.player_id));
    const picker=lineHost.querySelector('[data-lineup-picker]');
    picker.innerHTML=`<section class="lineup-picker" aria-label="בחירת שחקן"><div class="section-heading"><h3>בחירת שחקן · ${esc(definitions.find(s=>s.slot===slot).label)}</h3><button data-picker-close>סגירה</button></div><p class="muted">הבחירה משנה את ההרכב בלבד. עמדה ראשית ודירוג נשארים כפי שהם.</p><input type="search" data-picker-search placeholder="חיפוש שחקן" aria-label="חיפוש שחקן להרכב"><button data-pick="" class="secondary">השאר עמדה ריקה</button><div class="lineup-candidates">${d.players.filter(p=>!used.has(p.id)).map(p=>`<button data-pick="${p.id}" data-name="${esc(p.name.toLowerCase())}" aria-pressed="${p.id===current}">${UI.Portrait(p.id)}<strong>${esc(p.name)}</strong>${UI.PositionChip(p.position)}${UI.RatingBadge(p.display)}</button>`).join('')}</div></section>`;
    picker.querySelector('[data-picker-close]').onclick=()=>{picker.innerHTML='';b.focus()};
    picker.querySelector('[data-picker-search]').oninput=e=>picker.querySelectorAll('[data-name]').forEach(x=>x.hidden=!x.dataset.name.includes(e.target.value.toLowerCase()));
    picker.querySelectorAll('[data-pick]').forEach(x=>x.onclick=()=>store({...result.slots,[slot]:{player_id:x.dataset.pick||null,manual:true}}));
    picker.querySelector('input').focus();picker.scrollIntoView({block:'nearest',behavior:'smooth'});
   });
  }catch(e){if(seq===request&&page.isConnected)lineHost.innerHTML=`<p role="alert">${esc(e.message)}</p>`}
 };
 const show=tab=>{
  // Overview uses the same lineup and squad nodes, in document order.
  lineHost.hidden=!d.eligible||tab==='squad';
  squad.hidden=tab==='lineup'&&d.eligible;
  page.querySelectorAll('[role="tab"]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.entityTab===tab)));
  if(!lineHost.hidden&&!lineHost.hasChildNodes())drawLineup();
 };
 page.querySelector('[data-entity-tab="overview"]').setAttribute('aria-controls','entity-lineup entity-squad');
 page.querySelectorAll('[data-entity-tab]').forEach(b=>b.onclick=()=>show(b.dataset.entityTab));
 show('overview');
}
