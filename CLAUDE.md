# technomancy

Proof-of-concept technomancy tools as static web pages. See README.md for layout.

## Stack rules

- HTML5 + CSS3 + plain JavaScript only. No TypeScript, no frameworks, no
  bundlers, no npm, no server. Everything must work by opening the HTML file
  directly from disk.
- Classic `<script>` tags only, never `type="module"` (blocked on `file://`).
  Shared code in `js/lib/` exposes globals; tool entry points live in an IIFE.
- Use Canvas 2D / WebGL / Web Audio APIs directly. Don't use AudioWorklet or
  anything else that fetches a module URL.
- Keep it simple. These are toys and proofs of concept.

## Adding a tool

1. `tools/<name>/index.html` linking `../../styles/base.css`, then the needed
   `../../js/lib/*.js` scripts, then `../../js/<name>/main.js`.
2. Add a card to `index.html`.
