"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

type Props = { name: string };

const wishLines = [
  "Chúc anh chân cứng đá mềm,",
  "Đường xa không mỏi,",
  "Đường đời có người anh thương.",
  "Chúc anh trong túi có tiền,",
  "Trong tay có việc,",
  "Trong lòng có người anh thương 💙",
];

// ----- Đường cong trái tim (heart curve) -----
const HEART_COUNT = 28; // số trái tim nhỏ chạy trên viền
const ORBIT_SECONDS = 26; // thời gian bay hết một vòng
const heartGlyphs = ["💗", "💕", "💖", "💗", "💞"];

function heartUnit(t: number) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);
  return { x, y };
}

/** Bo tròn hai đỉnh trên + lõm giữa (trái tim mềm hơn) */
function heartUnitRounded(t: number) {
  const { x, y } = heartUnit(t);
  let dy = 0;
  const lobe = (center: number, amp: number, sigma: number) => {
    let d = t - center;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const g = Math.exp(-(d * d) / (2 * sigma * sigma));
    return g * amp;
  };
  dy += lobe(Math.PI / 2, 1.65, 0.38);
  dy += lobe((3 * Math.PI) / 2, 1.65, 0.38);
  dy -= lobe(Math.PI, 1.1, 0.32);
  return { x, y: y + dy };
}

type Pt = { x: number; y: number };

function toView(t: number) {
  const { x, y } = heartUnitRounded(t);
  return { x: x + 16, y: CENTER_Y - y + HEIGHT_UNITS / 2 };
}

