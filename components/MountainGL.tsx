"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  ORIENTATION  — theta = π (camera due-west, looking east)
  The Wasatch runs N–S along our Z-axis.  From the west you see the
  full range as a horizontal panorama — the correct SLC valley view.

  NO-CLIP PROOF  (mobile, r=65, phi=-0.06, FOV=76°, TARGET.y=29)
  ─────────────────────────────────────────────────────────────────
  camera.y  = 29 + 65·sin(−0.06) = 29 − 3.9 = 25.1
  looks UP at target y=29  (2.8° upward tilt)

  peak (y=58) angle above look-dir:
    arctan((58−25.1)/65) − 2.8° = 26.8° − 2.8° = 24.0°

  FOV=76° → half-angle = 38°
  24° < 38° → peaks safely in upper third  ✓

  base (y=0) angle below look-dir:
    arctan(25.1/65) + 2.8° = 21.1° + 2.8° = 23.9°
  23.9° < 38° → valley floor visible  ✓
*/

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
  let h = wx > 0 ? Math.min(0.12, wx / 80 * 0.12) : 0;
  for (const p of PEAKS) {
    const dx = (wx - p.x) / p.sx;
    const dz = (wz - p.z) / p.sz;
    h += p.h * Math.exp(-(dx * dx + dz * dz));
  }
  return Math.min(1, Math.max(0, h));
}

function altColor(t: number): [number, number, number] {
  // foothills: deep navy → peaks: bright ice-blue/white
  // Brighter at the top so peaks read clearly against black sky
  return [
    0.03 + t * 0.30,   // 0.03 → 0.33
    0.05 + t * 0.48,   // 0.05 → 0.53
    0.22 + t * 0.76,   // 0.22 → 0.98  (peaks nearly full-blue)
  ];
}

const TARGET = new THREE.Vector3(12, MAX_H / 2, 0); // y=29 — mountain centre

// Desktop: elevated panoramic sweep from the west
const KF_DESK = [
  { theta: Math.PI + 0.18, phi:  0.10, r: 122 },
  { theta: Math.PI        , phi:  0.13, r: 110 },
  { theta: Math.PI - 0.22, phi:  0.08, r: 102 },
  { theta: Math.PI - 0.46, phi:  0.11, r: 118 },
];
// Mobile: valley-level, slightly below target so camera looks up at peaks
// phi = -0.06 puts camera at y≈25, looking up — peaks at 24° above centre
const KF_MOB = [
  { theta: Math.PI + 0.12, phi: -0.06, r: 65 },
  { theta: Math.PI        , phi: -0.04, r: 61 },
  { theta: Math.PI - 0.18, phi: -0.02, r: 58 },
  { theta: Math.PI + 0.26, phi: -0.05, r: 67 },
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
    const KFS     = mobile ? KF_MOB  : KF_DESK;
    const FOV     = mobile ? 76 : 50;
    const FOG_DEN = mobile ? 0.0016 : 0.0032;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, FOG_DEN);
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
      vertexColors: true, transparent: true, opacity: 0.95,
    });
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
        kf.theta + mouse.x * 0.03,
        kf.phi   - mouse.y * 0.02,
        kf.r,
      );
      camPos.lerp(dst, 0.032);
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
