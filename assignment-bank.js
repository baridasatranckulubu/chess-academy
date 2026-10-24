/* Fetch only the selected topic and enough small puzzle shards. */
(()=>{'use strict';const cache=new Map();let manifestPromise,indexPromise;const json=async url=>{const r=await fetch(url);if(!r.ok)throw Error('Sorular yüklenemedi.');return r.json()};
const manifest=()=>manifestPromise||(manifestPromise=json('puzzle-data/manifest.json').catch(e=>{manifestPromise=null;throw e}));
const index=()=>indexPromise||(indexPromise=manifest().then(m=>json('puzzle-data/'+(m.summary||'topic-index.json'))).catch(e=>{indexPromise=null;throw e}));
function shard(file){if(!cache.has(file)){cache.set(file,json('puzzle-data/'+file).catch(e=>{cache.delete(file);throw e}));if(cache.size>24)cache.delete(cache.keys().next().value)}return cache.get(file)}
async function select({theme,min,max,count,exclude=[],opening=null}){const idx=await index(),entry=opening?idx.openings[opening]:idx.themes[theme];if(!entry)throw Error('Konu bulunamadı.');const detail=entry.file?await json('puzzle-data/'+entry.file):entry;const openingIds=opening&&entry.ids?new Set(entry.ids):null;const blocked=new Set(exclude),found=new Map();let files=detail.shards.map(item=>typeof item==='string'?{file:item,weight:1}:{file:item[0],weight:item[1].reduce((n,[bucket,total])=>n+(bucket*200<=max&&(bucket+1)*200>min?total:0),0)}).filter(x=>x.weight>0);for(const f of files)f.order=-Math.log(Math.max(Number.EPSILON,Math.random()))/f.weight;files.sort((a,b)=>a.order-b.order);
 const add=rows=>{for(const p of rows)if(Array.isArray(p)&&/^[A-Za-z0-9]{5}$/.test(p[0])&&!blocked.has(p[0])&&p[3]>=min&&p[3]<=max&&(opening?(openingIds?openingIds.has(p[0]):p[5]?.includes(opening)):theme==='all'||p[4].includes(theme)))found.set(p[0],p)};
 // One request is normally enough; avoid downloading four unrelated shards for one question.
 for(const {file} of files){add(await shard(file));if(found.size>=count)break}
 const selected=[...found.values()];for(let i=selected.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[selected[i],selected[j]]=[selected[j],selected[i]]}if(selected.length<count)throw Error('Bu seçimde '+selected.length+' yeni soru var. Adedi azalt veya seviyeyi değiştir.');return selected.slice(0,count);
}
async function find(id){const m=await manifest();if(m.idPrefixLength)return(await shard('full/'+id.slice(0,m.idPrefixLength)+'.json')).find(p=>p[0]===id);for(const file of m.shards){const p=(await shard(file)).find(p=>p[0]===id);if(p)return p}return null}
window.BaridaAssignmentBank={select,find,manifest,index};
})();
