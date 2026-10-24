(function(root){'use strict';
 const Engine=root.ChessAcademyEngine.ChessEngine;
 function validate(input){
  if(!input||typeof input.fen!=='string'||!Array.isArray(input.moves)||input.moves.length>1000)throw Error('Geçersiz çalışma kaydı.');
  const game=new Engine(input.fen),fen=game.fen(),moves=[];
  for(const item of input.moves){if(!item||!/^[a-h][1-8]$/.test(item.from)||!/^[a-h][1-8]$/.test(item.to))throw Error('Geçersiz hamle.');
   const move=game.moves({square:item.from}).find(m=>m.to===item.to&&(m.promotion||'')===(item.promotion||''));
   if(!move||!game.move(move))throw Error('Çalışmada yasal olmayan hamle var.');moves.push(move);
  }
  return {title:String(input.title||'Adsız çalışma').slice(0,100),fen,moves,notes:String(input.notes||'').slice(0,5000)};
 }
 root.BaridaWorkshopCore={validate};
})(typeof window==='undefined'?globalThis:window);
