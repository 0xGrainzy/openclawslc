"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraInfo } from "./MountainGL";

/* ─────────────────────────────────────────────────────────────────
   Projects Wasatch peak positions into screen space each frame
   and renders floating labels as fixed HTML elements.
───────────────────────────────────────────────────────────────── */

const MAX_H = 58;

// World positions of labeled peaks (match MountainGL terrain)
const LABELED = [
  { name: "Ben Lomond",    elev: "9,712′",  wx:  8, wy: 0.78 * MAX_H, wz: 42  },
  { name: "Mt Olympus",    elev: "9,026′",  wx: 12, wy: 0.76 * MAX_H, wz:  7  },
  { name: "Twin Peaks",    elev: "11,330′", wx: 15, wy: 0.94 * MAX_H, wz:  3  },
  { name: "Lone Peak",     elev: "11,253′", wx: 16, wy: 0.93 * MAX_H, wz: -1  },
  { name: "Timpanogos",    elev: "11,752′", wx: 18, wy: 0.99 * MAX_H, wz: -16 },
  { name: "Mt Nebo",       elev: "11,928′", wx: 16, wy: 1.00 * MAX_H, wz: -30 },
];

interface LabelPos {
  name: string;
  elev: string;
  x: number;
  y: number;
  visible: boolean;
}

interface Props {
  getCameraInfo: () => CameraInfo | null;
}

export default function PeakLabels({ getCameraInfo }: Props) {
  const [labels, setLabels] = useState<LabelPos[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const vec = new THREE.Vector3();

    function update() {
      rafRef.current = requestAnimationFrame(update);
      const info = getCameraInfo();
      if (!info) return;
      const { camera, width, height } = info;

      const next: LabelPos[] = LABELED.map(p => {
        vec.set(p.wx, p.wy + 3, p.wz); // slightly above summit
        const proj = vec.clone().project(camera);
        const sx = ( proj.x * 0.5 + 0.5) * width;
        const sy = (-proj.y * 0.5 + 0.5) * height;
        // visible if in front of camera and within screen bounds
        const visible = proj.z < 1 &&
          sx > 40 && sx < width  - 40 &&
          sy > 60 && sy < height - 40;
        return { name: p.name, elev: p.elev, x: sx, y: sy, visible };
      });
      setLabels(next);
    }
    update();
    return () => cancelAnimationFrame(rafRef.current);
  }, [getCameraInfo]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:5, pointerEvents:"none" }}>
      {labels.map(l => (
        <div
          key={l.name}
          style={{
            position: "absolute",
            left: l.x,
            top:  l.y,
            transform: "translate(-50%, -100%)",
            opacity: l.visible ? 1 : 0,
            transition: "opacity 0.4s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            pointerEvents: "none",
          }}
        >
          {/* Name + elevation */}
          <div style={{ textAlign: "center", marginBottom: 2 }}>
            <div style={{
              fontFamily: "monospace",
              fontSize: "0.48rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.3,
            }}>{l.name}</div>
            <div style={{
              fontFamily: "monospace",
              fontSize: "0.42rem",
              letterSpacing: "0.12em",
              color: "rgba(96,165,250,0.7)",
            }}>{l.elev}</div>
          </div>
          {/* Tick line */}
          <div style={{ width: 1, height: 10, background: "rgba(96,165,250,0.35)" }} />
          {/* Dot */}
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#60A5FA", opacity: 0.8 }} />
        </div>
      ))}
    </div>
  );
}
