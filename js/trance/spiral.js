// Hypnotic spiral renderer. WebGL fragment shader with a Canvas 2D fallback.
// Classic script: exposes createSpiral(canvas) -> { resize, render, mode }.
//
// render(params) where params = {
//   phase:  rotation phase in radians (accumulated by the caller),
//   arms:   number of spiral arms (1-4),
//   tight:  turns across the short viewport edge,
//   colorA: [r,g,b] 0-1,
//   colorB: [r,g,b] 0-1
// }

function createSpiral(canvas) {
  var gl = canvas.getContext("webgl", { antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (gl) return webglSpiral(canvas, gl);
  return canvasSpiral(canvas);
}

function webglSpiral(canvas, gl) {
  var vsrc = [
    "attribute vec2 a_pos;",
    "void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }"
  ].join("\n");

  var fsrc = [
    "precision mediump float;",
    "uniform vec2 u_res;",
    "uniform float u_phase;",
    "uniform float u_arms;",
    "uniform float u_tight;",
    "uniform vec3 u_a;",
    "uniform vec3 u_b;",
    "void main() {",
    "  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);",
    "  float r = length(p);",
    "  float th = atan(p.y, p.x);",
    "  float band = sin(u_arms * th - u_tight * 6.28318 * r + u_phase);",
    // soften the edge a little; width shrinks with radius so the center stays crisp
    "  float w = 0.08 / (0.15 + r * 4.0) + 0.01;",
    "  float m = smoothstep(-w, w, band);",
    "  gl_FragColor = vec4(mix(u_a, u_b, m), 1.0);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error("Shader error: " + gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  var prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error("Program link error: " + gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var u = {
    res: gl.getUniformLocation(prog, "u_res"),
    phase: gl.getUniformLocation(prog, "u_phase"),
    arms: gl.getUniformLocation(prog, "u_arms"),
    tight: gl.getUniformLocation(prog, "u_tight"),
    a: gl.getUniformLocation(prog, "u_a"),
    b: gl.getUniformLocation(prog, "u_b")
  };

  return {
    mode: "webgl",
    resize: function (w, h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    },
    render: function (p) {
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.phase, p.phase);
      gl.uniform1f(u.arms, p.arms);
      gl.uniform1f(u.tight, p.tight);
      gl.uniform3f(u.a, p.colorA[0], p.colorA[1], p.colorA[2]);
      gl.uniform3f(u.b, p.colorB[0], p.colorB[1], p.colorB[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  };
}

// 2D fallback: paints the same band function per pixel into an ImageData at
// reduced resolution, then scales it up. Slow but dependable.
function canvasSpiral(canvas) {
  var ctx = canvas.getContext("2d");
  var scale = 4;
  var off = document.createElement("canvas");
  var octx = off.getContext("2d");
  var img = null;

  function toByte(v) { return Math.max(0, Math.min(255, Math.round(v * 255))); }

  return {
    mode: "canvas2d",
    resize: function (w, h) {
      canvas.width = w;
      canvas.height = h;
      off.width = Math.max(1, Math.floor(w / scale));
      off.height = Math.max(1, Math.floor(h / scale));
      img = octx.createImageData(off.width, off.height);
      ctx.imageSmoothingEnabled = true;
    },
    render: function (p) {
      if (!img) return;
      var W = off.width, H = off.height, d = img.data;
      var minDim = Math.min(W, H);
      var ar = p.colorA[0], ag = p.colorA[1], ab = p.colorA[2];
      var br = p.colorB[0], bg = p.colorB[1], bb = p.colorB[2];
      var i = 0;
      for (var y = 0; y < H; y++) {
        var py = (H - y - 0.5 * H) / minDim;
        for (var x = 0; x < W; x++) {
          var px = (x - 0.5 * W) / minDim;
          var r = Math.sqrt(px * px + py * py);
          var th = Math.atan2(py, px);
          var band = Math.sin(p.arms * th - p.tight * 6.28318 * r + p.phase);
          var m = band > 0 ? 1 : 0;
          d[i++] = toByte(ar + (br - ar) * m);
          d[i++] = toByte(ag + (bg - ag) * m);
          d[i++] = toByte(ab + (bb - ab) * m);
          d[i++] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    }
  };
}
