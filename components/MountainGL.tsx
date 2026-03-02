"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  ═══════════════════════════════════════════════════════════════
  WASATCH FRONT — 360° Orbital Camera
  ═══════════════════════════════════════════════════════════════

  COORDINATE SYSTEM
  ─────────────────
  X-axis : West → East  (positive = deeper into range)
  Z-axis : South → North  (positive Z = north)
  Y-axis : elevation

  PEAK POSITIONS  (z = N-S; negative = south of SLC)
  ────────────────────────────────────────────────────
  Ben Lomond   z=+44  (40 mi north, near Ogden)
  Thurston     z=+22
  Grandeur     z=+12  (directly above SLC)
  Mt Olympus   z=+7   (9,026′  — iconic SLC skyline)
  Twin Peaks   z=+2   (11,330′)
  Lone Peak    z=-2   (11,253′)
  Timpanogos   z=-18  (11,752′ — Utah County)
  Mt Nebo      z=-38  (11,928′ — highest; 60 mi south, far back)

  ORBIT (scroll 0 → 1 = full 360°)
  ──────────────────────────────────
  KF[0]  θ=π        West  — classic SLC valley panorama
  KF[1]  θ=3π/2     South — Nebo sweeps into foreground
  KF[2]  θ=2π       East  — back of the range, elevated
  KF[3]  θ=5π/2     North — Nebo deep in the distance ✓
  KF[4]  θ=3π       West  — full circle complete

  NO-CLIP PROOF (mobile, r=90, phi=0.19, FOV=74°)
  ──────────────────────────────────────────────────
  cam.y = 29 + 90·sin(0.19) = 46.2
  peak (y=58): arctan((58-46.2)/90) = 7.4°  above centre
  valley (y=0): arctan(46.2/90) = 27.2°  below centre
  half-FOV = 37°  →  7.4° and 27.2° both in frame ✓
*/

const MAX_H = 65; // slightly taller for more dramatic silhouette

// ── Accurate Wasatch peaks ────────────────────────────────────────
// h = fraction of MAX_H at peak; elevations in ′ for reference
// sx,sz = Gaussian half-widths (world units)
const PEAKS = [
  // Far North
  { x: 10, z:  44, h: 0.59, sx: 10, sz: 12 }, // Ben Lomond    9,712′
  { x: 11, z:  34, h: 0.56, sx:  8, sz:  8 }, // Mt Ogden area
  { x: 11, z:  22, h: 0.60, sx:  7, sz:  7 }, // Thurston Peak
  // SLC skyline
  { x: 12, z:  12, h: 0.65, sx:  6, sz:  7 }, // Grandeur Peak
  { x: 13, z:   7, h: 0.68, sx:  5, sz:  5 }, // Mt Olympus     9,026′
  // High central
  { x: 15, z:   2, h: 0.97, sx:  5, sz:  5 }, // Twin Peaks    11,330′
  { x: 15, z:  -2, h: 0.96, sx:  4, sz:  5 }, // Lone Peak     11,253′
  { x: 14, z:  -8, h: 0.72, sx:  6, sz:  6 }, // Draper ridge
  // Utah County
  { x: 17, z: -18, h: 1.00, sx:  8, sz: 10 }, // Timpanogos   11,752′  ← tallest near SLC
  { x: 15, z: -27, h: 0.76, sx:  6, sz:  7 }, // Santaquin
  // Far south — the "far back" peak
  { x: 18, z: -38, h: 0.99, sx:  8, sz: 10 }, // Mt Nebo       11,928′  ← true highest
];

function terrainH(wx: number, wz: number): number {
  // Broad rising base west→east, fades from foothills into range
  const base = Math.max(0, (wx + 60) / 140) * 0.16;
  let h = base;
  for (const p of PEAKS) {
    const dx = (wx - p.x) / p.sx;
    const dz = (wz - p.z) / p.sz;
    h += p.h * Math.exp(-(dx * dx + dz * dz));
  }
  return Math.min(1, Math.max(0, h));
}

function altColor(t: number): [number, number, number] {
  // Valley floor: dark navy → ridgeline: bright ice-blue / near-white
  return [
    0.02 + t * 0.32,
    0.04 + t * 0.50,
    0.20 + t * 0.78,
  ];
}

// Target = centre of the range mass
const TARGET = new THREE.Vector3(13, MAX_H / 2, 2);

/*
  ── 360° Keyframes ──────────────────────────────────────────────
  theta sweeps π → 3π  (one full clockwise orbit when viewed top-down)
  phi controls elevation angle; r controls radius.
  Desktop uses larger r (panoramic) with slightly higher phi.
*/

