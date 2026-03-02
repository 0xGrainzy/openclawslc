"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  CENTRAL WASATCH — Wide backdrop with background ranges behind.
  Front range = main Wasatch (Olympus → Lone Peak).
  Behind it: backcountry ridgeline (Uintas-esque) at lower opacity.
  Peaks should be POINTY, not flat-topped.
*/

const MAX_H = 28;
const Z_STRETCH = 3.0;

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

/* ─── Front range: Peaks — sharp, tall ───────────────────────── */
const PEAKS = [
  { x: 14, z:+20, h: 7,  r: 3.0 },  // Grandeur
  { x: 14, z:+13, h: 7,  r: 2.8 },  // Mt Aire
  { x: 16, z: +7, h:12,  r: 2.8 },  // Olympus
  { x: 18, z: +6, h:15,  r: 2.4 },  // Gobblers Knob
  { x: 18, z: +5, h:15,  r: 2.4 },  // Raymond
  { x: 19, z: +1, h:16,  r: 2.5 },  // Kessler
  { x: 20, z: -2, h:20,  r: 2.5 },  // Superior
  { x: 22, z: -3, h:24,  r: 2.8 },  // Twin Peaks — highest
  { x: 22, z: -6, h:19,  r: 2.5 },  // Hidden Peak
  { x: 23, z: -8, h:23,  r: 2.6 },  // Pfeifferhorn
  { x: 22, z:-10, h:21,  r: 2.5 },  // White Baldy
  { x: 21, z:-15, h:18,  r: 2.8 },  // Lone Peak
  { x: 19, z:-24, h:10,  r: 3.5 },  // Box Elder
];

/* ─── Front range terrain ────────────────────────────────────── */
const RIDGE_X = 18;

function frontH(wx: number, wz: number): number {
  // Base envelope — narrow E-W, long N-S
  const dx = wx - RIDGE_X;
  const westHW = 14, eastHW = 22;
  const hw = dx < 0 ? westHW : eastHW;
  const xNorm = dx / hw;
  const zNorm = (wz - (-2)) / 28;
  const r2 = xNorm * xNorm + zNorm * zNorm;
  if (r2 >= 1) return 0;

  // Base elevation — moderate, provides the "body"
  const base = Math.pow(1 - r2, 1.6) * 8;

  // Ridge crest
  const ridgeDx = (wx - RIDGE_X) / 4;
  const ridge = Math.exp(-ridgeDx * ridgeDx) * Math.pow(Math.max(0, 1 - zNorm * zNorm), 0.8) * 5;

  // Canyon cuts — deep V-shapes
  let cut = 0;
  for (const c of CANYONS) {
    const dzC = (wz - c.z) / c.width;
    const canyon = c.depth * Math.exp(-dzC * dzC);
    // Canyons cut from west, deepen toward crest
    const xFade = sstep(RIDGE_X - 14, RIDGE_X - 8, wx) * (1 - sstep(RIDGE_X + 8, RIDGE_X + 14, wx));
    cut += canyon * xFade * MAX_H;
  }

  // Sharp peak bumps — these create the actual summits
  let peaks = 0;
  for (const p of PEAKS) {
    const pdx = (wx - p.x) / p.r, pdz = (wz - p.z) / p.r;
    const d2 = pdx * pdx + pdz * pdz;
    // Sharp falloff for pointy peaks
    peaks += p.h * Math.exp(-d2 * 1.2);
  }

  // Texture noise
  const noise = fbm(wx * 0.12 + 5.3, wz * 0.09 + 3.7, 5) * 2.5 * Math.pow(Math.max(0, 1 - r2), 1.5);

  const h = base + ridge + peaks + noise - cut;
  const edgeFade = Math.pow(Math.max(0, 1 - r2), 0.3);
  return Math.max(0, h) * edgeFade;
}

/* ─── Back range terrain (behind the front range) ────────────── */
const BACK_RIDGE_X = 42;
const BACK_PEAKS = [
  { x: 42, z: +18, h: 14, r: 4.0 },
  { x: 44, z: +10, h: 16, r: 3.5 },
  { x: 43, z: +2,  h: 18, r: 3.5 },
  { x: 45, z: -4,  h: 15, r: 4.0 },
  { x: 44, z: -10, h: 17, r: 3.8 },
  { x: 42, z: -18, h: 13, r: 4.5 },
  { x: 43, z: -25, h: 11, r: 4.0 },
];

function backH(wx: number, wz: number): number {
  const dx = wx - BACK_RIDGE_X;
  const hw = 16;
  const xNorm = dx / hw;
  const zNorm = (wz - (-3)) / 30;
  const r2 = xNorm * xNorm + zNorm * zNorm;
  if (r2 >= 1) return 0;

  const base = Math.pow(1 - r2, 1.4) * 6;

  let peaks = 0;
  for (const p of BACK_PEAKS) {
    const pdx = (wx - p.x) / p.r, pdz = (wz - p.z) / p.r;
    peaks += p.h * Math.exp(-(pdx * pdx + pdz * pdz) * 1.1);
  }

  const noise = fbm(wx * 0.10 + 9.1, wz * 0.08 + 6.3, 4) * 2.0 * Math.pow(Math.max(0, 1 - r2), 1.5);
  const h = base + peaks + noise;
  const edgeFade = Math.pow(Math.max(0, 1 - r2), 0.3);
  return Math.max(0, h) * edgeFade;
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
    const COLS = mobile ? 200 : 320;
    const ROWS = mobile ? 160 : 250;
    const XMIN = -2, XMAX = 38;
    const ZMIN = -30, ZMAX = 26;

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

    /* ─── Build back range mesh ─────────────────────────────── */
    const B_COLS = mobile ? 100 : 160;
    const B_ROWS = mobile ? 80 : 130;
    const BX0 = 28, BX1 = 60;
    const BZ0 = -32, BZ1 = 28;

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
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, opacity: 0.90, transparent: true });
    scene.add(new THREE.LineSegments(geo, mat));

    /* ─── Infinite ground grid ───────────────────────────────── */
    const gridVerts: number[] = [], gridCols: number[] = [];
    const GE = 400;
    const GSP = 3.0;
    const gOp = 0.09;
    for (let z = -GE; z <= GE; z += GSP) {
      gridVerts.push(-GE, 0, z, GE, 0, z);
      gridCols.push(0.06*gOp, 0.12*gOp, 0.35*gOp, 0.06*gOp, 0.12*gOp, 0.35*gOp);
    }
    for (let x = -GE; x <= GE; x += GSP) {
      gridVerts.push(x, 0, -GE, x, 0, GE);
      gridCols.push(0.06*gOp, 0.12*gOp, 0.35*gOp, 0.06*gOp, 0.12*gOp, 0.35*gOp);
    }

    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(gridVerts, 3));
    gridGeo.setAttribute("color", new THREE.Float32BufferAttribute(gridCols, 3));
    const gridMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 });
    scene.add(new THREE.LineSegments(gridGeo, gridMat));

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
    function animate() {
      raf = requestAnimationFrame(animate);
      const kf = lerpKf(scroll, KFS);
      const dst = orbitPos(kf.theta + mouse.x * 0.03, kf.phi - mouse.y * 0.008, kf.r);
      camPos.lerp(dst, 0.035);
      camera.position.copy(camPos);
      camera.lookAt(TARGET);
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
