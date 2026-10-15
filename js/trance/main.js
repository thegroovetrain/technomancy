// Trance Induction entry point. Depends on dom.js, eq.js, wheel.js,
// sigilfile.js, pinknoise.js, spiral.js.
(function () {
  var stage = $("#stage");
  var spiralCanvas = $("#spiral");
  var sigilCanvas = $("#sigil");
  var panel = $("#panel");
  var status = $("#status");
  var lettersInput = $("#letters");

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    letters: "",
    phase: 0,
    hue: 0,
    speed: 1,
    period: 60,
    arms: 2,
    tight: 8,
    inward: true,
    size: 0.1,
    thick: 0.037,
    color: "#ffffff",
    followHue: false,
    paused: reducedMotion
  };

  var spiral;
  try {
    spiral = createSpiral(spiralCanvas);
  } catch (err) {
    spiral = canvasSpiral(spiralCanvas);
    console.warn("WebGL unavailable, using 2D fallback:", err.message);
  }

  // --- colors ---------------------------------------------------------
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    function f(n) {
      var k = (n + h * 12) % 12;
      var a = s * Math.min(l, 1 - l);
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    }
    return [f(0), f(8), f(4)];
  }

  // --- sigil ----------------------------------------------------------
  function drawSigil() {
    var dpr = window.devicePixelRatio || 1;
    var w = stage.clientWidth, h = stage.clientHeight;
    sigilCanvas.width = Math.floor(w * dpr);
    sigilCanvas.height = Math.floor(h * dpr);
    var ctx = sigilCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!state.letters) return;
    var radius = Math.min(w, h) * state.size;
    var lw = radius * state.thick;
    var color = state.followHue ? hslCss(state.hue + 90, 0.9, 0.6) : state.color;
    var markers = { startRadius: radius * 0.03 + lw * 0.8, arrowLength: radius * 0.05 + lw * 1.5 };
    // dark halo first (same geometry, thicker stroke), then the colored line on top
    drawSigilPath(ctx, state.letters, w / 2, h / 2, radius, {
      stroke: "rgba(0,0,0,0.7)", lineWidth: lw * 1.8, shadowColor: "rgba(0,0,0,0.8)", shadowBlur: lw * 2.5,
      startRadius: markers.startRadius, arrowLength: markers.arrowLength
    });
    drawSigilPath(ctx, state.letters, w / 2, h / 2, radius, {
      stroke: color, lineWidth: lw, shadowColor: color, shadowBlur: lw * 1.3,
      startRadius: markers.startRadius, arrowLength: markers.arrowLength
    });
  }

  function hslCss(h, s, l) {
    return "hsl(" + (((h % 360) + 360) % 360).toFixed(1) + ", " + (s * 100) + "%, " + (l * 100) + "%)";
  }

  function setLetters(raw, source) {
    state.letters = eqClean(raw);
    if (lettersInput.value !== state.letters && document.activeElement !== lettersInput) {
      lettersInput.value = state.letters;
    }
    status.textContent = state.letters ? state.letters + (source ? "  ·  " + source : "") : "no sigil loaded";
    drawSigil();
  }

  // --- resize ---------------------------------------------------------
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    spiral.resize(Math.floor(stage.clientWidth * dpr), Math.floor(stage.clientHeight * dpr));
    drawSigil();
    if (state.paused) renderFrame();
  }
  window.addEventListener("resize", resize);

  // --- animation loop -------------------------------------------------
  var last = performance.now();

  function renderFrame() {
    var a = hslToRgb(state.hue, 0.9, 0.55);
    var b = hslToRgb(state.hue + 180, 0.9, 0.55);
    spiral.render({ phase: state.phase, arms: state.arms, tight: state.tight, colorA: a, colorB: b });
  }

  function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!state.paused) {
      var dir = state.inward ? 1 : -1;
      state.phase += dt * state.speed * 2.5 * dir;
      state.hue = (state.hue + (dt / state.period) * 360) % 360;
      renderFrame();
      if (state.followHue) drawSigil();
    }
    requestAnimationFrame(tick);
  }

  // --- controls -------------------------------------------------------
  function bindRange(id, key, fmt) {
    var input = $(id);
    var out = fmt ? $(id + "-val") : null;
    function apply() {
      state[key] = parseFloat(input.value);
      if (out) out.textContent = fmt(state[key]);
    }
    input.addEventListener("input", apply);
    apply();
  }
  bindRange("#speed", "speed");
  bindRange("#period", "period", function (v) { return v + " s"; });
  bindRange("#arms", "arms");
  bindRange("#tight", "tight");
  $("#inward").addEventListener("change", function (e) { state.inward = e.target.checked; });

  function bindSigilRange(id, key) {
    var input = $(id);
    input.addEventListener("input", function () { state[key] = parseFloat(input.value); drawSigil(); });
    state[key] = parseFloat(input.value);
  }
  bindSigilRange("#size", "size");
  bindSigilRange("#thick", "thick");
  $("#color").addEventListener("input", function (e) { state.color = e.target.value; drawSigil(); });
  $("#followhue").addEventListener("change", function (e) { state.followHue = e.target.checked; drawSigil(); });

  var pauseBtn = $("#pause");
  function setPaused(p) {
    state.paused = p;
    pauseBtn.textContent = p ? "Play" : "Pause";
    pauseBtn.classList.toggle("active", p);
  }
  pauseBtn.addEventListener("click", function () { setPaused(!state.paused); });
  setPaused(state.paused);

  lettersInput.addEventListener("input", function () { setLetters(lettersInput.value, "typed"); });

  $("#file").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = parseSigilFile(reader.result, file.name);
        setLetters(parsed.letters, file.name);
      } catch (err) {
        status.textContent = err.message;
      }
    };
    reader.readAsText(file);
  });

  // --- audio ----------------------------------------------------------
  var audioCtx = null, noise = null;
  var audioBtn = $("#audio");
  var volume = $("#volume");

  function toggleAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      noise = createPinkNoise(audioCtx);
      noise.setVolume(parseFloat(volume.value));
    }
    if (noise.playing()) {
      noise.stop();
      audioBtn.textContent = "Play";
      audioBtn.classList.remove("active");
    } else {
      noise.start();
      audioBtn.textContent = "Stop";
      audioBtn.classList.add("active");
    }
  }
  audioBtn.addEventListener("click", toggleAudio);
  volume.addEventListener("input", function () { if (noise) noise.setVolume(parseFloat(volume.value)); });

  // --- fullscreen -----------------------------------------------------
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    }
  }
  $("#fullscreen").addEventListener("click", toggleFullscreen);

  // --- panel auto-hide ------------------------------------------------
  var hideTimer = null;
  var panelForcedHidden = false;
  function showPanel() {
    if (panelForcedHidden) return;
    panel.classList.remove("hidden");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (!panel.contains(document.activeElement)) panel.classList.add("hidden");
    }, 3000);
  }
  function hidePanel() { panel.classList.add("hidden"); clearTimeout(hideTimer); }
  window.addEventListener("mousemove", showPanel);
  window.addEventListener("touchstart", showPanel, { passive: true });
  panel.addEventListener("mouseenter", function () { clearTimeout(hideTimer); });
  panel.addEventListener("mouseleave", showPanel);

  window.addEventListener("keydown", function (e) {
    var typing = e.target && (e.target.tagName === "INPUT");
    if (e.key === "Escape") { lettersInput.blur(); return; }
    if (typing && e.key !== "Escape") return;
    if (e.key === " ") { e.preventDefault(); setPaused(!state.paused); }
    else if (e.key === "f" || e.key === "F") toggleFullscreen();
    else if (e.key === "h" || e.key === "H") {
      panelForcedHidden = !panelForcedHidden;
      if (panelForcedHidden) hidePanel(); else showPanel();
    }
  });

  // --- init -----------------------------------------------------------
  var fromHash = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (fromHash) setLetters(fromHash, "link"); else setLetters("", null);
  window.addEventListener("hashchange", function () {
    setLetters(decodeURIComponent(location.hash.replace(/^#/, "")), "link");
  });

  if (reducedMotion) status.textContent += "  ·  paused (reduced motion)";
  resize();
  renderFrame();
  showPanel();
  requestAnimationFrame(tick);
})();
