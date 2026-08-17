/**
 * Minne — hero field.
 *
 * A memory graph: loose clusters of fragments (one cluster per subject the
 * wiki would keep), linked to their neighbours. Amber points are raw captures;
 * every few seconds a digest wave crosses a cluster, lights the links it
 * touches and turns the captures it passes into blue wiki nodes. New captures
 * appear to replace them, so the cycle never empties.
 *
 * Everything drifts in the vertex shader — points and the line endpoints share
 * one displacement function, so the edges stay welded to their nodes and the
 * CPU only touches a buffer when a digest wave starts (roughly once every six
 * seconds).
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineSegments,
  PerspectiveCamera,
  Points,
  Scene,
  DynamicDrawUsage,
  ShaderMaterial,
  WebGLRenderer,
} from "three";

const canvas = document.getElementById("graph");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── deterministic randomness, so the composition is designed, not rolled ── */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rand = rng(20260817);
const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

/* ── the graph ────────────────────────────────────────────────────────── */

const CLUSTERS = [
  { x: 2.4, y: 3.4, z: -1.4, r: 1.7, n: 62 },
  { x: 5.6, y: 4.6, z: -3.0, r: 1.5, n: 52 },
  { x: 8.2, y: 2.4, z: -1.6, r: 1.8, n: 70 },
  { x: 5.5, y: -0.6, z: -0.6, r: 1.7, n: 78 },
  { x: 2.7, y: -2.8, z: -2.3, r: 1.9, n: 60 },
  { x: 7.4, y: -3.9, z: -3.1, r: 1.7, n: 58 },
  { x: 0.1, y: -4.2, z: -1.0, r: 1.4, n: 34 },
  { x: 9.8, y: -0.6, z: -4.6, r: 2.0, n: 54 },
  { x: 10.4, y: 3.8, z: -2.6, r: 1.6, n: 44 },
  { x: 12.6, y: 1.2, z: -3.4, r: 1.8, n: 46 },
];

function buildGraph(scale) {
  const nodes = [];
  CLUSTERS.forEach((c, ci) => {
    const count = Math.max(16, Math.round(c.n * scale));
    for (let i = 0; i < count; i++) {
      const hub = i === 0;
      nodes.push({
        cluster: ci,
        x: c.x + gauss() * c.r,
        y: c.y + gauss() * c.r * 0.8,
        z: c.z + gauss() * c.r * 0.7,
        seed: rand(),
        hub,
        size: hub ? 4.0 : 0.8 + rand() * 1.2,
        raw: !hub && rand() < 0.22,
      });
    }
  });

  // Each node reaches for its two nearest neighbours inside its own cluster:
  // dense locally, sparse between subjects — the shape a wiki actually has.
  const edges = new Set();
  const key = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const near = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j || nodes[j].cluster !== a.cluster) continue;
      const b = nodes[j];
      const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
      near.push([d, j]);
    }
    near.sort((p, q) => p[0] - q[0]);
    // Cap the reach: a link that spans the whole field reads as a mistake,
    // not as a relation.
    for (let k = 0; k < Math.min(2, near.length); k++) {
      if (near[k][0] > 6.8) break;
      edges.add(key(i, near[k][1]));
    }
  }
  // A few links across subjects: the same person turning up in two projects.
  const hubs = nodes.map((n, i) => (n.hub ? i : -1)).filter((i) => i >= 0);
  for (let i = 0; i < hubs.length; i++) {
    for (let j = i + 1; j < hubs.length; j++) {
      const a = nodes[hubs[i]];
      const b = nodes[hubs[j]];
      const span = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      const flat = Math.abs(a.z - b.z) < 2.0;
      if (span < 4.6 && flat && rand() < 0.8) edges.add(key(hubs[i], hubs[j]));
    }
  }
  return { nodes, edges: [...edges].map((k) => k.split(":").map(Number)) };
}

const isSmall = window.innerWidth < 760;
const { nodes, edges } = buildGraph(isSmall ? 0.55 : 1);

/* ── shared drift + wave, compiled into both materials ────────────────── */

