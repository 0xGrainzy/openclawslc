"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   Wasatch Front — 3D wireframe mountain range.
   Real peak positions. Scroll drives orbital camera.
   Separate keyframes per device class for correct peak framing.
───────────────────────────────────────────────────────────────── */

const PEAKS = [
  {x:  8, z:  42, h: 0.78, sx:  9, sz:  9 }, // Ben Lomond
  {x:  9, z:  28, h: 0.68, sx:  8, sz:  8 }, // Weber area
  {x: 10, z:  14, h: 0.71, sx:  7, sz:  7 }, // Grandeur Peak
  {x: 12, z:   7, h: 0.76, sx:  6, sz:  5 }, // Mount Olympus
  {x: 15, z:   3, h: 0.94, sx:  4, sz:  4 }, // Twin Peaks
  {x: 16, z:  -1, h: 0.93, sx:  4, sz:  4 }, // Lone Peak
  {x: 14, z:  -5, h: 0.82, sx:  5, sz:  5 }, // Draper ridge
  {x: 18, z: -16, h: 0.99, sx:  7, sz:  8 }, // Mt Timpanogos
  {x: 16, z: -30, h: 1.00, sx:  6, sz:  7 }, // Mount Nebo
];

function foothill(wx: number): number {
  if (wx < -30) return 0;
  return Math.max(0, (wx + 30) / 30) * (wx < 0 ? 0.08 : 0.08 + wx / 80 * 0.12);
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
  return [0.02 + t * 0.20, 0.04 + t * 0.38, 0.18 + t * 0.72];
}

/*
  Camera geometry cheat-sheet
  ─────────────────────────────────────────
  TARGET.y = point the camera looks at (world space)
  phi > 0  = camera above target → looking DOWN  → peaks can overshoot top
  phi < 0  = camera below target → looking UP    → peaks fill upper frame naturally
  r        = orbital radius (smaller = closer / larger mountain)

  Mobile goal: valley-floor vantage (~y 40), r=88, phi≈-0.05
    camera.y = 44 + 88*sin(-0.05) = ~39.6
    peaks at y=58 → 9° above screen centre (well inside ±34° FOV@68°)
    base  at y=0  → 26° below screen centre (also inside FOV)
    → full mountain visible, peaks in upper third, close and dramatic
*/
const TARGET_DESK   = new THREE.Vector3(8, 18, 0);
const TARGET_MOBILE = new THREE.Vector3(8, 44, 0); // aim at upper mountain

/* Desktop: wide panoramic sweep */
const KEYFRAMES_DESK = [
  { theta:  1.65, phi: 0.30, r: 165 },
  { theta:  0.90, phi: 0.38, r: 140 },
  { theta:  0.10, phi: 0.50, r: 125 },
  { theta: -0.75, phi: 0.42, r: 155 },
];
/*
  Mobile: camera sits at valley elevation, looks slightly up.
  phi is negative (camera y < target y) → natural upward view.
  r is much smaller → mountain fills the viewport.
*/
const KEYFRAMES_MOB = [
  { theta:  1.65, phi: -0.05, r: 88 }, // side-valley hero shot
  { theta:  0.90, phi:  0.00, r: 82 }, // rotate around, climbing
  { theta:  0.10, phi:  0.06, r: 78 }, // oblique, slightly above foothills
  { theta: -0.55, phi: -0.03, r: 86 }, // sweeping south, back to valley
];

function orbitPos(theta: number, phi: number, r: number, target: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    target.x + r * Math.cos(phi) * Math.cos(theta),
    target.y + r * Math.sin(phi),
    target.z + r * Math.cos(phi) * Math.sin(theta),
  );
}
function lerpKf(scroll: number, kfs: typeof KEYFRAMES_DESK, rScale: number) {
  const idx  = scroll * (kfs.length - 1);
  const a    = Math.floor(idx), b = Math.min(a + 1, kfs.length - 1);
  const t    = idx - a, e = t * t * (3 - 2 * t);
  const A = kfs[a], B = kfs[b];
  return {
    theta: A.theta + (B.theta - A.theta) * e,
    phi:   A.phi   + (B.phi   - A.phi)   * e,
    r:    (A.r     + (B.r     - A.r)     * e) * rScale,
  };
}

