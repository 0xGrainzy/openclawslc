"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraInfo } from "./MountainGL";

/* ─────────────────────────────────────────────────────────────────
   Projects the 3 most iconic Wasatch peaks into screen space.
   Shows each label only when: in front of camera, within screen,
   and far enough from other visible labels (no overlap).
───────────────────────────────────────────────────────────────── */

const MAX_H = 58;

// Three most iconic peaks — in priority order
const LABELED = [
  { name: "Timpanogos", elev: "11,752′", wx: 18, wy: 0.99 * MAX_H, wz: -16 },
  { name: "Ben Lomond",  elev: "9,712′",  wx:  8, wy: 0.78 * MAX_H, wz:  42 },
  { name: "Mt Nebo",     elev: "11,928′", wx: 16, wy: 1.00 * MAX_H, wz: -30 },
];

const MIN_DIST = 90; // px — minimum distance between any two visible labels

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

      // Project all peaks into screen space
      const projected = LABELED.map(p => {
        vec.set(p.wx, p.wy + 4, p.wz);
        const proj = vec.clone().project(camera);
        const sx = ( proj.x * 0.5 + 0.5) * width;
        const sy = (-proj.y * 0.5 + 0.5) * height;
        const inBounds = proj.z < 1
          && sx > 50 && sx < width  - 50
          && sy > 72 && sy < height - 80; // top margin keeps it from nav/edge
        return { name: p.name, elev: p.elev, x: sx, y: sy, raw: inBounds };
      });

      // Anti-collision: greedily include peaks in priority order
      const shown: { x: number; y: number }[] = [];
      const next: LabelPos[] = projected.map(p => {
        if (!p.raw) return { ...p, visible: false };
        const tooClose = shown.some(s => {
          const dx = s.x - p.x, dy = s.y - p.y;
          return Math.sqrt(dx * dx + dy * dy) < MIN_DIST;
        });
        if (tooClose) return { ...p, visible: false };
        shown.push({ x: p.x, y: p.y });
        return { ...p, visible: true };
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
            transition: "opacity 0.5s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            pointerEvents: "none",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 2 }}>
            <div style={{
              fontFamily: "monospace",
              fontSize: "0.44rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
            }}>{l.name}</div>
            <div style={{
              fontFamily: "monospace",
              fontSize: "0.38rem",
              letterSpacing: "0.1em",
              color: "rgba(96,165,250,0.6)",
              whiteSpace: "nowrap",
            }}>{l.elev}</div>
          </div>
          <div style={{ width: 1, height: 8, background: "rgba(96,165,250,0.3)" }} />
          <div style={{ width: 2.5, height: 2.5, borderRadius: "50%", background: "#60A5FA", opacity: 0.7 }} />
        </div>
      ))}
    </div>
  );
}
