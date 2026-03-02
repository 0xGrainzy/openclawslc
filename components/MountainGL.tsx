"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   MountainGL — Three.js wireframe mountain.
   Fixed behind all content. Scroll drives camera through 4 scenes.
   Mouse creates a subtle look-around.
───────────────────────────────────────────────────────────────── */

const PEAKS = [
  { pos: 0.08, h: 0.30, w: 0.055 }, { pos: 0.18, h: 0.44, w: 0.058 },
  { pos: 0.28, h: 0.60, w: 0.050 }, { pos: 0.37, h: 0.74, w: 0.044 },
  { pos: 0.44, h: 0.86, w: 0.038 }, { pos: 0.51, h: 0.96, w: 0.032 },
  { pos: 0.57, h: 1.00, w: 0.028 }, { pos: 0.63, h: 0.88, w: 0.036 },
  { pos: 0.70, h: 0.76, w: 0.044 }, { pos: 0.78, h: 0.62, w: 0.052 },
  { pos: 0.87, h: 0.46, w: 0.058 }, { pos: 0.94, h: 0.30, w: 0.052 },
];

function terrain(nx: number): number {
  let h = 0;
  for (const p of PEAKS) h += p.h * Math.exp(-((nx - p.pos) ** 2) / (2 * p.w ** 2));
  return Math.min(1, Math.max(0, h));
}

function heightColor(t: number): [number, number, number] {
  // deep navy → electric blue → ice at peaks
  const r = 0.04 + t * 0.24;
  const g = 0.05 + t * 0.45;
  const b = 0.35 + t * 0.60;
  return [r, g, b];
}

// Camera keyframes: [posX, posY, posZ, tgtX, tgtY, tgtZ]
const SCENES: [number, number, number, number, number, number][] = [
  [  0,  6,  95,    0, 18,  0 ],  // Hero    – low, wide, side view
  [-20, 30,  65,    8, 22,  0 ],  // Events  – ascending, tilting
  [ 18, 52,  30,   -5, 30, -5 ],  // Builders– oblique near-peak
  [  0, 78,  18,    0,  8,  0 ],  // Join    – overhead, abstract
];

function lerpScene(scroll: number) {
  // scroll: 0→1 across total page
  const idx    = scroll * (SCENES.length - 1);
  const a      = Math.floor(idx);
  const b      = Math.min(a + 1, SCENES.length - 1);
  const t      = idx - a;
  const ease   = t * t * (3 - 2 * t); // smoothstep
  return SCENES[a].map((v, i) => v + (SCENES[b][i] - v) * ease) as [number,number,number,number,number,number];
}

export default function MountainGL() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    el.appendChild(renderer.domElement);

    /* ── Scene & Camera ── */
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, 0.007);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1000);

    /* ── Terrain geometry ── */
    const COLS   = window.innerWidth < 768 ? 90 : 160;
    const ROWS   = window.innerWidth < 768 ? 18 : 28;
    const W      = 180;
    const D      = 50;
    const MAX_H  = 52;

    // Build height map
    const H: number[][] = [];
    for (let z = 0; z < ROWS; z++) {
      H[z] = [];
      for (let x = 0; x < COLS; x++) {
        const nx = x / (COLS - 1);
        const nz = z / (ROWS - 1);
        const depth = Math.exp(-((nz - 0.5) ** 2) / (2 * 0.18 ** 2));
        H[z][x] = terrain(nx) * MAX_H * depth;
      }
    }

    const verts: number[]  = [];
    const colors: number[] = [];

    function addSeg(
      x0: number, y0: number, z0: number,
      x1: number, y1: number, z1: number
    ) {
      verts.push(x0, y0, z0, x1, y1, z1);
      const t0 = y0 / MAX_H, t1 = y1 / MAX_H;
      const c0 = heightColor(t0), c1 = heightColor(t1);
      colors.push(...c0, ...c1);
    }

    // X-direction lines (along the ridgeline — the main visual)
    for (let z = 0; z < ROWS; z++) {
      const wz = -D / 2 + (z / (ROWS - 1)) * D;
      for (let x = 0; x < COLS - 1; x++) {
        const wx0 = -W / 2 + (x / (COLS - 1)) * W;
        const wx1 = -W / 2 + ((x + 1) / (COLS - 1)) * W;
        addSeg(wx0, H[z][x], wz, wx1, H[z][x + 1], wz);
      }
    }

    // Z-direction lines (depth lines — gives 3D form)
    for (let x = 0; x < COLS; x++) {
      const wx = -W / 2 + (x / (COLS - 1)) * W;
      for (let z = 0; z < ROWS - 1; z++) {
        const wz0 = -D / 2 + (z / (ROWS - 1)) * D;
        const wz1 = -D / 2 + ((z + 1) / (ROWS - 1)) * D;
        addSeg(wx, H[z][x], wz0, wx, H[z + 1][x], wz1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color",    new THREE.Float32BufferAttribute(colors, 3));

    const mat   = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 });
    const lines = new THREE.LineSegments(geo, mat);
    scene.add(lines);

    /* ── State ── */
    const state = {
      scroll:  0,
      mouse:   new THREE.Vector2(0, 0),
      camPos:  new THREE.Vector3(),
      camTgt:  new THREE.Vector3(),
    };
    const target = { pos: new THREE.Vector3(), tgt: new THREE.Vector3() };

    /* ── Resize ── */
    function resize() {
      if (!el) return;
      const W = el.clientWidth, H = el.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    /* ── Scroll ── */
    function onScroll() {
      const max   = document.body.scrollHeight - window.innerHeight;
      state.scroll = max > 0 ? window.scrollY / max : 0;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ── Mouse ── */
    function onMouse(e: MouseEvent) {
      state.mouse.set(
        (e.clientX / window.innerWidth)  * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1
      );
    }
    window.addEventListener("mousemove", onMouse, { passive: true });

    /* ── RAF loop ── */
    let raf = 0;
    const clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      clock.getDelta(); // advance clock

      const kf = lerpScene(state.scroll);
      target.pos.set(kf[0], kf[1], kf[2]);
      target.tgt.set(kf[3], kf[4], kf[5]);

      // Mouse offset — subtle look-around
      target.pos.x += state.mouse.x * 4;
      target.pos.y -= state.mouse.y * 2.5;

      // Smooth camera
      state.camPos.lerp(target.pos, 0.035);
      state.camTgt.lerp(target.tgt, 0.035);

      camera.position.copy(state.camPos);
      camera.lookAt(state.camTgt);

      renderer.render(scene, camera);
    }

    // Seed initial camera
    const init = lerpScene(0);
    state.camPos.set(init[0], init[1], init[2]);
    state.camTgt.set(init[3], init[4], init[5]);

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
