"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraInfo } from "./MountainGL";

const MAX_H = 30;

// Matches peaks in MountainGL.tsx exactly
const PEAKS_DEF = [
  { name:"Grandeur",     elev:"9,299′",  wx:  8, wy: 0.12*MAX_H, wz: +16 },
  { name:"Mt Olympus",   elev:"9,030′",  wx: 10, wy: 0.30*MAX_H, wz: +10 },
  { name:"Mt Raymond",   elev:"10,241′", wx: 13, wy: 0.52*MAX_H, wz:  +5 },
  { name:"Kessler Peak", elev:"10,403′", wx: 14, wy: 0.62*MAX_H, wz:  +1 },
  { name:"Mt Superior",  elev:"11,032′", wx: 16, wy: 0.84*MAX_H, wz:  -3 },
  { name:"Broads Fork",  elev:"11,330′", wx: 17, wy: 1.00*MAX_H, wz:  -7 },
  { name:"Pfeifferhorn", elev:"11,325′", wx: 18, wy: 0.96*MAX_H, wz: -11 },
  { name:"Lone Peak",    elev:"11,253′", wx: 16, wy: 0.80*MAX_H, wz: -17 },
  { name:"Box Elder",    elev:"11,101′", wx: 15, wy: 0.52*MAX_H, wz: -23 },
];

const LABEL_W  = 86;
const LABEL_H  = 34;
const MIN_XGAP = 50;

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
        vec.set(p.wx, p.wy + 1.0, p.wz);
        const proj = vec.clone().project(camera);
        if (proj.z >= 1) continue;
        const px = ( proj.x * 0.5 + 0.5) * width;
        const py = (-proj.y * 0.5 + 0.5) * height;
        if (px < 14 || px > width - 14 || py < 58 || py > height - 24) continue;
        visible.push({ name: p.name, elev: p.elev, px, py });
      }
      visible.sort((a, b) => a.px - b.px);

      const result: Placed[] = [];
      for (const v of visible) {
        let lx = v.px - LABEL_W / 2;
        let ly = v.py - LABEL_H - 10;
        for (const prev of result) {
          if (Math.abs(v.px - (prev.lx + LABEL_W / 2)) < MIN_XGAP && ly + LABEL_H > prev.ly) {
            ly = prev.ly - LABEL_H - 5;
          }
        }
        ly = Math.max(ly, 58);
        result.push({ name:v.name, elev:v.elev, px:v.px, py:v.py, lx, ly, stemH:Math.max(4, v.py-(ly+LABEL_H)) });
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
          <div style={{ position:"absolute", left:p.lx, top:p.ly, width:LABEL_W, textAlign:"center" }}>
            <div style={{ fontFamily:"'JetBrains Mono','Fira Code',monospace", fontSize:"0.42rem",
              letterSpacing:"0.16em", textTransform:"uppercase",
              color:"rgba(255,255,255,0.88)", lineHeight:1.3, whiteSpace:"nowrap" }}>{p.name}</div>
            <div style={{ fontFamily:"'JetBrains Mono','Fira Code',monospace", fontSize:"0.37rem",
              letterSpacing:"0.08em", color:"rgba(96,165,250,0.92)", whiteSpace:"nowrap" }}>{p.elev}</div>
          </div>
          <div style={{ position:"absolute", left:p.px-0.5, top:p.ly+LABEL_H, width:1, height:p.stemH,
            background:"linear-gradient(to bottom,rgba(96,165,250,0.62) 0%,rgba(96,165,250,0.06) 100%)" }}/>
          <div style={{ position:"absolute", left:p.px-2.5, top:p.py-2.5, width:5, height:5,
            borderRadius:"50%", background:"#93C5FD", boxShadow:"0 0 6px 2px rgba(147,197,253,0.55)" }}/>
        </div>
      ))}
    </div>
  );
}
