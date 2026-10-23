'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');
const academy=read('academy.js'),css=read('academy.css'),shared=read('shared-chess-board.js'),studio=read('custom-homework-board.js');
for(const [name,source] of [['academy.js',academy],['shared-chess-board.js',shared],['custom-homework-board.js',studio]])assert.doesNotThrow(()=>new vm.Script(source,{filename:name}));
assert(academy.includes("section==='admin-students'"),'admin student route missing');
assert(academy.includes("academy_admin_student_action"),'admin student RPC missing');
assert(academy.includes("academy_teacher_save_student_details"),'teacher scoped unified student editor RPC missing');
assert(academy.includes("studentAccountActive"),'passive account access guard missing');
assert(academy.includes("accountStatuses.get(st.id)"),'payment and account statuses must be distinguished');
assert(studio.includes("shared.renderBoard("),'studio must render canonical pieces');
assert(studio.includes("bindDrag($('board')"),'studio must support piece dragging');
assert(studio.includes("choosePromotion("),'studio must offer 4-way promotion');
// Execute the current renderer instead of matching the retired SVG palette.
const context={window:{},document:{getElementById:()=>true}};
vm.runInNewContext(shared,context);
const renderer=context.window.ChessAcademySharedBoard.pieceSVG;
for(const [code,name] of Object.entries({k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'})){
 for(const [piece,color] of [[code,'black'],[code.toUpperCase(),'white']]){
  const html=renderer('',piece);
  assert.match(html,/^<img /,'approved pieces must render as images');
  assert(html.includes('barida-approved-piece '+color),'piece side must be preserved');
  const src=html.match(/src="([^"?]+)/)?.[1];
  assert.equal(src,`assets/barida-pieces/${color}-${name}.png`);
  assert(fs.existsSync(require('node:path').join(__dirname,'..',src)),`${src} missing`);
 }
}
assert.equal(renderer('','invalid'),'','invalid pieces must not render');
assert(css.includes('.barida-admin-student-schedule'),'admin schedule must have editable layout');
console.log('PASS BARIDA admin student management and canonical homework board contracts');
