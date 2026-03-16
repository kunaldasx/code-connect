"use client";

import { useEffect, useRef } from "react";

const StarCanvas = () => {
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
    <>
      <canvas
        ref={ref}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

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
    </>
  );
};

export default StarCanvas;
