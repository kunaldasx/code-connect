"use client";

import { useState, useEffect, useRef } from "react";
import {
  Code2,
  Eye,
  Terminal,
  FileText,
  Video,
  Copy,
  Check,
  ArrowRight,
  Users,
  Globe,
  Zap,
  Star,
} from "lucide-react";
import Orb from "@/components/animated-orb-bg";

function genId() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const s = (n) =>
    Array.from(
      { length: n },
      () => c[Math.floor(Math.random() * c.length)],
    ).join("");
  return `${s(4)}-${s(4)}`;
}
function toRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`
    : "255,255,255";
}

const FEATURES = [
  {
    Icon: Code2,
    title: "Real-time Collaboration",
    desc: "See every keystroke live with cursor sharing, highlight sync, and follow mode to code side-by-side.",
    color: "#4DF4FF",
  },
  {
    Icon: Eye,
    title: "Live Preview",
    desc: "Render UI changes instantly. Tailwind CSS, React, and 40+ libraries preloaded and ready to go.",
    color: "#B07AFF",
  },
  {
    Icon: Terminal,
    title: "Shared Terminal",
    desc: "Run code together and see output simultaneously across 80+ supported languages.",
    color: "#3FFFB0",
  },
  {
    Icon: Star,
    title: "GitHub Integrated",
    desc: "Open files directly from your repos and push collaborative work straight back with ease.",
    color: "#FF9A4A",
  },
  {
    Icon: FileText,
    title: "Shared Notepad",
    desc: "Rich text notes and full markdown, synced live alongside your code editor in real time.",
    color: "#FFE160",
  },
  {
    Icon: Video,
    title: "Video & Voice",
    desc: "HD video and crystal-clear voice built in — communicate without leaving your workspace.",
    color: "#FF6FAF",
  },
];

const STATS = [
  { val: "80+", label: "Languages", Icon: Globe },
  { val: "0s", label: "Setup Time", Icon: Zap },
  { val: "∞", label: "Collaborators", Icon: Users },
  { val: "Live", label: "Sync Speed", Icon: Code2 },
];

const STEPS = [
  {
    n: "01",
    title: "Enter Your Name",
    desc: "No email. No password. No account needed. Just your name and you're instantly ready to go.",
    colors: ["77,244,255", "#4DF4FF", "#6AB0FF"],
  },
  {
    n: "02",
    title: "Create or Beam In",
    desc: "Launch your own room and share the ID, or paste a friend's code to join their session instantly.",
    colors: ["176,122,255", "#9966FF", "#FF66AA"],
  },
  {
    n: "03",
    title: "Start Coding Together",
    desc: "Your full collaborative toolkit activates. Code, preview, run terminals, and talk — all perfectly in sync.",
    colors: ["63,255,176", "#3FFFB0", "#4DF4FF"],
  },
];

function StarCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let raf,
      frame = 0,
      W,
      H;
    const resize = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.15,
      ph: Math.random() * Math.PI * 2,
      sp: 0.003 + Math.random() * 0.011,
      ba: 0.1 + Math.random() * 0.85,
    }));
    let sh = [];
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        s.ph += s.sp;
        const a =
          s.ba * (0.12 + 0.88 * Math.pow(Math.abs(Math.sin(s.ph)), 1.6));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,225,255,${a})`;
        ctx.fill();
      }
      if (frame % 200 === 0 && Math.random() > 0.25) {
        sh.push({
          x: W + 60,
          y: Math.random() * H * 0.55,
          vx: -(8 + Math.random() * 11),
          vy: 3 + Math.random() * 6,
          life: 1,
          len: 90 + Math.random() * 150,
          col: Math.random() < 0.5 ? "77,244,255" : "160,120,255",
        });
      }
      sh = sh.filter((s) => s.life > 0);
      for (const s of sh) {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.017;
        const m = Math.hypot(s.vx, s.vy);
        const tx = s.x - (s.vx / m) * s.len,
          ty = s.y - (s.vy / m) * s.len;
        const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
        g.addColorStop(0, `rgba(${s.col},${s.life * 0.9})`);
        g.addColorStop(0.3, `rgba(${s.col},${s.life * 0.4})`);
        g.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 7);
        hg.addColorStop(0, `rgba(${s.col},${s.life})`);
        hg.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = hg;
        ctx.fill();
      }
      frame++;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

