#!/usr/bin/env node
/*
 * Headless test for the DLScanner plugin's in-browser JavaScript.
 *
 * It pulls the live <script> out of DLScanner.pm (so we test exactly what
 * ships, not a copy), runs it in a vm with light DOM/jQuery shims, then:
 *
 *   1) feeds each fixture's raw string straight to parse()  -> parser test
 *   2) replays the fixture as scanner keystrokes (printable keys + Ctrl+J for
 *      LF, Ctrl+6 for RS, Enter for CR) through the document keydown handler,
 *      then asserts the control chords were preventDefault'd AND the six
 *      patron fields were filled.  -> capture + control-character test
 *
 * Run: node test/run.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { FIXTURES } = require('./aamva-fixtures.js');

const PM = path.join(__dirname, '..', 'Koha', 'Plugin', 'Com', 'ByWaterSolutions', 'DLScanner.pm');

// ---- extract the JS between <script> and </script> --------------------------
const pmSrc = fs.readFileSync(PM, 'utf8');
const js = pmSrc.slice(pmSrc.indexOf('<script>') + 8, pmSrc.indexOf('</script>'));

// ---- shims -----------------------------------------------------------------
const GAP_MS = 2;       // inter-keystroke gap (scanner-fast, < BURST_MS)
let fields = {};        // '#address' -> value, set via $('#x').val(v)
const docListeners = [];
const timers = new Map();
let timerSeq = 0;

const dlEl = {
  value: '',
  focus() {},
  addEventListener() {},          // paste etc. - not exercised here
};

const documentShim = {
  getElementById(id) { return id === 'dl-data' ? dlEl : null; },
  addEventListener(type, fn, capture) { docListeners.push({ type, fn, capture }); },
  body: {},
  get activeElement() { return null; },
};

function jq(sel) {
  if (sel === documentShim) {
    return { ready(fn) { fn(); } };   // DOM is "ready" immediately
  }
  return {
    val(v) { if (v === undefined) return fields[sel]; fields[sel] = v; return this; },
    before() { return this; },
    on() { return this; },
    bind() { return this; },
    focus() { return this; },
    each() { return this; },
  };
}

const sandbox = {
  console,
  document: documentShim,
  window: { addEventListener() {} },
  $: jq,
  jQuery: jq,
  setTimeout(fn) { const id = ++timerSeq; timers.set(id, fn); return id; },
  clearTimeout(id) { timers.delete(id); },
};

vm.createContext(sandbox);
vm.runInContext(js, sandbox, { filename: 'DLScanner.intranet_js' });

function flushTimers() {
  const fns = [...timers.values()];
  timers.clear();
  fns.forEach((f) => f());
}

// ---- keystroke replay ------------------------------------------------------
function toKeystrokes(raw) {
  return [...raw].map((ch) => {
    if (ch === '\n') return { key: 'j', ctrlKey: true };   // LF  = Ctrl+J
    if (ch === '\x1e') return { key: '6', ctrlKey: true }; // RS  = Ctrl+6
    if (ch === '\r') return { key: 'Enter' };              // CR  = Enter
    return { key: ch };
  });
}

function simulateScan(raw) {
  fields = {};
  const keydown = docListeners.find((l) => l.type === 'keydown');
  if (!keydown) throw new Error('no document keydown listener registered');
  let t = 1000;
  const events = [];
  for (const ks of toKeystrokes(raw)) {
    t += GAP_MS;
    const ev = {
      key: ks.key,
      ctrlKey: !!ks.ctrlKey,
      altKey: false,
      metaKey: false,
      timeStamp: t,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() {},
    };
    keydown.fn(ev);
    events.push(ev);
  }
  flushTimers();           // fire the idle timer -> endScan -> processScan
  return events;
}

// ---- assertions ------------------------------------------------------------
const MAP = { surname: '#surname', firstname: '#firstname', address: '#address',
              city: '#city', state: '#state', zipcode: '#zipcode' };

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + label + (detail ? '  -> ' + detail : '')); }
}

function parseDirect(raw) {
  const r = sandbox.parse(raw) || {};
  return {
    surname: r.name && r.name.last,
    firstname: r.name && r.name.first,
    address: r.address,
    city: r.city,
    state: r.state,
    zipcode: r.postal_code != null ? String(r.postal_code).slice(0, 5) : undefined,
  };
}

for (const fx of FIXTURES) {
  console.log('\n' + fx.name);

  // 1) parser
  const parsed = parseDirect(fx.raw);
  for (const k of Object.keys(fx.expect)) {
    check(`parse(): ${k}`, parsed[k] === fx.expect[k],
      `got ${JSON.stringify(parsed[k])} want ${JSON.stringify(fx.expect[k])}`);
  }

  // 2) capture + control characters
  const events = simulateScan(fx.raw);

  check('first key "@" not preventDefault\'d (armed only)',
    events[0].key === '@' && events[0].defaultPrevented === false);

  const chords = events.filter((e) =>
    (e.ctrlKey && /^[a-z0-9]$/i.test(e.key)) || e.key === 'Enter');
  check('every control chord (Ctrl+J / Ctrl+6 / Enter) was preventDefault\'d',
    chords.length > 0 && chords.every((e) => e.defaultPrevented),
    `${chords.filter((e) => !e.defaultPrevented).length} of ${chords.length} leaked`);

  const ctrlJ = events.filter((e) => e.ctrlKey && e.key === 'j');
  check('Ctrl+J (Downloads shortcut) prevented',
    ctrlJ.length > 0 && ctrlJ.every((e) => e.defaultPrevented));
  const ctrl6 = events.filter((e) => e.ctrlKey && e.key === '6');
  check('Ctrl+6 (tab switch) prevented',
    ctrl6.length > 0 && ctrl6.every((e) => e.defaultPrevented));

  for (const k of Object.keys(fx.expect)) {
    check(`field ${k} populated via scan`, fields[MAP[k]] === fx.expect[k],
      `got ${JSON.stringify(fields[MAP[k]])} want ${JSON.stringify(fx.expect[k])}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
