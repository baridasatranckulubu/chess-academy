const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'password-recovery.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const code = scripts.map(([, attributes, inline]) => {
  const source = attributes.match(/\bsrc="([^"?]+)/)?.[1];
  if (!source) return inline;
  if (source.startsWith('https://')) return '';
  return fs.readFileSync(path.join(root, source), 'utf8');
}).join('\n');

const hash = '#type=recovery&access_token=test-access-token&refresh_token=test-refresh-token';
const user = { id: 'test-user-id' };
const session = { access_token: 'test-verified-access-token', user };
const tick = () => new Promise(resolve => setImmediate(resolve));

function deferred() {
  let resolve;
  const promise = new Promise(complete => { resolve = complete; });
  return { promise, resolve };
}

function runEntryRedirect(file, url) {
  const entry = fs.readFileSync(path.join(root, file), 'utf8');
  const script = entry.match(/<head><script>([\s\S]*?)<\/script>/)[1];
  const location = new URL(url);
  const changes = [];
  location.replace = destination => changes.push({ action: 'navigate', destination });
  const history = {
    replaceState: (_state, _title, destination) => {
      changes.push({ action: 'cleanAddress', destination });
      location.href = new URL(destination, location.href).href;
    },
  };
  vm.runInNewContext(script, { location, history, URL, URLSearchParams });
  return changes;
}

function openRecovery(fragment = hash) {
  const status = { textContent: '' };
  const button = { disabled: false };
  const password = { value: '' };
  const confirm = { value: '' };
  const form = {
    hidden: true,
    querySelector: selector => {
      assert.equal(selector, 'button');
      return button;
    },
    reset: () => { password.value = ''; confirm.value = ''; },
    addEventListener: (event, listener) => {
      assert.equal(event, 'submit');
      form.onsubmit = listener;
    },
  };
  const fields = { status, reset: form, pw: password, confirm };
  const location = new URL(`https://baridasatranc.com/password-recovery${fragment}`);
  const calls = [];
  const sessionResult = deferred();
  const verificationResult = deferred();
  let saveResponse;
  const auth = {
    setSession: tokens => {
      calls.push({ action: 'setSession', tokens });
      return sessionResult.promise;
    },
    getUser: () => {
      calls.push({ action: 'getUser' });
      return verificationResult.promise;
    },
    signOut: async () => ({ error: null }),
  };
  const supabase = {
    createClient: (_url, _key, options) => {
      calls.push({ action: 'createClient', options });
      return { auth };
    },
  };
  const history = {
    replaceState: (_state, _title, url) => {
      calls.push({ action: 'cleanAddress' });
      location.href = new URL(url, location.href).href;
    },
  };
  vm.runInNewContext(code, {
    document: { getElementById: id => fields[id] },
    fetch: async (url, options) => {
      calls.push({ action: 'save', url: String(url), options });
      return saveResponse;
    },
    history,
    location,
    supabase,
    URL,
    URLSearchParams,
    window: { history, supabase, location },
  });
  return {
    button, calls, form, location, password, confirm, sessionResult, status, verificationResult,
    setSaveResponse: response => { saveResponse = response; },
    submit: () => form.onsubmit({ preventDefault() {} }),
  };
}

async function verifyRecovery(page) {
  assert.equal(page.form.hidden, true, 'The password form is hidden during setSession');
  assert.equal(page.location.hash, '', 'Recovery tokens are removed before session verification completes');
  const setup = page.calls.find(call => call.action === 'createClient');
  assert.equal(setup.options.auth.persistSession, false);
  assert.equal(setup.options.auth.detectSessionInUrl, false);
  assert.equal(setup.options.auth.autoRefreshToken, false);
  const initialize = page.calls.find(call => call.action === 'setSession');
  assert.equal(initialize.tokens.access_token, 'test-access-token');
  assert.equal(initialize.tokens.refresh_token, 'test-refresh-token');
  assert(page.calls.findIndex(call => call.action === 'cleanAddress') < page.calls.indexOf(initialize));
  assert.equal(page.calls.some(call => call.action === 'getUser'), false);

  page.sessionResult.resolve({ data: { session }, error: null });
  await tick();
  assert.equal(page.calls.some(call => call.action === 'getUser'), true);
  assert.equal(page.form.hidden, true, 'The password form stays hidden until the user is verified');

  page.verificationResult.resolve({ data: { user }, error: null });
  await tick();
  assert.equal(page.form.hidden, false);
}

