"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  CENTRAL WASATCH — Wide backdrop with background ranges behind.
  Front range = main Wasatch (Olympus → Lone Peak).
  Behind it: backcountry ridgeline (Uintas-esque) at lower opacity.
  Peaks should be POINTY, not flat-topped.
*/

const MAX_H = 14;
const Z_STRETCH = 4.0;

/* ─── Noise ──────────────────────────────────────────────────── */
function hash2d(ix: number, iz: number): number {
  let n = (ix * 73856093) ^ (iz * 19349663);
  n = (n << 13) ^ n;
  n = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
  return n / 0x7fffffff;
}
function smoothNoise(x: number, z: number): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const a = hash2d(ix, iz), b = hash2d(ix + 1, iz);
  const c = hash2d(ix, iz + 1), d = hash2d(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
function fbm(x: number, z: number, octaves = 6): number {
  let val = 0, amp = 1, freq = 1, maxA = 0;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, z * freq);
    maxA += amp; amp *= 0.46; freq *= 2.15;
  }
  return val / maxA;
}
function sstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* ─── Front range: Canyons ───────────────────────────────────── */
const CANYONS = [
  { z: +14, depth: 0.28, width: 2.0 },
  { z: +9,  depth: 0.24, width: 1.8 },
  { z: +3,  depth: 0.35, width: 2.6 },
  { z: -5,  depth: 0.35, width: 2.6 },
  { z: -12, depth: 0.24, width: 2.0 },
  { z: -18, depth: 0.20, width: 1.8 },
];

/* ─── Front range: Peaks — small bumps on the ridge ──────────── */
const PEAKS = [
  { x: 14, z:+20, h: 1.5, r: 5.0 },  // Grandeur
  { x: 14, z:+13, h: 1.5, r: 5.0 },  // Mt Aire
  { x: 16, z: +7, h: 2.5, r: 5.0 },  // Olympus
  { x: 18, z: +6, h: 3.0, r: 4.5 },  // Gobblers Knob
  { x: 18, z: +5, h: 3.0, r: 4.5 },  // Raymond
  { x: 19, z: +1, h: 3.2, r: 4.5 },  // Kessler
  { x: 20, z: -2, h: 4.0, r: 4.5 },  // Superior
  { x: 22, z: -3, h: 4.5, r: 5.0 },  // Twin Peaks — highest
  { x: 22, z: -6, h: 3.5, r: 4.5 },  // Hidden Peak
  { x: 23, z: -8, h: 4.2, r: 5.0 },  // Pfeifferhorn
  { x: 22, z:-10, h: 4.0, r: 4.5 },  // White Baldy
  { x: 21, z:-15, h: 3.5, r: 5.0 },  // Lone Peak
  { x: 19, z:-24, h: 2.0, r: 6.0 },  // Box Elder
];

/* ─── Front range terrain ────────────────────────────────────── */
const RIDGE_X = 18;