function Planet() {
  return (
    <div
      style={{ position: "relative", width: 300, height: 300, flexShrink: 0 }}
    >
      <div
        style={{
          position: "absolute",
          inset: -60,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(77,244,255,0.06) 0%,transparent 65%)",
        }}
      />
      {/* Ring 1 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 180,
          height: 180,
          marginTop: -90,
          marginLeft: -90,
          borderRadius: "50%",
          border: "1px solid rgba(77,244,255,0.2)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 0,
            height: 0,
            animation: "sat1 7s linear infinite",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 9,
              height: 9,
              top: -4.5,
              left: -4.5,
              borderRadius: "50%",
              background: "#4DF4FF",
              boxShadow: "0 0 10px #4DF4FF,0 0 24px rgba(77,244,255,0.55)",
            }}
          />
        </div>
      </div>
      {/* Ring 2 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 240,
          height: 240,
          marginTop: -120,
          marginLeft: -120,
          borderRadius: "50%",
          border: "1px solid rgba(176,122,255,0.15)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 0,
            height: 0,
            animation: "sat2 12s linear infinite",
            animationDelay: "-4s",
            animationDirection: "reverse",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              top: -5,
              left: -5,
              borderRadius: "50%",
              background: "#B07AFF",
              boxShadow: "0 0 10px #B07AFF,0 0 24px rgba(176,122,255,0.55)",
            }}
          />
        </div>
      </div>
      {/* Ring 3 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 280,
          height: 280,
          marginTop: -140,
          marginLeft: -140,
          borderRadius: "50%",
          border: "1px solid rgba(63,255,176,0.1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 0,
            height: 0,
            animation: "sat3 18s linear infinite",
            animationDelay: "-9s",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 7,
              height: 7,
              top: -3.5,
              left: -3.5,
              borderRadius: "50%",
              background: "#3FFFB0",
              boxShadow: "0 0 8px #3FFFB0,0 0 18px rgba(63,255,176,0.5)",
            }}
          />
        </div>
      </div>
      {/* Planet sphere */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 90,
          height: 90,
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 30%,#4DBDFF 0%,#7044BB 42%,#0F0528 100%)",
          boxShadow:
            "0 0 38px rgba(77,180,255,0.38),0 0 75px rgba(113,68,187,0.2)",
        }}
      />
      {/* Atmosphere ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 102,
          height: 102,
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          border: "2px solid rgba(77,180,255,0.18)",
          boxShadow: "0 0 22px rgba(77,180,255,0.1)",
        }}
      />
      {/* Surface highlight */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 28,
          height: 16,
          transform: "translate(-80%,-110%)",
          borderRadius: "50%",
          background: "rgba(180,230,255,0.14)",
          filter: "blur(4px)",
        }}
      />
    </div>
  );
}

