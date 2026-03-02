"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════
   Wasatch Front — 3D wireframe mountain range
   ─────────────────────────────────────────────────────────────────
   COORDINATE SYSTEM
     • The real Wasatch runs North–South.  In our world-space that
       means peaks are spread along the Z-axis (z=−30 Nebo → z=42
       Ben Lomond).  The range rises from valley floor (y≈0) to peaks
       (y≈58 = MAX_H × 1.0).
     • The Salt Lake Valley lies to the WEST (negative-X).
       → Camera must sit at negative-X (theta ≈ π) and look EAST.
         This is the only angle where the range appears as a
         horizontal panorama; any other theta makes it look sideways.

   CAMERA MATH
     orbitPos(theta, phi, r, target):
       x = target.x + r·cos(phi)·cos(theta)
       y = target.y + r·sin(phi)
       z = target.z + r·cos(phi)·sin(theta)

     For theta = π:  cos(θ)=−1, sin(θ)=0 → camera directly west
     phi < 0  → camera y < target.y → looking UPWARD at peaks
     phi > 0  → camera y > target.y → looking downward (eagle view)

   MOBILE HERO GEOMETRY  (verified, no clipping)
     TARGET_MOB = (8, 45, 0)   r=88   phi=−0.20
     Camera y  = 45 + 88·sin(−0.20) = 45 − 17.5 = 27.5
     Peak (y=58) angle above look direction ≈ +7°  (upper third ✓)
     Valley (y=0) angle below look direction ≈ −30° (within ±37.5° FOV ✓)
═══════════════════════════════════════════════════════════════════ */

const PEAKS = [
  { x:  8, z:  42, h: 0.78, sx:  9, sz:  9 }, // Ben Lomond       9,712′
  { x:  9, z:  28, h: 0.68, sx:  8, sz:  8 }, // Weber / Farmington
  { x: 10, z:  14, h: 0.71, sx:  7, sz:  7 }, // Grandeur Peak
  { x: 12, z:   7, h: 0.76, sx:  6, sz:  5 }, // Mount Olympus     9,026′
  { x: 15, z:   3, h: 0.94, sx:  4, sz:  4 }, // Twin Peaks       11,330′
  { x: 16, z:  -1, h: 0.93, sx:  4, sz:  4 }, // Lone Peak        11,253′
  { x: 14, z:  -5, h: 0.82, sx:  5, sz:  5 }, // Draper ridge
  { x: 18, z: -16, h: 0.99, sx:  7, sz:  8 }, // Mt Timpanogos   11,752′
  { x: 16, z: -30, h: 1.00, sx:  6, sz:  7 }, // Mount Nebo      11,928′
];

function foothill(wx: number): number {
  if (wx < -50) return 0;
  const t = Math.max(0, (wx + 50) / 50);
  return t * (wx < 0 ? 0.06 : 0.06 + wx / 80 * 0.10);
}
function terrainH(wx: number, wz: number): number {
  let h = foothill(wx);
  for (const p of PEAKS) {
    const dx = (wx - p.x) / p.sx;
    const dz = (wz - p.z) / p.sz;
    h += p.h * Math.exp(-(dx * dx + dz * dz));
  }
  return Math.min(1, Math.max(0, h));
}
function altColor(t: number): [number, number, number] {
  // deep navy foothills → bright ice-blue peaks
  return [0.02 + t * 0.22, 0.04 + t * 0.42, 0.20 + t * 0.75];
}

/* ── Camera targets ─────────────────────────────────────────────── */
const T_DESK = new THREE.Vector3(8, 20, 0);
const T_MOB  = new THREE.Vector3(8, 45, 0); // aim high → peaks in upper frame

/*
  All keyframes use theta ≈ π (west-side camera, looking east).
  Small variation in theta gives a gentle orbital sweep.

  Desktop: elevated panoramic — phi 0.18–0.28, r 130–160
  Mobile:  valley-level, looking up — phi ≈ −0.20, r ≈ 88
*/
const KF_DESK = [
  { theta: Math.PI + 0.20, phi: 0.22, r: 155 }, // SW, elevated
  { theta: Math.PI        , phi: 0.26, r: 140 }, // due W, elevated
  { theta: Math.PI - 0.25, phi: 0.20, r: 130 }, // NW, slightly lower
  { theta: Math.PI - 0.55, phi: 0.24, r: 150 }, // N-NW sweep
];
const KF_MOB = [
  { theta: Math.PI + 0.15, phi: -0.20, r: 88 }, // valley floor, W-SW
  { theta: Math.PI        , phi: -0.14, r: 84 }, // due W, still low
  { theta: Math.PI - 0.20, phi: -0.08, r: 80 }, // W-NW, rising slightly
  { theta: Math.PI + 0.35, phi: -0.18, r: 90 }, // W-SW, back to valley
];

