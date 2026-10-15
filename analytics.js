function analyticNumber(v){return v==null?'—':Number(v).toLocaleString(I18n.locale==='he'?'he-IL':'en-US',{maximumFractionDigits:2})}
function analyticTable(headers,rows){return `<div class="analytics-scroll"><table><thead><tr>${headers.map(h=>`<th>${t(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`}
async function analyticsPage(position){if(position==='GK'){await gkAnalyticsPage();return;}const destination=location.hash;app.innerHTML=UI.LoadingState(t('loading'));try{const data=await api('analytics'+(position?'?position='+encodeURIComponent(position):''));if(location.hash!==destination)return;
 const skillsData=position?null:await api('analytics-skills');if(location.hash!==destination)return;
 let content=heading('analytics.title','analytics.scope');
 if(data.detail){const d=data.detail;content+=`<a href="#analytics">← ${t('back')}</a><h2>${t('filter_position.'+d.position)}</h2>${averageNote(d.count)}<div class="analytics-grid">${[['analytics.count',d.count],['analytics.internal_average',d.average_overall],['analytics.display_average',d.average_display],['analytics.skills_average',d.average_skills]].map(([k,v])=>UI.StatTile(t(k),analyticNumber(v))).join('')}</div>`;
 for(const [kind,metrics] of [['mains',d.mains],['abilities',d.abilities]])content+=`<section class="panel"><h2>${t('analytics.'+kind)}</h2>${analyticTable(['analytics.metric','analytics.mean','analytics.database_mean','analytics.delta'],d['ordered_'+kind].map(k=>{const v=metrics[k],baseline=d['database_'+kind][k],diff=d['difference_'+kind][k];return `<tr><td>${t((kind==='mains'?'main.':'ability.')+k)}</td><td>${analyticNumber(v)}</td><td><small class="muted">${analyticNumber(baseline)}</small></td><td class="${diff>0?'ui-diff-positive':diff<0?'ui-diff-negative':''}" dir="ltr">${diff>0?'+':''}${analyticNumber(diff)}</td></tr>`}))}</section>`;
 content+=`<div class="analytics-grid">${[['top',d.top],['bottom',d.bottom]].map(([k,rows])=>`<section class="panel"><h3>${t('analytics.'+k)}</h3>${analyticTable(['field.full_name','overall'],rows.map(r=>`<tr><td><button class="link" data-quick="${r.id}">${esc(r.name)}</button></td><td>${r.display??'—'}</td></tr>`))}</section>`).join('')}</div>`;
 }else{
 content+=`<section class="panel"><h2>${data.total} ${t('analytics.rated')}</h2><div class="analytics-grid">${data.positions.map(p=>`<a class="analytics-position" href="#analytics/${p.id}"><span>${t('filter_position.'+p.id)}</span><strong>${p.count}</strong><small>${t('analytics.internal_average')}: ${analyticNumber(p.average_overall)}</small>${averageNote(p.count)}</a>`).join('')}</div></section><div class="analytics-grid">`;
 for(const [key,type]of [['countries','country'],['clubs','club']])content+=`<section class="panel"><h2>${t('analytics.'+key)}</h2>${data[key].map((r,i)=>UI.FrequencyRow(r.name?entityLink(type,r.name):t('missing'),r.count,null,Math.max(...data[key].map(x=>x.count),1),i+1)).join('')}</section>`;
 content+=`</div><div class="analytics-grid"><section class="panel"><h2>${t('analytics.distribution')}</h2><p>${t('analytics.display_distribution')}</p>${data.bands.map(b=>`<div class="analytics-band"><span dir="ltr">${esc(b.label)}</span><progress max="${Math.max(data.total,1)}" value="${b.count}" aria-label="${esc(b.label)}"></progress><b>${b.count}</b></div>`).join('')}</section><section class="panel"><h2>${t('analytics.styles')}</h2>${data.styles.map(r=>UI.FrequencyRow(r.name?esc(traitName(r.name)):t('missing'),r.count,r.percent,Math.max(...data.styles.map(x=>x.count),1))).join('')}</section></div>`+analyticsTop100(data)+analyticsSkillsTable(skillsData);
 }app.innerHTML=`<div class="analytics-page">${content}</div>`;UI.enhance();if(!position&&analyticsReturn){window.scrollTo(0,analyticsScroll);analyticsReturn=false;}
 }catch(error){if(location.hash===destination)app.innerHTML=`<p role="alert">${esc(error.message)}</p>`}}


let analyticsScroll=0,analyticsReturn=false;
const skillFilters={};
function analyticsSkillsTable(data){return UI.DataCard(UI.SectionHeader(t('analytics.skills'))+data.skills.map(s=>UI.FrequencyRow(`<a data-analytics-skill href="#analytics-skill/${encodeURIComponent(s.id)}">${traitName(s.id)}</a>`,s.count,s.percent,Math.max(...data.skills.map(x=>x.count),1))).join(''))}

document.addEventListener('click',e=>{if(e.target.closest('[data-analytics-skill]'))analyticsScroll=window.scrollY;if(e.target.closest('[data-analytics-return]'))analyticsReturn=true;});
async function analyticsSkillPage(skill){
 const destination=location.hash;app.innerHTML=UI.LoadingState(t('loading'));
 try{
 const data=await api('analytics-skills?skill='+encodeURIComponent(skill));if(location.hash!==destination)return;
 const filters=skillFilters[skill]||(skillFilters[skill]={});
 app.innerHTML=`<div class="analytics-page">${heading('analytics.skills','analytics.scope')}<a data-analytics-return href="#analytics">← ${t('back')}</a><h2>${traitName(skill)}</h2><div class="filters"><input id="skill-search" aria-label="${t('search')}" placeholder="${t('search')}" value="${esc(filters.search||'')}">${[['position','position_id'],['country','country'],['club','primary_club'],['style','playing_style']].map(([k,label])=>`<label>${fieldName(label)}<select data-skill-filter="${k}"><option value="">${t('analytics.all')}</option>${[...new Set(data.players.map(p=>p[k]).filter(Boolean))].sort().map(v=>`<option value="${esc(v)}" ${filters[k]===v?'selected':''}>${k==='position'?t('filter_position.'+v):k==='style'?traitName(v):esc(v)}</option>`).join('')}</select></label>`).join('')}</div><p id="skill-count"></p><div id="skill-rows"></div><p role="alert" id="skill-error"></p></div>`;
 const render=()=>{
 const rows=data.players.filter(p=>['position','country','club','style'].every(k=>!filters[k]||p[k]===filters[k])&&(!filters.search||p.name.toLocaleLowerCase().includes(filters.search.toLocaleLowerCase())));
 document.querySelector('#skill-count').textContent=t('analytics.skill_count',{count:rows.length,total:data.players.length,percent:analyticNumber(data.total?data.players.length*100/data.total:0)});
 document.querySelector('#skill-rows').innerHTML=analyticTable(['field.full_name','overall','field.position_id','field.country','field.primary_club','field.playing_style','analytics.action'],rows.map(p=>`<tr><td><button class="link" data-quick="${p.id}">${esc(p.name)}</button></td><td>${p.display??'—'}</td><td>${t('filter_position.'+p.position)}</td><td>${esc(p.country||'—')}</td><td>${esc(p.club||'—')}</td><td>${p.style?traitName(p.style):'—'}</td><td><button data-remove-skill="${p.id}">${t('analytics.remove_skill')}</button></td></tr>`));
 document.querySelectorAll('[data-remove-skill]').forEach(button=>button.onclick=async()=>{
 const p=data.players.find(p=>p.id===button.dataset.removeSkill);
 if(!await skillRemovalConfirm(t('analytics.remove_confirm',{skill:traitName(skill),player:p.name})))return;
 button.disabled=true;
 try{const current=await api('player/'+encodeURIComponent(p.id));await api('analytics-remove-skill',{player_id:p.id,skill,revision:current.revision});await reload(true);if(location.hash===destination){const scroll=window.scrollY;await analyticsSkillPage(skill);window.scrollTo(0,scroll);}}
 catch(error){if(location.hash===destination){document.querySelector('#skill-error').textContent=error.message;button.disabled=false;}}
 });};
 UI.enhance();document.querySelector('#skill-search').oninput=e=>{filters.search=e.target.value;render();};
 document.querySelectorAll('[data-skill-filter]').forEach(el=>el.onchange=()=>{filters[el.dataset.skillFilter]=el.value;render();});render();
 }catch(error){if(location.hash===destination)app.innerHTML=`<p role="alert">${esc(error.message)}</p>`;}
}

function skillRemovalConfirm(message){return new Promise(resolve=>{
 const dialog=document.createElement('dialog');dialog.className='skill-confirm';dialog.innerHTML=`<p>${esc(message)}</p><div class="actions"><button data-confirm-skill>${t('analytics.confirm_remove')}</button><button data-cancel-skill class="secondary">${t('cancel')}</button></div>`;document.body.append(dialog);
 const finish=value=>{dialog.close();dialog.remove();resolve(value);};dialog.querySelector('[data-confirm-skill]').onclick=()=>finish(true);dialog.querySelector('[data-cancel-skill]').onclick=()=>finish(false);dialog.oncancel=e=>{e.preventDefault();finish(false);};dialog.showModal();
 });}
function analyticsTop100(data){return `<div class="analytics-grid analytics-top100">${[['abilities',data.top100_abilities],['mains',data.top100_mains]].map(([kind,rows])=>`<section class="panel"><h2>${t('analytics.top100_'+kind)}</h2>${analyticTable(['analytics.metric','analytics.top100_average'],rows.map(r=>`<tr><td><a href="#abilities/${kind==='mains'?'main-':''}${r.metric}">${kind==='mains'?t('main.'+r.metric):abilityName(r.metric)}</a></td><td title="${t('analytics.based_on',{count:r.count})}">${entityNumber(r.average)}</td></tr>`))}</section>`).join('')}</div>`}