(async () => {
  assert.match(html, /href="academy\.html\?giris=antrenor"/);

  for (const [file, entry] of [['index.html', '/'], ['academy.html', '/academy']]) {
    const url = `https://baridasatranc.com${entry}`;
    assert.deepEqual(runEntryRedirect(file, url+'#contact'), []);
    for (const fragment of [hash, '#error_code=otp_expired']) {
      const changes = runEntryRedirect(file, url+fragment);
      assert.equal(changes.length, 2);
      assert.equal(changes[0].action, 'cleanAddress');
      assert(!changes[0].destination.includes(fragment));
      assert.deepEqual(changes[1], {
        action: 'navigate', destination: `https://baridasatranc.com/password-recovery.html${fragment}`,
      });
    }
  }

  for (const fragment of ['', '#error_code=otp_expired', '#type=signup&access_token=a&refresh_token=b', '#type=recovery&access_token=a']) {
    const page = openRecovery(fragment);
    await tick();
    assert.equal(page.form.hidden, true);
    assert.match(page.status.textContent, /geçersiz|süresi/i);
    assert.equal(page.calls.some(call => call.action === 'setSession'), false);
  }

  const expired = openRecovery();
  expired.sessionResult.resolve({ data: { session: null }, error: new Error('Expired session') });
  await tick();
  assert.equal(expired.form.hidden, true);
  assert.match(expired.status.textContent, /geçersiz|süresi/i);
  assert.equal(expired.calls.some(call => call.action === 'getUser'), false);

  const unverified = openRecovery();
  unverified.sessionResult.resolve({ data: { session }, error: null });
  unverified.verificationResult.resolve({ data: { user: null }, error: new Error('Session rejected') });
  await tick();
  assert.equal(unverified.form.hidden, true);
  assert.match(unverified.status.textContent, /geçersiz|süresi/i);

  const page = openRecovery();
  await verifyRecovery(page);
  page.password.value = 'new-test-password';
  page.confirm.value = 'different-test-password';
  await page.submit();
  assert.equal(page.calls.some(call => call.action === 'save'), false);

  page.confirm.value = page.password.value;
  page.setSaveResponse({ ok: false, json: async () => ({ error: 'Şifre hizmeti geçici olarak kullanılamıyor.' }) });
  await page.submit();
  const failure = page.calls.find(call => call.action === 'save');
  assert.equal(new URL(failure.url).pathname, '/functions/v1/academy-account-password');
  assert.equal(failure.options.method, 'POST');
  const headers = new Headers(failure.options.headers);
  assert.equal(headers.get('authorization'), 'Bearer test-verified-access-token');
  assert.equal(headers.get('content-type'), 'application/json');
  assert(headers.get('apikey'));
  assert.deepEqual(JSON.parse(failure.options.body), { password: 'new-test-password' });
  assert.equal(page.form.hidden, false);
  assert.equal(page.button.disabled, false);
  assert.match(page.status.textContent, /şifre|tekrar/i);

  page.setSaveResponse({ ok: true, json: async () => ({ ok: true }) });
  await page.submit();
  assert.equal(page.form.hidden, true);
  assert.equal(page.password.value, '');
  assert.equal(page.confirm.value, '');
  assert.match(page.status.textContent, /güncellendi|kaydedildi/i);
  console.log('PASS recovery routing, expired recovery, verified session, authenticated password update and retry');
})().catch(error => { console.error(error); process.exitCode = 1; });
