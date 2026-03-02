"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraInfo } from "./MountainGL";

const MAX_H = 22;
const Z_STRETCH = 3.0;

// Only 4 key peaks — keeps it clean and readable
const PEAKS_DEF = [
  { name:"OLYMPUS",       elev:"9,026′",  wx: 10, wy: MAX_H * 0.42, wz:  +7 },
  { name:"TWIN PEAKS",    elev:"11,330′", wx: 20, wy: MAX_H * 0.98, wz:  -3 },
  { name:"LONE PEAK",     elev:"11,253′", wx: 20, wy: MAX_H * 0.78, wz: -15 },
];

interface Placed {
  name: string; elev: string;
  px: number; py: number;
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

      const result: Placed[] = [];
      for (const p of PEAKS_DEF) {
        vec.set(p.wx, p.wy + 0.8, p.wz * Z_STRETCH);
        const proj = vec.clone().project(camera);
        if (proj.z >= 1) continue;
        const px = (proj.x * 0.5 + 0.5) * width;
        const py = (-proj.y * 0.5 + 0.5) * height;
        // Must be well within frame
        if (px < 30 || px > width - 30 || py < 30 || py > height * 0.65) continue;
        result.push({ name: p.name, elev: p.elev, px, py });
      }
      setPlaced(result);
    }
    tick();
    return () => cancelAnimationFrame(raf.current);
  }, [getCameraInfo]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 6, pointerEvents: "none" }}>
      {placed.map(p => (
        <div key={p.name} style={{ position: "absolute", left: p.px, top: p.py - 28, transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "0.78rem",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1,
            whiteSpace: "nowrap",
            textShadow: "0 1px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.8)",
          }}>{p.name}</div>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: "0.36rem",
            letterSpacing: "0.08em",
            color: "rgba(96,165,250,0.80)",
            whiteSpace: "nowrap",
            textShadow: "0 1px 4px rgba(0,0,0,1)",
          }}>{p.elev}</div>
          {/* Small dot at peak */}
          <div style={{
            position: "absolute", left: "50%", bottom: -10,
            transform: "translateX(-50%)",
            width: 4, height: 4,
            borderRadius: "50%", background: "rgba(147,197,253,0.70)",
            boxShadow: "0 0 4px 1px rgba(147,197,253,0.35)",
          }} />
        </div>
      ))}
    </div>
  );
}
