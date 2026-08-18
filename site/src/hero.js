/**
 * Minne — hero field: a memory assembling itself.
 *
 * The page opens with loose fragments scattered through the depth of the
 * scene. Cluster by cluster they fly in and snap onto their place in a
 * knowledge graph, and each link flares as it forms — the same thing the app
 * does every half hour, at the speed of a title sequence. Once it stands, the
 * graph keeps living: it drifts, digest waves sweep it (amber raw captures
 * turning blue as they are filed), new fragments arrive one at a time, the
 * camera parallaxes with the pointer and the whole field leans away as you
 * scroll into the page.
 *
 * All motion is in the vertex shader. Points and line endpoints share one
 * placement function, so links stay welded to their nodes; the CPU only writes
 * a buffer when a wave starts or a single fragment is re-seeded.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Group,
  LineSegments,
  PerspectiveCamera,
  Points,
  Scene,
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

/* ── the graph ────────────────────────────────────────────────────────────
   One cluster per subject a wiki would keep. `order` is the beat it lands on
   during the assembly: the middle of the field first, the edges last.        */
const CLUSTERS = [
  { x: 5.4, y: -0.4, z: 0.4, r: 1.8, n: 96, order: 0 },
  { x: 8.4, y: 2.3, z: -1.4, r: 1.8, n: 84, order: 1 },
  { x: 2.6, y: 3.3, z: -1.0, r: 1.7, n: 78, order: 2 },
  { x: 7.6, y: -3.6, z: -2.2, r: 1.7, n: 76, order: 3 },
  { x: 2.2, y: -3.1, z: -1.8, r: 1.8, n: 74, order: 4 },
  { x: 11.4, y: -0.4, z: -3.4, r: 1.9, n: 72, order: 5 },
  { x: 5.6, y: 4.6, z: -3.2, r: 1.5, n: 58, order: 6 },
  { x: -0.8, y: 0.6, z: -2.6, r: 1.7, n: 62, order: 7 },
  { x: 10.6, y: 4.2, z: -4.4, r: 1.6, n: 56, order: 8 },
  { x: 13.2, y: 1.6, z: -2.2, r: 1.7, n: 54, order: 9 },
  { x: -3.4, y: -3.4, z: -3.0, r: 1.6, n: 48, order: 10 },
  { x: -2.6, y: 4.0, z: -4.2, r: 1.5, n: 44, order: 11 },
];

const BEAT = 0.16; // seconds between two clusters landing
const FLIGHT = 1.5; // seconds a fragment spends in the air