const COMMON = /* glsl */ `
  uniform float uTime;
  uniform vec3 uWave;      // wave origin
  uniform vec2 uWaveClock; // x: start time, y: -1 when idle
  uniform vec3 uPointer;   // pointer, projected into the field
  attribute float aSeed;
  attribute float aDigest;  // time this fragment gets filed, -1 if it is not raw

  vec3 drift(vec3 p, float seed) {
    float t = uTime * 0.34;
    return p + vec3(
      sin(t * 0.7 + seed * 39.0),
      cos(t * 0.6 + seed * 27.0),
      sin(t * 0.5 + seed * 53.0)
    ) * 0.22;
  }

  // Brightness of the digest wave as it sweeps past this point.
  float wave(vec3 p) {
    if (uWaveClock.y < 0.0) return 0.0;
    float age = uTime - uWaveClock.x;
    float radius = age * 3.4;
    float d = distance(p, uWave);
    float band = exp(-pow((d - radius) * 1.5, 2.0));
    return band * smoothstep(3.2, 0.0, age);
  }

  float nearPointer(vec3 p) {
    return smoothstep(3.4, 0.6, distance(p.xy, uPointer.xy));
  }
`;

const uniforms = {
  uTime: { value: 0 },
  uWave: { value: new Float32Array([0, 0, 0]) },
  uWaveClock: { value: new Float32Array([0, -1]) },
  uPointer: { value: new Float32Array([40, 40, 0]) },
  uPixelRatio: { value: 1 },
  uFade: { value: 0 },
};

const pointMaterial = new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms,
  vertexShader: `
    ${COMMON}
    uniform float uPixelRatio;
    attribute float aSize;
    attribute float aRaw;
    varying float vGlow;
    varying float vFiled;
    void main() {
      vec3 p = drift(position, aSeed);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float w = wave(p);
      // Depth reads as distance in time: the far side of the graph sits back.
      float depth = smoothstep(20.0, 9.0, -mv.z);
      vGlow = (0.95 + w * 1.8 + nearPointer(p) * 0.7) * (0.55 + depth * 0.45);
      // A raw capture becomes a wiki node once the wave has passed it.
      vFiled = aRaw > 0.5 ? (aDigest < 0.0 ? 0.0 : smoothstep(0.0, 1.4, uTime - aDigest)) : 1.0;
      gl_PointSize = aSize * uPixelRatio * (1.0 + w * 0.9) * (34.0 / -mv.z);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uFade;
    varying float vGlow;
    varying float vFiled;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float core = smoothstep(0.5, 0.28, d);
      float halo = smoothstep(0.5, 0.05, d) * 0.35;
      vec3 raw  = vec3(0.85, 0.63, 0.40);
      vec3 wiki = vec3(0.45, 0.62, 1.0);
      vec3 c = mix(raw, wiki, vFiled);
      float a = (core + halo) * vGlow * uFade;
      if (a < 0.004) discard;
      gl_FragColor = vec4(c * vGlow, a);
    }
  `,
});

const lineMaterial = new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms,
  vertexShader: `
    ${COMMON}
    varying float vAlpha;
    void main() {
      vec3 p = drift(position, aSeed);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      vAlpha = (0.17 + wave(p) * 0.9 + nearPointer(p) * 0.2) * (0.55 + 0.45 * smoothstep(22.0, 9.0, -mv.z));
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uFade;
    varying float vAlpha;
    void main() {
      gl_FragColor = vec4(0.42, 0.58, 0.95, vAlpha * uFade);
    }
  `,
});

/* ── geometry ─────────────────────────────────────────────────────────── */

const count = nodes.length;
const pointGeometry = new BufferGeometry();
const positions = new Float32Array(count * 3);
const seeds = new Float32Array(count);
const sizes = new Float32Array(count);
const raws = new Float32Array(count);
const digest = new Float32Array(count).fill(-1);

nodes.forEach((n, i) => {
  positions[i * 3] = n.x;
  positions[i * 3 + 1] = n.y;
  positions[i * 3 + 2] = n.z;
  seeds[i] = n.seed;
  sizes[i] = n.size;
  raws[i] = n.raw ? 1 : 0;
});

const digestAttribute = new BufferAttribute(digest, 1);
digestAttribute.setUsage(DynamicDrawUsage);
pointGeometry.setAttribute("position", new BufferAttribute(positions, 3));
pointGeometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
pointGeometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
pointGeometry.setAttribute("aRaw", new BufferAttribute(raws, 1));
pointGeometry.setAttribute("aDigest", digestAttribute);

