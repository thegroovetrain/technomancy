// Sigil Cipher entry point. Depends on dom.js, eq.js, wheel.js.
(function () {
  var intentInput = $("#intent");
  var keyInput = $("#key");
  var canvas = $("#wheel");

  // 1. alphabet strip
  var alpha = $("#alphabet");
  for (var a = 0; a < 26; a++) {
    alpha.append(el("div", {}, el("b", {}, EQ_ORDER[a]), el("small", {}, String(a + 1))));
  }

  // 2. tabula recta
  var recta = $("#recta");
  var head = el("tr", {}, el("th", {}));
  for (var c = 0; c < 26; c++) head.append(el("th", {}, EQ_ORDER[c]));
  recta.append(el("thead", {}, head));
  var body = el("tbody");
  for (var r = 0; r < 26; r++) {
    var tr = el("tr", { "data-r": String(r) }, el("th", {}, EQ_ORDER[r]));
    for (var c2 = 0; c2 < 26; c2++) {
      tr.append(el("td", { "data-c": String(c2) }, EQ_ORDER[(r + c2) % 26]));
    }
    body.append(tr);
  }
  recta.append(body);

  function highlight(plain, keyRep) {
    recta.querySelectorAll(".hit").forEach(function (n) { n.classList.remove("hit"); });
    recta.querySelectorAll(".keyrow").forEach(function (n) { n.classList.remove("keyrow"); });
    for (var i = 0; i < plain.length; i++) {
      var row = recta.querySelector("tr[data-r='" + eqIndex(keyRep[i]) + "']");
      row.classList.add("keyrow");
      row.querySelector("td[data-c='" + eqIndex(plain[i]) + "']").classList.add("hit");
    }
  }

  // 3. cipher steps
  function render() {
    var plain = eqClean(intentInput.value);
    var keyRep = eqRepeatKey(keyInput.value, plain.length);
    var ct = eqEncipher(plain, keyInput.value);
    var sig = dedupe(ct);

    $("#pt").textContent = plain;
    $("#kt").textContent = keyRep;
    var ctEl = $("#ct");
    ctEl.textContent = "";
    var seen = {};
    for (var i = 0; i < ct.length; i++) {
      var span = el("span", seen[ct[i]] ? { class: "dup" } : {}, ct[i]);
      seen[ct[i]] = true;
      ctEl.append(span);
    }
    $("#sig").textContent = sig;
    $("#download-png").disabled = $("#download-svg").disabled = $("#download-json").disabled = sig.length === 0;

    var cast = $("#cast");
    cast.href = "../trance/index.html#" + sig;
    cast.classList.toggle("disabled", sig.length === 0);

    highlight(plain, keyRep);
    drawWitchesWheel(canvas, sig);
  }

  // 4. export
  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var link = el("a", { href: url, download: name });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function sigilMeta() {
    return {
      format: "technomancy-sigil",
      version: 1,
      letters: $("#sig").textContent,
      cipher: eqEncipher(intentInput.value, keyInput.value),
      key: eqClean(keyInput.value),
      alphabet: EQ_ORDER,
      created: new Date().toISOString()
    };
  }

  function baseName() {
    return "sigil-" + ($("#sig").textContent || "empty").toLowerCase();
  }

  $("#download-png").addEventListener("click", function () {
    canvas.toBlob(function (blob) { saveBlob(blob, baseName() + ".png"); }, "image/png");
  });

  $("#download-svg").addEventListener("click", function () {
    var svg = witchesWheelSVG($("#sig").textContent, {}, sigilMeta());
    saveBlob(new Blob([svg], { type: "image/svg+xml" }), baseName() + ".svg");
  });

  $("#download-json").addEventListener("click", function () {
    var json = JSON.stringify(sigilMeta(), null, 2);
    saveBlob(new Blob([json], { type: "application/json" }), baseName() + ".json");
  });

  intentInput.addEventListener("input", render);
  keyInput.addEventListener("input", render);
  $("#form").addEventListener("submit", function (e) { e.preventDefault(); });
  render();
})();
