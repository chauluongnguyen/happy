"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

type Props = { name: string };

export default function Celebration({ name }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ["#ff5a8a", "#ffb1cf", "#ffd166", "#7ad6c0", "#a78bfa"];

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
      <motion.h1
        initial={{ opacity: 0, y: -20, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        🎉 Chúc mừng sinh nhật {name} 🎂
      </motion.h1>

      <motion.div
        className="frame"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <div className="photo">
          <img src="/photo.jpg" alt="Ảnh kỷ niệm của hai chúng ta" />
        </div>
      </motion.div>

      <motion.p
        className="wish"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        Chúc em luôn vui vẻ,
        <br />
        hạnh phúc và đạt được
        <br />
        mọi điều em mong muốn ❤️
      </motion.p>

      <motion.div
        className="hearts"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.span
            key={i}
            className="h"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: -160, opacity: [0, 1, 1, 0] }}
            transition={{
              delay: 1 + i * 0.4,
              duration: 4.5,
              repeat: Infinity,
              repeatDelay: 1.6,
              ease: "easeOut",
            }}
            style={{ left: `${8 + i * 10}%` }}
          >
            ❤️
          </motion.span>
        ))}
      </motion.div>

      <style jsx>{`
        .stage {
          min-height: 100vh;
          padding: 32px 20px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        h1 {
          font-size: clamp(24px, 5.4vw, 38px);
          color: #b0265a;
          margin: 8px 0 22px;
          font-weight: 700;
          text-shadow: 0 2px 0 #fff;
        }
        .frame {
          width: min(340px, 78vw);
          background: white;
          padding: 16px 16px 60px;
          border-radius: 6px;
          box-shadow: 0 24px 50px -24px rgba(176, 38, 90, 0.4),
            0 6px 16px -8px rgba(176, 38, 90, 0.25);
          transform: rotate(-1.5deg);
          margin-bottom: 24px;
        }
        .photo {
          width: 100%;
          aspect-ratio: 9 / 16;
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          background: #ffe1ec;
        }
        .photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .wish {
          font-size: clamp(17px, 3.4vw, 21px);
          color: #5a1d3a;
          line-height: 1.7;
          margin: 4px 0 0;
          font-weight: 500;
        }
        .hearts {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .h {
          position: absolute;
          bottom: 0;
          font-size: 22px;
        }
      `}</style>
    </main>
  );
}