const lineGeometry = new BufferGeometry();
const linePositions = new Float32Array(edges.length * 6);
const lineSeeds = new Float32Array(edges.length * 2);
const lineDigest = new Float32Array(edges.length * 2).fill(-1);
edges.forEach(([a, b], e) => {
  const na = nodes[a];
  const nb = nodes[b];
  linePositions.set([na.x, na.y, na.z, nb.x, nb.y, nb.z], e * 6);
  lineSeeds[e * 2] = na.seed;
  lineSeeds[e * 2 + 1] = nb.seed;
});
lineGeometry.setAttribute("position", new BufferAttribute(linePositions, 3));
lineGeometry.setAttribute("aSeed", new BufferAttribute(lineSeeds, 1));
lineGeometry.setAttribute("aDigest", new BufferAttribute(lineDigest, 1));

/* ── scene ────────────────────────────────────────────────────────────── */

let renderer;
try {
  renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
} catch (error) {
  document.documentElement.classList.add("no-webgl");
}
if (!renderer || !renderer.getContext()) {
  document.documentElement.classList.add("no-webgl");
} else {
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  const field = new Group();
  field.add(new Points(pointGeometry, pointMaterial));
  field.add(new LineSegments(lineGeometry, lineMaterial));
  scene.add(field);

  const pointer = { x: 40, y: 40, tx: 40, ty: 40 };
  let waveIndex = 0;
  let nextWave = 1.6;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(rect.width, rect.height, false);
    uniforms.uPixelRatio.value = ratio;
    camera.aspect = rect.width / Math.max(rect.height, 1);
    // Portrait and phone widths need the field pulled back and centred.
    const wide = camera.aspect > 1.1;
    camera.position.set(wide ? 1.6 : 4.0, 0.3, wide ? 12.0 : 17.0);
    camera.lookAt(wide ? 2.6 : 4.2, 0.1, -2);
    camera.updateProjectionMatrix();
  }

  // A digest pass: pick a cluster, sweep it, and file the captures it meets.
  function startWave(now) {
    const c = CLUSTERS[waveIndex % CLUSTERS.length];
    waveIndex += 1;
    uniforms.uWave.value[0] = c.x;
    uniforms.uWave.value[1] = c.y;
    uniforms.uWave.value[2] = c.z;
    uniforms.uWaveClock.value[0] = now;
    uniforms.uWaveClock.value[1] = 1;

    for (let i = 0; i < count; i++) {
      const n = nodes[i];
      if (!n.raw || digest[i] >= 0) continue;
      const d = Math.hypot(n.x - c.x, n.y - c.y, n.z - c.z);
      if (d < 5.5) digest[i] = now + d / 3.4;
    }
    // Fresh captures arrive where the last pass just finished.
    let reseeded = 0;
    for (let i = 0; i < count && reseeded < 6; i++) {
      const n = nodes[i];
      if (n.hub || n.raw) continue;
      if (Math.hypot(n.x - c.x, n.y - c.y, n.z - c.z) > 5.5) continue;
      if (rand() < 0.06) {
        n.raw = true;
        raws[i] = 1;
        digest[i] = -1;
        reseeded += 1;
      }
    }
    pointGeometry.getAttribute("aRaw").needsUpdate = true;
    digestAttribute.needsUpdate = true;
  }

  function frame(ms) {
    const now = ms / 1000;
    uniforms.uTime.value = now;
    uniforms.uFade.value = Math.min(1, uniforms.uFade.value + 0.014);

    if (now > nextWave) {
      startWave(now);
      nextWave = now + 4.2 + rand() * 2.6;
    }

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;
    uniforms.uPointer.value[0] = pointer.x;
    uniforms.uPointer.value[1] = pointer.y;

    field.rotation.y = now * 0.012 + (pointer.tx - 4) * 0.012;
    field.rotation.x = -pointer.ty * 0.008;

    renderer.render(scene, camera);
    if (running) requestAnimationFrame(frame);
  }

  let running = false;
  function start() {
    if (running || reduceMotion) return;
    running = true;
    requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  if (reduceMotion) {
    // One composed frame: the graph mid-digest, holding still.
    uniforms.uTime.value = 4;
    uniforms.uFade.value = 1;
    startWave(3.2);
    renderer.render(scene, camera);
  } else {
    start();
    window.addEventListener(
      "pointermove",
      (event) => {
        const rect = canvas.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = (event.clientY - rect.top) / rect.height;
        pointer.tx = 0.5 + nx * 11;
        pointer.ty = 4.5 - ny * 9;
      },
      { passive: true }
    );

    // Stop rendering when the hero is off screen or the tab is hidden.
    const hero = canvas.closest(".hero");
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { threshold: 0 }
      ).observe(hero);
    }
    document.addEventListener("visibilitychange", () =>
      document.hidden ? stop() : start()
    );
  }
}
