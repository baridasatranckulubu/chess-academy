'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
globalThis.ChessAcademyEngine=require('../engine.js');require('../workshop-core.js');
const {validate}=globalThis.BaridaWorkshopCore;
const fen='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const raw={title:'Açılış',fen,moves:[{from:'e2',to:'e4'},{from:'e7',to:'e5'},{from:'g1',to:'f3'},{from:'b8',to:'c6'}],notes:'Merkeze gelişim'};
const result=validate(raw);assert.equal(result.moves.length,4);assert.equal(result.notes,raw.notes);
for(let ply=0;ply<=4;ply++){const game=new ChessAcademyEngine.ChessEngine(result.fen);for(const move of result.moves.slice(0,ply))assert(game.move(move));assert.equal(game.history.length,ply)}
assert.throws(()=>validate({...raw,moves:[{from:'e2',to:'e5'}]}));
assert.throws(()=>validate({...raw,moves:[{from:'z2',to:'e4'}]}));
assert.throws(()=>validate({...raw,moves:Array(1001).fill(raw.moves[0])}));
for(const file of ['study.js','workshop.js','academy.js'])new vm.Script(fs.readFileSync(file,'utf8'));
console.log('PASS workshop line validation, legal replay at every ply, illegal/oversize rejection');
