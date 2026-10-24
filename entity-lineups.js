'use strict';
// Presentation and lineup persistence only. Reuses the existing entity roster.
let entityPanels=new Map();try{entityPanels=new Map(JSON.parse(localStorage.getItem('entity-panel-preferences')||'[]'))}catch(e){}
function persistEntityPanels(){try{localStorage.setItem('entity-panel-preferences',JSON.stringify([...entityPanels]))}catch(e){}}
function entityBench(players, starters){
 const pool=players.filter(p=>p.position!=='GK'&&!starters.has(p.id)).sort((a,b)=>compareRatingValues(b.overall,a.overall)||a.id.localeCompare(b.id)),used=new Set();
 const pick=(preferred,fallback=[])=>{const p=[preferred,fallback].flatMap(positions=>pool.filter(p=>!used.has(p.id)&&positions.includes(p.position)))[0];if(p)used.add(p.id);return p};
 const att=[pick(['RW','LW','CF','ST']),pick(['RW','LW','CF','ST'])],mid=[pick(['DM'],['CM','AM']),pick(['CM','AM'],['DM'])],def=[pick(['LB','RB'],['RCB','LCB','CB']),pick(['RCB','LCB','CB'],['LB','RB'])];
 const best=pool.find(p=>!used.has(p.id));if(best)used.add(best.id);
 return [...att,...mid,best,...def].map(p=>{if(p)return p;const next=pool.find(p=>!used.has(p.id));if(next)used.add(next.id);return next}).filter(Boolean);
}
function selectedEntityBench(players,result,pref,formation){
 const selected=new Set(Object.values(result.slots).map(s=>s.player_id)),byId=new Map(players.map(p=>[p.id,p]));
 const saved=pref.benches?.[formation];
 const ids=result.bench_persisted?result.bench:(saved?.ids||result.bench||[]);
 const used=new Set(selected),clean=ids.slice(0,7).map(id=>{if(!byId.has(id)||byId.get(id).position==='GK'||used.has(id))return null;used.add(id);return byId.get(id)});
 const candidates=entityBench(players,used);
 while(clean.length<7)clean.push(null);
 return clean.map(p=>p||candidates.shift()).filter(Boolean);
}
function entitySwap(slots,bench,first,second){
 const values=Object.fromEntries(Object.entries(slots).map(([k,v])=>[k,{...v}]));
 const ids=[...bench];
 if(!first.slot&&!second.slot){
  const a=ids.indexOf(first.id),b=ids.indexOf(second.id);
  if(a<0||b<0)return null;
  [ids[a],ids[b]]=[ids[b],ids[a]];
 }else if(first.slot&&second.slot){
  const a=values[first.slot].player_id;
  values[first.slot]={player_id:values[second.slot].player_id,manual:true};
  values[second.slot]={player_id:a,manual:true};
 }else{
  const slot=first.slot||second.slot,id=first.id||second.id,index=ids.indexOf(id);
  if(!slot||index<0)return null;
  const outgoing=values[slot].player_id;
  values[slot]={player_id:id,manual:true};
  if(outgoing)ids[index]=outgoing;else ids.splice(index,1);
 }
 return {slots:values,bench:ids};
}
async function entityFormation(kind,name,q){
 const page=app.querySelector('.entity-page'),hash=location.hash;
 let d;try{d=await api('entity-overview?'+new URLSearchParams({kind,key:name}))}catch(e){toast('נדרשת הפעלה מחדש של האתר כדי לטעון את מערכת ההרכבים החדשה');return}
 if(!page.isConnected||location.hash!==hash)return;
 const panelKey=kind+':'+name,pref=entityPanels.get(panelKey)||{tab:'overview',formation:'4-3-3'};
 entityPanels.set(panelKey,pref);page.dataset.lineupEligible=String(d.eligible);
 const theme={"ריאל מדריד": {"primaryColor": "#f4efdf", "secondaryColor": "#183b79", "accentColor": "#d7b65f"}, "ברצלונה": {"primaryColor": "#7d2946", "secondaryColor": "#203650", "accentColor": "#edc55d"}, "ליברפול": {"primaryColor": "#ed9999", "secondaryColor": "#44232b", "accentColor": "#ed9999"}, "באיירן מינכן": {"primaryColor": "#ed9999", "secondaryColor": "#382739", "accentColor": "#ed9999"}, "ארסנל": {"primaryColor": "#f2b0a5", "secondaryColor": "#44272b", "accentColor": "#f2b0a5"}, "פריז סן ז׳רמן": {"primaryColor": "#8aaee4", "secondaryColor": "#1a2a43", "accentColor": "#8aaee4"}, "אינטר": {"primaryColor": "#5998ed", "secondaryColor": "#111d32", "accentColor": "#a4c8fa"}, "צ׳לסי": {"primaryColor": "#8aaaff", "secondaryColor": "#1d2d4d", "accentColor": "#8aaaff"}, "מילאן": {"primaryColor": "#8f2533", "secondaryColor": "#15171c", "accentColor": "#dfcda5"}, "מנצ׳סטר יונייטד": {"primaryColor": "#ef6864", "secondaryColor": "#371b22", "accentColor": "#e7c261"}, "יובנטוס": {"primaryColor": "#f0f0eb", "secondaryColor": "#171b22", "accentColor": "#c6cdd5"}, "מנצ׳סטר סיטי": {"primaryColor": "#9ed9ee", "secondaryColor": "#243c4d", "accentColor": "#9ed9ee"}, "אתלטיקו מדריד": {"primaryColor": "#eeaaa6", "secondaryColor": "#38283c", "accentColor": "#eeaaa6"}, "אייאקס": {"primaryColor": "#eeaaa6", "secondaryColor": "#3e2830", "accentColor": "#eeaaa6"}, "נאפולי": {"primaryColor": "#86d5f4", "secondaryColor": "#1b3b4a", "accentColor": "#86d5f4"}, "רומא": {"primaryColor": "#e7b668", "secondaryColor": "#422a2c", "accentColor": "#e7b668"}, "בורוסיה דורטמונד": {"primaryColor": "#edda70", "secondaryColor": "#353525", "accentColor": "#edda70"}, "טוטנהאם": {"primaryColor": "#dce4f2", "secondaryColor": "#252e40", "accentColor": "#dce4f2"}, "לאציו": {"primaryColor": "#a2dbee", "secondaryColor": "#283c4a", "accentColor": "#a2dbee"}, "באייר לברקוזן": {"primaryColor": "#e9a09a", "secondaryColor": "#3c252c", "accentColor": "#e9a09a"}, "ספרד": {"primaryColor": "#e4c26f", "secondaryColor": "#422b30", "accentColor": "#e4c26f"}, "איטליה": {"primaryColor": "#8eb4ef", "secondaryColor": "#22354b", "accentColor": "#8eb4ef"}, "ברזיל": {"primaryColor": "#f2d34e", "secondaryColor": "#165c42", "accentColor": "#87cda5"}, "צרפת": {"primaryColor": "#9bb7ee", "secondaryColor": "#27334a", "accentColor": "#9bb7ee"}, "אנגליה": {"primaryColor": "#e6e7eb", "secondaryColor": "#34313a", "accentColor": "#e6e7eb"}, "גרמניה": {"primaryColor": "#e3c38a", "secondaryColor": "#37312d", "accentColor": "#e3c38a"}, "ארגנטינה": {"primaryColor": "#8fd5f3", "secondaryColor": "#224d71", "accentColor": "#f4eee0"}, "הולנד": {"primaryColor": "#efb179", "secondaryColor": "#443226", "accentColor": "#efb179"}, "פורטוגל": {"primaryColor": "#e6aaa3", "secondaryColor": "#263d32", "accentColor": "#e6aaa3"}, "בלגיה": {"primaryColor": "#e9c779", "secondaryColor": "#3e2d2e", "accentColor": "#e9c779"}};
 if(theme[name]){const c=theme[name];page.style.setProperty('--entity-primary',c.primaryColor);page.style.setProperty('--entity-secondary',c.secondaryColor);page.style.setProperty('--entity-accent',c.accentColor||c.primaryColor);}
 const oldTitle=page.querySelector('.title'),summary=page.querySelector('.entity-summary');
 const rosterCounts=Object.fromEntries(Object.entries({GK:['GK'],DEF:['RB','LB','RCB','LCB','CB'],MID:['DM','CM','AM'],ATT:['RW','LW','CF','ST']}).map(([key,positions])=>[key,d.players.filter(p=>positions.includes(p.position)).length]));
 const rosterSummary=`<div class="roster-composition" aria-label="מבנה הסגל"><span>שחקנים רשמיים: ${d.count}</span>${Object.entries(rosterCounts).map(([k,n])=>`<span><small>${({GK:"שוערים",DEF:"הגנה",MID:"קישור",ATT:"התקפה"})[k]}</small><b>${n}</b></span>`).join('')}</div>`;
 oldTitle.remove();summary.remove();
 const squad=document.createElement('section');squad.className='entity-squad'+(q.metric==='overall'?' entity-squad-overall':'');squad.id='entity-squad';squad.setAttribute('role','tabpanel');
 while(page.firstChild)squad.append(page.firstChild);
 page.append(squad);
 const openPlayer=async id=>{try{const p=await api('player/'+id);if(location.hash!==hash)return;const i=state.players.findIndex(x=>x.id===p.id);if(i>=0)state.players[i]=p;else state.players.push(p);quick(id)}catch(e){toast(e.message)}};
 page.insertAdjacentHTML('afterbegin',`<div class="team-rating-layout"><section class="team-panel" aria-label="Team Rating"><div class="team-identity">${UI.EntityIcon(kind,name)}<div><small>${kind==='club'?'מועדון כל הזמנים':'נבחרת כל הזמנים'}</small><h1>${esc(name)}</h1></div><button data-entity-back class="secondary" aria-label="חזרה">←</button></div>${rosterSummary}<div data-team-rating role="status" aria-live="polite"><p class="muted">מחשב Team Rating…</p></div></section><section id="entity-lineup" role="tabpanel" class="panel entity-lineup" hidden></section></div><div class="entity-tabs" role="tablist" aria-label="תצוגת קבוצה">${[['overview','סקירה'],['lineup','הרכב'],['squad','סגל'],['abilities','דירוג יכולות']].map(([key,label])=>`<button role="tab" data-entity-tab="${key}" aria-controls="entity-${key==='abilities'?'squad':key}">${label}</button>`).join('')}</div>`);
 const lineHost=page.querySelector('#entity-lineup'),teamHost=page.querySelector('[data-team-rating]'),cache=new Map();let request=0,busy=false;
 const pendingTeam=message=>{teamHost.innerHTML=`<div class="team-overall is-pending"><small>TEAM RATING · V1.2</small><strong>—</strong></div><p class="team-rating-note">${esc(message)}</p>`};
 const updateTeam=async(formation,result,bench,seq)=>{
  teamHost.setAttribute('aria-busy','true');
  try{
   const rating=await api('team-rating',{kind,key:name,formation,slots:result.slots,bench:bench.map(p=>p.id)});
   if(seq!==request||!page.isConnected)return;
   if(rating.status!=='calculated'){updateSquadAverages(page,rating);pendingTeam(rating.message);return}
   updateSquadAverages(page,rating);
   const labels={attack:'Attack',shooting:'Shooting',dribbling:'Dribbling',passing:'Passing',athleticism:'Athleticism',general:'General',ball_winning:'Ball Winning',defense:'Defense'};
   teamHost.innerHTML=`<div class="team-overall" title="${esc(rating.overall)}"><small>TEAM RATING · V1.2</small><strong>${rating.display_overall}</strong><span>סגל נבחר: 18 · ${rating.goalkeeper_placeholder?'שוער זמני 81':'שוער'} + 17 שחקני שדה</span></div><div class="team-squad-average" title="${esc(rating.squadAverageOverall)}">ממוצע הסגל: <b>${rating.display_squad_average}</b></div><div class="team-main-grid">${Object.entries(labels).map(([key,label])=>`<div title="${esc(rating.mains[key])}"><small>${label}</small><b>${rating.display_mains[key]}</b></div>`).join('')}</div><p class="team-rating-note">בסיס קבוצתי + תרומת בונוס מההרכב<br>8 התרומות הגבוהות · עד שני מחליפים לכל יכולת</p>`;
  }catch(e){if(seq===request&&page.isConnected)pendingTeam('חישוב קבוצתי לא זמין כרגע. '+e.message)}
  finally{if(seq===request&&page.isConnected)teamHost.setAttribute('aria-busy','false')}
 };
 const drawLineup=async()=>{
  if(!d.eligible){pendingTeam('לא מספיק עומק לסגל 18');lineHost.innerHTML='<p class="muted">הרכב ייפתח כאשר יהיו לפחות 12 שחקנים במאגר</p>';return}
  const formation=pref.formation,seq=++request;
  lineHost.innerHTML=UI.LoadingState(t('loading'));
  teamHost.setAttribute('aria-busy','true');
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
   const definitions=d.formations[formation],midSlots=definitions.filter(s=>s.positions.some(p=>['DM','CM','AM'].includes(p))),triangle=midSlots.length===3;
   const bench=selectedEntityBench(d.players,result,pref,formation);
   if(!result.bench_persisted&&pref.benches?.[formation]?.ids){
    result=await api('entity-lineup-save',{kind,key:name,formation,slots:result.slots,bench:bench.map(p=>p.id),lineupMode:'manual',revision:result.revision});cache.set(formation,result);
   }

   lineHost.innerHTML=`<div class="lineup-toolbar"><div><small>מערך</small><strong dir="ltr">${esc(formation)}</strong></div><button class="secondary" data-reset-lineup>איפוס להרכב אוטומטי</button><span class="muted lineup-save-status" role="status">${result.lineupMode==='manual'?'הרכב ידני':'הרכב אוטומטי'}</span></div><div class="formation-options">${[['CLASSIC',['4-3-3','4-4-2','4-2-3-1','4-3-1-2']],['CONTROL',['4-3-3 Holding','5-3-2','5-4-1']]].map(([label,items])=>`<div><small>${label}</small><div class="formation-chips">${items.map(f=>`<button data-formation="${esc(f)}" aria-pressed="${f===formation}" dir="ltr">${esc(f)}</button>`).join('')}</div></div>`).join('')}</div>${Formation.pitch(definitions.map(s=>{const p=d.players.find(r=>r.id===result.slots[s.slot].player_id);return {...s,temporaryGoalkeeper:s.label==='GK'&&!d.players.some(p=>p.position==='GK'),...(triangle&&midSlots.includes(s)?{row:2,triangle:String(midSlots.indexOf(s)+1)}:{}),player:p?{id:p.id,name:p.name,rating:p.display,position:p.position}:null}}),{label:"הרכב "+formation})}<div class="entity-bench" aria-label="מחליפים"><small>מחליפים</small><div>${bench.map(p=>`<button data-bench-player="${p.id}">${UI.Portrait(p.id)}<span>${esc(p.name)}</span><small>${esc(p.position)}</small>${UI.RatingBadge(p.display)}</button>`).join('')}</div></div><div class="lineup-swap-tools"><span data-swap-status role="status">בחרו שני שחקנים להחלפה</span><button class="secondary" data-swap-cancel hidden>ביטול</button><button class="secondary" data-swap-roster hidden>בחירה מהסגל</button></div><div data-lineup-picker></div>`;
   await updateTeam(formation,result,bench,seq);
   const store=async(values,reset=false,benchIds=null)=>{
    if(busy)return;busy=true;lineHost.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{const next=await api(reset?'entity-lineup-reset':'entity-lineup-save',{kind,key:name,formation,slots:values,bench:benchIds||bench.map(p=>p.id),lineupMode:reset?'auto':'manual',revision:result.revision});cache.set(formation,next);
     pref.benches=pref.benches||{};
     if(reset)delete pref.benches[formation];
     else if(benchIds)pref.benches[formation]={revision:next.revision,ids:benchIds};
     persistEntityPanels();await drawLineup()}
    catch(e){cache.delete(formation);toast(e.message);await drawLineup()}
    finally{busy=false}
   };
   lineHost.querySelectorAll('[data-formation]').forEach(b=>b.onclick=()=>{if(busy)return;pref.formation=b.dataset.formation;persistEntityPanels();drawLineup()});
   lineHost.querySelector('[data-reset-lineup]').onclick=()=>store(null,true);
   const storeBench=async ids=>store(result.slots,false,ids);
   const openRoster=b=>{
    const slot=b.dataset.slot,benchId=b.dataset.benchPlayer,current=slot?result.slots[slot].player_id:benchId,used=new Set(Object.entries(result.slots).filter(([k])=>k!==slot).map(([,v])=>v.player_id));
    if(benchId)bench.forEach(p=>{if(p.id!==benchId)used.add(p.id)});
    const picker=lineHost.querySelector('[data-lineup-picker]');
    picker.innerHTML=`<section class="lineup-picker" aria-label="בחירת שחקן"><div class="section-heading"><h3>בחירת שחקן · ${esc(slot?definitions.find(s=>s.slot===slot).label:'ספסל')}</h3><button data-picker-close>סגירה</button></div><p class="muted">הבחירה משנה את ההרכב בלבד. עמדה ראשית ודירוג נשארים כפי שהם.</p><input type="search" data-picker-search placeholder="חיפוש שחקן" aria-label="חיפוש שחקן להרכב">${slot?'<button data-pick="" class="secondary">השאר עמדה ריקה</button>':''}<div class="lineup-candidates">${d.players.filter(p=>!used.has(p.id)&&(!benchId||p.position!=='GK')).map(p=>`<button data-pick="${p.id}" data-name="${esc(p.name.toLowerCase())}" aria-pressed="${p.id===current}">${UI.Portrait(p.id)}<strong>${esc(p.name)}</strong>${UI.PositionChip(p.position)}${UI.RatingBadge(p.display)}</button>`).join('')}</div></section>`;
    picker.querySelector('[data-picker-close]').onclick=()=>{picker.innerHTML='';b.focus()};
    picker.querySelector('[data-picker-search]').oninput=e=>picker.querySelectorAll('[data-name]').forEach(x=>x.hidden=!x.dataset.name.includes(e.target.value.toLowerCase()));
    picker.querySelectorAll('[data-pick]').forEach(x=>x.onclick=()=>{
     if(benchId)storeBench(bench.map(p=>p.id===benchId?x.dataset.pick:p.id));
     else store({...result.slots,[slot]:{player_id:x.dataset.pick||null,manual:true}});
    });
    picker.querySelector('input').focus();picker.scrollIntoView({block:'nearest',behavior:'smooth'});
   };
   let swapSelection=null;
   const cancel=lineHost.querySelector('[data-swap-cancel]'),roster=lineHost.querySelector('[data-swap-roster]'),status=lineHost.querySelector('[data-swap-status]');
   const mark=(choice,button)=>{
    swapSelection=choice?{choice,button}:null;
    lineHost.querySelectorAll('[data-slot],[data-bench-player]').forEach(b=>{const active=b===button;b.classList.toggle('is-swap-selected',active);b.setAttribute('aria-pressed',String(active))});
    cancel.hidden=!choice;roster.hidden=!choice;
    status.textContent=choice?'נבחר להחלפה · לחצו על שחקן נוסף':'בחרו שני שחקנים להחלפה';
    lineHost.querySelector('[data-lineup-picker]').innerHTML='';
   };
   const choose=(choice,button)=>{
    if(busy)return;
    if(!swapSelection){mark(choice,button);return}
    if(swapSelection.button===button){mark(null,null);return}
    const change=entitySwap(result.slots,bench.map(p=>p.id),swapSelection.choice,choice);
    if(change){
     if(!swapSelection.choice.slot&&!choice.slot)storeBench(change.bench);
     else store(change.slots,false,change.bench);
    }
   };
   cancel.onclick=()=>mark(null,null);
   roster.onclick=()=>{if(swapSelection)openRoster(swapSelection.button)};
   lineHost.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>choose({slot:b.dataset.slot},b));
   lineHost.querySelectorAll('[data-bench-player]').forEach(b=>b.onclick=()=>choose({id:b.dataset.benchPlayer},b));
  }catch(e){if(seq===request&&page.isConnected)lineHost.innerHTML=`<p role="alert">${esc(e.message)}</p>`}
 };
 page.refreshTeam=async()=>{d=await api('entity-overview?'+new URLSearchParams({kind,key:name}));cache.clear();await drawLineup()};
 const show=tab=>{page.dataset.panel=tab;
  if(tab==='abilities'){const el=page.querySelector('[data-er-ability]');if(el&&!el.value){el.value=state.catalog.abilities[0].id;el.dispatchEvent(new Event('change'));}}
  // Overview uses the same lineup and squad nodes, in document order.
  lineHost.hidden=!d.eligible||(tab==='squad'||tab==='abilities');
  squad.hidden=tab==='lineup'&&d.eligible;
  page.querySelectorAll('[role="tab"]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.entityTab===tab)));
  if(!lineHost.hidden&&!lineHost.hasChildNodes())drawLineup();
 };
 page.querySelector('[data-entity-tab="overview"]').setAttribute('aria-controls','entity-lineup entity-squad');
 page.querySelectorAll('[data-entity-tab]').forEach(b=>b.onclick=()=>show(b.dataset.entityTab));
 if(!d.eligible)pendingTeam('לא מספיק עומק לסגל 18');
 show('overview');
}

function updateSquadAverages(page,rating){
 const host=page.querySelector('[data-squad-main-averages]');
 if(host)host.innerHTML=rating.status==='calculated'?mains.map(k=>`<div><small>${t('main.'+k)}</small><b> ${entityNumber(rating.squadMainAverages[k])}</b></div>`).join(''):'לא מספיק עומק לסגל 18';
 const comparison=page.querySelector('[data-squad-ability-average]');
 if(comparison){const value=rating.squadAbilityAverages?.[page.dataset.metric];comparison.innerHTML=`ממוצע יכולת בסגל הנבחר <strong>${entityNumber(value)}</strong><small> · 17 שחקני שדה</small>`;}
 page.squadRating=rating;
}
