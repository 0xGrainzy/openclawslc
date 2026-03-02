"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   Wasatch Front — 3D wireframe mountain range.
   Real peak positions. Scroll drives 180° orbital camera.
   Exposes camera via onCameraUpdate for peak-label overlay.
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

const TARGET = new THREE.Vector3(8, 14, 0);
const KEYFRAMES = [
  { theta:  1.65, phi: 0.30, r: 165 },
  { theta:  0.90, phi: 0.38, r: 140 },
  { theta:  0.10, phi: 0.50, r: 125 },
  { theta: -0.75, phi: 0.42, r: 155 },
];
function orbitPos(theta: number, phi: number, r: number): THREE.Vector3 {
  return new THREE.Vector3(
    TARGET.x + r * Math.cos(phi) * Math.cos(theta),
    TARGET.y + r * Math.sin(phi),
    TARGET.z + r * Math.cos(phi) * Math.sin(theta),
  );
}
function lerpKf(scroll: number, rScale = 1) {
  const idx  = scroll * (KEYFRAMES.length - 1);
  const a    = Math.floor(idx), b = Math.min(a + 1, KEYFRAMES.length - 1);
  const t    = idx - a, e = t * t * (3 - 2 * t);
  const A = KEYFRAMES[a], B = KEYFRAMES[b];
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

    const mobile   = window.innerWidth < 768;
    const rScale   = mobile ? 1.55 : 1.0;   // pull camera back on mobile

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, 0.0042);
    const camera = new THREE.PerspectiveCamera(mobile ? 58 : 48, 1, 0.5, 800);

    const COLS = mobile ? 100 : 180, ROWS = mobile ? 70 : 130;
    const XMIN = -55, XMAX = 35, ZMIN = -45, ZMAX = 50, MAX_H = 58;

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
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.88 });
    scene.add(new THREE.LineSegments(geo, mat));

    const mouse  = new THREE.Vector2();
    let   scroll = 0;
    const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3().copy(TARGET);
    const kf0 = lerpKf(0, rScale);
    camPos.copy(orbitPos(kf0.theta, kf0.phi, kf0.r));

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
      const kf  = lerpKf(scroll, rScale);
      const tgt = orbitPos(kf.theta + mouse.x * 0.05, kf.phi - mouse.y * 0.03, kf.r);
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
