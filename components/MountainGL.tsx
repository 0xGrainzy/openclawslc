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
  Y-axis : elevation (MAX_H = 20 world-units — flat relief ratio ~1:5.5 N-S)

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

const MAX_H = 30; // height:N-S ≈ 1:3.7 — enough relief to read individual peaks

/*
  KEY FIX: narrow Gaussians (sz=2.5–3) with 4–6 unit Z-spacing.
  Overlap check with sz=2.5, spacing=4: exp(-(4/2.5)²) = 0.077 → 8% overlap.
  Peaks are individually visible instead of merging into a plateau.

  Peaks north→south (left→right on west face view).
*/
const PEAKS = [
  // ── North end — low, wide base ───────────────────────────────
  { x:  8, z: +16, h: 0.12, sx: 8, sz: 6.0 }, // Grandeur        9,299′  (very low)
  { x: 10, z: +10, h: 0.30, sx: 4, sz: 3.5 }, // Mt Olympus      9,030′  (isolated)

  // ── Rising toward crest — 4-unit spacing, sz=2.5 ────────────
  { x: 13, z:  +5, h: 0.52, sx: 3, sz: 2.5 }, // Mount Raymond  10,241′
  { x: 14, z:  +1, h: 0.62, sx: 3, sz: 2.5 }, // Kessler Peak   10,403′

  // ── High central crest — 4-unit spacing ─────────────────────
  { x: 16, z:  -3, h: 0.84, sx: 3, sz: 2.5 }, // Mount Superior 11,032′
  { x: 17, z:  -7, h: 1.00, sx: 3, sz: 3.0 }, // Broads Fork    11,330′ ← HIGHEST
  { x: 18, z: -11, h: 0.96, sx: 3, sz: 2.5 }, // Pfeifferhorn   11,325′

  // ── Lone Peak — 6-unit saddle break ─────────────────────────
  { x: 16, z: -17, h: 0.80, sx: 3, sz: 3.0 }, // Lone Peak      11,253′

  // ── South tail ───────────────────────────────────────────────
  { x: 15, z: -23, h: 0.52, sx: 5, sz: 4.0 }, // Box Elder      11,101′

  // ── Background dome — overall whale shape ───────────────────
  { x: 15, z:  -4, h: 0.20, sx: 6, sz:25.0 }, // range spine (low, wide)
];

function terrainH(wx: number, wz: number): number {
  // Minimal base — peaks dominate, not the terrain ramp
  const base = Math.max(0, (wx + 65) / 150) * 0.04;
  let h = base;
  for (const p of PEAKS) {
    const dx = (wx - p.x) / p.sx;
    const dz = (wz - p.z) / p.sz;
    h += p.h * Math.exp(-(dx * dx + dz * dz));
  }

  // ── Edge tapers — no hard boundaries anywhere ──────────────
  // East taper: smooth fade from x=18 → 0 at x=28
  const xFade = 1 - Math.max(0, Math.min(1, (wx - 18) / 10));
  // West taper: fade in from XMIN → full at XMIN+30
  const xWest = Math.max(0, Math.min(1, (wx - XMIN_CONST) / 30));
  // North/south: 30-unit ramp so edges are far from peaks
  const zFade = Math.min(
    Math.max(0, Math.min(1, (wz - ZMIN_CONST) / 30)),
    Math.max(0, Math.min(1, (ZMAX_CONST - wz) / 30)),
  );

  return Math.min(1, Math.max(0, h)) * xFade * xWest * zFade;
}

// Match terrain build constants
const XMIN_CONST = -120;
const ZMIN_CONST = -58;
const ZMAX_CONST = +52;

function altColor(t: number): [number, number, number] {
  // Valley / foothills: dark navy → crest: bright ice-blue / near-white
  return [
    0.02 + t * 0.33,
    0.04 + t * 0.52,
    0.20 + t * 0.78,
  ];
}

// Look target: range centre; y=MAX_H/2 keeps camera above the mass
const TARGET = new THREE.Vector3(12, MAX_H / 2, -1);

/*
  360° Keyframes.
  theta sweeps π → 3π  (one full clockwise orbit, top-down view).
  Adjusted r for the more compact terrain footprint.
*/
/*
  With MAX_H=20 the terrain is very flat.
  High phi (0.42–0.48) gives the Andy Earl oblique-relief look —
  camera well above the range, looking steeply down.
  S/N views drop phi so the low ridge has some drama end-on.
*/
const KF_MOB = [
  { theta: Math.PI,          phi: 0.45, r:  80 }, // West  — Andy Earl oblique (hero)
  { theta: Math.PI * 1.50,   phi: 0.18, r:  90 }, // South — end-on, gentle ridge profile
  { theta: Math.PI * 2.00,   phi: 0.44, r: 120 }, // East  — back face from above
  { theta: Math.PI * 2.50,   phi: 0.16, r:  92 }, // North — end-on north side
  { theta: Math.PI * 3.00,   phi: 0.45, r:  80 }, // West  — full circle
];
const KF_DESK = [
  { theta: Math.PI,          phi: 0.40, r: 108 }, // West
  { theta: Math.PI * 1.50,   phi: 0.14, r: 125 }, // South
  { theta: Math.PI * 2.00,   phi: 0.42, r: 155 }, // East
  { theta: Math.PI * 2.50,   phi: 0.12, r: 128 }, // North
  { theta: Math.PI * 3.00,   phi: 0.40, r: 108 }, // West
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

    const COLS = mobile ? 140 : 200;
    const ROWS = mobile ? 100 : 150;
    // Wider N-S extent so 30-unit tapers don't crowd the peaks
    const XMIN = XMIN_CONST, XMAX = 28;
    const ZMIN = ZMIN_CONST, ZMAX = ZMAX_CONST;

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
    // Z-direction columns at ~17% density — clean depth cues, no wall effect
    for(let xi=0;xi<COLS;xi+=6){
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
    camPos.copy(orbitPos(KFS[0].theta, KFS[0].phi, KFS[0].r));

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