export interface CameraInfo {
  camera: THREE.PerspectiveCamera;
  width: number;
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

    const mobile  = window.innerWidth < 768;
    const rScale  = 1.0; // r is baked into keyframes per device
    const KFS     = mobile ? KEYFRAMES_MOB : KEYFRAMES_DESK;
    const TARGET  = mobile ? TARGET_MOBILE  : TARGET_DESK;
    const FOV     = mobile ? 68 : 48;        // wider vertical FOV on mobile portrait
    const FOG     = mobile ? 0.0028 : 0.0042; // less fog on mobile → peaks stay crisp

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, FOG);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 800);

    const COLS = mobile ? 110 : 180, ROWS = mobile ? 80 : 130;
    const XMIN = -55, XMAX = 35, ZMIN = -45, ZMAX = 52, MAX_H = 58;

    const H: number[][] = Array.from({length: ROWS}, (_, zi) =>
      Array.from({length: COLS}, (_, xi) => {
        const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
        return terrainH(wx, wz) * MAX_H;
      })
    );

    const verts: number[] = [], cols: number[] = [];
    function seg(x0:number,y0:number,z0:number,x1:number,y1:number,z1:number) {
      verts.push(x0,y0,z0,x1,y1,z1);
      const [r0,g0,b0]=altColor(y0/MAX_H), [r1,g1,b1]=altColor(y1/MAX_H);
      cols.push(r0,g0,b0,r1,g1,b1);
    }
    for (let zi=0;zi<ROWS;zi++) {
      const wz=ZMIN+(zi/(ROWS-1))*(ZMAX-ZMIN);
      for (let xi=0;xi<COLS-1;xi++) {
        const wx0=XMIN+(xi/(COLS-1))*(XMAX-XMIN), wx1=XMIN+((xi+1)/(COLS-1))*(XMAX-XMIN);
        seg(wx0,H[zi][xi],wz,wx1,H[zi][xi+1],wz);
      }
    }
    for (let xi=0;xi<COLS;xi++) {
      const wx=XMIN+(xi/(COLS-1))*(XMAX-XMIN);
      for (let zi=0;zi<ROWS-1;zi++) {
        const wz0=ZMIN+(zi/(ROWS-1))*(ZMAX-ZMIN), wz1=ZMIN+((zi+1)/(ROWS-1))*(ZMAX-ZMIN);
        seg(wx,H[zi][xi],wz0,wx,H[zi+1][xi],wz1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color",    new THREE.Float32BufferAttribute(cols, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.90 });
    scene.add(new THREE.LineSegments(geo, mat));

    const mouse  = new THREE.Vector2();
    let   scroll = 0;
    const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3().copy(TARGET);
    const kf0    = lerpKf(0, KFS, rScale);
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
      mouse.set((e.clientX/window.innerWidth)*2-1, (e.clientY/window.innerHeight)*2-1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });

    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      const kf  = lerpKf(scroll, KFS, rScale);
      const tgt = orbitPos(kf.theta + mouse.x * 0.04, kf.phi - mouse.y * 0.025, kf.r, TARGET);
      camPos.lerp(tgt, 0.028);
      camTgt.lerp(TARGET, 0.028);
      camera.position.copy(camPos);
      camera.lookAt(camTgt);
      renderer.render(scene, camera);
      if (el) onCameraUpdate?.({ camera, width: el.clientWidth, height: el.clientHeight });
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
      ro.disconnect();
      geo.dispose(); mat.dispose(); renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onCameraUpdate]);

  return <div ref={mountRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}