function frontH(wx: number, wz: number): number {
  // Wide base — steep west face, VERY wide east backcountry
  const dx = wx - RIDGE_X;
  const westHW = 14;
  const eastHW = 55;  // massive backcountry — rolling mountains extend far east
  const hw = dx < 0 ? westHW : eastHW;
  const xNorm = dx / hw;
  const zNorm = (wz - (-2)) / 42;

  // N-S taper only (no hard east cutoff — let it roll)
  const zR2 = zNorm * zNorm;
  if (zR2 >= 1) return 0;
  const xR2 = xNorm * xNorm;
  if (xR2 >= 1) return 0;

  // West side: steep dome falloff. East side: very gentle plateau
  let xFalloff: number;
  if (dx < 0) {
    xFalloff = Math.pow(1 - xR2, 1.8);  // steep west face
  } else {
    xFalloff = Math.pow(1 - xR2, 0.25);  // extremely gentle east — stays elevated far out
  }
  const zFalloff = Math.pow(1 - zR2, 1.0);

  // Base elevation — high, continuous
  const base = xFalloff * zFalloff * 6;

  // Ridge crest at front — subtle
  const ridgeDx = (wx - RIDGE_X) / 6;
  const ridge = Math.exp(-ridgeDx * ridgeDx) * zFalloff * 1.5;

  // Rolling waves EVERYWHERE — the whole range undulates
  const w1 = Math.sin(wx * 0.20 + wz * 0.14 + 1.5) * 0.5 + 0.5;
  const w2 = Math.sin(wx * 0.12 - wz * 0.18 + 3.8) * 0.5 + 0.5;
  const w3 = Math.sin(wx * 0.30 + wz * 0.06 + 0.7) * 0.4 + 0.5;
  const w4 = Math.sin(wx * 0.08 + wz * 0.25 + 5.2) * 0.3 + 0.5;
  // Waves are stronger on the back, subtle on the front
  const waveMix = dx > 0 ? 1.0 : 0.3;
  const wave = (w1 * 2.2 + w2 * 1.8 + w3 * 1.0 + w4 * 1.4) * xFalloff * zFalloff * waveMix;

  // Canyon cuts — only on the western front face
  let cut = 0;
  for (const c of CANYONS) {
    const dzC = (wz - c.z) / c.width;
    const canyon = c.depth * Math.exp(-dzC * dzC);
    const cxFade = sstep(RIDGE_X - 14, RIDGE_X - 8, wx) * (1 - sstep(RIDGE_X + 10, RIDGE_X + 18, wx));
    cut += canyon * cxFade * MAX_H;
  }

  // Sharp peak bumps
  let peaks = 0;
  for (const p of PEAKS) {
    const pdx = (wx - p.x) / p.r, pdz = (wz - p.z) / p.r;
    peaks += p.h * Math.exp(-(pdx * pdx + pdz * pdz) * 0.7);
  }

  // Texture noise
  const envelope = xFalloff * zFalloff;
  const noise = fbm(wx * 0.12 + 5.3, wz * 0.09 + 3.7, 5) * 1.4 * envelope;
  const detail = fbm(wx * 0.22 + 11.0, wz * 0.18 + 7.0, 4) * 0.6 * envelope;

  const h = base + ridge + wave + peaks + noise + detail - cut;

  // Soft edges — east side fades very gently
  const zEdge = Math.pow(Math.max(0, 1 - zR2), 0.35);
  const xEdge = dx < 0 ? Math.pow(Math.max(0, 1 - xR2), 0.3) : Math.pow(Math.max(0, 1 - xR2), 0.12);
  const edgeFade = Math.min(zEdge, xEdge);
  return Math.max(0, h) * edgeFade;
}

/* ─── Back range — wider, continuous, rolling ────────────────── */
const BACK_CX = 58;

function backH(wx: number, wz: number): number {
  const dx = wx - BACK_CX;
  const hw = 30;  // wide
  const xNorm = dx / hw;
  const zNorm = (wz - (-3)) / 46;
  const xR2 = xNorm * xNorm;
  const zR2 = zNorm * zNorm;
  if (xR2 >= 1 || zR2 >= 1) return 0;

  const xF = Math.pow(1 - xR2, 0.3);
  const zF = Math.pow(1 - zR2, 0.4);
  const env = xF * zF;

  // Rolling continuous wave — these mountains are a sea of ridges
  const w1 = Math.sin(wx * 0.22 + wz * 0.15 + 4.2) * 0.5 + 0.5;
  const w2 = Math.sin(wx * 0.14 - wz * 0.20 + 1.7) * 0.5 + 0.5;
  const w3 = Math.sin(wx * 0.35 + wz * 0.10 + 6.1) * 0.4 + 0.5;
  const wave = (w1 * 5.0 + w2 * 4.0 + w3 * 3.0) * env;

  // Secondary sharp peaks on the back range
  const p1 = Math.max(0, Math.sin(wz * 0.35 + 2.1)) * Math.max(0, Math.sin(wx * 0.25 + 1.4)) * 4.0 * env;
  const p2 = Math.max(0, Math.sin(wz * 0.50 - 0.8)) * Math.max(0, Math.sin(wx * 0.18 + 3.0)) * 3.0 * env;

  const base = env * 6;
  const noise = fbm(wx * 0.10 + 9.1, wz * 0.08 + 6.3, 5) * 2.5 * env;

  return Math.max(0, base + wave + p1 + p2 + noise);
}

