"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraInfo } from "./MountainGL";

const MAX_H = 32;
const Z_STRETCH = 1.8;

// Only the most prominent peaks — keep it readable
const PEAKS_DEF = [
  { name:"GRANDEUR",     elev:"9,299′",  wx:  6, wy: MAX_H * 0.24, wz: +20 },
  { name:"OLYMPUS",      elev:"9,026′",  wx: 10, wy: MAX_H * 0.42, wz:  +7 },
  { name:"RAYMOND",      elev:"10,241′", wx: 15, wy: MAX_H * 0.62, wz:  +5 },
  { name:"SUPERIOR",     elev:"11,032′", wx: 18, wy: MAX_H * 0.88, wz:  -2 },
  { name:"TWIN PEAKS",   elev:"11,330′", wx: 20, wy: MAX_H * 1.05, wz:  -3 },
  { name:"SNOWBIRD",     elev:"10,992′", wx: 21, wy: MAX_H * 0.84, wz:  -6 },
  { name:"PFEIFFERHORN", elev:"11,325′", wx: 22, wy: MAX_H * 0.98, wz:  -8 },
  { name:"LONE PEAK",    elev:"11,253′", wx: 20, wy: MAX_H * 0.80, wz: -15 },
  { name:"BOX ELDER",    elev:"11,101′", wx: 18, wy: MAX_H * 0.44, wz: -24 },
];

const LABEL_W = 90, LABEL_H = 30;

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
        vec.set(p.wx, p.wy + 0.5, p.wz * Z_STRETCH);
        const proj = vec.clone().project(camera);
        if (proj.z >= 1) continue;
        const px = (proj.x * 0.5 + 0.5) * width;
        const py = (-proj.y * 0.5 + 0.5) * height;
        if (px < 10 || px > width - 10 || py < 10 || py > height - 20) continue;
        visible.push({ name: p.name, elev: p.elev, px, py });
      }
      visible.sort((a, b) => a.px - b.px);

      // Place labels to the RIGHT of the peak dot with a horizontal stem
      const result: Placed[] = [];
      const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];

      for (const v of visible) {
        // Try right side first, then left
        let lx = v.px + 14;
        let ly = v.py - LABEL_H / 2;

        // If label goes off right edge, put it left
        if (lx + LABEL_W > width - 8) {
          lx = v.px - LABEL_W - 14;
        }

        // Collision: push down
        let attempts = 0;
        while (attempts < 6) {
          let collides = false;
          for (const o of occupied) {
            if (lx < o.x + o.w && lx + LABEL_W > o.x && ly < o.y + o.h + 6 && ly + LABEL_H > o.y - 6) {
              ly = o.y + o.h + 8;
              collides = true;
              break;
            }
          }
          if (!collides) break;
          attempts++;
        }

        ly = Math.max(10, Math.min(ly, height - LABEL_H - 10));
        lx = Math.max(4, Math.min(lx, width - LABEL_W - 4));
        occupied.push({ x: lx, y: ly, w: LABEL_W, h: LABEL_H });

        const stemH = 0; // horizontal stems instead
        result.push({ name: v.name, elev: v.elev, px: v.px, py: v.py, lx, ly, stemH });
      }
      setPlaced(result);
    }
    tick();
    return () => cancelAnimationFrame(raf.current);
  }, [getCameraInfo]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 6, pointerEvents: "none" }}>
      {placed.map(p => {
        // Horizontal stem from dot to label
        const stemLeft = Math.min(p.px, p.lx);
        const stemRight = Math.max(p.px, p.lx);
        const stemY = p.py;

        return (
          <div key={p.name}>
            {/* Label */}
            <div style={{ position: "absolute", left: p.lx, top: p.ly, width: LABEL_W }}>
              <div style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "0.72rem",
                letterSpacing: "0.10em",
                color: "rgba(255,255,255,0.90)",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                textShadow: "0 1px 6px rgba(0,0,0,0.95)",
              }}>{p.name}</div>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: "0.38rem",
                letterSpacing: "0.06em",
                color: "rgba(96,165,250,0.85)",
                whiteSpace: "nowrap",
                textShadow: "0 1px 3px rgba(0,0,0,0.9)",
              }}>{p.elev}</div>
            </div>
            {/* Horizontal stem line */}
            <div style={{
              position: "absolute",
              left: stemLeft,
              top: stemY - 0.25,
              width: stemRight - stemLeft,
              height: 0.5,
              background: "rgba(96,165,250,0.30)",
            }} />
            {/* Dot */}
            <div style={{
              position: "absolute", left: p.px - 2.5, top: p.py - 2.5, width: 5, height: 5,
              borderRadius: "50%", background: "#93C5FD",
              boxShadow: "0 0 6px 2px rgba(147,197,253,0.50)",
            }} />
          </div>
        );
      })}
    </div>
  );
}
