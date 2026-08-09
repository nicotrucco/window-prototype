/* Window — Siri-style GLSL voice visualiser.

   Ported from the React/Tailwind component Nicolas sent to vanilla JS, because
   app/ has no framework and no build step (CLAUDE.md: no new frameworks without
   a proposal). The React wrapper was thin — the substance is the GLSL and ~40
   lines of WebGL setup, both kept faithfully.

   Three deliberate changes from the original:

   1. PALETTE. The original spectral4() is a full RGB rainbow, which fights a
      brand built on the void + cream and nothing else. `palette:"brand"` swaps
      it for a cream→taupe ramp (0018 — beige on black, hierarchy by value).
      The chromatic aberration still works — it only needs the four channels to
      differ, not to be a rainbow.
   2. ALPHA. The original writes opaque black, so it renders as a black square.
      Here alpha tracks luminance and blending is premultiplied, so it sits on
      the void with no visible plate.
   3. IT STOPS. The original runs rAF forever. This only animates while the mic
      is live — a fragment shader per frame is not something to leave running
      behind a camera preview or on a battery.

   window.SiriWave.mount(canvas, opts) -> { start, stop, destroy, running }
*/

(function () {
  const VERT = "attribute vec2 aPos; void main(){ gl_Position=vec4(aPos,0.0,1.0); }";

  /* the rainbow, verbatim from the original */
  const PALETTE_SPECTRAL = `
vec3 palette4(int s){
    float x = float(s);
    return clamp(vec3(abs(x-3.0)-1.0, 2.0-abs(x-2.0), 2.0-abs(x-4.0)), 0.0, 1.0);
}`;

  /* 0018 · cream -> taupe. The ramp used to run out to coral; with one hue it
     runs DOWN THE VALUE SCALE instead. The chromatic aberration is unaffected —
     it only needs the four channels to differ, and they still do. */
  const PALETTE_BRAND = `
vec3 palette4(int s){
    vec3 a = vec3(0.965, 0.937, 0.875);   /* #F6EFDF bright cream */
    vec3 b = vec3(0.925, 0.894, 0.831);   /* #ECE4D4 frame cream  */
    vec3 c = vec3(0.702, 0.639, 0.545);   /* #B3A38B quiet beige  */
    vec3 d = vec3(0.400, 0.365, 0.318);   /* #665D51 deep taupe   */
    if(s == 0) return a;
    if(s == 1) return b;
    if(s == 2) return c;
    return d;
}`;

  const WAVE = `precision highp float;
uniform vec2 iResolution; uniform float iTime; uniform float iLevel;
const float PI = 3.14159265359;
const float AMPLITUDE   = 0.32;
const float FREQ        = 1.1;
const float ABER_FREQ   = 1.0;
const float SPEED       = 2.4;
const float WAVE_SCALE  = 0.6;
const float ABERRATION  = 2.6;
const float THICKNESS   = 3.0;
const float INTENSITY   = 2.;
const float FALLOFF     = 1.7;
const float EDGE_MASK   = 0.4;
const float EDGE_INSET  = 0.0;
const float BAND_FILL   = 30000.0;
const float BAND_THICK  = 0.08;
const float SOFTNESS    = 2.5;
const float LOW_AMP     = 6.0;
const float LOW_INT     = 1.5;
const float MID_ABER    = 0.8;
const float MID_ABAMP   = 0.05;
const float MID_SOFT    = 0.4;
const float HIGH_ABER   = 0.5;
const float HIGH_ABAMP  = 0.06;
const float UNRES_SCALE = 0.14;
__PALETTE__

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 R = iResolution.xy;
    float aspect = R.x / R.y;
    vec2 p = (fragCoord + 0.5) * 2.0 / R - 1.0;
    p.x *= aspect;
    float yScreen = p.y;
    p /= max(WAVE_SCALE, 0.1);

    float t = iTime;
    float amp = clamp(iLevel, 0.0, 1.0);
    float low  = clamp((0.45 + 0.45*sin(t*0.8)*sin(t*0.37+1.0)) * amp, 0.0, 1.0);
    float mid  = clamp((0.40 + 0.40*sin(t*1.7+2.0)*sin(t*0.53)) * amp, 0.0, 1.0);
    float high = clamp((0.30 + 0.30*sin(t*2.9+4.0)*sin(t*0.71+2.0)) * amp, 0.0, 1.0);

    float res   = clamp(amp, 0.0, 1.0);
    float drift = mod(t, 20.0*PI) * SPEED;

    float xN  = p.x / max(aspect, 1.0);
    float env = cos(PI*0.5 * min(abs(0.9*xN), 1.0));
    env *= env;

    float A1    = AMPLITUDE + 0.01*low*LOW_AMP;
    float A2    = A1 + mid*MID_ABAMP + high*HIGH_ABAMP;
    float AB    = (ABERRATION + mid*MID_ABER + high*HIGH_ABER)*res;
    float th    = mix(0.1, 0.01*THICKNESS, res);
    float inten = mix(0.1, 0.01*(INTENSITY + low*LOW_INT), res);
    float soft  = 0.01*res*max(0.0, SOFTNESS + mid*MID_SOFT);

    float dUnres = max(length(p) - mix(0.14, UNRES_SCALE, res), 0.0);
    float yMain = A1 * env * res * sin(p.x*FREQ + drift);

    float bandFillTh = max(BAND_THICK, 1e-4);
    float bandAmt    = 1e-4 * BAND_FILL * inten;
    vec3 num = vec3(0.0), den = vec3(0.0);
    for(int s = 0; s < 4; s++){
        vec3 hue = mix(vec3(1.0), palette4(s), res);
        den += hue;
        float ab = mix(-AB, AB, float(s)/3.0);
        float yL = A2 * env * res * sin(p.x*ABER_FREQ + drift + ab);
        float d   = mix(dUnres, abs(p.y - yL), res);
        float lor = mix(1.0/(1.0 + (0.02*d)*(0.02*d)), 1.0, res);
        float line = inten / (sqrt(d*d + soft*soft) + th);
        float lo = min(yMain, yL), hi = max(yMain, yL);
        float dBand = max(0.0, max(p.y - hi, lo - p.y));
        float band  = bandAmt / (dBand + bandFillTh);
        num += hue * lor * (line + band);
    }
    vec3 col = num / den;

    float dM    = mix(dUnres, abs(p.y - yMain), res);
    float lorM  = mix(1.0/(1.0 + (0.02*dM)*(0.02*dM)), 1.0, res);
    float boost = (1.0 - res) * (14.0*low + 4.0);
    col += 0.5 * inten * (lorM + boost) / (sqrt(dM*dM + soft*soft) + th);

    col = pow(max(col, 0.0), vec3(1.5));
    float emT = clamp((abs(yScreen) - 1.0 + EDGE_INSET) / (-max(EDGE_MASK, 1e-4)), 0.0, 1.0);
    float em  = emT*emT*(3.0 - 2.0*emT);
    float gauss = exp(-pow(xN*FALLOFF, 2.0));
    col *= mix(1.0, em*gauss, res);
    col *= res;
    col = min(col, vec3(1.0));
    /* alpha from luminance so it composites onto the void, no black plate */
    float a = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
    fragColor = vec4(col, a);
}
void main(){ mainImage(gl_FragColor, gl_FragCoord.xy); }`;

  function build(paletteName) {
    return WAVE.replace("__PALETTE__",
      paletteName === "spectral" ? PALETTE_SPECTRAL : PALETTE_BRAND);
  }

  function mount(canvas, opts) {
    const o = opts || {};
    const size = o.size || 120;
    const scale = o.renderScale || 0.75;
    const reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let gl = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true,
                                        antialias: false, depth: false });
    } catch (e) { gl = null; }
    /* no WebGL — caller keeps whatever fallback markup is already there */
    if (!gl) return null;

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh);
        gl.deleteShader(sh);
        throw new Error(log || "shader compile error");
      }
      return sh;
    }

    let program, vs, fs, buf;
    try {
      program = gl.createProgram();
      vs = compile(gl.VERTEX_SHADER, VERT);
      fs = compile(gl.FRAGMENT_SHADER, build(o.palette));
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link failed");
      gl.useProgram(program);
    } catch (e) {
      return null;
    }

    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "iResolution");
    const uTime = gl.getUniformLocation(program, "iTime");
    const uLevel = gl.getUniformLocation(program, "iLevel");

    const dim = Math.max(1, Math.round(size * scale));
    canvas.width = dim; canvas.height = dim;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    gl.viewport(0, 0, dim, dim);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const t0 = performance.now();
    let raf = 0, running = false, level = 0, target = 0;

    function draw() {
      /* ease toward the target so speech peaks don't strobe */
      level += (target - level) * 0.12;
      const t = (performance.now() - t0) / 1000;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, dim, dim);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uLevel, level);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (running) raf = requestAnimationFrame(draw);
    }

    const api = {
      start() {
        if (running) return;
        running = true; target = 1;
        if (reduce) { level = 1; draw(); running = false; return; }
        raf = requestAnimationFrame(draw);
      },
      stop() {
        running = false;
        cancelAnimationFrame(raf);
        gl.clear(gl.COLOR_BUFFER_BIT);
        level = 0; target = 0;
      },
      /* 0..1 — wire to real mic amplitude when there is one */
      setLevel(v) { target = Math.max(0, Math.min(1, v)); },
      get running() { return running; },
      destroy() {
        api.stop();
        gl.deleteProgram(program); gl.deleteShader(vs);
        gl.deleteShader(fs); gl.deleteBuffer(buf);
      }
    };

    /* a lost context should degrade to nothing, not to a frozen frame */
    canvas.addEventListener("webglcontextlost", ev => { ev.preventDefault(); api.stop(); });

    return api;
  }

  window.SiriWave = { mount };
})();
