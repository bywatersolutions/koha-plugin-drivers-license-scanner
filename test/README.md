# DLScanner tests

Tests for the in-browser JavaScript that the plugin injects via `intranet_js`
(the AAMVA driver's-license parser and the scanner keystroke-capture handler).

## Files

- `aamva-fixtures.js` — AAMVA sample data. **No real PII.** The `VA v10`
  fixtures are modeled on a real Virginia v10 scan from the support ticket but
  with every personal value replaced; the rest are synthetic. Control
  characters are written literally (`\n` = LF, `\x1e` = RS, `\r` = CR).
- `run.js` — headless test. Extracts the live `<script>` from `DLScanner.pm`,
  runs it under light DOM/jQuery shims, then for each fixture (1) parses the raw
  string and (2) replays it as scanner keystrokes (printable keys + Ctrl+J for
  LF, Ctrl+6 for RS, Enter for CR), asserting the control chords are
  `preventDefault`ed and the six patron fields fill correctly.
- `harness.html` — manual harness to exercise the same code in a real browser
  with real jQuery (field population + the paste path).

## Run

```sh
node test/run.js
```

For the browser harness, serve the plugin root and open the page (so it can
`fetch()` the live JS out of `DLScanner.pm`):

```sh
python3 -m http.server
# open http://localhost:8000/test/harness.html
```

## Note on the control-character (Downloads / tab-switch) behavior

A keyboard-wedge scanner emits the AAMVA control characters as control-key
chords: LF = Ctrl+J (opens Downloads), RS = Ctrl+6 (switches tab), CR = Enter.
`run.js` asserts the handler calls `preventDefault()` on every such chord — that
call is the mechanism that stops the browser acting on them.

Synthetic `KeyboardEvent`s are *untrusted*, so a browser will not fire its
native shortcuts for them regardless. Final confirmation that Downloads/tab
switching no longer happens therefore requires a **real scanner** (trusted
events) against a KTD instance with the plugin installed.
