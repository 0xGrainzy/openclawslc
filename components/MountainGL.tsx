"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  ORIENTATION  — theta = π (camera due-west, looking east)
  The Wasatch runs N–S along our Z-axis.  From the west you see the
  full range as a horizontal panorama — the correct SLC valley view.

  NO-CLIP PROOF (mobile, r=92, phi=0.19, FOV=74°, TARGET.y=29)
  ─────────────────────────────────────────────────────────────────
  camera.y  = 29 + 92·sin(0.19) = 29 + 17.4 = 46.4
  peak (y=58) angle from look-dir centre:
    arctan((58−46.4)/92) = arctan(0.126) = 7.2°  BELOW top of frame
  base (y=0) angle below look-dir:
    arctan(46.4/92) = 26.7°
  FOV=74° → half-angle = 37°
  7.2° and 26.7° both < 37° → full mountain in frame ✓
*/

const MAX_H = 58;

const PEAKS = [
  // ── North ─────────────────────────────────────────────────────
  { x:  8, z:  42, h: 0.67, sx:  9, sz:  9 }, // Ben Lomond       9,712′
  { x: 10, z:  32, h: 0.62, sx:  8, sz:  7 }, // Francis Peak
  { x: 11, z:  22, h: 0.66, sx:  7, sz:  6 }, // Thurston Peak
  { x: 12, z:  14, h: 0.70, sx:  6, sz:  6 }, // Grandeur / upper SLC
  // ── Central ───────────────────────────────────────────────────
  { x: 13, z:   9, h: 0.75, sx:  5, sz:  5 }, // Gobblers Knob
  { x: 12, z:   7, h: 0.70, sx:  5, sz:  4 }, // Mount Olympus     9,026′
  { x: 15, z:   3, h: 0.96, sx:  4, sz:  4 }, // Twin Peaks       11,330′
  { x: 16, z:  -1, h: 0.95, sx:  4, sz:  4 }, // Lone Peak        11,253′
  { x: 15, z:  -5, h: 0.80, sx:  5, sz:  5 }, // Draper ridge
  // ── South ─────────────────────────────────────────────────────
  { x: 18, z: -16, h: 0.99, sx:  7, sz:  8 }, // Mt Timpanogos   11,752′
  { x: 17, z: -24, h: 0.82, sx:  6, sz:  6 }, // Santaquin ridge
  { x: 16, z: -32, h: 1.00, sx:  6, sz:  7 }, // Mount Nebo      11,928′
];

function terrainH(wx: number, wz: number): number {
  const base = Math.max(0, (wx + 55) / 130) * 0.18;
  let h = base;
  for (const p of PEAKS) {
    const dx = (wx - p.x) / p.sx;
    const dz = (wz - p.z) / p.sz;
    h += p.h * Math.exp(-(dx * dx + dz * dz));
  }
  return Math.min(1, Math.max(0, h));
}

function altColor(t: number): [number, number, number] {
  // foothills: deep navy → peaks: bright ice-blue/white
  return [
    0.03 + t * 0.30,
    0.05 + t * 0.48,
    0.22 + t * 0.76,
  ];
}

const TARGET = new THREE.Vector3(12, MAX_H / 2, 0); // y=29 — mountain centre

// Desktop: elevated panoramic sweep from the west
const KF_DESK = [
  { theta: Math.PI + 0.18, phi:  0.14, r: 128 },
  { theta: Math.PI        , phi:  0.16, r: 118 },
  { theta: Math.PI - 0.22, phi:  0.12, r: 110 },
  { theta: Math.PI - 0.46, phi:  0.15, r: 124 },
];

// Mobile: elevated view so full ridge is visible — camera above the peaks, looking down slightly
// phi=0.18–0.20 puts camera at y≈46, peaks at y=58 are ~7° above centre
const KF_MOB = [
  { theta: Math.PI + 0.10, phi:  0.19, r: 92 },
  { theta: Math.PI        , phi:  0.20, r: 88 },
  { theta: Math.PI - 0.15, phi:  0.17, r: 85 },
  { theta: Math.PI + 0.22, phi:  0.18, r: 94 },
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
    const FOV     = mobile ? 74 : 50;
    const FOG_DEN = mobile ? 0.0010 : 0.0026;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, FOG_DEN);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 900);

    const COLS = mobile ? 140 : 200;
    const ROWS = mobile ? 100 : 150;
    // XMAX=45: east slope fades naturally (peaks at x≈15-18 drop to ~5% by x=45)
    // No more vertical cliff at the east edge.
    const XMIN = -100, XMAX = 45;
    const ZMIN = -55,  ZMAX = 62;

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
        kf.phi   - mouse.y * 0.015,
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