/* ─── Color ──────────────────────────────────────────────────── */
function altColor(t: number): [number, number, number] {
  return [0.02 + t * 0.42, 0.04 + t * 0.60, 0.18 + t * 0.82];
}
function backColor(t: number): [number, number, number] {
  // Dimmer, more blue — further away
  return [0.01 + t * 0.18, 0.03 + t * 0.28, 0.14 + t * 0.45];
}

/* ─── Camera ─────────────────────────────────────────────────── */
const TARGET = new THREE.Vector3(10, MAX_H * 0.30, -2 * Z_STRETCH);

const KF_MOB = [
  { theta: Math.PI - 0.10, phi: 0.14, r: 115 },
  { theta: Math.PI * 0.60, phi: 0.30, r: 135 },
  { theta: Math.PI * 0.00, phi: 0.42, r: 150 },
  { theta: Math.PI * 1.40, phi: 0.30, r: 135 },
  { theta: Math.PI * 1.90, phi: 0.14, r: 115 },
];
const KF_DESK = [
  { theta: Math.PI - 0.10, phi: 0.12, r: 135 },
  { theta: Math.PI * 0.60, phi: 0.28, r: 160 },
  { theta: Math.PI * 0.00, phi: 0.40, r: 175 },
  { theta: Math.PI * 1.40, phi: 0.28, r: 160 },
  { theta: Math.PI * 1.90, phi: 0.12, r: 135 },
];

function orbitPos(theta: number, phi: number, r: number): THREE.Vector3 {
  return new THREE.Vector3(
    TARGET.x + r * Math.cos(phi) * Math.cos(theta),
    TARGET.y + r * Math.sin(phi),
    TARGET.z + r * Math.cos(phi) * Math.sin(theta),
  );
}
function lerpKf(s: number, kfs: typeof KF_DESK) {
  const idx = s * (kfs.length - 1);
  const a = Math.floor(idx), b = Math.min(a + 1, kfs.length - 1);
  const t = idx - a, e = t * t * (3 - 2 * t);
  return {
    theta: kfs[a].theta + (kfs[b].theta - kfs[a].theta) * e,
    phi:   kfs[a].phi   + (kfs[b].phi   - kfs[a].phi)   * e,
    r:     kfs[a].r     + (kfs[b].r     - kfs[a].r)     * e,
  };
}

export interface CameraInfo {
  camera: THREE.PerspectiveCamera;
  width:  number;
  height: number;
}
interface Props { onCameraUpdate?: (info: CameraInfo) => void }

