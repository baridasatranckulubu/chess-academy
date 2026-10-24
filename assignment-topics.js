/* Lichess's complete public theme taxonomy; counts come from real source rows. */
(()=>{'use strict';let resources;
const load=()=>resources||(resources=Promise.all([fetch('data/lichess-themes.json').then(r=>{if(!r.ok)throw Error('Konu listesi yüklenemedi.');return r.json()}),window.BaridaAssignmentBank.index()]).catch(e=>{resources=null;throw e}));
const normalize=t=>String(t).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
const translations=[['Four Knights','Dört At'],['Two Knights','İki At'],["King's Indian",'Şah Hint'],["Queen's Indian",'Vezir Hint'],["King's Pawn",'Şah Piyonu'],["Queen's Pawn",'Vezir Piyonu'],["King's",'Şah'],["Queen's",'Vezir'],['Sicilian','Sicilya'],['French','Fransız'],['Italian','İtalyan'],['English','İngiliz'],['Scandinavian','İskandinav'],['Indian','Hint'],['Ruy Lopez','İspanyol'],['Defense','Savunması'],['Opening','Açılışı'],['Game','Oyunu'],['Variation','Varyantı'],['Attack','Saldırısı'],['Countergambit','Karşı Gambiti'],['Gambit','Gambiti'],['Accepted','Kabul Edilen'],['Declined','Reddedilen'],['System','Sistemi'],['Classical','Klasik'],['Modern','Modern'],['Exchange','Değişim'],['Advance','İlerleme'],['Closed','Kapalı'],['Open','Açık'],['Main Line','Ana Devam Yolu']];
function openingName(key){let s=key.replaceAll('_',' ');for(const [a,b] of translations)s=s.replaceAll(a,b);return s}
async function mount({theme,level,count,form,send,canSend}){
 const [catalog,index]=await load();const map=new Map(catalog.groups.flatMap(g=>g.themes.map(t=>[t.id,t])));
 if(![...level.options].some(o=>o.value==='400-3000'))level.add(new Option('Tüm seviyeler','400-3000'));
 const search=document.createElement('input');search.type='search';search.id='quickThemeSearch';search.placeholder='Konu ara…';search.setAttribute('aria-label','Konu ara');theme.before(search);
 const available=document.createElement('small');available.id='quickAvailability';available.setAttribute('aria-live','polite');theme.after(available);
 const wrap=document.createElement('label');wrap.className='opening-picker';wrap.hidden=true;wrap.append('Açılış / varyant');
 const os=document.createElement('input');os.type='search';os.id='quickOpeningSearch';os.placeholder='Açılış ara…';os.setAttribute('aria-label','Açılış ara');
 const opening=document.createElement('select');opening.id='quickOpening';opening.setAttribute('aria-label','Açılış veya varyant');wrap.append(os,opening);form.insertBefore(wrap,send);
 function state(){return{opening:theme.value==='opening'?opening.value:null}}
 function amount(){const openingKey=state().opening;const entry=openingKey?index.openings[openingKey]:index.themes[theme.value];const key={'400-1400':'easy','1200-1900':'medium','1800-3000':'hard','400-3000':'all'}[level.value];return entry?.counts[key]||0}
 function refresh(){wrap.hidden=theme.value!=='opening';const n=amount();available.textContent=n.toLocaleString('tr-TR')+' soru';for(const o of count.options)o.disabled=Number(o.value)>n;if(!count.value||count.selectedOptions[0]?.disabled){const choices=[...count.options].filter(o=>!o.disabled);count.value=choices.at(-1)?.value||''}send.disabled=!canSend()||n===0}
 function topicChange(){wrap.hidden=theme.value!=='opening';if(amount()===0)level.value='400-3000';refresh()}
 function renderThemes(){const old=theme.value;theme.replaceChildren();const q=normalize(search.value);for(const g of catalog.groups){const options=g.themes.filter(t=>normalize(t.name+' '+t.sourceId).includes(q));if(!options.length)continue;const group=document.createElement('optgroup');group.label=g.name;for(const t of options){const o=new Option(t.name,t.id);o.title=t.sourceId;group.append(o)}theme.append(group)}if([...theme.options].some(o=>o.value===old))theme.value=old;topicChange()}
 function renderOpenings(){const old=opening.value;opening.replaceChildren(new Option('Tüm açılışlar',''));const q=normalize(os.value),groups=new Map();for(const [key,item] of Object.entries(index.openings)){const name=openingName(key);if(!normalize(name+' '+key).includes(q))continue;if(!groups.has(item.family))groups.set(item.family,[]);groups.get(item.family).push([key,name])}for(const [family,items] of [...groups].sort((a,b)=>openingName(a[0]).localeCompare(openingName(b[0]),'tr'))){const group=document.createElement('optgroup');group.label=openingName(family);for(const [key,name] of items.sort((a,b)=>a[1].localeCompare(b[1],'tr')))group.append(new Option(name,key));opening.append(group)}if([...opening.options].some(o=>o.value===old))opening.value=old;topicChange()}
 search.oninput=renderThemes;os.oninput=renderOpenings;theme.onchange=topicChange;opening.onchange=topicChange;level.addEventListener('change',refresh);count.addEventListener('change',refresh);renderThemes();renderOpenings();theme.dataset.ready='true';
 return{state,refresh,name:()=>state().opening?openingName(state().opening):map.get(theme.value)?.name||'Karışık'};
}
window.BaridaPuzzleTopics={load,mount,openingName};
})();
