"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  ═══════════════════════════════════════════════════════════════
  CENTRAL WASATCH — accurate geometry, 360° orbital camera
  ═══════════════════════════════════════════════════════════════

  SOURCE: Andy Earl "Central Range" map (Central Wasatch, Utah)
  The range covered is Grandeur Peak (north) → Box Elder (south)
  — roughly 15 miles, the section directly above SLC.

  COORDINATE SYSTEM
  ─────────────────
  X-axis : West → East   (positive = deeper into range)
  Z-axis : South → North (positive = north)
  Y-axis : elevation (MAX_H = 65 world-units)

  ACCURACY NOTES
  ──────────────
  – Shape: compact whale / teardrop mass.  Not a straight ridge.
  – Mt Olympus is an isolated massif on the NW flank,
    noticeably lower than the central crest.
  – The high crest runs Kessler → Broads Fork Twins → Pfeifferhorn
    as one continuous ridge (no gap).
  – Lone Peak stands slightly apart to the south.
  – Natural edge taper at X > 22 and at Z extremes.
    No vertical walls at terrain boundary.

  ORBIT
  ──────
  KF[0]  θ=π        West  — SLC valley, west face
  KF[1]  θ=3π/2     South — south flank
  KF[2]  θ=2π       East  — back face, elevated
  KF[3]  θ=5π/2     North — north flank, Grandeur close
  KF[4]  θ=3π       West  — full circle complete
*/

const MAX_H = 65;

/*
  Peaks ordered north (left on west view) → south (right).
  Positions calibrated to the Andy Earl map.
  sx/sz = Gaussian half-widths; wider = broader, smoother base.
*/
const PEAKS = [
  // ── North / NW flank ────────────────────────────────────────
  { x:  8, z: +16, h: 0.58, sx:10, sz: 9 }, // Grandeur Peak    9,299′
  { x: 10, z: +10, h: 0.67, sx: 8, sz: 7 }, // Mt Olympus       9,030′  isolated NW

  // ── High central crest (continuous ridge) ───────────────────
  { x: 13, z:  +6, h: 0.79, sx: 6, sz: 6 }, // Mount Raymond   10,241′
  { x: 14, z:  +3, h: 0.77, sx: 5, sz: 5 }, // Kessler Peak    10,403′
  { x: 14, z:  +1, h: 0.76, sx: 5, sz: 4 }, // Gobblers Knob   10,246′
  { x: 16, z:  -1, h: 0.93, sx: 5, sz: 4 }, // Mount Superior  11,032′
  { x: 17, z:  -2, h: 1.00, sx: 5, sz: 5 }, // Broads Fork Twins 11,330′ ← highest crest
  { x: 18, z:  -4, h: 0.90, sx: 5, sz: 4 }, // Hidden Peak     10,932′
  { x: 18, z:  -6, h: 0.97, sx: 4, sz: 4 }, // Pfeifferhorn    11,325′
  { x: 18, z:  -8, h: 0.96, sx: 5, sz: 4 }, // AF Twin Peaks   11,329′
  { x: 17, z: -10, h: 0.94, sx: 5, sz: 4 }, // White Baldy     11,321′

  // ── Lone Peak massif (separated by saddle) ──────────────────
  { x: 16, z: -14, h: 0.92, sx: 6, sz: 6 }, // Lone Peak       11,253′

  // ── Southern tail ────────────────────────────────────────────
  { x: 15, z: -20, h: 0.78, sx: 7, sz: 7 }, // Box Elder Peak  11,101′

  // ── Ridge backbone (elongated low Gaussian for continuous crest look) ──
  { x: 15, z:   0, h: 0.38, sx: 4, sz:20 }, // ridge spine N-S
];

