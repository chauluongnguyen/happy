"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Celebration from "./Celebration";

type Status = "idle" | "loading" | "error";

export default function BirthdayPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      const data = (await res.json()) as { ok: boolean; name?: string };
      setName(data.name ?? "");
      setUnlocked(true);
    } catch {
      setStatus("error");
    }
  }

  if (unlocked) {
    return <Celebration name={name || "Bảo Châu"} />;
  }

  return (
    <main className="gate">
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="gift"
          animate={{ rotate: [0, -6, 6, -6, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2 }}
        >
          🎁
        </motion.div>

        <h1>Bạn đã tìm thấy món quà bí mật</h1>
        <p className="lead">Nhập mật khẩu để mở quà:</p>

        <form onSubmit={onSubmit}>
          <input
            type="password"
            inputMode="text"
            autoComplete="off"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            aria-label="Mật khẩu"
          />

          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Đang mở…" : "Nhận quà"}
          </button>
        </form>

        <AnimatePresence>
          {status === "error" && (
            <motion.p
              key="err"
              className="err"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Mật khẩu chưa đúng, thử lại nhé 🎂
            </motion.p>
          )}
        </AnimatePresence>

        <p className="hint">Gợi ý: một ngày rất đặc biệt của hai chúng ta ✨</p>
      </motion.div>

      <style jsx>{`
        .gate {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .card {
          width: min(420px, 100%);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 36px 28px 28px;
          text-align: center;
          box-shadow: 0 30px 60px -30px rgba(176, 38, 90, 0.35),
            0 6px 16px -6px rgba(176, 38, 90, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.7);
        }
        .gift {
          font-size: 56px;
          line-height: 1;
          margin-bottom: 8px;
          display: inline-block;
          transform-origin: 50% 80%;
        }
        h1 {
          font-size: 22px;
          margin: 8px 0 4px;
          color: #b0265a;
        }
        .lead {
          margin: 0 0 18px;
          color: #6b3a55;
        }
        form {
          display: grid;
          gap: 10px;
        }
        input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1.5px solid #ffc8de;
          background: #fff8fb;
          font-size: 17px;
          letter-spacing: 0.18em;
          text-align: center;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        input:focus {
          border-color: #ff6fa5;
          box-shadow: 0 0 0 4px rgba(255, 111, 165, 0.18);
        }
        button {
          padding: 13px 18px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #ff5a8a 0%, #ff80b5 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: transform 0.1s, filter 0.15s, opacity 0.15s;
        }
        button:hover {
          filter: brightness(1.04);
        }
        button:active {
          transform: translateY(1px);
        }
        button:disabled {
          opacity: 0.7;
          cursor: progress;
        }
        .err {
          margin: 12px 0 0;
          color: #c0285a;
          font-weight: 500;
        }
        .hint {
          margin: 18px 0 0;
          font-size: 13px;
          color: #a06480;
        }
      `}</style>
    </main>
  );
}
