// Witches' Wheel: 26 letters in EQ order around a circle, A at the top,
// clockwise. Draws a sigil path through the given letters.
// Classic script: exposes drawWitchesWheel(canvas, letters, opts).

// Draw only the sigil line (path, start circle, arrowhead) through the EQ
// wheel points of `letters`, centered at (cx, cy) with wheel radius `radius`.
// Shared by the cipher page (inside the full wheel) and the trance page.
function drawSigilPath(ctx, letters, cx, cy, radius, opts) {
  opts = opts || {};
  if (!letters || letters.length === 0) return;
  var stroke = opts.stroke || "#fff";
  var lw = opts.lineWidth || radius / 96;
  // markers scale with the line, not the wheel
  var startR = opts.startRadius || lw * 4;
  var arrowLen = opts.arrowLength || lw * 8;
  var spread = Math.PI / 7;

  var pts = [];
  for (var j = 0; j < letters.length; j++) {
    var ang = (eqIndex(letters[j]) / 26) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: cx + Math.cos(ang) * radius, y: cy + Math.sin(ang) * radius });
  }

  ctx.save();
  if (opts.shadowColor) {
    ctx.shadowColor = opts.shadowColor;
    ctx.shadowBlur = opts.shadowBlur || lw * 3;
  }
  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // start circle
  ctx.beginPath();
  ctx.arc(pts[0].x, pts[0].y, startR, 0, Math.PI * 2);
  ctx.stroke();

  if (pts.length > 1) {
    // line leaves from the rim of the start circle and stops short of the
    // arrowhead so the cap never pokes out past it
    var d0 = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
    var first = { x: pts[0].x + Math.cos(d0) * startR, y: pts[0].y + Math.sin(d0) * startR };
    var a = pts[pts.length - 2], b = pts[pts.length - 1];
    var dir = Math.atan2(b.y - a.y, b.x - a.x);
    var lastEnd = { x: b.x - Math.cos(dir) * arrowLen * 0.5, y: b.y - Math.sin(dir) * arrowLen * 0.5 };

    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (var k = 1; k < pts.length - 1; k++) ctx.lineTo(pts[k].x, pts[k].y);
    ctx.lineTo(lastEnd.x, lastEnd.y);
    ctx.stroke();

    // arrowhead, tip on the final point
    ctx.beginPath();
    ctx.moveTo(b.x + Math.cos(dir) * arrowLen * 0.6, b.y + Math.sin(dir) * arrowLen * 0.6);
    ctx.lineTo(b.x - Math.cos(dir - spread) * arrowLen, b.y - Math.sin(dir - spread) * arrowLen);
    ctx.lineTo(b.x - Math.cos(dir + spread) * arrowLen, b.y - Math.sin(dir + spread) * arrowLen);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawWitchesWheel(canvas, letters, opts) {
  opts = opts || {};
  var ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  var cx = W / 2, cy = H / 2;
  var rimR = W * 0.44, dotR = W * 0.40;

  var style = getComputedStyle(document.documentElement);
  function css(name, fallback) {
    return style.getPropertyValue(name).trim() || fallback;
  }
  var bg = opts.bg || css("--bg-elev", "#15151d");
  var fg = opts.fg || css("--fg", "#e6e2d8");
  var muted = opts.muted || css("--fg-muted", "#9a958a");
  var accent = opts.accent || css("--accent", "#c69c3b");
  var border = opts.border || css("--border", "#2a2a36");
  var font = opts.font || css("--font-mono", "monospace");

  function pointFor(ch, r) {
    var ang = (eqIndex(ch) / 26) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
  }

  // background (opaque, so PNG export looks right)
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // rim
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, rimR, 0, Math.PI * 2);
  ctx.stroke();

  // letters and points
  ctx.font = "500 " + (W * 0.032) + "px " + font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (var i = 0; i < 26; i++) {
    var ch = EQ_ORDER[i];
    var used = letters.indexOf(ch) !== -1;
    var p = pointFor(ch, dotR);
    var lp = pointFor(ch, rimR + W * 0.035);
    ctx.fillStyle = used ? accent : muted;
    ctx.globalAlpha = used ? 1 : 0.55;
    ctx.fillText(ch, lp.x, lp.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, used ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawSigilPath(ctx, letters, cx, cy, dotR, { stroke: fg, lineWidth: 4 });
}

// Same drawing as an SVG string. `meta` (optional object) is embedded as JSON
// in a <desc> element so the file can be read back later.
function witchesWheelSVG(letters, opts, meta) {
  opts = opts || {};
  var W = opts.size || 960, cx = W / 2, cy = W / 2;
  var rimR = W * 0.44, dotR = W * 0.40;
  var style = getComputedStyle(document.documentElement);
  function css(name, fallback) { return style.getPropertyValue(name).trim() || fallback; }
  var bg = opts.bg || css("--bg-elev", "#15151d");
  var fg = opts.fg || css("--fg", "#e6e2d8");
  var muted = opts.muted || css("--fg-muted", "#9a958a");
  var accent = opts.accent || css("--accent", "#c69c3b");
  var border = opts.border || css("--border", "#2a2a36");
  var font = opts.font || "ui-monospace, Menlo, Consolas, monospace";

  function pointFor(ch, r) {
    var ang = (eqIndex(ch) / 26) * Math.PI * 2 - Math.PI / 2;
    return { x: +(cx + Math.cos(ang) * r).toFixed(2), y: +(cy + Math.sin(ang) * r).toFixed(2) };
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var out = [];
  out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + W + '" width="' + W + '" height="' + W + '">');
  out.push('<title>Sigil ' + esc(letters) + '</title>');
  if (meta) out.push('<desc>' + esc(JSON.stringify(meta)) + '</desc>');
  out.push('<rect width="' + W + '" height="' + W + '" fill="' + bg + '"/>');
  out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rimR + '" fill="none" stroke="' + border + '" stroke-width="2"/>');

  out.push('<g font-family="' + esc(font) + '" font-size="' + (W * 0.032) + '" font-weight="500" text-anchor="middle" dominant-baseline="central">');
  for (var i = 0; i < 26; i++) {
    var ch = EQ_ORDER[i];
    var used = letters.indexOf(ch) !== -1;
    var p = pointFor(ch, dotR), lp = pointFor(ch, rimR + W * 0.035);
    var color = used ? accent : muted, alpha = used ? 1 : 0.55;
    out.push('<text x="' + lp.x + '" y="' + lp.y + '" fill="' + color + '" opacity="' + alpha + '">' + ch + '</text>');
    out.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (used ? 5 : 3) + '" fill="' + color + '" opacity="' + alpha + '"/>');
  }
  out.push('</g>');

  if (letters.length > 0) {
    var lw = 4, startR = lw * 4, arrowLen = lw * 8, spread = Math.PI / 7;
    var pts = [];
    for (var j = 0; j < letters.length; j++) pts.push(pointFor(letters[j], dotR));
    out.push('<circle cx="' + pts[0].x + '" cy="' + pts[0].y + '" r="' + startR + '" fill="none" stroke="' + fg + '" stroke-width="' + lw + '"/>');
    if (pts.length > 1) {
      var d0 = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      var a = pts[pts.length - 2], b = pts[pts.length - 1];
      var ang = Math.atan2(b.y - a.y, b.x - a.x);
      var d = "M" + (pts[0].x + Math.cos(d0) * startR).toFixed(2) + " " + (pts[0].y + Math.sin(d0) * startR).toFixed(2);
      for (var k = 1; k < pts.length - 1; k++) d += " L" + pts[k].x + " " + pts[k].y;
      d += " L" + (b.x - Math.cos(ang) * arrowLen * 0.5).toFixed(2) + " " + (b.y - Math.sin(ang) * arrowLen * 0.5).toFixed(2);
      out.push('<path id="sigil" d="' + d + '" fill="none" stroke="' + fg + '" stroke-width="' + lw + '" stroke-linejoin="round" stroke-linecap="round"/>');
      var tip = [b.x + Math.cos(ang) * arrowLen * 0.6, b.y + Math.sin(ang) * arrowLen * 0.6];
      var l = [b.x - Math.cos(ang - spread) * arrowLen, b.y - Math.sin(ang - spread) * arrowLen];
      var r = [b.x - Math.cos(ang + spread) * arrowLen, b.y - Math.sin(ang + spread) * arrowLen];
      out.push('<polygon points="' + [tip, l, r].map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" ") + '" fill="' + fg + '"/>');
    }
  }
  out.push('</svg>');
  return out.join("\n");
}
