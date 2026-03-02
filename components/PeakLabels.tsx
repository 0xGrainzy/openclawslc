"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraInfo } from "./MountainGL";

/*
  Renders a label for every Wasatch peak that is currently on-screen.
  Collision resolution: peaks that would overlap are staggered upward
  (not hidden) so every visible peak always has a readable label.
*/

const MAX_H = 58;

const PEAKS_DEF = [
  { name:"Ben Lomond",  elev:"9,712′",  wx:  8, wy: 0.78*MAX_H, wz:  42 },
  { name:"Mt Olympus",  elev:"9,026′",  wx: 12, wy: 0.76*MAX_H, wz:   7 },
  { name:"Twin Peaks",  elev:"11,330′", wx: 15, wy: 0.94*MAX_H, wz:   3 },
  { name:"Lone Peak",   elev:"11,253′", wx: 16, wy: 0.93*MAX_H, wz:  -1 },
  { name:"Timpanogos",  elev:"11,752′", wx: 18, wy: 0.99*MAX_H, wz: -16 },
  { name:"Mt Nebo",     elev:"11,928′", wx: 16, wy: 1.00*MAX_H, wz: -30 },
];

const LABEL_W  = 78;  // approximate label width  (px)
const LABEL_H  = 34;  // approximate label height (px)
const MIN_XGAP = 60;  // horizontal gap before we stagger vertically

interface Placed {
  name: string; elev: string;
  px: number; py: number; // peak dot position
  lx: number; ly: number; // label top-left
  stemH: number;
}

interface Props { getCameraInfo: () => CameraInfo | null }

export default function PeakLabels({ getCameraInfo }: Props) {
  const [placed, setPlaced] = useState<Placed[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const vec = new THREE.Vector3();

    function tick() {
      raf.current = requestAnimationFrame(tick);
      const info = getCameraInfo();
      if (!info) return;
      const { camera, width, height } = info;

      // Project peaks; discard anything behind camera or off-screen
      const visible: Array<{ name:string; elev:string; px:number; py:number }> = [];
      for (const p of PEAKS_DEF) {
        vec.set(p.wx, p.wy + 1.5, p.wz);
        const proj = vec.clone().project(camera);
        if (proj.z >= 1) continue; // behind camera
        const px = ( proj.x * 0.5 + 0.5) * width;
        const py = (-proj.y * 0.5 + 0.5) * height;
        // Keep labels away from absolute screen edges
        if (px < 20 || px > width - 20 || py < 44 || py > height - 32) continue;
        visible.push({ name: p.name, elev: p.elev, px, py });
      }

      // Sort left-to-right for predictable stagger order
      visible.sort((a, b) => a.px - b.px);

      // Greedy vertical placement: label sits above its dot;
      // if it would overlap a previous label, push it higher.
      const result: Placed[] = [];
      for (const v of visible) {
        // Default: centre label over dot, just above it
        let lx = v.px - LABEL_W / 2;
        let ly = v.py - LABEL_H - 10; // 10px gap between dot and bottom of label

        // Push up past any overlapping previously placed label
        for (const prev of result) {
          const overlapX = Math.abs(v.px - (prev.lx + LABEL_W/2)) < MIN_XGAP;
          if (overlapX) {
            const prevTop = prev.ly;
            if (ly + LABEL_H > prevTop) {
              ly = prevTop - LABEL_H - 6; // stack above previous label
            }
          }
        }

        // Clamp top edge to stay below the nav bar
        ly = Math.max(ly, 56);

        const stemH = Math.max(4, v.py - (ly + LABEL_H));

        result.push({ name: v.name, elev: v.elev, px: v.px, py: v.py, lx, ly, stemH });
      }

      setPlaced(result);
    }

    tick();
    return () => cancelAnimationFrame(raf.current);
  }, [getCameraInfo]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:6, pointerEvents:"none" }}>
      {placed.map(p => (
        <div key={p.name}>

          {/* Label block */}
          <div style={{
            position:"absolute",
            left: p.lx,
            top:  p.ly,
            width: LABEL_W,
            textAlign:"center",
          }}>
            <div style={{
              fontFamily:"'JetBrains Mono','Fira Code',monospace",
              fontSize:"0.42rem",
              letterSpacing:"0.16em",
              textTransform:"uppercase",
              color:"rgba(255,255,255,0.80)",
              lineHeight:1.3,
              whiteSpace:"nowrap",
            }}>{p.name}</div>
            <div style={{
              fontFamily:"'JetBrains Mono','Fira Code',monospace",
              fontSize:"0.37rem",
              letterSpacing:"0.08em",
              color:"rgba(96,165,250,0.85)",
              whiteSpace:"nowrap",
            }}>{p.elev}</div>
          </div>

          {/* Stem line from label bottom to dot */}
          <div style={{
            position:"absolute",
            left: p.px - 0.5,
            top:  p.ly + LABEL_H,
            width: 1,
            height: p.stemH,
            background:"linear-gradient(to bottom, rgba(96,165,250,0.55) 0%, rgba(96,165,250,0.10) 100%)",
          }}/>

          {/* Peak dot */}
          <div style={{
            position:"absolute",
            left: p.px - 2.5,
            top:  p.py - 2.5,
            width: 5,
            height: 5,
            borderRadius:"50%",
            background:"#93C5FD",
            boxShadow:"0 0 6px 1px rgba(147,197,253,0.5)",
          }}/>

        </div>
      ))}
    </div>
  );
}
