/* Chess Academy v0.23 | Original, self-contained vector chess set. */
(()=>{'use strict';
const shapes={
 p:'<circle cx="50" cy="26" r="12"/><path d="M41 40 Q50 36 59 40 L66 68 H34 Z"/><path d="M31 68 H69 L75 78 H25 Z"/>',
 r:'<path d="M26 19 H37 V29 H45 V19 H55 V29 H63 V19 H74 V38 H68 L64 69 H36 L32 38 H26 Z"/><path d="M29 68 H71 L76 79 H24 Z"/><path class="cut" d="M34 39 H66"/>',
 n:'<path d="M29 76 L33 62 L24 50 L31 39 L30 27 L42 18 L59 19 L70 30 L73 41 L63 48 L54 42 L48 50 L57 66 L66 76 Z"/><path class="cut" d="M32 52 L47 47 M36 36 L49 34"/><circle class="eye" cx="55" cy="30" r="3.5"/>',
 b:'<path d="M50 14 C39 22 31 33 35 45 Q38 54 43 59 L39 68 H61 L57 59 Q62 54 65 45 C69 33 61 22 50 14 Z"/><path class="cut" d="M50 23 V51"/><path d="M31 68 H69 L74 79 H26 Z"/>',
 q:'<circle cx="19" cy="25" r="6"/><circle cx="35" cy="19" r="6"/><circle cx="50" cy="14" r="6"/><circle cx="65" cy="19" r="6"/><circle cx="81" cy="25" r="6"/><path d="M19 31 L31 65 H69 L81 31 L64 43 L50 25 L36 43 Z"/><path d="M28 66 H72 L77 79 H23 Z"/>',
 k:'<path d="M46 11 H54 V22 H64 V30 H54 V42 H46 V30 H36 V22 H46 Z"/><path d="M35 44 Q50 35 65 44 L69 68 H31 Z"/><path d="M28 68 H72 L78 79 H22 Z"/><path class="cut" d="M38 52 H62"/>'
};
let counter=0;
function render(piece){if(!/^[KQRBNPkqrbnp]$/.test(piece))return '';
 const white=piece===piece.toUpperCase(),id='piece-v23-'+(++counter);
 const stops=white?['#fffdf3','#f0e3c9','#c5ae8d','#fff5df','#ad9676']:['#88919b','#3a4652','#101923','#57616a','#080e15'];
 const stroke=white?'#786149':'#d3b783';
 return `<svg class="piece-asset ${white?'white':'black'}" viewBox="0 0 100 100" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${stops[0]}"/><stop offset=".26" stop-color="${stops[1]}"/><stop offset=".54" stop-color="${stops[2]}"/><stop offset=".79" stop-color="${stops[3]}"/><stop offset="1" stop-color="${stops[4]}"/></linearGradient></defs>
 <ellipse cx="51" cy="84" rx="32" ry="6" fill="#0d1014" opacity=".29"/>
 <g fill="url(#${id})" stroke="${stroke}" stroke-width="2.7" stroke-linejoin="round">${shapes[piece.toLowerCase()]}</g>
 <path d="M27 80 Q50 86 73 80" fill="none" stroke="${white?'#fff6e4':'#9aa6b0'}" stroke-width="1.7" opacity=".6"/>
 </svg>`;
}
window.ChessAcademyPieces={render};
})();