export default function MountainGL({ onCameraUpdate }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const mobile = window.innerWidth < 768;
    const KFS = mobile ? KF_MOB : KF_DESK;
    const FOV = mobile ? 58 : 44;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0030);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 1200);

    /* ─── Build front range mesh ────────────────────────────── */
    const COLS = mobile ? 220 : 360;
    const ROWS = mobile ? 160 : 250;
    const XMIN = -2, XMAX = 72;
    const ZMIN = -42, ZMAX = 38;

    const H: number[][] = Array.from({ length: ROWS }, (_, zi) =>
      Array.from({ length: COLS }, (_, xi) => {
        const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
        return frontH(wx, wz);
      }),
    );

    const verts: number[] = [], colA: number[] = [];
    function seg(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number,
                 c: (t: number) => [number, number, number], maxH: number) {
      verts.push(x0, y0, z0, x1, y1, z1);
      const [r0, g0, b0] = c(y0 / maxH);
      const [r1, g1, b1] = c(y1 / maxH);
      colA.push(r0, g0, b0, r1, g1, b1);
    }

    for (let zi = 0; zi < ROWS; zi++) {
      const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
      const dz = wz * Z_STRETCH;
      for (let xi = 0; xi < COLS - 1; xi++) {
        const wx0 = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wx1 = XMIN + ((xi + 1) / (COLS - 1)) * (XMAX - XMIN);
        const h0 = H[zi][xi], h1 = H[zi][xi + 1];
        if (h0 > 0.08 || h1 > 0.08) {
          seg(wx0, h0, dz, wx1, h1, dz, altColor, MAX_H);
        }
      }
    }
    // Keep a copy of base positions for ripple animation
    const frontBasePos = new Float32Array(verts);

    /* ─── Build back range mesh ─────────────────────────────── */
    const B_COLS = mobile ? 100 : 160;
    const B_ROWS = mobile ? 80 : 130;
    const BX0 = 30, BX1 = 90;
    const BZ0 = -44, BZ1 = 40;

    const BH: number[][] = Array.from({ length: B_ROWS }, (_, zi) =>
      Array.from({ length: B_COLS }, (_, xi) => {
        const wx = BX0 + (xi / (B_COLS - 1)) * (BX1 - BX0);
        const wz = BZ0 + (zi / (B_ROWS - 1)) * (BZ1 - BZ0);
        return backH(wx, wz);
      }),
    );

    const bVerts: number[] = [], bCols: number[] = [];
    function bSeg(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
      bVerts.push(x0, y0, z0, x1, y1, z1);
      const [r0, g0, b0] = backColor(y0 / MAX_H);
      const [r1, g1, b1] = backColor(y1 / MAX_H);
      bCols.push(r0, g0, b0, r1, g1, b1);
    }

    for (let zi = 0; zi < B_ROWS; zi++) {
      const wz = BZ0 + (zi / (B_ROWS - 1)) * (BZ1 - BZ0);
      const dz = wz * Z_STRETCH;
      for (let xi = 0; xi < B_COLS - 1; xi++) {
        const wx0 = BX0 + (xi / (B_COLS - 1)) * (BX1 - BX0);
        const wx1 = BX0 + ((xi + 1) / (B_COLS - 1)) * (BX1 - BX0);
        const h0 = BH[zi][xi], h1 = BH[zi][xi + 1];
        if (h0 > 0.08 || h1 > 0.08) {
          bSeg(wx0, h0, dz, wx1, h1, dz);
        }
      }
    }

    const backBasePos = new Float32Array(bVerts);
    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute("position", new THREE.Float32BufferAttribute(bVerts, 3));
    bGeo.setAttribute("color", new THREE.Float32BufferAttribute(bCols, 3));
    const bMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.45 });
    scene.add(new THREE.LineSegments(bGeo, bMat));

    /* ─── Skirt lines ────────────────────────────────────────── */
    const skirtVerts: number[] = [], skirtCols: number[] = [];
    const skirtStep = mobile ? 3 : 2;

    for (let zi = 0; zi < ROWS; zi += skirtStep) {
      const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
      const dz = wz * Z_STRETCH;
      for (let xi = 0; xi < COLS; xi++) {
        if (H[zi][xi] > 0.2) {
          const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
          skirtVerts.push(wx, H[zi][xi], dz, wx, 0, dz);
          const t = H[zi][xi] / MAX_H;
          skirtCols.push(0.02+t*0.16, 0.04+t*0.22, 0.14+t*0.30, 0.01, 0.02, 0.06);
          break;
        }
      }
    }

    const skirtGeo = new THREE.BufferGeometry();
    skirtGeo.setAttribute("position", new THREE.Float32BufferAttribute(skirtVerts, 3));
    skirtGeo.setAttribute("color", new THREE.Float32BufferAttribute(skirtCols, 3));
    const skirtMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.50 });
    scene.add(new THREE.LineSegments(skirtGeo, skirtMat));

    /* ─── Front range mesh ───────────────────────────────────── */
    const frontPosArray = new Float32Array(verts);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(frontPosArray, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, opacity: 0.90, transparent: true });
    scene.add(new THREE.LineSegments(geo, mat));

    /* ─── Animated ground grid — mouse creates ripple waves ──── */
    const GE = mobile ? 200 : 350;
    const GSP = mobile ? 4.0 : 3.0;
    const gOp = 0.09;

    // Build grid as individual vertices so we can animate Y per-vertex
    const gridPositions: number[] = [];
    const gridColors: number[] = [];

    // E-W lines (rows of Z)
    const zLines: number[] = [];
    for (let z = -GE; z <= GE; z += GSP) zLines.push(z);
    const xLines: number[] = [];
    for (let x = -GE; x <= GE; x += GSP) xLines.push(x);

    // E-W horizontal lines
    for (const z of zLines) {
      for (let i = 0; i < xLines.length - 1; i++) {
        gridPositions.push(xLines[i], 0, z, xLines[i + 1], 0, z);
        gridColors.push(0.06*gOp, 0.12*gOp, 0.35*gOp, 0.06*gOp, 0.12*gOp, 0.35*gOp);
      }
    }
    // N-S vertical lines
    for (const x of xLines) {
      for (let i = 0; i < zLines.length - 1; i++) {
        gridPositions.push(x, 0, zLines[i], x, 0, zLines[i + 1]);
        gridColors.push(0.06*gOp, 0.12*gOp, 0.35*gOp, 0.06*gOp, 0.12*gOp, 0.35*gOp);
      }
    }

    const gridPosArray = new Float32Array(gridPositions);
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.BufferAttribute(gridPosArray, 3));
    gridGeo.setAttribute("color", new THREE.Float32BufferAttribute(gridColors, 3));
    const gridMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 });
    scene.add(new THREE.LineSegments(gridGeo, gridMat));

    // Raycaster for mouse→ground intersection
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const mouseWorld = new THREE.Vector3();
    // Trail of recent mouse positions for ripple persistence
    const ripples: Array<{ x: number; z: number; t: number }> = [];
    let clock = 0;

    /* ─── Interaction ────────────────────────────────────────── */
    const mouse = new THREE.Vector2();
    let scroll = 0;
    const camPos = new THREE.Vector3();
    camPos.copy(orbitPos(KFS[0].theta, KFS[0].phi, KFS[0].r));

    function resize() {
      if (!el) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scroll = max > 0 ? window.scrollY / max : 0;
    };
    const onMouse = (e: MouseEvent) => {
      mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });

    let raf = 0;
    let lastRippleTime = 0;

    function animate() {
      raf = requestAnimationFrame(animate);
      clock += 0.016; // ~60fps

      const kf = lerpKf(scroll, KFS);
      const dst = orbitPos(kf.theta + mouse.x * 0.03, kf.phi - mouse.y * 0.008, kf.r);
      camPos.lerp(dst, 0.035);
      camera.position.copy(camPos);
      camera.lookAt(TARGET);

      // Raycast mouse onto ground plane to find world position
      raycaster.setFromCamera(mouse, camera);
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        mouseWorld.copy(hitPoint);
        // Add ripple source every few frames
        if (clock - lastRippleTime > 0.08) {
          ripples.push({ x: hitPoint.x, z: hitPoint.z, t: clock });
          lastRippleTime = clock;
          // Keep max 30 ripples
          if (ripples.length > 30) ripples.shift();
        }
      } else {
      }

      // Animate grid vertices — ripple waves from mouse/trail
      const pos = gridGeo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        const vx = gridPositions[i];
        const vz = gridPositions[i + 2];
        let yOff = 0;

        // Sum ripple contributions from all active ripples
        for (const rip of ripples) {
          const age = clock - rip.t;
          if (age > 4) continue; // ripple dies after 4s
          const dx = vx - rip.x;
          const dz = vz - rip.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const rippleRadius = age * 35; // expanding ring
          const ringDist = Math.abs(dist - rippleRadius);
          const ringWidth = 12;
          if (ringDist < ringWidth) {
            const ringStrength = (1 - ringDist / ringWidth);
            const decay = Math.exp(-age * 1.2); // fade over time
            const distDecay = Math.exp(-dist * 0.008); // fade with distance
            yOff += Math.sin(dist * 0.3 - age * 6) * ringStrength * decay * distDecay * 1.2;
          }
        }

        // Subtle ambient wave even without mouse
        yOff += Math.sin(vx * 0.04 + clock * 0.8) * Math.sin(vz * 0.04 + clock * 0.6) * 0.15;

        arr[i + 1] = yOff;
      }
      pos.needsUpdate = true;

      // Expire old ripples
      while (ripples.length > 0 && clock - ripples[0].t > 4) ripples.shift();

      // Ripple the mountain meshes too
      function applyMtnRipple(baseArr: Float32Array, liveArr: Float32Array, geoObj: THREE.BufferGeometry) {
        for (let i = 0; i < liveArr.length; i += 3) {
          const bx = baseArr[i], by = baseArr[i + 1], bz = baseArr[i + 2];
          let yOff = 0;
          for (const rip of ripples) {
            const age = clock - rip.t;
            if (age > 4) continue;
            const dx = bx - rip.x;
            const dz = bz - rip.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const rippleRadius = age * 35;
            const ringDist = Math.abs(dist - rippleRadius);
            const ringWidth = 15;
            if (ringDist < ringWidth) {
              const ringStrength = (1 - ringDist / ringWidth);
              const decay = Math.exp(-age * 1.0);
              const distDecay = Math.exp(-dist * 0.006);
              // Scale wave by base height — higher terrain gets bigger waves
              const heightScale = 0.5 + (by / MAX_H) * 1.5;
              yOff += Math.sin(dist * 0.25 - age * 5) * ringStrength * decay * distDecay * 0.8 * heightScale;
            }
          }
          // Ambient breathing
          yOff += Math.sin(bx * 0.05 + clock * 0.6) * Math.sin(bz * 0.04 + clock * 0.5) * 0.12;
          liveArr[i + 1] = by + yOff;
        }
        (geoObj.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }
      applyMtnRipple(frontBasePos, frontPosArray, geo);

      // Back range ripple (subtler)
      const bPosArr = bGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < bPosArr.length; i += 3) {
        const by = backBasePos[i + 1];
        const bx = backBasePos[i], bz = backBasePos[i + 2];
        let yOff = Math.sin(bx * 0.04 + clock * 0.4) * Math.sin(bz * 0.03 + clock * 0.35) * 0.10;
        for (const rip of ripples) {
          const age = clock - rip.t;
          if (age > 4) continue;
          const dist = Math.sqrt((bx - rip.x) * (bx - rip.x) + (bz - rip.z) * (bz - rip.z));
          const rippleRadius = age * 35;
          const ringDist = Math.abs(dist - rippleRadius);
          if (ringDist < 18) {
            const rs = (1 - ringDist / 18) * Math.exp(-age * 1.2) * Math.exp(-dist * 0.008);
            yOff += Math.sin(dist * 0.2 - age * 4.5) * rs * 0.5;
          }
        }
        bPosArr[i + 1] = by + yOff;
      }
      (bGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      renderer.render(scene, camera);
      if (el) onCameraUpdate?.({ camera, width: el.clientWidth, height: el.clientHeight });
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
      ro.disconnect();
      geo.dispose(); mat.dispose();
      bGeo.dispose(); bMat.dispose();
      skirtGeo.dispose(); skirtMat.dispose();
      gridGeo.dispose(); gridMat.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onCameraUpdate]);

  return (
    <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
  );
}
