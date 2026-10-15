// Pink noise via a looping AudioBuffer (no AudioWorklet, so it works from
// file://). Uses Paul Kellet's filter on white noise.
// Classic script: exposes createPinkNoise(audioCtx).

function createPinkNoise(ctx) {
  var seconds = 6;
  var rate = ctx.sampleRate;
  var length = Math.floor(rate * seconds);
  var buffer = ctx.createBuffer(2, length, rate);

  for (var ch = 0; ch < 2; ch++) {
    var data = buffer.getChannelData(ch);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < length; i++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    // crossfade the loop seam (50 ms) to avoid a click
    var fade = Math.floor(rate * 0.05);
    for (var f = 0; f < fade; f++) {
      var t = f / fade;
      var tail = length - fade + f;
      data[tail] = data[tail] * (1 - t) + data[f] * t;
    }
  }

  var gain = ctx.createGain();
  gain.gain.value = 0.5;
  gain.connect(ctx.destination);
  var source = null;

  return {
    start: function () {
      if (source) return;
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start();
      if (ctx.state === "suspended") ctx.resume();
    },
    stop: function () {
      if (!source) return;
      source.stop();
      source.disconnect();
      source = null;
    },
    setVolume: function (v) {
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
    },
    playing: function () { return source !== null; }
  };
}
