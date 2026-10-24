/* Official Lichess CC0 export already synchronized into the site's puzzle bank. */
(()=>{'use strict';const cache=new Map();let manifest;
async function select({theme,min,max,count,exclude=[]}){if(!manifest){const r=await fetch('puzzle-data/manifest.json');if(!r.ok)throw Error('Sorular yüklenemedi.');manifest=await r.json()}
 const blocked=new Set(exclude),found=new Map();const files=manifest.shards.filter(s=>s.startsWith('lichess-auto-')).sort(()=>Math.random()-.5);
 const add=rows=>{for(const p of rows)if(Array.isArray(p)&&/^[A-Za-z0-9]{5}$/.test(p[0])&&!blocked.has(p[0])&&p[3]>=min&&p[3]<=max&&(theme==='all'||p[4].includes(theme)))found.set(p[0],p)};
 for(let i=0;i<files.length&&found.size<count;i+=4){const rows=await Promise.all(files.slice(i,i+4).map(async file=>{if(!cache.has(file)){cache.set(file,fetch('puzzle-data/'+file).then(async r=>{if(!r.ok)throw Error('Sorular yüklenemedi.');return r.json()}).catch(e=>{cache.delete(file);throw e}))}return cache.get(file)}));rows.forEach(add)}
 const selected=[...found.values()].sort(()=>Math.random()-.5).slice(0,count);if(selected.length<count)throw Error('Bu seçimde '+selected.length+' yeni soru var. Adedi azalt veya seviyeyi değiştir.');return selected;
}
window.BaridaAssignmentBank={select};
})();
