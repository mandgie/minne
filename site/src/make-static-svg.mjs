/**
 * Bakes the hero graph into assets/hero-static.svg — the picture shown when
 * WebGL is unavailable. Same clusters, same seed and the same camera as
 * src/hero.js, projected once and frozen, so the fallback is the animated
 * scene standing still rather than a different design.
 *
 *   bun run build:svg
 */
import { writeFileSync } from "node:fs";

const W = 1440;
const H = 900;
const EYE = [1.6, 0.3, 12];
const TARGET = [2.6, 0.1, -2];
const FOV = (40 * Math.PI) / 180;

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

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rand = rng(20260817);
const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

const nodes = [];
CLUSTERS.forEach((c, ci) => {
  for (let i = 0; i < c.n; i++) {
    const hub = i === 0;
    nodes.push({
      cluster: ci,
      x: c.x + gauss() * c.r,
      y: c.y + gauss() * c.r * 0.8,
      z: c.z + gauss() * c.r * 0.7,
      hub,
      size: hub ? 4.0 : 0.8 + rand() * 1.2,
      raw: !hub && rand() < 0.22,
    });
  }
});

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
  for (let k = 0; k < Math.min(2, near.length); k++) {
    if (near[k][0] > 6.8) break;
    edges.add(key(i, near[k][1]));
  }
}
const hubs = nodes.map((n, i) => (n.hub ? i : -1)).filter((i) => i >= 0);
for (let i = 0; i < hubs.length; i++) {
  for (let j = i + 1; j < hubs.length; j++) {
    const a = nodes[hubs[i]];
    const b = nodes[hubs[j]];
    const span = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (span < 4.6 && Math.abs(a.z - b.z) < 2.0 && rand() < 0.8) edges.add(key(hubs[i], hubs[j]));
  }
}

/* ── camera ───────────────────────────────────────────────────────────── */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (v) => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const forward = norm(sub(TARGET, EYE));
const right = norm(cross(forward, [0, 1, 0]));
const up = cross(right, forward);
const half = Math.tan(FOV / 2);
const aspect = W / H;

function project(p) {
  const v = sub([p.x, p.y, p.z], EYE);
  const depth = -dot(v, forward);
  const ndcX = dot(v, right) / (-depth * half * aspect);
  const ndcY = dot(v, up) / (-depth * half);
  return { x: (ndcX * 0.5 + 0.5) * W, y: (0.5 - ndcY * 0.5) * H, depth: -depth };
}

const p = nodes.map(project);
const fade = (d) => Math.max(0, Math.min(1, (22 - d) / 13));

// Grouped into a handful of opacity buckets: one path per bucket keeps the
// file a quarter the size of one element per segment.
const BUCKETS = 4;
const bucket = (v) => Math.min(BUCKETS - 1, Math.max(0, Math.round(v * (BUCKETS - 1))));

const linePaths = Array.from({ length: BUCKETS }, () => []);
for (const k of edges) {
  const [a, b] = k.split(":").map(Number);
  const f = fade((p[a].depth + p[b].depth) / 2);
  linePaths[bucket(f)].push(
    `M${p[a].x.toFixed(1)} ${p[a].y.toFixed(1)}L${p[b].x.toFixed(1)} ${p[b].y.toFixed(1)}`
  );
}
const lines = linePaths
  .map((d, i) => {
    if (!d.length) return "";
    const alpha = (0.13 * (0.55 + (0.45 * i) / (BUCKETS - 1))).toFixed(3);
    return `<path d="${d.join("")}" stroke="#6b95f2" stroke-opacity="${alpha}" fill="none"/>`;
  })
  .filter(Boolean)
  .join("\n");

const dotGroups = new Map();
nodes.forEach((n, i) => {
  const f = bucket(fade(p[i].depth));
  const id = `${n.raw ? "raw" : "wiki"}-${f}`;
  const r = ((n.size * 34) / p[i].depth) * 0.5;
  const list = dotGroups.get(id) ?? [];
  list.push(`<circle cx="${p[i].x.toFixed(1)}" cy="${p[i].y.toFixed(1)}" r="${r.toFixed(2)}"/>`);
  dotGroups.set(id, list);
});
const dots = [...dotGroups]
  .map(([id, list]) => {
    const [kind, f] = id.split("-");
    const glow = 0.95 * (0.55 + (0.45 * Number(f)) / (BUCKETS - 1));
    const fill = kind === "raw" ? "#d9a066" : "#8fb4ff";
    return `<g fill="${fill}" fill-opacity="${Math.min(1, glow).toFixed(2)}">${list.join(
      ""
    )}</g>`;
  })
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<g>
${lines}
</g>
<g>
${dots}
</g>
</svg>
`;

writeFileSync(new URL("../assets/hero-static.svg", import.meta.url), svg);
console.log(`hero-static.svg: ${nodes.length} nodes, ${edges.size} edges`);
