
const {ChessEngine}=require(process.argv[2]);
function fenFrom(map,turn){let rows=[];for(let r=8;r>=1;r--){let str='',empty=0;for(let c of 'abcdefgh'){let p=map[c+r];if(p){if(empty)str+=empty;empty=0;str+=p}else empty++}if(empty)str+=empty;rows.push(str)}return rows.join('/')+' '+turn+' - - 0 1'}
const sq=[];for(const c of 'abcdefgh')for(let r=1;r<=8;r++)sq.push(c+r);
const puzzles=[],seen=new Set();
for(const wk of sq)for(const bk of ['a8','b8','h8','g8','a1','h1','g1','b1'])for(const q of sq){
 if(new Set([wk,bk,q]).size!==3)continue;
 let fen=fenFrom({[wk]:'K',[bk]:'k',[q]:'Q'},'w');
 try{
 let g=new ChessEngine(fen);
 if(g.isCheck('b')||g.isCheck('w'))continue;
 const mates=[];
 for(const m of g.moves()){g.move(m.from,m.to,m.promotion||'q');if(g.isCheckmate())mates.push(m.from+m.to+(m.promotion||''));g.undo();}
 if(mates.length!==1)continue;
 const key=wk+bk+q;
 if(seen.has(key))continue;seen.add(key);
 puzzles.push({fen,answer:mates[0],theme:'Queen mate'});
 }catch{}
 if(puzzles.length>=24)break;
 if(puzzles.length>=24)break;
 if(puzzles.length>=24)break;
}
console.log(JSON.stringify(puzzles.slice(0,24)));
