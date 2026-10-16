'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {ChessEngine}=require('../engine.js');
const src=fs.readFileSync(require('node:path').join(__dirname,'../board-game.js'),'utf8');
const match=src.match(/const puzzles=(\[.*?\]);\s*\/\/ Puzzle catalogue/s);
assert(match,'Puzzle catalogue not found');
const puzzles=JSON.parse(match[1]);
assert(puzzles.length>=28);
for(let i=0;i<puzzles.length;i++){
 const {fen,answer}=puzzles[i];const g=new ChessEngine(fen);const initial=g.fen();
 assert.equal(g.isCheckmate(),false,`Puzzle ${i+1} already checkmate`);
 const legal=g.moves();assert(legal.length>0,`Puzzle ${i+1} has no legal moves`);
 const move=g.move(answer.slice(0,2),answer.slice(2,4),answer[4]||'q');
 assert(move,`Puzzle ${i+1} has illegal answer ${answer}`);
 assert(g.isCheckmate(),`Puzzle ${i+1} answer not mate`);
 g.undo();assert.equal(g.fen(),initial,`Puzzle ${i+1} undo regression`);
}
console.log(`PASS ${puzzles.length} puzzle positions, legal answers, mate detection and undo`);
