"use client";

import { useEffect, useRef } from "react";
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

// Tâm & kích thước trái tim để dựng viewBox
let MIN_Y = Infinity;
let MAX_Y = -Infinity;
for (let k = 0; k <= 720; k++) {
  const { y } = heartUnit((k / 720) * Math.PI * 2);
  if (y < MIN_Y) MIN_Y = y;
  if (y > MAX_Y) MAX_Y = y;
}
const CENTER_Y = (MIN_Y + MAX_Y) / 2;
const HEIGHT_UNITS = MAX_Y - MIN_Y; // ~29
const WIDTH_UNITS = 32; // x ∈ [-16, 16]

// Đường viền trái tim trong hệ toạ độ viewBox (32 x HEIGHT_UNITS)
const HEART_PATH = (() => {
  let d = "";
  const samples = 200;
  for (let k = 0; k <= samples; k++) {
    const t = (k / samples) * Math.PI * 2;
    const { x, y } = heartUnit(t);
    const sx = x + 16;
    const sy = CENTER_Y - y + HEIGHT_UNITS / 2;
    d += `${k === 0 ? "M" : "L"}${sx.toFixed(3)} ${sy.toFixed(3)} `;
  }
  return d + "Z";
})();

export default function Celebration({ name }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
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
  }, []);

  return (
    <main className="stage">
      <motion.div
        className="heart"
        style={{ aspectRatio: `${WIDTH_UNITS} / ${HEIGHT_UNITS}` }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <svg
          className="art"
          viewBox={`0 0 ${WIDTH_UNITS} ${HEIGHT_UNITS}`}
          aria-hidden
        >
          <defs>
            <linearGradient id="heartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#fff2f8" />
              <stop offset="100%" stopColor="#ffe1ef" />
            </linearGradient>
            <path id="heartPath" d={HEART_PATH} />
          </defs>

          {/* thân trái tim */}
          <use
            href="#heartPath"
            fill="url(#heartFill)"
            stroke="#ffbcd8"
            strokeWidth={0.22}
          />

          {/* các trái tim nhỏ chạy chầm chậm dọc viền */}
          {Array.from({ length: HEART_COUNT }).map((_, i) => {
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

          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
          >
            Chúc mừng sinh nhật
            <span className="name">{name}</span>
          </motion.h1>

          <motion.p
            className="wish"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {wishLines.map((line, i) => (
              <span key={i} className="wline">
                {line}
              </span>
            ))}
          </motion.p>

          <motion.div
            className="sign"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <span className="from">Yêu anh, Bảo Châu 💙</span>
            <span className="date">18 · 06 · 2026</span>
          </motion.div>
        </div>
      </motion.div>

      <style jsx>{`
        .stage {
          min-height: 100vh;
          min-height: 100dvh;
          padding: 24px 8px 36px;
          display: grid;
          place-items: center;
          position: relative;
          overflow: hidden;
        }
        .heart {
          position: relative;
          width: min(460px, calc(100vw - 16px));
          filter: drop-shadow(0 26px 44px rgba(214, 51, 132, 0.28));
        }
        .art {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          overflow: visible;
        }
        .bead {
          filter: drop-shadow(0 0.08px 0.12px rgba(236, 72, 153, 0.5));
        }
        .content {
          position: absolute;
          left: 50%;
          top: 45%;
          transform: translate(-50%, -50%);
          width: 72%;
          text-align: center;
          z-index: 2;
        }
        .cake {
          font-size: clamp(30px, 8vw, 42px);
          line-height: 1;
          display: inline-block;
          filter: drop-shadow(0 6px 10px rgba(14, 107, 168, 0.25));
        }
        h1 {
          font-size: clamp(15px, 3.6vw, 19px);
          color: #0e6ba8;
          margin: 4px 0 0;
          font-weight: 700;
          line-height: 1.2;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .name {
          font-size: clamp(22px, 6vw, 32px);
          background: linear-gradient(135deg, #0e88c8 0%, #38bdf8 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }
        .wish {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: clamp(13px, 3.4vw, 16px);
          color: #7a2348;
          line-height: 1.45;
          margin: 10px 0 0;
          font-weight: 500;
        }
        .wline {
          display: block;
        }
        .sign {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
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
