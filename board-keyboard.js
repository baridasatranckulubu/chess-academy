/* Chess Academy v0.23 | keyboard navigation for 8x8 interactive boards.
   Uses native buttons rather than an incomplete ARIA grid role. */
(()=>{'use strict';
const board=document.getElementById('board');if(!board)return;
const strings={
 tr:['Klavye: ok tuşlarıyla kareler arasında gezinin, Enter/Boşluk ile seçin, Esc ile seçimi kaldırın.','boş kare','beyaz','siyah','şah','vezir','kale','fil','at','piyon','seçili','yasal hedef'],
 en:['Keyboard: arrow keys move between squares; Enter/Space selects; Escape clears selection.','empty square','white','black','king','queen','rook','bishop','knight','pawn','selected','legal destination'],
 de:['Tastatur: Pfeiltasten bewegen, Enter/Leertaste wählen, Esc hebt die Auswahl auf.','leeres Feld','weiß','schwarz','König','Dame','Turm','Läufer','Springer','Bauer','ausgewählt','legales Zielfeld'],
 it:['Tastiera: frecce per spostarsi, Invio/Spazio per selezionare, Esc per annullare.','casella vuota','bianco','nero','re','regina','torre','alfiere','cavallo','pedone','selezionata','destinazione legale'],
 ru:['Клавиатура: стрелки для перемещения, Enter/Пробел для выбора, Esc для отмены.','пустая клетка','белые','чёрные','король','ферзь','ладья','слон','конь','пешка','выбрано','допустимый ход'],
 az:['Klaviatura: ox düymələri ilə hərəkət, Enter/Boşluq ilə seçim, Esc ilə ləğv.','boş xana','ağ','qara','şah','vəzir','qala','fil','at','piyada','seçilib','qanuni gediş']
};
const pieceIndex={k:4,q:5,r:6,b:7,n:8,p:9};
const lang=()=>strings[document.documentElement.lang]||strings.tr;
const cells=()=>[...board.querySelectorAll('button.sq')];
const coord=el=>el.dataset.square||el.getAttribute('aria-label')?.match(/^[a-h][1-8]/)?.[0]||'';
const original=new WeakMap();
let active=0,restore=false,ready=false;
const help=document.createElement('p');help.className='chess-keyboard-help';help.id='chess-keyboard-help';
const frame=board.closest('.chess-board-frame,.tactic-board-frame');(frame||board).insertAdjacentElement('afterend',help);
board.setAttribute('aria-describedby','chess-keyboard-help');
function sync(){
 const list=cells();if(!list.length)return;
 active=Math.min(Math.max(active,0),list.length-1);
 const words=lang();help.textContent=words[0];
 list.forEach((el,i)=>{
  el.tabIndex=i===active?0:-1;
  if(!original.has(el))original.set(el,el.getAttribute('aria-label')||'');
  const raw=original.get(el),square=coord(el),piece=raw.match(/^[a-h][1-8]\s+([KQRBNPkqrbnp])(?:\s|$)/)?.[1];
  const detail=piece?words[piece===piece.toUpperCase()?2:3]+' '+words[pieceIndex[piece.toLowerCase()]]:words[1];
  const suffix=el.classList.contains('selected')?words[10]:el.classList.contains('target')?words[11]:'';
  el.setAttribute('aria-label',[square,detail,suffix].filter(Boolean).join(', '));
 });
 if(restore){restore=false;list[active]?.focus({preventScroll:true})}
 ready=true;
}
board.addEventListener('focusin',event=>{const el=event.target.closest('button.sq');if(el){const i=cells().indexOf(el);if(i>=0){active=i;cells().forEach((x,n)=>x.tabIndex=n===i?0:-1)}}});
board.addEventListener('click',event=>{const el=event.target.closest('button.sq');if(el){const i=cells().indexOf(el);if(i>=0){active=i;restore=document.activeElement===el}}},true);
board.addEventListener('keydown',event=>{
 const target=event.target.closest('button.sq');if(!target)return;
 const list=cells(),i=list.indexOf(target);if(i<0)return;
 const col=i%8,row=Math.floor(i/8);let next=i;
 switch(event.key){
  case 'ArrowRight':next=row*8+Math.min(7,col+1);break;
  case 'ArrowLeft':next=row*8+Math.max(0,col-1);break;
  case 'ArrowDown':next=Math.min(7,row+1)*8+col;break;
  case 'ArrowUp':next=Math.max(0,row-1)*8+col;break;
  case 'Home':next=event.ctrlKey?0:row*8;break;
  case 'End':next=event.ctrlKey?63:row*8+7;break;
  case 'Escape':{
   const selected=board.querySelector('button.sq.selected');
   if(selected){event.preventDefault();restore=true;selected.click()}return;
  }
  default:return;
 }
 event.preventDefault();active=next;list.forEach((el,n)=>el.tabIndex=n===next?0:-1);list[next].focus({preventScroll:true});
});
new MutationObserver(()=>sync()).observe(board,{childList:true});
sync();
window.ChessAcademyKeyboard={refresh:sync};
})();
