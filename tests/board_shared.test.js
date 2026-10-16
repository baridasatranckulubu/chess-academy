'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const shared=read('premium-board.js'),css=read('premium-board.css');
for(const page of ['classroom.html','puzzles.html']){
 const html=read(page);
 assert(html.includes('href="premium-board.css"'),page+' CSS missing');
 assert(html.includes('src="premium-board.js"'),page+' JS missing');
 const app=page==='classroom.html'?'classroom.js':'puzzles.js';
 assert(html.indexOf('src="premium-board.js"')<html.indexOf('src="'+app+'"'),'shared board must load before '+app);
 const code=read(app);
 assert(code.includes('ChessPremiumBoard?.init'),app+' premium init missing');
 assert(code.includes('premium?.coordinates(flipped)'),app+' coordinates missing');
 assert(code.includes('premium.flipButton.onclick'),app+' flip missing');
 assert(code.includes('premium?.play('),app+' sound missing');
}
assert(shared.includes("letters=flipped?'hgfedcba':'abcdefgh'"));
assert(shared.includes("numbers=flipped?'12345678':'87654321'"));
assert(shared.includes("sound.textContent=enabled?'🔊 Ses açık':'🔇 Ses kapalı'"));
assert(shared.includes('ca-spin')&&shared.includes("tone('flip')"));assert(shared.includes('ca-volume-panel'));assert(shared.includes('chess-academy-volume'));assert(read('classroom.js').includes('AbortController'));
assert(css.includes('grid-template-columns:repeat(8,minmax(0,1fr))'));
const academy=read('academy.js');
assert(academy.includes("practiceFrame.src='board.html'"),'assignments board missing');
assert(academy.includes("embedded('classroom.html'"),'classroom link missing');
assert(academy.includes("embedded('puzzles.html?maxLevel='"),'tactics link missing');
console.log('PASS: tactics, classroom, assignments and standalone boards have premium features');
