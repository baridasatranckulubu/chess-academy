'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const read = path => fs.readFileSync(path, 'utf8');

const shared = read('premium-board.js');
const css = read('premium-board.css');
const classroom = read('classroom.js');
const tactics = read('puzzles.js');
const standalone = read('board-game.js');
const boardPage = read('board.html');
const homePage = read('index.html');

for (const [name, source] of Object.entries({
  'premium-board.js': shared,
  'classroom.js': classroom,
  'puzzles.js': tactics,
  'board-game.js': standalone
})) {
  assert.doesNotThrow(() => new vm.Script(source, { filename: name }), name + ' must parse');
}

assert.match(shared, /function\s+pieceSVG\s*\(/, 'shared SVG renderer must exist');
for (const [name, source] of [['classroom.js', classroom], ['puzzles.js', tactics], ['board-game.js', standalone]]) {
  assert.match(source, /ChessAcademySharedBoard/, name + ' must reference the shared renderer');
}
assert.match(css, /rotate\(360deg\)/, 'shared board stylesheet must support full rotation');
assert.match(classroom, /getBoundingClientRect\(\)/, 'analysis arrows must use measured coordinates');
assert(classroom.includes("stroke:'#ffffff'"), 'analysis arrow must retain white contrast');

for (const [name, html] of [['board.html', boardPage], ['index.html', homePage]]) {
  assert.match(html, /id=["']ca-standalone-spin-style["']/, name + ' must include spin styles');
  assert.match(html, /@keyframes\s+ca-standalone-spin/, name + ' must define the animation');
  assert.match(html, /\.board\.ca-standalone-spin/, name + ' must target the board');
  assert.match(html, /prefers-reduced-motion\s*:\s*reduce/, name + ' must respect reduced motion');
}

// The standalone flip currently uses Web Animations API, not the CSS class.
// Guard the actual flip handler rather than requiring a nonexistent JS class string.
assert.match(standalone, /\$\('flipBoard'\)\.onclick\s*=\s*async/, 'flip control must have a handler');
assert.match(standalone, /frame\.animate\(/, 'flip handler must animate the board frame');
assert.match(standalone, /prefers-reduced-motion:\s*reduce/, 'flip handler must respect reduced motion');
assert.match(standalone, /flipped\s*=\s*!flipped/, 'flip handler must change board orientation');
console.log('PASS shared board integration, board flip contracts, accessibility and JS syntax');
