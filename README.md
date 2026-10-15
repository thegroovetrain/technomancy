# technomancy

A collection of technomancy tools. Each tool is a proof-of-concept web page built
with plain HTML5, CSS3 and JavaScript. No frameworks, no build step, no server.

## Tools

- **Sigil Cipher** (`tools/sigil/`) — cryptographic sigilization via a Vigenère
  cipher over the English Qabalah (Order & Value).
- **Trance Induction** (`tools/trance/`) — hypnotic spirals and pink noise for
  trance induction and sigil casting.

## Running

Open `index.html` in a browser. That's it.

## Layout

```
index.html          landing page linking to each tool
styles/base.css     shared styles
tools/<name>/       one folder per tool: index.html (+ tool-specific css)
js/<name>/main.js   entry script for that tool
js/lib/             shared scripts (cipher, audio, canvas helpers, ...)
```

## Conventions

- Scripts are classic `<script>` tags, not ES modules, so pages work from
  `file://`. Shared files in `js/lib/` are loaded first and expose plain globals;
  each tool's `main.js` wraps itself in an IIFE.
- Canvas / WebGL / Web Audio are used directly, no wrapper libraries. Avoid
  anything that needs a module URL (e.g. AudioWorklet), since that fails on
  `file://`.
