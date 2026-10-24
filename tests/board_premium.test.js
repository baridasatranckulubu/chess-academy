'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const board=read('board-game.js');
for(const file of ['board.html']){
 const html=read(file);
 assert(html.includes('chess-premium-board-v23'),file+' missing premium board style');
 assert(html.includes('chess-board-coordinate-fix-v24'),file+' missing coordinate layout fix');
 assert(/src="board-game\.js(?:\?[^\"]*)?"/.test(html),file+' missing shared board code');
 assert(html.includes('id="flipBoard"'),file+' missing flip button');
 assert(html.includes('id="board"'),file+' missing chessboard');
}
assert(board.includes("grid-template-columns")===false,'Board coordinates should use CSS, not inline layout');
assert(board.includes("letters='abcdefgh'.split('')"),'Missing file labels');
assert(board.includes("const nums=flipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1]"),'Missing rank orientation');
assert(board.includes("controls.append(toggle)"),'Sound toggle not in control bar');
assert(board.includes("AcademyStorage.setItem('chess-academy-sound'"),'Sound preference not persisted');
assert(board.includes("wasCapture?'capture':'move'"),'Capture sound detection missing');
assert(board.includes("sound(game.isCheckmate()?'mate'"),'Mate sound missing');
console.log('PASS: board styles, shared scripts, coordinates, flip, sound toggle and event wiring');
