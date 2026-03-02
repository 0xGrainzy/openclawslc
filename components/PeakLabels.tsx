"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraInfo } from "./MountainGL";

const MAX_H = 32;
const Z_STRETCH = 1.8;

const PEAKS_DEF = [
  { name:"Grandeur",      elev:"9,299′",  wx:  6, wy: MAX_H * 0.18, wz: +20 },
  { name:"Mt Aire",       elev:"8,621′",  wx:  8, wy: MAX_H * 0.16, wz: +13 },
  { name:"Olympus",       elev:"9,026′",  wx: 10, wy: MAX_H * 0.32, wz:  +7 },
  { name:"Gobblers Knob", elev:"10,246′", wx: 14, wy: MAX_H * 0.52, wz:  +6 },
  { name:"Raymond",       elev:"10,241′", wx: 15, wy: MAX_H * 0.55, wz:  +5 },
  { name:"Kessler",       elev:"10,403′", wx: 16, wy: MAX_H * 0.60, wz:  +1 },
  { name:"Superior",      elev:"11,032′", wx: 18, wy: MAX_H * 0.80, wz:  -2 },
  { name:"Broads Fork",   elev:"11,330′", wx: 20, wy: MAX_H * 0.95, wz:  -3 },
  { name:"Hidden Peak",   elev:"10,992′", wx: 21, wy: MAX_H * 0.76, wz:  -6 },
  { name:"Pfeifferhorn",  elev:"11,325′", wx: 22, wy: MAX_H * 0.90, wz:  -8 },
  { name:"White Baldy",   elev:"11,321′", wx: 21, wy: MAX_H * 0.82, wz: -10 },
  { name:"Lone Peak",     elev:"11,253′", wx: 20, wy: MAX_H * 0.72, wz: -15 },
  { name:"Box Elder",     elev:"11,101′", wx: 18, wy: MAX_H * 0.38, wz: -24 },
];

const LABEL_W = 95, LABEL_H = 36, MIN_XGAP = 70, MIN_YGAP = 40;

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

      const visible: Array<{ name: string; elev: string; px: number; py: number }> = [];
      for (const p of PEAKS_DEF) {
        // Apply Z_STRETCH to match display coordinates
        vec.set(p.wx, p.wy + 0.5, p.wz * Z_STRETCH);
        const proj = vec.clone().project(camera);
        if (proj.z >= 1) continue;
        const px = (proj.x * 0.5 + 0.5) * width;
        const py = (-proj.y * 0.5 + 0.5) * height;
        if (px < 10 || px > width - 10 || py < 16 || py > height - 20) continue;
        visible.push({ name: p.name, elev: p.elev, px, py });
      }
      visible.sort((a, b) => a.px - b.px);

      const result: Placed[] = [];
      for (const v of visible) {
        let lx = v.px - LABEL_W / 2;
        let ly = v.py - LABEL_H - 12;

        // Collision avoidance — push up if overlapping
        let collision = true;
        let attempts = 0;
        while (collision && attempts < 8) {
          collision = false;
          for (const prev of result) {
            const xOverlap = Math.abs((lx + LABEL_W / 2) - (prev.lx + LABEL_W / 2)) < MIN_XGAP;
            const yOverlap = ly < prev.ly + MIN_YGAP && ly + LABEL_H > prev.ly;
            if (xOverlap && yOverlap) {
              ly = prev.ly - MIN_YGAP;
              collision = true;
              break;
            }
          }
          attempts++;
        }

        ly = Math.max(ly, 16);
        lx = Math.max(4, Math.min(lx, width - LABEL_W - 4));
        const stemH = Math.max(4, v.py - (ly + LABEL_H));
        result.push({ name: v.name, elev: v.elev, px: v.px, py: v.py, lx, ly, stemH });
      }
      setPlaced(result);
    }
    tick();
    return () => cancelAnimationFrame(raf.current);
  }, [getCameraInfo]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 6, pointerEvents: "none" }}>
      {placed.map(p => (
        <div key={p.name}>
          {/* Label text */}
          <div style={{ position: "absolute", left: p.lx, top: p.ly, width: LABEL_W, textAlign: "center" }}>
            <div style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "0.52rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            }}>{p.name}</div>
            <div style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "0.44rem",
              letterSpacing: "0.06em",
              color: "rgba(96,165,250,0.90)",
              whiteSpace: "nowrap",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}>{p.elev}</div>
          </div>
          {/* Stem line */}
          <div style={{
            position: "absolute", left: p.px - 0.5, top: p.ly + LABEL_H, width: 1, height: p.stemH,
            background: "linear-gradient(to bottom,rgba(96,165,250,0.55) 0%,rgba(96,165,250,0.08) 100%)",
          }} />
          {/* Dot */}
          <div style={{
            position: "absolute", left: p.px - 2.5, top: p.py - 2.5, width: 5, height: 5,
            borderRadius: "50%", background: "#93C5FD",
            boxShadow: "0 0 6px 2px rgba(147,197,253,0.50)",
          }} />
        </div>
      ))}
    </div>
  );
}
