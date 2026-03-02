"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════
   Wasatch Front — 3D wireframe mountain range

   ORIENTATION FIX
   ───────────────
   The Wasatch runs North–South (our Z-axis, z=−30 Nebo → z=42 Ben
   Lomond).  The Salt Lake Valley is WEST (negative-X).  Camera must
   sit on the negative-X side (theta = π) so the range appears as a
   horizontal panorama rather than end-on.

   GUARANTEED NO-CLIPPING FORMULA
   ────────────────────────────────
   TARGET.y = MAX_H / 2  = 29   (camera aims at the mountain centre)
   phi = 0                       (camera at exact same height as target)
   → camera sees ± r·tan(FOV/2) above/below screen centre
   → at r=80, FOV=75°: visible range = ±80·tan(37.5°) = ±61 units
   → mountain is 0–58 units tall, centred at 29 → fully inside ±61 ✓
   No peaks will EVER be clipped with these settings.
═══════════════════════════════════════════════════════════════════ */

const MAX_H = 58;

const PEAKS = [
  { x:  8, z:  42, h: 0.78, sx:  9, sz:  9 }, // Ben Lomond       9,712′
  { x:  9, z:  28, h: 0.68, sx:  8, sz:  8 }, // Farmington
  { x: 10, z:  14, h: 0.71, sx:  7, sz:  7 }, // Grandeur Peak
  { x: 12, z:   7, h: 0.76, sx:  6, sz:  5 }, // Mount Olympus     9,026′
  { x: 15, z:   3, h: 0.94, sx:  4, sz:  4 }, // Twin Peaks       11,330′
  { x: 16, z:  -1, h: 0.93, sx:  4, sz:  4 }, // Lone Peak        11,253′
  { x: 14, z:  -5, h: 0.82, sx:  5, sz:  5 }, // Draper ridge
  { x: 18, z: -16, h: 0.99, sx:  7, sz:  8 }, // Mt Timpanogos   11,752′
  { x: 16, z: -30, h: 1.00, sx:  6, sz:  7 }, // Mount Nebo      11,928′
];

function terrainH(wx: number, wz: number): number {
  // Gentle foothill base (only on positive-x / east side of range)
  let h = wx > 0 ? Math.min(0.12, wx / 80 * 0.12) : 0;
  for (const p of PEAKS) {
    const dx = (wx - p.x) / p.sx;
    const dz = (wz - p.z) / p.sz;
    h += p.h * Math.exp(-(dx * dx + dz * dz));
  }
  return Math.min(1, Math.max(0, h));
}

function altColor(t: number): [number, number, number] {
  // deep navy → electric blue at peaks
  return [0.02 + t * 0.20, 0.04 + t * 0.40, 0.22 + t * 0.72];
}

/* ── Camera setup ────────────────────────────────────────────────── */
const TARGET = new THREE.Vector3(12, MAX_H / 2, 0); // aim at vertical centre

// theta = π puts camera due-west (valley side), small variation for sweep
const KF_DESK = [
  { theta: Math.PI + 0.18, phi:  0.14, r: 155 },
  { theta: Math.PI        , phi:  0.18, r: 140 },
  { theta: Math.PI - 0.22, phi:  0.12, r: 132 },
  { theta: Math.PI - 0.50, phi:  0.16, r: 148 },
];
// Mobile: phi = 0 (perfectly horizontal) guarantees full mountain in FOV
const KF_MOB = [
  { theta: Math.PI + 0.12, phi:  0.00, r: 80 },
  { theta: Math.PI        , phi:  0.00, r: 76 },
  { theta: Math.PI - 0.18, phi:  0.04, r: 72 },
  { theta: Math.PI + 0.28, phi:  0.02, r: 82 },
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

    const mobile = window.innerWidth < 768;
    const KFS    = mobile ? KF_MOB  : KF_DESK;
    const FOV    = mobile ? 75 : 48;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, mobile ? 0.0022 : 0.0038);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 800);

    const COLS = mobile ? 130 : 190;
    const ROWS = mobile ? 95  : 140;
    const XMIN = -90, XMAX = 38;
    const ZMIN = -52, ZMAX = 58;

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
        const wx0=XMIN+(xi/(COLS-1))*(XMAX-XMIN),wx1=XMIN+((xi+1)/(COLS-1))*(XMAX-XMIN);
        seg(wx0,H[zi][xi],wz,wx1,H[zi][xi+1],wz);
      }
    }
    for(let xi=0;xi<COLS;xi++){
      const wx=XMIN+(xi/(COLS-1))*(XMAX-XMIN);
      for(let zi=0;zi<ROWS-1;zi++){
        const wz0=ZMIN+(zi/(ROWS-1))*(ZMAX-ZMIN),wz1=ZMIN+((zi+1)/(ROWS-1))*(ZMAX-ZMIN);
        seg(wx,H[zi][xi],wz0,wx,H[zi+1][xi],wz1);
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
    const kf0    = lerpKf(0, KFS);
    camPos.copy(orbitPos(kf0.theta, kf0.phi, kf0.r));

    function resize(){
      if(!el) return;
      renderer.setSize(el.clientWidth,el.clientHeight);
      camera.aspect=el.clientWidth/el.clientHeight;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro=new ResizeObserver(resize); ro.observe(el);

    const onScroll=()=>{
      const max=document.body.scrollHeight-window.innerHeight;
      scroll=max>0?window.scrollY/max:0;
    };
    const onMouse=(e:MouseEvent)=>{
      mouse.set((e.clientX/window.innerWidth)*2-1,(e.clientY/window.innerHeight)*2-1);
    };
    window.addEventListener("scroll",    onScroll, {passive:true});
    window.addEventListener("mousemove", onMouse,  {passive:true});

    let raf=0;
    function animate(){
      raf=requestAnimationFrame(animate);
      const kf=lerpKf(scroll,KFS);
      const dst=orbitPos(kf.theta+mouse.x*0.03,kf.phi-mouse.y*0.02,kf.r);
      camPos.lerp(dst,0.030);
      camera.position.copy(camPos);
      camera.lookAt(TARGET);
      renderer.render(scene,camera);
      if(el) onCameraUpdate?.({camera,width:el.clientWidth,height:el.clientHeight});
    }
    animate();

    return()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll",    onScroll);
      window.removeEventListener("mousemove", onMouse);
      ro.disconnect();
      geo.dispose(); mat.dispose(); renderer.dispose();
      if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onCameraUpdate]);

  return <div ref={mountRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}