function FeatureCard({ Icon, title, desc, color }) {
  const [hov, setHov] = useState(false);
  const r = toRgb(color);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `rgba(${r},0.07)` : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? `rgba(${r},0.28)` : "rgba(255,255,255,0.07)"}`,
        borderRadius: 18,
        padding: "22px 22px 24px",
        transition: "all 0.35s ease",
        transform: hov ? "translateY(-7px)" : "translateY(0)",
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `rgba(${r},0.1)`,
          border: `1px solid rgba(${r},0.22)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          boxShadow: hov ? `0 0 22px rgba(${r},0.3)` : "none",
          transition: "box-shadow 0.35s ease",
        }}
      >
        <Icon size={19} color={color} strokeWidth={1.5} />
      </div>
      <h3
        style={{
          fontFamily: "'Orbitron',sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.3,
          color: "#DCF0FF",
          marginBottom: 9,
          lineHeight: 1.4,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 13,
          color: "rgba(220,240,255,0.42)",
          lineHeight: 1.72,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

export default function CodeConnect() {
  const [mode, setMode] = useState("create");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [gid] = useState(genId);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const cardRef = useRef(null);

  const scrollToCard = (m) => {
    if (m && m !== mode) setMode(m);
    setTimeout(
      () =>
        cardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      60,
    );
  };
  const copy = () => {
    try {
      navigator.clipboard.writeText(gid);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  const canGo =
    mode === "create"
      ? !!name.trim()
      : !!name.trim() && roomId.replace("-", "").length >= 8;
  const handleAction = () => {
    if (!canGo || busy) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 1500);
  };
  const switchMode = (m) => {
    setMode(m);
    setName("");
    setRoomId("");
    setDone(false);
    setBusy(false);
  };

  const inputBase = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "13px 16px",
    color: "#DCF0FF",
    fontFamily: "'Outfit',sans-serif",
    fontSize: 15,
    outline: "none",
    transition: "all 0.25s ease",
  };

  const btnGrad =
    mode === "create"
      ? "linear-gradient(135deg,#4DF4FF 0%,#9966FF 100%)"
      : "linear-gradient(135deg,#9966FF 0%,#FF5599 100%)";
  const btnShadowRgb = mode === "create" ? "77,244,255" : "153,100,255";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{overflow-x:hidden;}
        input::placeholder{color:rgba(220,240,255,0.2)!important;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes nebula{0%,100%{transform:scale(1) translate(0,0)}33%{transform:scale(1.05) translate(20px,-16px)}66%{transform:scale(0.96) translate(-12px,20px)}}
        @keyframes shimmer{from{background-position:200% center}to{background-position:-200% center}}
        @keyframes glow{0%,100%{box-shadow:0 0 26px rgba(77,244,255,0.09)}50%{box-shadow:0 0 56px rgba(77,244,255,0.22)}}
        @keyframes pop{0%{transform:scale(1)}35%{transform:scale(0.95)}100%{transform:scale(1)}}
        @keyframes sat1{from{transform:rotate(0deg) translateX(90px) rotate(0deg)}to{transform:rotate(360deg) translateX(90px) rotate(-360deg)}}
        @keyframes sat2{from{transform:rotate(0deg) translateX(120px) rotate(0deg)}to{transform:rotate(360deg) translateX(120px) rotate(-360deg)}}
        @keyframes sat3{from{transform:rotate(0deg) translateX(140px) rotate(0deg)}to{transform:rotate(360deg) translateX(140px) rotate(-360deg)}}
        @keyframes logoOrb{from{transform:rotate(0deg) translateX(23px) rotate(0deg)}to{transform:rotate(360deg) translateX(23px) rotate(-360deg)}}
        .a1{animation:fadeUp 0.7s ease both}
        .a2{animation:fadeUp 0.78s 0.08s ease both}
        .a3{animation:fadeUp 0.86s 0.18s ease both}
        .a4{animation:fadeUp 0.94s 0.3s ease both}
        .a5{animation:fadeUp 1.02s 0.44s ease both}
        .a6{animation:fadeUp 1.1s 0.58s ease both}
        .mf{animation:slideIn 0.24s ease both}
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(ellipse at 22% 22%,#090428 0%,#020610 45%,#010209 100%)",
          fontFamily: "'Outfit',sans-serif",
          color: "#DCF0FF",
          overflowX: "hidden",
          position: "relative",
        }}
      >
        <StarCanvas />

        {/* Nebula blobs */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {[
            {
              w: 680,
              top: "-10%",
              left: "-18%",
              col: "77,244,255",
              o: 0.05,
              d: "0s",
              dur: 24,
            },
            {
              w: 560,
              top: "28%",
              right: "-12%",
              col: "140,80,255",
              o: 0.07,
              d: "-9s",
              dur: 28,
            },
            {
              w: 460,
              bottom: "4%",
              left: "12%",
              col: "255,70,150",
              o: 0.045,
              d: "-5s",
              dur: 20,
            },
          ].map(({ w, top, left, right, bottom, col, o, d, dur }, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: w,
                height: w,
                top,
                left,
                right,
                bottom,
                borderRadius: "50%",
                background: `radial-gradient(circle,rgba(${col},${o}) 0%,transparent 70%)`,
                filter: "blur(85px)",
                animation: `nebula ${dur}s ease-in-out infinite`,
                animationDelay: d,
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 28px",
          }}
        >
          {/* ── NAV ── */}
          <nav
            className="a1"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "22px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative", width: 40, height: 40 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#4DF4FF,#9966FF)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#02060F",
                    letterSpacing: 0.5,
                  }}
                >
                  CC
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 0,
                    height: 0,
                    animation: "logoOrb 3.5s linear infinite",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: 5,
                      height: 5,
                      top: -2.5,
                      left: -2.5,
                      borderRadius: "50%",
                      background: "#4DF4FF",
                      boxShadow:
                        "0 0 6px #4DF4FF,0 0 12px rgba(77,244,255,0.5)",
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontFamily: "'Orbitron',sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                }}
              >
                Code<span style={{ color: "#4DF4FF" }}>Connect</span>
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => scrollToCard("create")}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(77,244,255,0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(77,244,255,0.1)")
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(77,244,255,0.2)",
                  cursor: "pointer",
                  fontFamily: "'Orbitron',sans-serif",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  background: "rgba(77,244,255,0.1)",
                  color: "#4DF4FF",
                  transition: "all 0.2s",
                }}
              >
                GET STARTED
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 100,
                  padding: "6px 14px",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#4DF4FF",
                    animation: "pulse 2s ease-in-out infinite",
                    boxShadow: "0 0 8px rgba(77,244,255,0.6)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    color: "rgba(220,240,255,0.36)",
                    letterSpacing: 1.5,
                  }}
                >
                  NO SIGN-UP
                </span>
              </div>
            </div>
          </nav>

          {/* ── HERO ── */}
          <section
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 32,
              padding: "72px 0 64px",
              flexWrap: "wrap",
            }}
          >
            <div className="a2" style={{ flex: "1 1 380px", minWidth: 0 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: "rgba(77,244,255,0.07)",
                  border: "1px solid rgba(77,244,255,0.22)",
                  borderRadius: 100,
                  padding: "7px 16px",
                  marginBottom: 26,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#4DF4FF",
                    boxShadow: "0 0 8px #4DF4FF",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: 8.5,
                    letterSpacing: 2.5,
                    color: "#4DF4FF",
                  }}
                >
                  COLLABORATIVE CODING · REIMAGINED
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "'Orbitron',sans-serif",
                  fontSize: "clamp(30px,5vw,56px)",
                  fontWeight: 900,
                  lineHeight: 1.06,
                  marginBottom: 22,
                  letterSpacing: -0.8,
                }}
              >
                <span
                  style={{
                    background:
                      "linear-gradient(128deg,#DCF0FF 0%,#4DF4FF 35%,#9966FF 70%,#FF5599 100%)",
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "shimmer 7s linear infinite",
                  }}
                >
                  Your Coding
                </span>
                <br />
                <span style={{ color: "#DCF0FF" }}>Space,</span>
                <br />
                <span
                  style={{
                    color: "rgba(220,240,255,0.45)",
                    fontWeight: 400,
                    fontSize: "clamp(20px,3.5vw,38px)",
                  }}
                >
                  Reimagined.
                </span>
              </h1>
              <p
                style={{
                  fontSize: 16,
                  color: "rgba(220,240,255,0.46)",
                  lineHeight: 1.85,
                  marginBottom: 38,
                  maxWidth: 440,
                }}
              >
                No sign-up. No installs. Share a Room ID and start coding with
                your team instantly — directly in your browser.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => scrollToCard("create")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow =
                      "0 16px 44px rgba(77,244,255,0.36)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 28px rgba(77,244,255,0.22)";
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 28px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.8,
                    background: "linear-gradient(135deg,#4DF4FF,#9966FF)",
                    color: "#02060F",
                    boxShadow: "0 8px 28px rgba(77,244,255,0.22)",
                    transition: "all 0.25s ease",
                  }}
                >
                  CREATE ROOM <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => scrollToCard("join")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(176,122,255,0.55)";
                    e.currentTarget.style.color = "#B07AFF";
                    e.currentTarget.style.background = "rgba(153,102,255,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.12)";
                    e.currentTarget.style.color = "rgba(220,240,255,0.6)";
                    e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 28px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.8,
                    background: "transparent",
                    color: "rgba(220,240,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    transition: "all 0.25s ease",
                  }}
                >
                  JOIN ROOM <ArrowRight size={14} />
                </button>
              </div>
              <p
                style={{
                  marginTop: 28,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  color: "rgba(220,240,255,0.22)",
                  letterSpacing: 0.5,
                }}
              >
                Start in{" "}
                <span style={{ color: "rgba(77,244,255,0.6)" }}>seconds</span> ·
                Zero friction ·{" "}
                <span style={{ color: "rgba(77,244,255,0.6)" }}>
                  Free forever
                </span>
              </p>
            </div>
            <div
              className="a3"
              style={{
                flex: "0 0 auto",
                display: "flex",
                justifyContent: "center",
                animation: "float 6s ease-in-out infinite",
              }}
            >
              <Planet />
              {/* <Orb /> */}
            </div>
          </section>

          {/* ── STATS STRIP ── */}
          <section
            className="a3"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
              gap: 10,
              padding: "0 0 80px",
            }}
          >
            {STATS.map(({ val, label, Icon: IC }, i) => (
              <div
                key={i}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(77,244,255,0.2)";
                  e.currentTarget.style.background = "rgba(6,14,40,0.85)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.background = "rgba(6,14,40,0.65)";
                }}
                style={{
                  padding: "18px 22px",
                  background: "rgba(6,14,40,0.65)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transition: "all 0.3s ease",
                }}
              >
                <IC size={22} color="rgba(77,244,255,0.55)" strokeWidth={1.5} />
                <div>
                  <div
                    style={{
                      fontFamily: "'Orbitron',sans-serif",
                      fontSize: 24,
                      fontWeight: 900,
                      color: "#DCF0FF",
                      lineHeight: 1,
                    }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      color: "rgba(220,240,255,0.3)",
                      letterSpacing: 1.5,
                      marginTop: 4,
                    }}
                  >
                    {label.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* ── ROOM CARD ── */}
          <section
            ref={cardRef}
            className="a4"
            style={{ maxWidth: 510, margin: "0 auto", padding: "0 0 92px" }}
          >
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <p
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "rgba(77,244,255,0.5)",
                  letterSpacing: 3,
                  marginBottom: 8,
                }}
              >
                // START COLLABORATING
              </p>
              <h2
                style={{
                  fontFamily: "'Orbitron',sans-serif",
                  fontSize: 27,
                  fontWeight: 700,
                  color: "#DCF0FF",
                  letterSpacing: -0.3,
                }}
              >
                Launch Your Mission
              </h2>
              <p
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: "rgba(220,240,255,0.36)",
                }}
              >
                Create a room or join an existing one
              </p>
            </div>
            <div
              style={{
                background: "rgba(5,12,36,0.88)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(77,244,255,0.13)",
                borderRadius: 26,
                padding: "30px",
                animation: "glow 5s ease-in-out infinite",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background:
                    "linear-gradient(90deg,transparent,rgba(77,244,255,0.45),rgba(153,102,255,0.25),transparent)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background:
                    "linear-gradient(90deg,transparent,rgba(255,85,153,0.15),rgba(77,244,255,0.1),transparent)",
                }}
              />

              {/* Tabs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 4,
                  background: "rgba(0,0,0,0.45)",
                  borderRadius: 15,
                  padding: 4,
                  marginBottom: 28,
                }}
              >
                {[
                  { k: "create", l: "⊕  CREATE" },
                  { k: "join", l: "⤳  JOIN" },
                ].map(({ k, l }) => (
                  <button
                    key={k}
                    onClick={() => switchMode(k)}
                    style={{
                      padding: "12px",
                      borderRadius: 12,
                      border:
                        mode === k
                          ? "1px solid rgba(77,244,255,0.25)"
                          : "1px solid transparent",
                      cursor: "pointer",
                      fontFamily: "'Orbitron',sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2.2,
                      color: mode === k ? "#4DF4FF" : "rgba(220,240,255,0.24)",
                      background:
                        mode === k
                          ? "linear-gradient(135deg,rgba(77,244,255,0.11),rgba(153,102,255,0.07))"
                          : "transparent",
                      boxShadow:
                        mode === k ? "0 0 20px rgba(77,244,255,0.07)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div key={mode} className="mf">
                {mode === "create" ? (
                  <>
                    <div style={{ marginBottom: 18 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <label
                          style={{
                            fontFamily: "'Orbitron',sans-serif",
                            fontSize: 9,
                            letterSpacing: 2,
                            color: "rgba(77,244,255,0.68)",
                          }}
                        >
                          YOUR ROOM ID
                        </label>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9,
                            color: "rgba(220,240,255,0.18)",
                          }}
                        >
                          auto-generated
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "rgba(77,244,255,0.05)",
                          border: "1px solid rgba(77,244,255,0.24)",
                          borderRadius: 12,
                          padding: "13px 14px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 22,
                            color: "#4DF4FF",
                            letterSpacing: 5,
                            fontWeight: 600,
                          }}
                        >
                          {gid}
                        </span>
                        <button
                          onClick={copy}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: copied
                              ? "rgba(63,255,176,0.1)"
                              : "rgba(77,244,255,0.08)",
                            border: `1px solid ${copied ? "rgba(63,255,176,0.38)" : "rgba(77,244,255,0.24)"}`,
                            borderRadius: 8,
                            padding: "7px 11px",
                            cursor: "pointer",
                            color: copied ? "#3FFFB0" : "rgba(77,244,255,0.78)",
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9,
                            letterSpacing: 0.5,
                            transition: "all 0.2s",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? "COPIED" : "COPY"}
                        </button>
                      </div>
                      <p
                        style={{
                          marginTop: 7,
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 10,
                          color: "rgba(220,240,255,0.18)",
                        }}
                      >
                        Share this ID with collaborators to invite them →
                      </p>
                    </div>
                    <div style={{ marginBottom: 22 }}>
                      <label
                        style={{
                          display: "block",
                          fontFamily: "'Orbitron',sans-serif",
                          fontSize: 9,
                          letterSpacing: 2,
                          color: "rgba(220,240,255,0.34)",
                          marginBottom: 8,
                        }}
                      >
                        YOUR NAME
                      </label>
                      <input
                        placeholder="Enter your display name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAction()}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(77,244,255,0.48)";
                          e.currentTarget.style.background =
                            "rgba(77,244,255,0.04)";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(77,244,255,0.08)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.1)";
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.04)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        style={inputBase}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label
                        style={{
                          display: "block",
                          fontFamily: "'Orbitron',sans-serif",
                          fontSize: 9,
                          letterSpacing: 2,
                          color: "rgba(220,240,255,0.34)",
                          marginBottom: 8,
                        }}
                      >
                        ROOM ID
                      </label>
                      <input
                        placeholder="XXXX-XXXX"
                        value={roomId}
                        maxLength={9}
                        onChange={(e) => {
                          let v = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "");
                          if (v.length > 4)
                            v = v.slice(0, 4) + "-" + v.slice(4, 8);
                          setRoomId(v);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleAction()}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(176,122,255,0.52)";
                          e.currentTarget.style.background =
                            "rgba(176,122,255,0.04)";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(176,122,255,0.09)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.1)";
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.04)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        style={{
                          ...inputBase,
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 22,
                          letterSpacing: 5,
                          color: "#B07AFF",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 22 }}>
                      <label
                        style={{
                          display: "block",
                          fontFamily: "'Orbitron',sans-serif",
                          fontSize: 9,
                          letterSpacing: 2,
                          color: "rgba(220,240,255,0.34)",
                          marginBottom: 8,
                        }}
                      >
                        YOUR NAME
                      </label>
                      <input
                        placeholder="Enter your display name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAction()}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(176,122,255,0.52)";
                          e.currentTarget.style.background =
                            "rgba(176,122,255,0.04)";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(176,122,255,0.09)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.1)";
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.04)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        style={inputBase}
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={handleAction}
                  disabled={!canGo || busy}
                  onMouseEnter={(e) => {
                    if (canGo && !busy) {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = `0 18px 48px rgba(${btnShadowRgb},0.42)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    if (canGo && !busy)
                      e.currentTarget.style.boxShadow = `0 8px 28px rgba(${btnShadowRgb},0.22)`;
                  }}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 14,
                    border: "none",
                    cursor: canGo ? "pointer" : "not-allowed",
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    background: done
                      ? "linear-gradient(135deg,#3FFFB0,#4DF4FF)"
                      : busy
                        ? "rgba(77,244,255,0.1)"
                        : canGo
                          ? btnGrad
                          : "rgba(255,255,255,0.04)",
                    color: canGo
                      ? done
                        ? "#02060F"
                        : "#fff"
                      : "rgba(220,240,255,0.2)",
                    transition: "all 0.3s ease",
                    boxShadow:
                      canGo && !busy
                        ? `0 8px 28px rgba(${btnShadowRgb},0.22)`
                        : "none",
                    animation: busy ? "pop 0.5s ease" : "none",
                  }}
                >
                  {done
                    ? "✦ ORBIT LOCKED — LET'S CODE"
                    : busy
                      ? "ESTABLISHING LINK..."
                      : mode === "create"
                        ? "⊕ LAUNCH ROOM"
                        : "⤳ BEAM INTO ROOM"}
                </button>
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section className="a4" style={{ padding: "0 0 92px" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <p
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "rgba(77,244,255,0.5)",
                  letterSpacing: 3,
                  marginBottom: 10,
                }}
              >
                // HOW IT WORKS
              </p>
              <h2
                style={{
                  fontFamily: "'Orbitron',sans-serif",
                  fontSize: "clamp(20px,3.5vw,30px)",
                  fontWeight: 700,
                  color: "#DCF0FF",
                  letterSpacing: -0.3,
                }}
              >
                Three Steps to{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg,#4DF4FF,#9966FF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Orbit Together
                </span>
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
                gap: 14,
              }}
            >
              {STEPS.map(({ n, title, desc, colors }, i) => (
                <div
                  key={i}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `rgba(${colors[0]},0.3)`;
                    e.currentTarget.style.background = `rgba(${colors[0]},0.04)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.07)";
                    e.currentTarget.style.background = "rgba(6,14,38,0.55)";
                  }}
                  style={{
                    padding: "30px 26px",
                    background: "rgba(6,14,38,0.55)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 18,
                    transition: "all 0.3s ease",
                    cursor: "default",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Orbitron',sans-serif",
                        fontSize: 42,
                        fontWeight: 900,
                        color: `rgba(${colors[0]},0.12)`,
                        lineHeight: 1,
                      }}
                    >
                      {n}
                    </div>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: colors[1],
                        boxShadow: `0 0 10px ${colors[1]}`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 3,
                      borderRadius: 2,
                      background: `linear-gradient(90deg,${colors[1]},${colors[2]})`,
                      marginBottom: 16,
                      opacity: 0.65,
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: "'Orbitron',sans-serif",
                      fontSize: 11.5,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      color: "#DCF0FF",
                      marginBottom: 10,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "rgba(220,240,255,0.42)",
                      lineHeight: 1.74,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section className="a5" style={{ padding: "0 0 92px" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <p
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "rgba(77,244,255,0.5)",
                  letterSpacing: 3,
                  marginBottom: 10,
                }}
              >
                // BUILT FOR BUILDERS
              </p>
              <h2
                style={{
                  fontFamily: "'Orbitron',sans-serif",
                  fontSize: "clamp(20px,3.5vw,30px)",
                  fontWeight: 700,
                  color: "#DCF0FF",
                  letterSpacing: -0.3,
                }}
              >
                Everything You Need to{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg,#4DF4FF,#9966FF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Code Together
                </span>
              </h2>
              <p
                style={{
                  marginTop: 12,
                  fontSize: 15,
                  color: "rgba(220,240,255,0.38)",
                  maxWidth: 460,
                  margin: "12px auto 0",
                  lineHeight: 1.75,
                }}
              >
                A full-featured collaborative environment that lives entirely in
                your browser.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
                gap: 12,
              }}
            >
              {FEATURES.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </section>

          {/* ── CTA BAND ── */}
          <section className="a6" style={{ padding: "0 0 92px" }}>
            <div
              style={{
                background:
                  "linear-gradient(135deg,rgba(77,244,255,0.07) 0%,rgba(153,102,255,0.1) 55%,rgba(255,85,153,0.05) 100%)",
                border: "1px solid rgba(77,244,255,0.14)",
                borderRadius: 26,
                padding: "58px 48px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background:
                    "linear-gradient(90deg,transparent,rgba(77,244,255,0.45),rgba(153,102,255,0.25),transparent)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background:
                    "linear-gradient(90deg,transparent,rgba(255,85,153,0.2),rgba(77,244,255,0.1),transparent)",
                }}
              />
              <p
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "rgba(77,244,255,0.55)",
                  letterSpacing: 3,
                  marginBottom: 14,
                }}
              >
                // YOUR MISSION AWAITS
              </p>
              <h2
                style={{
                  fontFamily: "'Orbitron',sans-serif",
                  fontSize: "clamp(24px,4.5vw,42px)",
                  fontWeight: 900,
                  color: "#DCF0FF",
                  marginBottom: 16,
                  letterSpacing: -0.5,
                }}
              >
                Ready to Launch?
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: "rgba(220,240,255,0.45)",
                  maxWidth: 440,
                  margin: "0 auto 36px",
                  lineHeight: 1.85,
                }}
              >
                Create a room in seconds, share the ID, and start building
                something incredible together right now.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => scrollToCard("create")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow =
                      "0 18px 48px rgba(77,244,255,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(77,244,255,0.24)";
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "15px 32px",
                    borderRadius: 13,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    background: "linear-gradient(135deg,#4DF4FF,#9966FF)",
                    color: "#02060F",
                    boxShadow: "0 8px 30px rgba(77,244,255,0.24)",
                    transition: "all 0.25s ease",
                  }}
                >
                  START CODING NOW <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => scrollToCard("join")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(176,122,255,0.5)";
                    e.currentTarget.style.color = "#B07AFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "rgba(220,240,255,0.55)";
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "15px 32px",
                    borderRadius: 13,
                    cursor: "pointer",
                    fontFamily: "'Orbitron',sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    background: "transparent",
                    color: "rgba(220,240,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.25s ease",
                  }}
                >
                  JOIN EXISTING ROOM
                </button>
              </div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              padding: "18px 0 34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: "'Orbitron',sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: "rgba(220,240,255,0.2)",
                }}
              >
                CODECONNECT
              </span>
              <span style={{ color: "rgba(220,240,255,0.1)" }}>·</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "rgba(220,240,255,0.16)",
                  letterSpacing: 0.8,
                }}
              >
                YOUR COLLABORATIVE CODING SPACE
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                background: "rgba(255,85,153,0.06)",
                border: "1px solid rgba(255,85,153,0.15)",
                borderRadius: 100,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#FF5599",
                  animation: "pulse 2.5s ease-in-out infinite",
                  boxShadow: "0 0 6px rgba(255,85,153,0.7)",
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: "rgba(255,85,153,0.7)",
                  letterSpacing: 0.8,
                }}
              >
                Server Offline
              </span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
