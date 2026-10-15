// Read a sigil back from a file saved by the cipher page.
// Classic script: exposes parseSigilFile(text, filename) -> { letters, meta }.
// Throws an Error with a readable message if the file is not a sigil.

function parseSigilFile(text, filename) {
  var name = String(filename || "").toLowerCase();
  var meta = null;

  if (name.endsWith(".json") || /^\s*\{/.test(text)) {
    meta = JSON.parse(text);
  } else if (name.endsWith(".svg") || /<svg[\s>]/i.test(text)) {
    var doc = new DOMParser().parseFromString(text, "image/svg+xml");
    var desc = doc.querySelector("desc");
    if (desc && /^\s*\{/.test(desc.textContent)) {
      meta = JSON.parse(desc.textContent);
    } else {
      var title = doc.querySelector("title");
      var m = title && /Sigil\s+([A-Z]+)/i.exec(title.textContent);
      if (m) meta = { letters: m[1] };
    }
  }

  if (!meta || typeof meta.letters !== "string") {
    throw new Error("Not a sigil file. Expected JSON or SVG saved from the Sigil Cipher page.");
  }
  var letters = eqClean(meta.letters);
  if (letters.length === 0) throw new Error("Sigil file has no letters.");
  return { letters: letters, meta: meta };
}
