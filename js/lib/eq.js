// English Qabalah (Order & Value) alphabet and a Vigenère cipher over it.
// Classic script: exposes globals.

// Every 11th Latin letter starting at A: ALWHSDOZKVGRCNYJUFQBMXITEP
var EQ_ORDER = (function () {
  var latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", s = "";
  for (var i = 0; i < 26; i++) s += latin[(i * 11) % 26];
  return s;
})();

// 0-based position of a letter in the EQ order (-1 if not a letter).
function eqIndex(ch) {
  return EQ_ORDER.indexOf(ch);
}

// 1-based EQ value of a letter.
function eqValue(ch) {
  return eqIndex(ch) + 1;
}

// Uppercase and drop everything that is not A-Z.
function eqClean(str) {
  return String(str).toUpperCase().replace(/[^A-Z]/g, "");
}

// Repeat the key to cover `length` characters. Empty key acts as "A" (identity).
function eqRepeatKey(key, length) {
  key = eqClean(key) || "A";
  var out = "";
  for (var i = 0; i < length; i++) out += key[i % key.length];
  return out;
}

// Vigenère encipher: key row, plaintext column of the EQ tabula recta.
function eqEncipher(plain, key) {
  plain = eqClean(plain);
  var k = eqRepeatKey(key, plain.length), out = "";
  for (var i = 0; i < plain.length; i++) {
    out += EQ_ORDER[(eqIndex(plain[i]) + eqIndex(k[i])) % 26];
  }
  return out;
}

// Inverse of eqEncipher.
function eqDecipher(cipher, key) {
  cipher = eqClean(cipher);
  var k = eqRepeatKey(key, cipher.length), out = "";
  for (var i = 0; i < cipher.length; i++) {
    out += EQ_ORDER[(eqIndex(cipher[i]) - eqIndex(k[i]) + 26) % 26];
  }
  return out;
}

// Remove repeated letters, keeping the first occurrence of each.
function dedupe(str) {
  var seen = {}, out = "";
  for (var i = 0; i < str.length; i++) {
    if (!seen[str[i]]) { seen[str[i]] = true; out += str[i]; }
  }
  return out;
}
