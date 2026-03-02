"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraInfo } from "./MountainGL";

const MAX_H = 65;

// Matches peak positions in MountainGL.tsx exactly
const PEAKS_DEF = [
  { name:"Ben Lomond",  elev:"9,712′",  wx: 10, wy: 0.59*MAX_H, wz:  44 },
  { name:"Thurston Pk", elev:"9,706′",  wx: 11, wy: 0.60*MAX_H, wz:  22 },
  { name:"Mt Olympus",  elev:"9,026′",  wx: 13, wy: 0.68*MAX_H, wz:   7 },
  { name:"Twin Peaks",  elev:"11,330′", wx: 15, wy: 0.97*MAX_H, wz:   2 },
  { name:"Lone Peak",   elev:"11,253′", wx: 15, wy: 0.96*MAX_H, wz:  -2 },
  { name:"Timpanogos",  elev:"11,752′", wx: 17, wy: 1.00*MAX_H, wz: -18 },
  { name:"Mt Nebo",     elev:"11,928′", wx: 18, wy: 0.99*MAX_H, wz: -38 },
];

const LABEL_W  = 82;
const LABEL_H  = 34;
const MIN_XGAP = 54;

interface Placed {
  name: string; elev: string;
  px: number; py: number;
  lx: number; ly: number;
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

      const visible: Array<{ name:string; elev:string; px:number; py:number }> = [];
      for (const p of PEAKS_DEF) {
        vec.set(p.wx, p.wy + 1.5, p.wz);
        const proj = vec.clone().project(camera);
        if (proj.z >= 1) continue; // behind camera
        const px = ( proj.x * 0.5 + 0.5) * width;
        const py = (-proj.y * 0.5 + 0.5) * height;
        // Keep labels away from screen edges; allow close to top (nav is 52px)
        if (px < 16 || px > width - 16 || py < 60 || py > height - 28) continue;
        visible.push({ name: p.name, elev: p.elev, px, py });
      }

      // Sort left-to-right
      visible.sort((a, b) => a.px - b.px);

      // Greedy vertical stagger
      const result: Placed[] = [];
      for (const v of visible) {
        let lx = v.px - LABEL_W / 2;
        let ly = v.py - LABEL_H - 10;

        for (const prev of result) {
          const overlapX = Math.abs(v.px - (prev.lx + LABEL_W / 2)) < MIN_XGAP;
          if (overlapX && ly + LABEL_H > prev.ly) {
            ly = prev.ly - LABEL_H - 5;
          }
        }

        ly = Math.max(ly, 58); // below nav bar
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
          <div style={{
            position:"absolute", left:p.lx, top:p.ly, width:LABEL_W,
            textAlign:"center",
          }}>
            <div style={{
              fontFamily:"'JetBrains Mono','Fira Code',monospace",
              fontSize:"0.42rem", letterSpacing:"0.16em", textTransform:"uppercase",
              color:"rgba(255,255,255,0.85)", lineHeight:1.3, whiteSpace:"nowrap",
            }}>{p.name}</div>
            <div style={{
              fontFamily:"'JetBrains Mono','Fira Code',monospace",
              fontSize:"0.37rem", letterSpacing:"0.08em",
              color:"rgba(96,165,250,0.90)", whiteSpace:"nowrap",
            }}>{p.elev}</div>
          </div>

          {/* Stem */}
          <div style={{
            position:"absolute", left:p.px - 0.5, top:p.ly + LABEL_H,
            width:1, height:p.stemH,
            background:"linear-gradient(to bottom, rgba(96,165,250,0.60) 0%, rgba(96,165,250,0.08) 100%)",
          }}/>

          {/* Dot */}
          <div style={{
            position:"absolute", left:p.px - 2.5, top:p.py - 2.5,
            width:5, height:5, borderRadius:"50%",
            background:"#93C5FD",
            boxShadow:"0 0 6px 2px rgba(147,197,253,0.55)",
          }}/>
        </div>
      ))}
    </div>
  );
}