function terrainH(wx: number, wz: number): number {
  // Broad base that rises west→east
  const base = Math.max(0, (wx + 65) / 150) * 0.14;
  let h = base;
  for (const p of PEAKS) {
    const dx = (wx - p.x) / p.sx;
    const dz = (wz - p.z) / p.sz;
    h += p.h * Math.exp(-(dx * dx + dz * dz));
  }

  // ── Edge tapers — eliminate vertical boundary walls ──
  // East taper: height → 0 as x approaches XMAX
  const xFade = 1 - Math.max(0, Math.min(1, (wx - 22) / 12));
  // North/south taper: height → 0 at Z edges
  const zFade = Math.min(
    Math.max(0, Math.min(1, (wz - ZMIN_CONST) / 7)),
    Math.max(0, Math.min(1, (ZMAX_CONST - wz) / 7)),
  );

  return Math.min(1, Math.max(0, h)) * xFade * zFade;
}

// These constants mirror the terrain build below; used in terrainH
const ZMIN_CONST = -26;
const ZMAX_CONST = +24;

function altColor(t: number): [number, number, number] {
  // Valley / foothills: dark navy → crest: bright ice-blue / near-white
  return [
    0.02 + t * 0.33,
    0.04 + t * 0.52,
    0.20 + t * 0.78,
  ];
}

// Look target: slightly east of centre, near mid-elevation
const TARGET = new THREE.Vector3(12, MAX_H * 0.45, -1);

/*
  360° Keyframes.
  theta sweeps π → 3π  (one full clockwise orbit, top-down view).
  Adjusted r for the more compact terrain footprint.
*/
const KF_MOB = [
  { theta: Math.PI,          phi: 0.20, r:  82 }, // West  — SLC valley
  { theta: Math.PI * 1.50,   phi: 0.09, r:  92 }, // South — south flank
  { theta: Math.PI * 2.00,   phi: 0.30, r: 130 }, // East  — back face, elevated
  { theta: Math.PI * 2.50,   phi: 0.14, r:  95 }, // North — north flank
  { theta: Math.PI * 3.00,   phi: 0.20, r:  82 }, // West  — complete
];
const KF_DESK = [
  { theta: Math.PI,          phi: 0.17, r: 110 }, // West
  { theta: Math.PI * 1.50,   phi: 0.08, r: 125 }, // South
  { theta: Math.PI * 2.00,   phi: 0.28, r: 162 }, // East
  { theta: Math.PI * 2.50,   phi: 0.11, r: 128 }, // North
  { theta: Math.PI * 3.00,   phi: 0.17, r: 110 }, // West
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
  const a   = Math.floor(idx), b = Math.min(a + 1, kfs.length - 1);
  const t   = idx - a, e = t * t * (3 - 2 * t);
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
    const FOV     = mobile ? 72 : 52;
    const FOG_DEN = mobile ? 0.0010 : 0.0022;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, FOG_DEN);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 1000);

    const COLS = mobile ? 150 : 220;
    const ROWS = mobile ? 110 : 160;
    // Compact terrain: Central Wasatch only (matches Andy Earl map)
    const XMIN = -100, XMAX = 34;
    const ZMIN =   ZMIN_CONST, ZMAX = ZMAX_CONST;

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
    for(let zi=0;zi<ROWS;zi++){
      const wz=ZMIN+(zi/(ROWS-1))*(ZMAX-ZMIN);
      for(let xi=0;xi<COLS-1;xi++){
        const wx0=XMIN+(xi/(COLS-1))*(XMAX-XMIN);
        const wx1=XMIN+((xi+1)/(COLS-1))*(XMAX-XMIN);
        seg(wx0,H[zi][xi],wz,wx1,H[zi][xi+1],wz);
      }
    }
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
    camPos.copy(orbitPos(KF_MOB[0].theta, KF_MOB[0].phi, KF_MOB[0].r));

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
      mouse.set((e.clientX/window.innerWidth)*2-1, (e.clientY/window.innerHeight)*2-1);
    };
    window.addEventListener("scroll",    onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse,  { passive: true });

    let raf = 0;
    function animate(){
      raf = requestAnimationFrame(animate);
      const kf  = lerpKf(scroll, KFS);
      const dst = orbitPos(kf.theta + mouse.x*0.04, kf.phi - mouse.y*0.015, kf.r);
      camPos.lerp(dst, 0.035);
      camera.position.copy(camPos);
      camera.lookAt(TARGET);
      renderer.render(scene, camera);
      if(el) onCameraUpdate?.({ camera, width: el.clientWidth, height: el.clientHeight });
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
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
