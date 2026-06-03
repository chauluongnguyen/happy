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

  async function submit(value: string) {
    if (!value) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });

      if (!res.ok) {
        setStatus("error");
        setPassword("");
        return;
      }

      const data = (await res.json()) as { ok: boolean; name?: string };
      setName(data.name ?? "");
      setUnlocked(true);
    } catch {
      setStatus("error");
      setPassword("");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(password);
  }

  function press(digit: string) {
    if (status === "loading") return;
    if (status === "error") setStatus("idle");
    setPassword((prev) => (prev.length >= 12 ? prev : prev + digit));
  }

  function backspace() {
    if (status === "loading") return;
    if (status === "error") setStatus("idle");
    setPassword((prev) => prev.slice(0, -1));
  }

  if (unlocked) {
    return <Celebration name={name || "Hiếu Phạm"} />;
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
          <div className="dots" aria-label="Mật khẩu đã nhập">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={`dot ${i < password.length ? "filled" : ""}`}
              />
            ))}
          </div>

          <div className="keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                type="button"
                className="key"
                onClick={() => press(d)}
              >
                {d}
              </button>
            ))}
            <span className="key key-empty" aria-hidden />
            <button
              key="0"
              type="button"
              className="key"
              onClick={() => press("0")}
            >
              0
            </button>
            <button
              type="button"
              className="key key-back"
              onClick={backspace}
              aria-label="Xoá"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            disabled={status === "loading" || password.length === 0}
          >
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
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: 20px 16px;
        }
        .card {
          width: min(420px, 100%);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 36px 28px 28px;
          text-align: center;
          box-shadow: 0 30px 60px -30px rgba(14, 107, 168, 0.35),
            0 6px 16px -6px rgba(14, 107, 168, 0.18);
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
          color: #0e6ba8;
        }
        .lead {
          margin: 0 0 18px;
          color: #2b5a72;
        }
        form {
          display: grid;
          gap: 18px;
        }
        .dots {
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 4px 0 2px;
        }
        .dot {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: transparent;
          border: 2px solid #aaddf2;
          transition: background 0.15s, border-color 0.15s, transform 0.15s;
        }
        .dot.filled {
          background: #1b9bd8;
          border-color: #1b9bd8;
          transform: scale(1.12);
        }
        .keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 2px auto 0;
          width: min(300px, 100%);
        }
        .key {
          height: 64px;
          border-radius: 999px;
          border: 1.5px solid #cfeefb;
          background: #f4fbff;
          color: #0e6ba8;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: 0;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform 0.08s, background 0.15s, box-shadow 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .key:hover {
          background: #e9f7fe;
        }
        .key:active {
          transform: scale(0.94);
          background: #d6effb;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.18);
        }
        .key-empty {
          border: none;
          background: transparent;
          cursor: default;
        }
        .key-back {
          color: #0a5b86;
          font-size: 22px;
        }
        button {
          padding: 13px 18px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #0e88c8 0%, #38bdf8 100%);
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
          color: #d94f4f;
          font-weight: 500;
        }
        .hint {
          margin: 18px 0 0;
          font-size: 13px;
          color: #5a8aa0;
        }
        @media (max-width: 380px) {
          .card {
            padding: 30px 18px 22px;
          }
          .keypad {
            gap: 10px;
          }
          .key {
            height: 58px;
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}
