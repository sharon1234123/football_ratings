'use strict';
// Presentation only: these components never fetch, save or calculate ratings.
const UI={
 Number(value){if(value==null||value==='')return '—';const n=Number(value);return Number.isFinite(n)?String(Math.round(n)):String(value)},
 Navigation(nav){const link=([route,key])=>`<a href="#${route}">${this.Icon(route)}<span>${t(key)}</span></a>`;return nav.slice(0,5).map(link).join('')+`<details class="mobile-more"><summary aria-label="עוד מסכים">☰ <span>עוד</span></summary><div>${nav.slice(5).map(link).join('')}</div></details><div class="desktop-secondary-nav">${nav.slice(5).map(link).join('')}</div>`},
 icons:{dashboard:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',players:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',gk:'M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-6',clubs:'M4 21V8l8-5 8 5v13M2 21h20M9 21v-5h6v5M8 9h1M15 9h1M8 12h1M15 12h1',countries:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',abilities:'M4 20V10M10 20V4M16 20v-7M22 20H2',analytics:'M3 3v18h18M6 15l5-5 4 3 6-8',drafts:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 12h8M8 16h6',formula:'M4 5h16M4 12h16M4 19h16M8 3v4M16 10v4M10 17v4',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'},
 Icon(key){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${this.icons[key]||this.icons.players}"/></svg>`},
 Portrait(id){const src=typeof PlayerPortraits==='undefined'?null:PlayerPortraits[id];return `<span class="player-portrait" aria-hidden="true">${src?`<img src="${src}" alt="" width="36" height="36" loading="lazy" decoding="async">`:this.Icon('players')}</span>`},
 EntityIcon(kind,name){const src=typeof EntityAssets==='undefined'?null:EntityAssets[kind]?.[name];return `<span class="entity-emblem entity-emblem-${kind}${src?'':' is-placeholder'}" aria-hidden="true">${src?`<img src="${src}" alt="" width="28" height="28" loading="lazy" decoding="async">`:this.Icon(kind==='country'?'countries':'gk')}</span>`},
 RatingBadge(value,{large=false}={}){return `<span class="ui-rating${large?' ui-rating-large':''}">${esc(this.Number(value))}</span>`},
 PositionChip(value){return `<span class="position-chip" dir="ltr">${esc(value||'—')}</span>`},
 PlayerRow(cells,{className=''}={}){return `<tr class="ui-player-row ${className}">${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`},
 PlayerMiniCard(p){return `<button class="ui-mini-player" data-quick="${esc(p.id)}"><span>${esc(p.full_name)}</span>${this.RatingBadge(overall(p))}</button>`},
 SectionHeader(title,sub='',action=''){return `<div class="ui-section-header"><div><h2>${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:''}</div>${action}</div>`},
 DataCard(content,className=''){return `<section class="panel ui-data-card ${className}">${content}</section>`},
 StatTile(label,value,detail=''){return `<div class="ui-stat"><span>${esc(label)}</span><strong>${esc(value??'—')}</strong>${detail?`<small>${esc(detail)}</small>`:''}</div>`},
 AbilityTier(value){const n=Number(value);return value==null||!Number.isFinite(n)?'':n>=95?'tier-elite':n>=89?'tier-high':n>=84?'tier-good':n>=75?'tier-mid':'tier-low'},
 AbilityValue(value){return `<b class="ui-ability-value ${this.AbilityTier(value)}">${esc(value??'—')}</b>`},
 DeltaPreview(label,oldValue,newValue){return `<span class="ui-delta ${Number(newValue)>Number(oldValue)?'ui-delta-positive':Number(newValue)<Number(oldValue)?'ui-delta-negative':'ui-delta-neutral'}"><small>${esc(label)}</small><span dir="ltr">${esc(oldValue??'—')} <span aria-hidden="true">→</span> <b>${esc(newValue??'—')}</b></span></span>`},
 EditState(content){return `<div class="ui-edit-state" aria-live="polite">${content}</div>`},
 EmptyState(text){return `<div class="ui-empty">${this.Icon('players')}<p>${esc(text)}</p></div>`},
 LoadingState(text){return `<div class="ui-loading" role="status" aria-busy="true"><span></span>${esc(text)}</div>`},
 SearchField({id='',value='',attributes='',label=t('search')}={}){return `<label class="ui-search">${this.Icon('search')}<input ${id?`id="${id}"`:''} ${attributes} type="search" aria-label="${esc(label)}" placeholder="${esc(label)}" value="${esc(value)}"></label>`},
 SelectField(label,options,attributes=''){return `<label class="ui-select"><span>${esc(label)}</span><select ${attributes} aria-label="${esc(label)}">${options}</select></label>`},
 FilterBar(content,{id=''}={}){return `<details class="ui-filterbar" ${id?`id="${id}"`:''} ${typeof matchMedia==='undefined'||!matchMedia('(max-width:650px)').matches?'open':''}><summary>${'סינון וחיפוש'}</summary><div class="filters">${content}</div></details>`},
 NavigationCard(path,label){return `<a class="ui-nav-card" href="#${path}">${this.Icon(path)}<div><strong>${esc(label)}</strong><p>${t('ui.nav.'+path)}</p></div><span aria-hidden="true">↖</span></a>`},
 Metadata(meta={},value){return meta.origin||meta.source_form!=null?`<details class="ui-metadata"><summary aria-label="${t('ui.metadata')}">ⓘ</summary><div>${meta.source_form!=null?`<p>${t('v32.legacy_form')}: ${esc(meta.source_form)}</p>`:''}${meta.origin?`<p>${esc(meta.origin)}</p>`:''}<p>${t('ui.current')}: ${esc(Array.isArray(value)?value.join(' · '):value??'—')}</p></div></details>`:''},
 Chips(values){return `<div class="ui-chips">${values.map(v=>`<span class="ui-chip">${esc(v)}</span>`).join('')}</div>`},
 FrequencyRow(label,count,percent,max,rank=null){return `<div class="ui-frequency"><div>${rank==null?'':`<i class="ui-frequency-rank">#${rank}</i>`}${label}<span><b>${count}</b>${percent==null?'':` <small>${Number(percent).toFixed(1)}%</small>`}</span></div><progress value="${count}" max="${Math.max(1,max)}" aria-label="${esc(t('analytics.count'))}"></progress></div>`},
 FilterSummary(box){const count=[...box.querySelectorAll('input:not([type=checkbox]),select')].filter(el=>{const key=el.dataset.erFilter||el.dataset.draftFilter||el.id;return !['size','limit','sort','gk-sort'].includes(key)&&!!el.value&&el.value!=='overall'}).length;const summary=box.querySelector('summary');if(summary)summary.textContent='סינון וחיפוש'+(count?' · '+count+' פילטרים פעילים':'')},
 enhance(root=app){
  root.querySelectorAll('.filters').forEach(el=>{if(el.closest('.ui-filterbar')||el.tagName==='FORM'||el.closest('#edit-form,#phase5-form'))return;const box=document.createElement('details');box.className='ui-filterbar';box.open=!matchMedia('(max-width:650px)').matches;const summary=document.createElement('summary');summary.textContent='סינון וחיפוש';el.before(box);box.append(summary,el)});
  root.querySelectorAll('.ui-filterbar').forEach(box=>this.FilterSummary(box));
 },
 abilityGroups:{attack:['positioning','finishing','heading','kicking'],technique:['technique','dribbling','possession','balance'],passing:['short_passing','long_passing','free_kick','curl'],movement:['speed','acceleration','strength','jumping'],defense:['defending','tackling','aggression'],general:['stamina','teamwork','form_ability']},
 GroupedAbilities(render){return `<div class="ui-ability-groups">${Object.entries(this.abilityGroups).map(([group,keys])=>`<section><h3>${t('ui.'+group)}</h3><div class="ui-ability-list">${keys.map(render).join('')}</div></section>`).join('')}</div>`}
};

// Missing images must never block the entity name or navigation.
if(typeof document!=='undefined')document.addEventListener('error',e=>{if(e.target.matches?.('.entity-emblem img')){const host=e.target.parentElement;host.classList.add('is-placeholder');host.innerHTML=UI.Icon(host.classList.contains('entity-emblem-country')?'countries':'gk');}},true);

if(typeof document!=="undefined")document.addEventListener("error",e=>{if(e.target.matches?.(".player-portrait img"))e.target.parentElement.innerHTML=UI.Icon("players")},true);

document.addEventListener('input',e=>{const box=e.target.closest('.ui-filterbar');if(box)UI.FilterSummary(box)});
document.addEventListener('change',e=>{const box=e.target.closest('.ui-filterbar');if(box)UI.FilterSummary(box)});
document.addEventListener('click',e=>{if(e.target.closest('.mobile-more a'))e.target.closest('.mobile-more').open=false});
