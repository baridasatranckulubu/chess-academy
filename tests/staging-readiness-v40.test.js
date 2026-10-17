const assert = require('node:assert/strict');
assert.equal(process.env.NODE_ENV === 'production', false, 'Run only outside production');
console.log('Staging preflight only; no live authorization claims.');
