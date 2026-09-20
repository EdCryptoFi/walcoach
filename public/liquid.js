// Liquid background: a tiny WebGL fragment shader (no library). Soft blue/white
// in light mode, deep navy/cyan in dark mode. Pauses when the tab is hidden and
// renders a still frame when the user prefers reduced motion.
(() => {
  const canvas = document.getElementById("liquid");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false });
  if (!gl) { canvas.remove(); return; }
  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
  const fs = `precision mediump float;
  uniform vec2 r; uniform float t; uniform float dark;
  // value noise + fbm
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
  void main(){
    vec2 uv = gl_FragCoord.xy / r; vec2 q = uv * vec2(r.x / r.y, 1.0);
    float s = t * 0.045;
    vec2 w = vec2(fbm(q * 1.4 + vec2(s, -s * 0.7)), fbm(q * 1.4 + vec2(-s * 0.6, s)));
    float f = fbm(q * 1.2 + 2.2 * w + vec2(s * 0.3));
    float g = fbm(q * 2.6 - 1.5 * w - vec2(s * 0.2));
    vec3 white = vec3(0.93, 0.96, 1.0), cyan = vec3(0.0, 0.706, 0.847), azure = vec3(0.404, 0.729, 0.992), ice = vec3(0.76, 0.86, 0.99);
    vec3 navy = vec3(0.039, 0.075, 0.125), deep = vec3(0.0, 0.29, 0.40), glow = vec3(0.30, 0.84, 0.98);
    vec3 light = mix(white, ice, smoothstep(0.3, 0.75, f)); light = mix(light, mix(azure, cyan, g), smoothstep(0.58, 0.92, f) * 0.45);
    vec3 dk = mix(navy, deep, smoothstep(0.35, 0.8, f)); dk = mix(dk, glow, smoothstep(0.7, 0.98, f) * 0.35 * g);
    vec3 c = mix(light, dk, dark);
    gl_FragColor = vec4(c, 1.0);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uD = gl.getUniformLocation(prog, "dark");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dark = document.documentElement.dataset.theme === "dark" ? 1 : 0, dTarget = dark;
  new MutationObserver(() => { dTarget = document.documentElement.dataset.theme === "dark" ? 1 : 0; }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  function resize() { const dpr = Math.min(devicePixelRatio || 1, 1.5) * 0.5; canvas.width = Math.max(2, innerWidth * dpr | 0); canvas.height = Math.max(2, innerHeight * dpr | 0); gl.viewport(0, 0, canvas.width, canvas.height); }
  addEventListener("resize", resize); resize();
  const start = performance.now(); let raf = 0, last = 0;
  function frame(now) {
    if (now - last > 1000 / 30) { last = now; dark += (dTarget - dark) * 0.08; gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, (now - start) / 1000); gl.uniform1f(uD, dark); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
    if (!reduced) raf = requestAnimationFrame(frame);
  }
  const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };
  document.addEventListener("visibilitychange", () => document.hidden ? cancelAnimationFrame(raf) : run());
  run();
})();