function orbitPos(
  theta: number, phi: number, r: number,
  target: THREE.Vector3,
): THREE.Vector3 {
  return new THREE.Vector3(
    target.x + r * Math.cos(phi) * Math.cos(theta),
    target.y + r * Math.sin(phi),
    target.z + r * Math.cos(phi) * Math.sin(theta),
  );
}

function lerpKf(
  scroll: number,
  kfs: { theta: number; phi: number; r: number }[],
) {
  const idx = scroll * (kfs.length - 1);
  const a   = Math.floor(idx);
  const b   = Math.min(a + 1, kfs.length - 1);
  const t   = idx - a;
  const e   = t * t * (3 - 2 * t); // smoothstep
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
interface Props {
  onCameraUpdate?: (info: CameraInfo) => void;
}

export default function MountainGL({ onCameraUpdate }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const mobile = window.innerWidth < 768;
    const KFS    = mobile ? KF_MOB  : KF_DESK;
    const TARGET = mobile ? T_MOB   : T_DESK;
    const FOV    = mobile ? 75 : 48;         // wide mobile FOV fits valley-to-peaks
    const FOG    = mobile ? 0.0025 : 0.0040; // crisper peaks on mobile

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, FOG);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 800);

    // Extended west boundary so valley floor fills the frame
    const COLS = mobile ? 120 : 180;
    const ROWS = mobile ? 90  : 130;
    const XMIN = -85, XMAX = 35;   // −85 puts terrain at camera's feet on mobile
    const ZMIN = -48, ZMAX = 55;
    const MAX_H = 58;

    const H: number[][] = Array.from({ length: ROWS }, (_, zi) =>
      Array.from({ length: COLS }, (_, xi) => {
        const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
        return terrainH(wx, wz) * MAX_H;
      }),
    );

    const verts: number[] = [];
    const cols:  number[] = [];

    function seg(
      x0: number, y0: number, z0: number,
      x1: number, y1: number, z1: number,
    ) {
      verts.push(x0, y0, z0, x1, y1, z1);
      const [r0, g0, b0] = altColor(y0 / MAX_H);
      const [r1, g1, b1] = altColor(y1 / MAX_H);
      cols.push(r0, g0, b0, r1, g1, b1);
    }

    // X-direction line segments (rows of wire)
    for (let zi = 0; zi < ROWS; zi++) {
      const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
      for (let xi = 0; xi < COLS - 1; xi++) {
        const wx0 = XMIN + (xi       / (COLS - 1)) * (XMAX - XMIN);
        const wx1 = XMIN + ((xi + 1) / (COLS - 1)) * (XMAX - XMIN);
        seg(wx0, H[zi][xi], wz, wx1, H[zi][xi + 1], wz);
      }
    }
    // Z-direction line segments (columns of wire)
    for (let xi = 0; xi < COLS; xi++) {
      const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
      for (let zi = 0; zi < ROWS - 1; zi++) {
        const wz0 = ZMIN + (zi       / (ROWS - 1)) * (ZMAX - ZMIN);
        const wz1 = ZMIN + ((zi + 1) / (ROWS - 1)) * (ZMAX - ZMIN);
        seg(wx, H[zi][xi], wz0, wx, H[zi + 1][xi], wz1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color",    new THREE.Float32BufferAttribute(cols,  3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.92,
    });
    scene.add(new THREE.LineSegments(geo, mat));

    const mouse  = new THREE.Vector2();
    let   scroll = 0;
    const camPos = new THREE.Vector3();
    const camTgt = new THREE.Vector3().copy(TARGET);

    // Seed initial position without lerp jump
    const kf0 = lerpKf(0, KFS);
    camPos.copy(orbitPos(kf0.theta, kf0.phi, kf0.r, TARGET));

    function resize() {
      if (!el) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scroll = max > 0 ? window.scrollY / max : 0;
    };
    const onMouse = (e: MouseEvent) => {
      mouse.set(
        (e.clientX / window.innerWidth)  * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
    };
    window.addEventListener("scroll",    onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse,  { passive: true });

    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      const kf  = lerpKf(scroll, KFS);
      const dst = orbitPos(
        kf.theta + mouse.x * 0.04,
        kf.phi   - mouse.y * 0.025,
        kf.r,
        TARGET,
      );
      camPos.lerp(dst, 0.030);
      camTgt.lerp(TARGET, 0.030);
      camera.position.copy(camPos);
      camera.lookAt(camTgt);
      renderer.render(scene, camera);
      if (el) onCameraUpdate?.({ camera, width: el.clientWidth, height: el.clientHeight });
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll",    onScroll);
      window.removeEventListener("mousemove", onMouse);
      ro.disconnect();
      geo.dispose(); mat.dispose(); renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onCameraUpdate]);

  return (
    <div
      ref={mountRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