function buildGraph(scale) {
  const nodes = [];
  CLUSTERS.forEach((c, ci) => {
    const count = Math.max(14, Math.round(c.n * scale));
    for (let i = 0; i < count; i++) {
      const hub = i === 0;
      const delay = c.order * BEAT + rand() * 0.42;
      const dir = [gauss(), gauss(), gauss()];
      const reach = 7 + rand() * 13;
      nodes.push({
        cluster: ci,
        x: c.x + gauss() * c.r,
        y: c.y + gauss() * c.r * 0.8,
        z: c.z + gauss() * c.r * 0.7,
        // Where the fragment waits before it is filed.
        sx: c.x + dir[0] * reach,
        sy: c.y + dir[1] * reach * 0.7,
        sz: c.z + dir[2] * reach * 0.5 - rand() * 4,
        delay,
        seed: rand(),
        hub,
        size: hub ? 4.4 : 0.9 + rand() * 1.35,
        raw: !hub && rand() < 0.24,
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
      near.push([(a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2, j]);
    }
    near.sort((p, q) => p[0] - q[0]);
    // Cap the reach: a link spanning the whole field reads as a mistake, not
    // as a relation.
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
      if (span < 4.0 && Math.abs(a.z - b.z) < 1.8 && rand() < 0.55) {
        edges.add(key(hubs[i], hubs[j]));
      }
    }
  }
  return { nodes, edges: [...edges].map((k) => k.split(":").map(Number)) };
}

const isSmall = window.innerWidth < 760;
const { nodes, edges } = buildGraph(isSmall ? 0.5 : 1);

/* ── shared placement, compiled into both materials ─────────────────────── */

const COMMON = /* glsl */ `
  uniform float uTime;
  uniform vec3 uWave[2];      // where each digest pass started
  uniform vec2 uWaveClock[2]; // x: start time, y: -1 when idle
  uniform vec3 uPointer;   // pointer, in the field's own coordinates
  attribute float aSeed;
  attribute float aDelay;   // when this fragment starts flying in
  attribute vec3 aScatter;  // where it waits before that
  attribute float aDigest;  // when it gets filed, -1 if it is not a raw capture

  const float FLIGHT = ${FLIGHT.toFixed(2)};

  float ease(float t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

  float arrival() {
    return clamp((uTime - aDelay) / FLIGHT, 0.0, 1.0);
  }

  vec3 place(vec3 target, float a) {
    float t = uTime * 0.34;
    vec3 drift = vec3(
      sin(t * 0.7 + aSeed * 39.0),
      cos(t * 0.6 + aSeed * 27.0),
      sin(t * 0.5 + aSeed * 53.0)
    ) * 0.24;
    return mix(aScatter, target + drift, ease(a));
  }

  // Brightness of the digest waves as they sweep past a point. Two run at a
  // time, so one part of the memory is always being filed.
  float wave(vec3 p) {
    float lit = 0.0;
    for (int i = 0; i < 2; i++) {
      if (uWaveClock[i].y < 0.0) continue;
      float age = uTime - uWaveClock[i].x;
      float band = exp(-pow((distance(p, uWave[i]) - age * 3.4) * 1.3, 2.0));
      lit += band * smoothstep(3.8, 0.0, age);
    }
    return min(lit, 1.7);
  }

  float nearPointer(vec3 p) {
    return smoothstep(3.6, 0.5, distance(p.xy, uPointer.xy));
  }
`;

const uniforms = {
  uTime: { value: 0 },
  uWave: { value: new Float32Array([0, 0, 0, 0, 0, 0]) },
  uWaveClock: { value: new Float32Array([0, -1, 0, -1]) },
  uPointer: { value: new Float32Array([60, 60, 0]) },
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
    varying float vFlash;
    void main() {
      float a = arrival();
      vec3 p = place(position, a);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      float w = wave(p);
      // The moment of landing: a short, bright pop that settles.
      vFlash = exp(-max(0.0, uTime - aDelay - FLIGHT) * 2.6) * step(0.999, a);
      float depth = smoothstep(24.0, 8.0, -mv.z);
      vGlow = (0.62 + a * 0.5 + w * 1.9 + vFlash * 1.5 + nearPointer(p) * 0.85)
            * (0.5 + depth * 0.5);
      // A raw capture becomes a wiki node once the wave has passed it.
      vFiled = aRaw > 0.5 ? (aDigest < 0.0 ? 0.0 : smoothstep(0.0, 1.4, uTime - aDigest)) : 1.0;
      gl_PointSize = aSize * uPixelRatio * (0.6 + a * 0.4 + w * 0.9 + vFlash * 1.2)
                   * (46.0 / -mv.z);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uFade;
    varying float vGlow;
    varying float vFiled;
    varying float vFlash;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      // Two tiers: a hard core and a wide soft halo, which is what reads as
      // bloom on an additive buffer without a post pass.
      float core = smoothstep(0.42, 0.16, d);
      float halo = pow(smoothstep(0.5, 0.0, d), 2.0) * (0.42 + vFlash * 0.6);
      vec3 raw  = vec3(0.92, 0.66, 0.38);
      vec3 wiki = vec3(0.52, 0.68, 1.0);
      vec3 c = mix(raw, wiki, vFiled);
      float alpha = (core + halo) * vGlow * uFade;
      if (alpha < 0.004) discard;
      gl_FragColor = vec4(c * (0.78 + vGlow * 0.42), alpha);
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
    attribute float aFormed; // when both ends of this link have landed
    varying float vAlpha;
    void main() {
      float a = arrival();
      vec3 p = place(position, a);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      float age = uTime - aFormed;
      float born = smoothstep(0.0, 0.22, age);
      float flare = exp(-max(age, 0.0) * 1.9) * 0.85;
      float depth = 0.55 + 0.45 * smoothstep(24.0, 8.0, -mv.z);
      vAlpha = born * (0.19 + flare + wave(p) * 0.95 + nearPointer(p) * 0.3) * depth;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uFade;
    varying float vAlpha;
    void main() {
      gl_FragColor = vec4(0.46, 0.62, 0.98, vAlpha * uFade);
    }
  `,
});

/* ── geometry ─────────────────────────────────────────────────────────────
   Attribute names are shared by both materials; the line buffers repeat each
   node's values once per endpoint so the two shaders place them identically. */

const count = nodes.length;
const pointGeometry = new BufferGeometry();
const positions = new Float32Array(count * 3);
const scatter = new Float32Array(count * 3);
const seeds = new Float32Array(count);
const delays = new Float32Array(count);
const sizes = new Float32Array(count);
const raws = new Float32Array(count);
const digest = new Float32Array(count).fill(-1);

nodes.forEach((n, i) => {
  positions.set([n.x, n.y, n.z], i * 3);
  scatter.set([n.sx, n.sy, n.sz], i * 3);
  seeds[i] = n.seed;
  delays[i] = n.delay;
  sizes[i] = n.size;
  raws[i] = n.raw ? 1 : 0;
});

const digestAttribute = new BufferAttribute(digest, 1);
const rawAttribute = new BufferAttribute(raws, 1);
const pointDelayAttribute = new BufferAttribute(delays, 1);
digestAttribute.setUsage(DynamicDrawUsage);
rawAttribute.setUsage(DynamicDrawUsage);
pointDelayAttribute.setUsage(DynamicDrawUsage);
pointGeometry.setAttribute("position", new BufferAttribute(positions, 3));
pointGeometry.setAttribute("aScatter", new BufferAttribute(scatter, 3));
pointGeometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
pointGeometry.setAttribute("aDelay", pointDelayAttribute);
pointGeometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
pointGeometry.setAttribute("aRaw", rawAttribute);
pointGeometry.setAttribute("aDigest", digestAttribute);

const lineGeometry = new BufferGeometry();
const linePositions = new Float32Array(edges.length * 6);
const lineScatter = new Float32Array(edges.length * 6);
const lineSeeds = new Float32Array(edges.length * 2);
const lineDelays = new Float32Array(edges.length * 2);
const lineFormed = new Float32Array(edges.length * 2);
const lineDigest = new Float32Array(edges.length * 2).fill(-1);
edges.forEach(([a, b], e) => {
  const na = nodes[a];
  const nb = nodes[b];
  linePositions.set([na.x, na.y, na.z, nb.x, nb.y, nb.z], e * 6);
  lineScatter.set([na.sx, na.sy, na.sz, nb.sx, nb.sy, nb.sz], e * 6);
  lineSeeds[e * 2] = na.seed;
  lineSeeds[e * 2 + 1] = nb.seed;
  lineDelays[e * 2] = na.delay;
  lineDelays[e * 2 + 1] = nb.delay;
  const formed = Math.max(na.delay, nb.delay) + FLIGHT;
  lineFormed[e * 2] = formed;
  lineFormed[e * 2 + 1] = formed;
});
const lineDelayAttribute = new BufferAttribute(lineDelays, 1);
const lineFormedAttribute = new BufferAttribute(lineFormed, 1);
lineDelayAttribute.setUsage(DynamicDrawUsage);
lineFormedAttribute.setUsage(DynamicDrawUsage);
lineGeometry.setAttribute("position", new BufferAttribute(linePositions, 3));
lineGeometry.setAttribute("aScatter", new BufferAttribute(lineScatter, 3));
lineGeometry.setAttribute("aSeed", new BufferAttribute(lineSeeds, 1));
lineGeometry.setAttribute("aDelay", lineDelayAttribute);
lineGeometry.setAttribute("aFormed", lineFormedAttribute);
lineGeometry.setAttribute("aDigest", new BufferAttribute(lineDigest, 1));

/* ── scene ────────────────────────────────────────────────────────────── */

let renderer;
try {
  renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  });
} catch (error) {
  document.documentElement.classList.add("no-webgl");
}

if (!renderer || !renderer.getContext()) {
  document.documentElement.classList.add("no-webgl");
} else {
  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 120);
  const field = new Group();
  field.add(new Points(pointGeometry, pointMaterial));
  field.add(new LineSegments(lineGeometry, lineMaterial));
  scene.add(field);

  const home = { x: 2.0, y: 0.2, z: 12.6 };
  const look = { x: 3.0, y: 0.1, z: -2 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, seen: false };
  const field2d = { x: 60, y: 60 };
  let scroll = 0;
  let waveIndex = 0;
  let nextWave = 3.9;
  let nextArrival = 6.2;
  let running = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(rect.width, rect.height, false);
    uniforms.uPixelRatio.value = ratio;
    camera.aspect = rect.width / Math.max(rect.height, 1);
    // Portrait and phone widths need the field pulled back and centred.
    const wide = camera.aspect > 1.1;
    home.x = wide ? 2.0 : 5.2;
    home.z = wide ? 12.6 : 20.5;
    look.x = wide ? 3.0 : 5.2;
    camera.updateProjectionMatrix();
  }

  // A digest pass: pick a cluster, sweep it, and file the captures it meets.
  function startWave(now) {
    // Clusters are ordered middle-outwards, so stepping by five keeps
    // consecutive passes apart on screen.
    const c = CLUSTERS[(waveIndex * 5) % CLUSTERS.length];
    const slot = waveIndex % 2;
    waveIndex += 1;
    uniforms.uWave.value[slot * 3] = c.x;
    uniforms.uWave.value[slot * 3 + 1] = c.y;
    uniforms.uWave.value[slot * 3 + 2] = c.z;
    uniforms.uWaveClock.value[slot * 2] = now;
    uniforms.uWaveClock.value[slot * 2 + 1] = 1;

    for (let i = 0; i < count; i++) {
      const n = nodes[i];
      if (!n.raw || digest[i] >= 0) continue;
      const d = Math.hypot(n.x - c.x, n.y - c.y, n.z - c.z);
      if (d < 5.5) digest[i] = now + d / 3.6;
    }
    // Fresh captures appear where the pass just finished.
    let reseeded = 0;
    for (let i = 0; i < count && reseeded < 7; i++) {
      const n = nodes[i];
      if (n.hub || n.raw) continue;
      if (Math.hypot(n.x - c.x, n.y - c.y, n.z - c.z) > 5.5) continue;
      if (rand() < 0.07) {
        n.raw = true;
        raws[i] = 1;
        digest[i] = -1;
        reseeded += 1;
      }
    }
    rawAttribute.needsUpdate = true;
    digestAttribute.needsUpdate = true;
  }

  // Coming back to the top rebuilds the graph from scratch, so the assembly
  // is not a thing you had to catch in the first four seconds of the visit.
  function reassemble(now) {
    for (let i = 0; i < count; i++) delays[i] = nodes[i].delay + now + 0.35;
    edges.forEach(([a, b], e) => {
      lineDelays[e * 2] = nodes[a].delay + now + 0.35;
      lineDelays[e * 2 + 1] = nodes[b].delay + now + 0.35;
      const formed = Math.max(nodes[a].delay, nodes[b].delay) + FLIGHT + now + 0.35;
      lineFormed[e * 2] = formed;
      lineFormed[e * 2 + 1] = formed;
    });
    pointDelayAttribute.needsUpdate = true;
    lineDelayAttribute.needsUpdate = true;
    lineFormedAttribute.needsUpdate = true;
  }

  // One more fragment flies in and snaps on: the assembly, in miniature,
  // so the graph keeps behaving like something still being written.
  function newFragment(now) {
    for (let tries = 0; tries < 40; tries++) {
      const i = Math.floor(rand() * count);
      if (nodes[i].hub) continue;
      delays[i] = now;
      pointDelayAttribute.needsUpdate = true;
      return;
    }
  }

  function frame(ms) {
    const now = ms / 1000;
    uniforms.uTime.value = now;
    uniforms.uFade.value = Math.min(1, uniforms.uFade.value + 0.02);

    if (now > nextWave) {
      startWave(now);
      nextWave = now + 2.6 + rand() * 1.8;
    }
    if (now > nextArrival) {
      newFragment(now);
      nextArrival = now + 1.1 + rand() * 1.9;
    }

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    uniforms.uPointer.value[0] = field2d.x;
    uniforms.uPointer.value[1] = field2d.y;

    // Parallax is the camera moving, not the scene rotating: near clusters
    // slide against far ones the way they would if you leaned.
    const hero = canvas.getBoundingClientRect();
    scroll = Math.min(1, Math.max(0, -hero.top / Math.max(hero.height, 1)));
    camera.position.set(
      home.x - pointer.x * 1.6,
      home.y - pointer.y * 1.0 + scroll * 1.4,
      home.z - scroll * 2.2
    );
    camera.lookAt(look.x + pointer.x * 0.5, look.y - pointer.y * 0.35, look.z);
    field.rotation.y = now * 0.014 + pointer.x * 0.05 + scroll * 0.16;
    field.rotation.x = -pointer.y * 0.03;
    uniforms.uFade.value = Math.min(uniforms.uFade.value, 1 - scroll * 0.55);

    renderer.render(scene, camera);
    if (running) requestAnimationFrame(frame);
  }

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
    // One composed frame: the graph standing, mid-digest, holding still.
    uniforms.uTime.value = 9;
    uniforms.uFade.value = 1;
    startWave(8.1);
    camera.position.set(home.x, home.y, home.z);
    camera.lookAt(look.x, look.y, look.z);
    renderer.render(scene, camera);
  } else {
    start();
    window.addEventListener(
      "pointermove",
      (event) => {
        const rect = canvas.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = (event.clientY - rect.top) / rect.height;
        pointer.tx = nx * 2 - 1;
        pointer.ty = ny * 2 - 1;
        pointer.seen = true;
        // Where the pointer lands in the field, for the recall glow.
        field2d.x = look.x - 8 + nx * 17;
        field2d.y = 5 - ny * 10;
      },
      { passive: true }
    );

    // Stop rendering when the hero is off screen or the tab is hidden.
    const heroSection = canvas.closest(".hero");
    if (heroSection && "IntersectionObserver" in window) {
      let leftAt = 0;
      new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            leftAt = performance.now();
            stop();
            return;
          }
          // Away long enough to have forgotten it: build it again.
          if (leftAt && performance.now() - leftAt > 4000) {
            reassemble(performance.now() / 1000);
            uniforms.uFade.value = 0.2;
          }
          start();
        },
        { threshold: 0 }
      ).observe(heroSection);
    }
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }
}