function catmullRomSegment(points: Pt[], tension = 0.5, closed = false) {
  const n = points.length;
  if (n < 2) return "";
  let d = `M ${points[0].x.toFixed(3)} ${points[0].y.toFixed(3)}`;
  const end = closed ? n : n - 1;
  for (let i = 0; i < end; i++) {
    const p0 = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[closed ? (i + 1) % n : i + 1];
    const p3 = points[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C ${c1x.toFixed(3)} ${c1y.toFixed(3)}, ${c2x.toFixed(3)} ${c2y.toFixed(3)}, ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`;
  }
  return closed ? `${d} Z` : d;
}

function catmullRomClosedPath(points: Pt[], tension = 0.5) {
  return catmullRomSegment(points, tension, true);
}

/** Đẩy điểm ra ngoài theo pháp tuyến cung (chữ nằm phía trên viền) */
function offsetAlongNormal(points: Pt[], offset: number) {
  const cx = 16;
  const cy = HEIGHT_UNITS / 2;
  const n = points.length;
  return points.map((p, i) => {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    let nx = -ty;
    let ny = tx;
    const nlen = Math.hypot(nx, ny) || 1;
    const ox = p.x - cx;
    const oy = p.y - cy;
    if (nx * ox + ny * oy < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { x: p.x + (nx / nlen) * offset, y: p.y + (ny / nlen) * offset };
  });
}

function sampleHeartLoop(samples: number) {
  const pts: Pt[] = [];
  for (let k = 0; k < samples; k++) {
    const t = (k / samples) * Math.PI * 2;
    pts.push(toView(t));
  }
  return pts;
}

// Tâm & kích thước trái tim để dựng viewBox (theo đường đã bo góc)
let MIN_Y = Infinity;
let MAX_Y = -Infinity;
for (let k = 0; k <= 720; k++) {
  const { y } = heartUnitRounded((k / 720) * Math.PI * 2);
  if (y < MIN_Y) MIN_Y = y;
  if (y > MAX_Y) MAX_Y = y;
}
const CENTER_Y = (MIN_Y + MAX_Y) / 2;
const HEIGHT_UNITS = MAX_Y - MIN_Y; // ~29
const WIDTH_UNITS = 32; // x ∈ [-16, 16]

// Padding viewBox để chữ cong không bị cắt ở mép
const VIEW_PAD = { left: 0.9, top: 4.2, right: 0.9, bottom: 0.4 };
const VIEWBOX_W = WIDTH_UNITS + VIEW_PAD.left + VIEW_PAD.right;
const VIEWBOX_H = HEIGHT_UNITS + VIEW_PAD.top + VIEW_PAD.bottom;
const VIEWBOX = `${-VIEW_PAD.left} ${-VIEW_PAD.top} ${VIEWBOX_W} ${VIEWBOX_H}`;

// Đường viền trái tim — spline mượt, đỉnh trên bo tròn
const HEART_PATH = catmullRomClosedPath(sampleHeartLoop(280), 0.55);

function dedupeByX(points: Pt[], minGap = 0.35) {
  const out: Pt[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i === 0 || points[i].x - out[out.length - 1].x > minGap) {
      out.push(points[i]);
    }
  }
  return out;
}

/**
 * Hai cung trên (trái / phải), tránh lõm giữa — chữ không dính ở giao điểm.
 */
function buildGreetingArcPaths() {
  const loop = sampleHeartLoop(360);
  const minY = Math.min(...loop.map((p) => p.y));
  const band = minY + 7.5;
  const top = loop.filter((p) => p.y <= band);

  const left = dedupeByX(
    top.filter((p) => p.x <= 15.2).sort((a, b) => a.x - b.x)
  );
  const right = dedupeByX(
    top.filter((p) => p.x >= 16.8).sort((a, b) => a.x - b.x)
  );

  const toPath = (pts: Pt[]) =>
    catmullRomSegment(offsetAlongNormal(pts, 1.65), 0.48, false);

  return { left: toPath(left), right: toPath(right) };
}

const GREETING_ARCS = buildGreetingArcPaths();

export default function Celebration({ name }: Props) {
  const fired = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || fired.current) return;
    fired.current = true;

    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ["#0e88c8", "#38bdf8", "#7dd3fc", "#06b6d4", "#0ea5e9"];

    confetti({
      particleCount: 160,
      spread: 100,
      startVelocity: 55,
      origin: { y: 0.6 },
      colors,
    });

    const id = window.setInterval(() => {
      if (Date.now() > end) {
        window.clearInterval(id);
        return;
      }
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 65,
        startVelocity: 50,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 65,
        startVelocity: 50,
        origin: { x: 1, y: 0.7 },
        colors,
      });
    }, 220);

    return () => window.clearInterval(id);
  }, [mounted]);

  return (
    <main className="stage">
      <div className="card">
      <motion.div
        className="heart"
        style={{ aspectRatio: `${VIEWBOX_W} / ${VIEWBOX_H}` }}
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <svg
          className="art"
          viewBox={VIEWBOX}
          aria-hidden
        >
          <defs>
            <linearGradient id="heartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#fff2f8" />
              <stop offset="100%" stopColor="#ffe1ef" />
            </linearGradient>
            <path id="heartPath" d={HEART_PATH} />
            <path id="greetingArcLeft" d={GREETING_ARCS.left} fill="none" />
            <path id="greetingArcRight" d={GREETING_ARCS.right} fill="none" />
            <linearGradient
              id="titleGradLeft"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="16"
              y2="0"
            >
              <stop offset="0%" stopColor="#0a5f94" />
              <stop offset="100%" stopColor="#0e88c8" />
            </linearGradient>
            <linearGradient
              id="titleGradRight"
              gradientUnits="userSpaceOnUse"
              x1="16"
              y1="0"
              x2="32"
              y2="0"
            >
              <stop offset="0%" stopColor="#e84a8a" />
              <stop offset="100%" stopColor="#d6336c" />
            </linearGradient>
          </defs>

          {/* thân trái tim */}
          <use
            href="#heartPath"
            fill="url(#heartFill)"
            stroke="#ffbcd8"
            strokeWidth={0.22}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <text className="arc-title arc-title-left" fill="url(#titleGradLeft)" dy="-0.2">
            <textPath
              href="#greetingArcLeft"
              startOffset="50%"
              textAnchor="middle"
            >
              Chúc mừng
            </textPath>
          </text>
          <text className="arc-title arc-title-right" fill="url(#titleGradRight)" dy="-0.2">
            <textPath
              href="#greetingArcRight"
              startOffset="50%"
              textAnchor="middle"
            >
              sinh nhật
            </textPath>
          </text>

          {/* các trái tim nhỏ chạy chầm chậm dọc viền — chỉ sau mount (tránh hydration) */}
          {mounted &&
            Array.from({ length: HEART_COUNT }).map((_, i) => {
            const size = [1.7, 2.1, 2.5][i % 3];
            const begin = `-${((ORBIT_SECONDS * i) / HEART_COUNT).toFixed(2)}s`;
            return (
              <text
                key={i}
                fontSize={size}
                textAnchor="middle"
                dominantBaseline="central"
                className="bead"
              >
                <animateMotion
                  dur={`${ORBIT_SECONDS}s`}
                  repeatCount="indefinite"
                  rotate="0"
                  begin={begin}
                  keyPoints="0;1"
                  keyTimes="0;1"
                  calcMode="linear"
                >
                  <mpath href="#heartPath" />
                </animateMotion>
                {heartGlyphs[i % heartGlyphs.length]}
              </text>
            );
          })}
        </svg>

        {/* lời chúc bên trong trái tim */}
        <div className="content">
          <motion.div
            className="cake"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            🎂
          </motion.div>

          <p className="celebrant">{name}</p>

          <p className="wish">
            {wishLines.map((line, i) => (
              <span key={i} className="wline">
                {line}
              </span>
            ))}
          </p>
        </div>

        <div className="byline" aria-label="Lời ký">
          <span className="from">Happy Birthday 🎂 Hiếu Phạm 🎂🎂💙</span>
          <span className="date">18 · 06 · 2026</span>
          <span className="from">Bảo Châu 💙</span>
        </div>
      </motion.div>
      </div>

      <style jsx>{`
        .stage {
          min-height: 100vh;
          min-height: 100dvh;
          padding: 6px 0 max(24px, env(safe-area-inset-bottom, 0px));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow-x: hidden;
          overflow-y: auto;
        }
        .card {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 100vw;
        }
        .heart {
          position: relative;
          width: 100%;
          padding-bottom: max(72px, calc(58px + env(safe-area-inset-bottom, 0px)));
          overflow: visible;
        }
        .byline {
          position: absolute;
          left: 50%;
          bottom: max(6px, env(safe-area-inset-bottom, 0px));
          transform: translateX(-50%);
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          text-align: center;
          width: min(340px, 92vw);
          max-width: 92vw;
          padding: 0 10px;
          opacity: 1;
          animation: bylineIn 0.6s ease 1s both;
        }
        @keyframes bylineIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .art {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: visible;
          filter: drop-shadow(0 26px 44px rgba(214, 51, 132, 0.28));
          pointer-events: none;
        }
        .bead {
          filter: drop-shadow(0 0.08px 0.12px rgba(236, 72, 153, 0.5));
        }
        .arc-title {
          font-size: 1.72px;
          font-weight: 800;
          letter-spacing: 0.06em;
          filter: drop-shadow(0 0.12px 0.2px rgba(255, 255, 255, 0.9));
          animation: arcTitleIn 0.7s ease 0.35s both;
        }
        .arc-title-right {
          animation-delay: 0.45s;
        }
        @keyframes arcTitleIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .content {
          position: absolute;
          left: 50%;
          top: 44%;
          transform: translate(-50%, -50%);
          transform-origin: center center;
          width: 58%;
          max-height: 46%;
          text-align: center;
          z-index: 2;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cake {
          font-size: clamp(22px, 6vw, 32px);
          line-height: 1;
          margin-bottom: 0;
          display: inline-block;
          filter: drop-shadow(0 6px 10px rgba(14, 107, 168, 0.25));
        }
        .celebrant {
          position: static;
          z-index: auto;
          margin: 2px 0 4px;
          padding: 0 4px;
          font-size: clamp(22px, 6.2vw, 30px) !important;
          line-height: 1.08;
          font-weight: 800 !important;
          letter-spacing: 0.01em;
          color: #006994 !important;
          -webkit-text-fill-color: #006994 !important;
          display: block;
          width: 100%;
          max-width: 100%;
          text-align: center;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.95);
          pointer-events: none;
          opacity: 1;
          animation: celebrantIn 0.6s ease 0.3s both;
        }
        @keyframes celebrantIn {
          from {
            opacity: 0;
            transform: translate3d(0, -8px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .wish {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: clamp(11px, 2.9vw, 14px);
          color: #7a2348;
          line-height: 1.28;
          margin: 2px 0 0;
          font-weight: 500;
          width: 100%;
          padding: 0 2px;
          box-sizing: border-box;
          animation: wishIn 0.6s ease 0.5s both;
        }
        @keyframes wishIn {
          from {
            opacity: 0;
            transform: translate3d(0, 10px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .wline {
          display: block;
        }
        .wline:last-child {
          font-size: 0.9em;
          line-height: 1.25;
          padding: 0 4px;
        }
        @media (max-width: 480px) {
          .stage {
            justify-content: flex-start;
            padding: max(4px, env(safe-area-inset-top, 0px)) 0
              max(20px, env(safe-area-inset-bottom, 0px));
          }
          .card {
            width: 100%;
            margin: auto 0;
          }
          .heart {
            padding-bottom: max(68px, calc(54px + env(safe-area-inset-bottom, 0px)));
          }
          .arc-title {
            font-size: 1.58px;
          }
          .content {
            top: 43%;
            width: 56%;
            max-height: 44%;
            transform: translate(-50%, -50%);
          }
          .celebrant {
            font-size: clamp(20px, 5.8vw, 28px) !important;
            margin: 1px 0 3px;
          }
          .wish {
            gap: 1px;
            margin-top: 0;
            font-size: clamp(10px, 2.7vw, 12px);
            line-height: 1.24;
          }
          .wline:last-child {
            font-size: 0.88em;
            padding: 0 6px;
          }
          .byline {
            width: min(320px, 94vw);
            gap: 2px;
          }
          .from {
            font-size: clamp(11px, 3vw, 14px);
            line-height: 1.3;
          }
        }
        .from {
          font-size: clamp(13px, 3.6vw, 16px);
          font-weight: 700;
          color: #d6336c;
          font-style: italic;
        }
        .date {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #0e88c8;
        }
      `}</style>
    </main>
  );
}