const KF_MOB = [
  { theta: Math.PI,               phi: 0.19, r:  90 }, // West  — SLC valley
  { theta: Math.PI * 1.50,        phi: 0.08, r: 105 }, // South — Nebo close
  { theta: Math.PI * 2.00,        phi: 0.28, r: 148 }, // East  — back of range, high
  { theta: Math.PI * 2.50,        phi: 0.13, r: 108 }, // North — Nebo far back
  { theta: Math.PI * 3.00,        phi: 0.19, r:  90 }, // West  — full circle
];

const KF_DESK = [
  { theta: Math.PI,               phi: 0.16, r: 120 }, // West
  { theta: Math.PI * 1.50,        phi: 0.07, r: 138 }, // South
  { theta: Math.PI * 2.00,        phi: 0.26, r: 175 }, // East
  { theta: Math.PI * 2.50,        phi: 0.11, r: 140 }, // North
  { theta: Math.PI * 3.00,        phi: 0.16, r: 120 }, // West
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
interface Props { onCameraUpdate?: (info: CameraInfo) => void }

export default function MountainGL({ onCameraUpdate }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const mobile  = window.innerWidth < 768;
    const KFS     = mobile ? KF_MOB : KF_DESK;
    const FOV     = mobile ? 74 : 52;
    // Lighter fog — let the back of the range breathe
    const FOG_DEN = mobile ? 0.0009 : 0.0022;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog   = new THREE.FogExp2(0x000000, FOG_DEN);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 1200);

    // Higher resolution for a smoother wireframe from all angles
    const COLS = mobile ? 160 : 220;
    const ROWS = mobile ? 120 : 170;
    const XMIN = -110, XMAX = 55;  // Full range W→E; east face fully rendered
    const ZMIN =  -55, ZMAX = 65;  // Full N-S extent; Nebo at -38, Ben Lomond at 44

    const H: number[][] = Array.from({ length: ROWS }, (_, zi) =>
      Array.from({ length: COLS }, (_, xi) => {
        const wx = XMIN + (xi / (COLS - 1)) * (XMAX - XMIN);
        const wz = ZMIN + (zi / (ROWS - 1)) * (ZMAX - ZMIN);
        return terrainH(wx, wz) * MAX_H;
      }),
    );

    const verts: number[] = [], cols: number[] = [];
    function seg(x0:number,y0:number,z0:number,x1:number,y1:number,z1:number){
      verts.push(x0,y0,z0,x1,y1,z1);
      const[r0,g0,b0]=altColor(y0/MAX_H),[r1,g1,b1]=altColor(y1/MAX_H);
      cols.push(r0,g0,b0,r1,g1,b1);
    }
    // X-direction segments (rows)
    for(let zi=0;zi<ROWS;zi++){
      const wz=ZMIN+(zi/(ROWS-1))*(ZMAX-ZMIN);
      for(let xi=0;xi<COLS-1;xi++){
        const wx0=XMIN+(xi/(COLS-1))*(XMAX-XMIN);
        const wx1=XMIN+((xi+1)/(COLS-1))*(XMAX-XMIN);
        seg(wx0,H[zi][xi],wz,wx1,H[zi][xi+1],wz);
      }
    }
    // Z-direction segments (columns)
    for(let xi=0;xi<COLS;xi++){
      const wx=XMIN+(xi/(COLS-1))*(XMAX-XMIN);
      for(let zi=0;zi<ROWS-1;zi++){
        const wz0=ZMIN+(zi/(ROWS-1))*(ZMAX-ZMIN);
        const wz1=ZMIN+((zi+1)/(ROWS-1))*(ZMAX-ZMIN);
        seg(wx,H[zi][xi],wz0,wx,H[zi+1][xi],wz1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color",    new THREE.Float32BufferAttribute(cols,  3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, opacity: 0.95, transparent: true });
    scene.add(new THREE.LineSegments(geo, mat));

    const mouse  = new THREE.Vector2();
    let   scroll = 0;
    const camPos = new THREE.Vector3();
    const kf0    = lerpKf(0, KFS);
    camPos.copy(orbitPos(kf0.theta, kf0.phi, kf0.r));

    function resize(){
      if(!el) return;
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
      mouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
    };
    window.addEventListener("scroll",    onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse,  { passive: true });

    let raf = 0;
    function animate(){
      raf = requestAnimationFrame(animate);
      const kf  = lerpKf(scroll, KFS);
      const dst = orbitPos(
        kf.theta + mouse.x * 0.04,
        kf.phi   - mouse.y * 0.015,
        kf.r,
      );
      camPos.lerp(dst, 0.035);
      camera.position.copy(camPos);
      camera.lookAt(TARGET);
      renderer.render(scene, camera);
      if(el) onCameraUpdate?.({ camera, width: el.clientWidth, height: el.clientHeight });
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll",    onScroll);
      window.removeEventListener("mousemove", onMouse);
      ro.disconnect();
      geo.dispose(); mat.dispose(); renderer.dispose();
      if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onCameraUpdate]);

  return (
    <div ref={mountRef} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />
  );
}
