import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

/* ─── Google Fonts injection ──────────────────────────────────────────────── */
const FontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
);

/* ─── OS Detection ────────────────────────────────────────────────────────── */
function detectOS() {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const pl = navigator.platform || "";
  if (/android/i.test(ua)) return "android";
  if (/ipad|iphone|ipod/i.test(ua)) return "ios";
  if (/win/i.test(pl) || /win/i.test(ua)) return "windows";
  if (/mac/i.test(pl)) return "mac";
  if (/linux/i.test(pl)) return "linux";
  return "unknown";
}

const DOWNLOADS = {
  windows: {
    label: "Download for Windows",
    sub: ".exe · 64-bit installer",
    icon: "⊞",
    href: "#",
  },
  mac: {
    label: "Download for macOS",
    sub: ".dmg · Universal (M1 + Intel)",
    icon: "",
    href: "#",
  },
  linux: {
    label: "Download for Linux",
    sub: ".AppImage or .deb",
    icon: "🐧",
    href: "#",
  },
};
const MOBILE_OS = ["android", "ios", "unknown"];
const ALL_DL = Object.entries(DOWNLOADS).map(([os, d]) => ({ os, ...d }));

/* ─── Cursor glow ─────────────────────────────────────────────────────────── */
function CursorGlow({ dark }) {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 120, damping: 20 });
  const sy = useSpring(y, { stiffness: 120, damping: 20 });
  useEffect(() => {
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-9999 w-125 h-125 rounded-full"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        background: dark
          ? "radial-gradient(circle, rgba(251,146,60,0.06) 0%, transparent 65%)"
          : "radial-gradient(circle, rgba(234,179,8,0.08) 0%, transparent 65%)",
      }}
    />
  );
}

/* ─── Noise overlay ───────────────────────────────────────────────────────── */
function Noise() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-9998 opacity-[0.022]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "150px",
      }}
    />
  );
}

/* ─── Magnetic button wrapper ─────────────────────────────────────────────── */
function Magnetic({ children, strength = 0.22 }) {
  const ref = useRef();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });
  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated counter ────────────────────────────────────────────────────── */
function Counter({ to, suffix = "", decimals = 0, duration = 2.2 }) {
  const [val, setVal] = useState("0");
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(
        decimals
          ? (ease * to).toFixed(decimals)
          : String(Math.floor(ease * to)),
      );
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration, decimals]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* ─── Download button ─────────────────────────────────────────────────────── */
function DownloadBtn({ os, size = "lg", variant = "primary" }) {
  const [open, setOpen] = useState(false);
  const isMobile = MOBILE_OS.includes(os);
  const ref = useRef();

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pad = {
    lg: "px-6 py-4 text-[15px]",
    md: "px-5 py-3 text-[14px]",
    sm: "px-4 py-2.5 text-[13px]",
  }[size];
  const base = `cursor-pointer inline-flex items-center gap-3 rounded-xl font-semibold transition-all duration-200 select-none ${pad}`;
  const primary = `${base} bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.22)] hover:shadow-[0_0_60px_rgba(251,191,36,0.4)] active:scale-[0.98]`;
  const ghost = `${base} bg-transparent text-zinc-400 border border-zinc-700 hover:border-zinc-400 hover:text-zinc-100 active:scale-[0.98]`;
  const cls = variant === "primary" ? primary : ghost;

  if (!isMobile && DOWNLOADS[os]) {
    const d = DOWNLOADS[os];
    return (
      <Magnetic>
        <a href={d.href} className={cls}>
          <span className="text-xl leading-none shrink-0">{d.icon}</span>
          <span className="flex flex-col items-start leading-tight">
            <span>{d.label}</span>
            {size !== "sm" && (
              <span className="text-[11px] font-normal opacity-60 mt-0.5">
                {d.sub}
              </span>
            )}
          </span>
        </a>
      </Magnetic>
    );
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <Magnetic>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`${cls} ${open ? "ring-2 ring-amber-400/40" : ""}`}
        >
          <span className="text-xl leading-none shrink-0">⬇</span>
          <span className="flex flex-col items-start leading-tight">
            <span>Download RestMan</span>
            {size !== "sm" && (
              <span className="text-[11px] font-normal opacity-60 mt-0.5">
                Choose your platform
              </span>
            )}
          </span>
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-1 text-lg opacity-50"
          >
            ›
          </motion.span>
        </button>
      </Magnetic>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 z-50 min-w-70 bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
          >
            {ALL_DL.map((d, i) => (
              <a
                key={d.os}
                href={d.href}
                onClick={() => setOpen(false)}
                className={`cursor-pointer flex items-center gap-3 px-5 py-4 hover:bg-zinc-800 transition-colors duration-150 ${i < ALL_DL.length - 1 ? "border-b border-zinc-800" : ""}`}
              >
                <span className="text-2xl w-8 text-center shrink-0">
                  {d.icon}
                </span>
                <span className="flex flex-col">
                  <span className="text-[14px] font-semibold text-zinc-100">
                    {d.label}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">
                    {d.sub}
                  </span>
                </span>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Navbar ──────────────────────────────────────────────────────────────── */
function Navbar({ dark, onToggle, os }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? dark
            ? "bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60"
            : "bg-white/90 backdrop-blur-xl border-b border-zinc-200/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <div
          className={`flex items-center gap-2.5 font-bold text-[17px] tracking-tight ${dark ? "text-zinc-100" : "text-zinc-900"}`}
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect
              x="1"
              y="1"
              width="11"
              height="11"
              rx="3"
              fill={dark ? "#fbbf24" : "#d97706"}
            />
            <rect
              x="14"
              y="1"
              width="11"
              height="11"
              rx="3"
              fill={dark ? "#fbbf24" : "#d97706"}
              opacity="0.5"
            />
            <rect
              x="1"
              y="14"
              width="11"
              height="11"
              rx="3"
              fill={dark ? "#fbbf24" : "#d97706"}
              opacity="0.5"
            />
            <rect
              x="14"
              y="14"
              width="11"
              height="11"
              rx="3"
              fill={dark ? "#fbbf24" : "#d97706"}
              opacity="0.2"
            />
          </svg>
          RestMan
        </div>
        <div className="hidden md:flex items-center gap-1">
          {["Features", "Compare", "Testimonials"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className={`cursor-pointer px-4 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 ${dark ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}
            >
              {l}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className={`cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 ${dark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"}`}
          >
            <span className="text-[16px]">{dark ? "☀" : "☾"}</span>
          </button>
          <div className="hidden md:block">
            <DownloadBtn os={os} size="sm" />
          </div>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className={`cursor-pointer md:hidden flex flex-col gap-1.5 p-2 rounded-lg ${dark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
          >
            <span
              className={`block w-5 h-[1.5px] ${dark ? "bg-zinc-300" : "bg-zinc-700"}`}
            />
            <span
              className={`block w-5 h-[1.5px] ${dark ? "bg-zinc-300" : "bg-zinc-700"}`}
            />
            <span
              className={`block w-3 h-[1.5px] ${dark ? "bg-zinc-300" : "bg-zinc-700"}`}
            />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`overflow-hidden border-t ${dark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"}`}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {["Features", "Compare", "Testimonials"].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  onClick={() => setMobileOpen(false)}
                  className={`cursor-pointer px-4 py-3 rounded-lg text-[15px] font-medium ${dark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                >
                  {l}
                </a>
              ))}
              <div className="pt-3">
                <DownloadBtn os={os} size="md" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ─── Browser Mockup ──────────────────────────────────────────────────────── */
function BrowserMockup({ dark }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { label: "POST /auth/login", color: "text-blue-400" },
    { label: "GET /users/me", color: "text-emerald-400" },
    { label: "DELETE /cache/all", color: "text-rose-400" },
  ];
  const responses = [
    {
      status: "200 OK",
      ms: "124ms",
      body: `{\n  "token": "eyJhbGci...",\n  "user": {\n    "id": "usr_9fk2x",\n    "email": "dev@acme.io",\n    "role": "admin"\n  }\n}`,
    },
    {
      status: "200 OK",
      ms: "88ms",
      body: `{\n  "id": "usr_9fk2x",\n  "name": "Alex Dev",\n  "plan": "pro",\n  "createdAt": "2024-01-12"\n}`,
    },
    {
      status: "204 No Content",
      ms: "61ms",
      body: `// Cache cleared.\n// No response body returned.`,
    },
  ];
  const r = responses[activeTab];

  return (
    <motion.div
      className={`w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border shadow-2xl ${dark ? "bg-zinc-900 border-zinc-700/60 shadow-black/60" : "bg-white border-zinc-200 shadow-zinc-200"}`}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.65, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Chrome bar */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b ${dark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
        </div>
        <div
          className={`flex-1 mx-3 px-3 py-1 rounded-md text-[12px] font-mono text-center truncate ${dark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}`}
        >
          🔒 localhost:7777
        </div>
        <div
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${dark ? "bg-emerald-900/50 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
        >
          ● live
        </div>
      </div>

      {/* App body */}
      <div className="flex" style={{ height: "340px" }}>
        {/* Sidebar */}
        <div
          className={`w-40 shrink-0 border-r flex flex-col overflow-hidden ${dark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
        >
          <div
            className={`px-3 py-2.5 text-[10px] font-mono font-semibold tracking-widest uppercase ${dark ? "text-zinc-600" : "text-zinc-400"}`}
          >
            Collections
          </div>
          {[
            { name: "Auth", color: "bg-blue-400", count: 12 },
            { name: "Users", color: "bg-emerald-400", count: 8 },
            { name: "Payments", color: "bg-amber-400", count: 5 },
          ].map((c, i) => (
            <div
              key={c.name}
              className={`px-3 py-2 text-[12px] flex items-center gap-2 ${i === 0 ? (dark ? "bg-zinc-800 text-zinc-100" : "bg-zinc-200 text-zinc-900") : dark ? "text-zinc-500" : "text-zinc-500"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.color}`}
              />
              <span className="truncate">{c.name}</span>
              <span
                className={`ml-auto text-[10px] font-mono ${dark ? "text-zinc-600" : "text-zinc-400"}`}
              >
                {c.count}
              </span>
            </div>
          ))}
          <div
            className={`mt-auto px-3 py-3 border-t ${dark ? "border-zinc-800" : "border-zinc-200"}`}
          >
            <div
              className={`text-[10px] font-mono ${dark ? "text-zinc-600" : "text-zinc-400"}`}
            >
              ENV · production
            </div>
          </div>
        </div>

        {/* Main pane */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Tabs */}
          <div
            className={`flex border-b overflow-x-auto shrink-0 ${dark ? "border-zinc-800" : "border-zinc-200"}`}
          >
            {tabs.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`cursor-pointer shrink-0 px-3 py-2.5 text-[11px] font-mono transition-colors border-r ${dark ? "border-zinc-800" : "border-zinc-200"} ${activeTab === i ? (dark ? "bg-zinc-800 text-zinc-100" : "bg-white text-zinc-900") : dark ? "text-zinc-600 hover:text-zinc-400 bg-zinc-900" : "text-zinc-400 hover:text-zinc-600 bg-zinc-50"}`}
              >
                <span className={t.color}>{t.label.split(" ")[0]}</span>{" "}
                {t.label.split(" ").slice(1).join(" ")}
              </button>
            ))}
          </div>
          {/* Response */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                {r.status}
              </span>
              <span
                className={`text-[10px] font-mono ${dark ? "text-zinc-600" : "text-zinc-400"}`}
              >
                {r.ms} · 892B
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.pre
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`text-[12px] font-mono leading-relaxed whitespace-pre-wrap wrap-break-word ${dark ? "text-zinc-300" : "text-zinc-700"}`}
              >
                {r.body}
              </motion.pre>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
function Hero({ os, dark }) {
  const ref = useRef();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const words = ["Test APIs", "without leaving", "your browser."];

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16 px-6"
    >
      <div
        className={`absolute inset-0 ${dark ? "bg-linear-to-b from-zinc-950 via-zinc-950 to-zinc-900" : "bg-linear-to-b from-slate-50 via-white to-zinc-100"}`}
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-125 rounded-full blur-[140px] ${dark ? "opacity-25 bg-amber-600" : "opacity-30 bg-amber-200"}`}
        />
        <div
          className={`absolute bottom-0 right-1/3 w-100 h-75 rounded-full blur-[100px] ${dark ? "opacity-15 bg-orange-700" : "opacity-20 bg-orange-100"}`}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto text-center"
        style={{ y, opacity }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-8"
        >
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[12px] font-mono font-medium ${dark ? "bg-zinc-900/80 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-500"}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Free · Open Source · No sign-up
          </span>
        </motion.div>

        {/* Headline words */}
        <div className="mb-6">
          {words.map((word, i) => (
            <div key={i} className="overflow-hidden">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.2 + i * 0.13,
                  duration: 0.85,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <h1
                  className={`text-[clamp(40px,7.5vw,90px)] leading-[1.07] font-bold tracking-[-0.03em] ${
                    i === 1
                      ? "italic font-light text-amber-500"
                      : dark
                        ? "text-zinc-50"
                        : "text-zinc-950"
                  }`}
                >
                  {word}
                </h1>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.7 }}
          className={`text-[clamp(16px,2.2vw,19px)] font-light leading-[1.65] max-w-2xl mx-auto mb-10 ${dark ? "text-zinc-400" : "text-zinc-500"}`}
        >
          RestMan runs as a background service at{" "}
          <code
            className={`font-mono text-amber-500 text-[0.9em] px-1.5 py-0.5 rounded ${dark ? "bg-zinc-800" : "bg-zinc-100"}`}
          >
            localhost:7777
          </code>
          . One install. Always on. No app switching, ever.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
        >
          <DownloadBtn os={os} size="lg" variant="primary" />
          <a
            href="#features"
            className={`cursor-pointer inline-flex items-center gap-2 text-[15px] font-medium transition-colors ${dark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            See how it works
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "easeInOut",
              }}
            >
              ↓
            </motion.span>
          </a>
        </motion.div>

        {/* Proof chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95, duration: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-14"
        >
          {[
            "No sign-up",
            "No cloud",
            "No subscription",
            "No data collection",
            "No promo emails",
          ].map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-mono ${dark ? "bg-zinc-900/80 border border-zinc-800 text-zinc-500" : "bg-zinc-100 border border-zinc-200 text-zinc-500"}`}
            >
              <span className="text-amber-500 text-[10px]">✓</span> {item}
            </span>
          ))}
        </motion.div>

        {/* Browser mockup */}
        <BrowserMockup dark={dark} />
      </motion.div>
    </section>
  );
}

/* ─── Stats ───────────────────────────────────────────────────────────────── */
function Stats({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const stats = [
    { to: 12000, suffix: "+", label: "Active installs", dec: 0 },
    { to: 4.9, suffix: "★", label: "Developer rating", dec: 1 },
    { custom: "Free", label: "Forever. No catch." },
    { to: 3, suffix: "", label: "Platforms", dec: 0 },
  ];

  return (
    <section
      ref={ref}
      className={`border-y ${dark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-800/50">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.09, duration: 0.6, ease: "easeOut" }}
            className="py-12 px-6 text-center flex flex-col gap-2"
          >
            <div
              className={`text-[clamp(34px,5vw,52px)] font-bold tracking-[-0.03em] leading-none ${dark ? "text-zinc-50" : "text-zinc-900"}`}
            >
              {s.custom ? (
                s.custom
              ) : (
                <Counter to={s.to} suffix={s.suffix} decimals={s.dec} />
              )}
            </div>
            <div
              className={`text-[13px] font-mono ${dark ? "text-zinc-500" : "text-zinc-400"}`}
            >
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Feature visuals ─────────────────────────────────────────────────────── */
function VisualBrowser({ dark }) {
  return (
    <div
      className={`rounded-xl overflow-hidden border ${dark ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"}`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b ${dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-100 bg-zinc-50"}`}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div
          className={`flex-1 text-center text-[11px] font-mono ${dark ? "text-zinc-500" : "text-zinc-400"}`}
        >
          localhost:7777 · RestMan
        </div>
        <div
          className={`text-[10px] font-mono ${dark ? "text-emerald-500" : "text-emerald-600"}`}
        >
          ● live
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        {[
          { m: "POST", p: "/auth/token", c: "text-blue-400", s: "200" },
          { m: "GET", p: "/v2/users", c: "text-emerald-400", s: "200" },
          { m: "PUT", p: "/orders/91", c: "text-amber-400", s: "200" },
          { m: "DEL", p: "/cache/all", c: "text-rose-400", s: "204" },
        ].map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] font-mono ${dark ? "bg-zinc-800/80" : "bg-zinc-50"}`}
          >
            <span className={`font-bold text-[10px] w-8 shrink-0 ${r.c}`}>
              {r.m}
            </span>
            <span
              className={`flex-1 truncate ${dark ? "text-zinc-300" : "text-zinc-700"}`}
            >
              {r.p}
            </span>
            <span className="text-emerald-400 text-[10px]">{r.s}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function VisualService({ dark }) {
  return (
    <div className="space-y-3">
      {[
        {
          icon: "⚡",
          label: "Starts automatically",
          desc: "Runs on every boot",
        },
        {
          icon: "🔄",
          label: "Auto-updates via Git",
          desc: "Every 30 minutes, silently",
        },
        { icon: "🧠", label: "~45MB RAM", desc: "Less than a Chrome tab" },
        {
          icon: "📡",
          label: "Always listening",
          desc: "Port 7777 · Ready instantly",
        },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border ${dark ? "bg-zinc-900 border-zinc-700/80" : "bg-white border-zinc-200"}`}
        >
          <span className="text-xl shrink-0">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <div
              className={`text-[13px] font-semibold truncate ${dark ? "text-zinc-200" : "text-zinc-800"}`}
            >
              {item.label}
            </div>
            <div
              className={`text-[11px] font-mono ${dark ? "text-zinc-500" : "text-zinc-400"}`}
            >
              {item.desc}
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
}

function VisualEnv({ dark }) {
  const [env, setEnv] = useState(2);
  const envs = ["dev", "staging", "prod"];
  const values = [
    [
      ["BASE_URL", "https://localhost:3000"],
      ["API_KEY", "sk-dev-testkey"],
      ["TIMEOUT", "10000"],
    ],
    [
      ["BASE_URL", "https://staging.myapp.com"],
      ["API_KEY", "sk-stg-••••4a21"],
      ["TIMEOUT", "7500"],
    ],
    [
      ["BASE_URL", "https://api.myapp.com"],
      ["API_KEY", "sk-••••••••4f2a"],
      ["TIMEOUT", "5000"],
    ],
  ];
  return (
    <div
      className={`rounded-xl border overflow-hidden ${dark ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"}`}
    >
      <div
        className={`flex border-b ${dark ? "border-zinc-800" : "border-zinc-100"}`}
      >
        {envs.map((e, i) => (
          <button
            key={e}
            onClick={() => setEnv(i)}
            className={`cursor-pointer flex-1 py-3 text-[11px] font-mono font-semibold uppercase tracking-wider transition-all ${i === env ? (dark ? "bg-zinc-800 text-amber-400" : "bg-zinc-900 text-amber-400") : dark ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="p-5 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={env}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {values[env].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center gap-3 text-[12px] font-mono"
              >
                <span
                  className={`w-24 shrink-0 ${dark ? "text-zinc-500" : "text-zinc-400"}`}
                >
                  {k}
                </span>
                <span
                  className={`flex-1 truncate ${dark ? "text-zinc-200" : "text-zinc-700"}`}
                >
                  {v}
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function VisualPrivacy({ dark }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 ${dark ? "bg-zinc-900 border-zinc-700" : "bg-zinc-100 border-zinc-200"}`}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M20 3L5 10.5v10C5 28.6 11.8 36.3 20 39c8.2-2.7 15-10.4 15-18.5v-10L20 3z"
            stroke="#f87171"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="rgba(248,113,113,0.08)"
          />
          <path
            d="M13 20l5 5 9-9"
            stroke="#f87171"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <div className="text-center">
        <div
          className={`text-[15px] font-bold mb-1 ${dark ? "text-zinc-100" : "text-zinc-900"}`}
        >
          Air-gapped capable
        </div>
        <div
          className={`text-[13px] font-mono ${dark ? "text-zinc-500" : "text-zinc-400"}`}
        >
          Works with zero internet
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        {["No telemetry", "No accounts", "No cloud sync", "Fully local"].map(
          (item) => (
            <div
              key={item}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-mono ${dark ? "bg-zinc-900 border border-zinc-800 text-zinc-400" : "bg-zinc-50 border border-zinc-200 text-zinc-500"}`}
            >
              <span className="text-rose-400 text-[10px]">✓</span>
              {item}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* ─── Features (sticky scroll) ────────────────────────────────────────────── */
const FEATS = [
  {
    id: "browser",
    tag: "Zero friction",
    title: "Lives in your browser.\nAlways ready.",
    body: "RestMan sits at localhost:7777, ready the moment you open a tab. No app switching. No loading. Your entire API workspace is always one new tab away.",
    accent: "text-amber-500",
    Visual: VisualBrowser,
  },
  {
    id: "service",
    tag: "Always on",
    title: "One install.\nLifetime usage.",
    body: "Installs as a system service. Starts with your machine. Updates itself every 30 minutes. You never have to manage it again — it just silently does its job.",
    accent: "text-emerald-400",
    Visual: VisualService,
  },
  {
    id: "env",
    tag: "Environments",
    title: "Context-aware\nvariables.",
    body: "Dev, staging, production — switch with one click. Variables auto-resolve across every request. Your secrets stay local, never touching a cloud.",
    accent: "text-blue-400",
    Visual: VisualEnv,
  },
  {
    id: "privacy",
    tag: "Privacy first",
    title: "Your data never\nleaves this machine.",
    body: "No telemetry. No analytics. No promo emails. No account. RestMan is 100% offline-capable. Your keys, endpoints, and responses stay yours — forever.",
    accent: "text-rose-400",
    Visual: VisualPrivacy,
  },
];

function Features({ dark }) {
  const containerRef = useRef();
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setActive(Math.min(Math.floor(v * FEATS.length), FEATS.length - 1));
    });
  }, [scrollYProgress]);

  const f = FEATS[active];

  return (
    <section
      id="features"
      ref={containerRef}
      className="relative"
      style={{ height: `${FEATS.length * 100}vh` }}
    >
      <div
        className={`sticky top-0 h-screen flex items-center overflow-hidden ${dark ? "bg-zinc-950" : "bg-white"}`}
      >
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left */}
          <div className="flex flex-col">
            {/* Step indicators */}
            <div className="flex items-end gap-4 mb-10">
              {FEATS.map((ft, i) => (
                <button
                  key={ft.id}
                  onClick={() => {
                    const el = containerRef.current;
                    window.scrollTo({
                      top:
                        el.offsetTop +
                        (i / FEATS.length) * el.offsetHeight +
                        10,
                      behavior: "smooth",
                    });
                  }}
                  className="cursor-pointer flex flex-col items-start gap-1.5 group"
                >
                  <motion.div
                    animate={{ height: i === active ? 28 : 16 }}
                    transition={{ duration: 0.3 }}
                    className={`w-0.5 rounded-full transition-colors duration-300 ${i === active ? "bg-amber-400" : dark ? "bg-zinc-700 group-hover:bg-zinc-500" : "bg-zinc-200 group-hover:bg-zinc-400"}`}
                  />
                  <span
                    className={`text-[10px] font-mono hidden sm:block transition-colors duration-300 ${i === active ? "text-amber-400" : dark ? "text-zinc-600" : "text-zinc-400"}`}
                  >
                    {ft.tag}
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -28 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <span
                  className={`text-[11px] font-mono font-semibold tracking-[0.15em] uppercase mb-4 block ${f.accent}`}
                >
                  {f.tag}
                </span>
                <h2
                  className={`text-[clamp(28px,3.8vw,50px)] font-bold leading-[1.1] tracking-[-0.025em] mb-5 whitespace-pre-line ${dark ? "text-zinc-50" : "text-zinc-950"}`}
                >
                  {f.title}
                </h2>
                <p
                  className={`text-[16px] leading-[1.75] font-light max-w-md ${dark ? "text-zinc-400" : "text-zinc-500"}`}
                >
                  {f.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right */}
          <div className="hidden lg:flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={f.id}
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: -20 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-110"
              >
                <f.Visual dark={dark} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Lightweight ─────────────────────────────────────────────────────────── */
function Lightweight({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const metrics = [
    { label: "Memory", value: "~45MB", width: 9, color: "bg-emerald-400" },
    { label: "CPU at rest", value: "~0.1%", width: 1, color: "bg-blue-400" },
    { label: "Boot time", value: "<2s", width: 12, color: "bg-amber-400" },
    { label: "Disk", value: "~80MB", width: 8, color: "bg-rose-400" },
  ];
  return (
    <section
      ref={ref}
      className={`py-28 px-6 border-y ${dark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span
            className={`text-[11px] font-mono font-semibold tracking-[0.15em] uppercase block mb-4 ${dark ? "text-zinc-500" : "text-zinc-400"}`}
          >
            Lightweight
          </span>
          <h2
            className={`text-[clamp(28px,4vw,48px)] font-bold tracking-[-0.025em] leading-[1.1] mb-5 ${dark ? "text-zinc-50" : "text-zinc-950"}`}
          >
            Barely there.
            <br />
            <span className="text-amber-500 italic font-light">
              Always there.
            </span>
          </h2>
          <p
            className={`text-[16px] font-light leading-[1.75] ${dark ? "text-zinc-400" : "text-zinc-500"}`}
          >
            RestMan uses less memory than a Chrome tab. It runs silently 24/7,
            auto-updates itself, and costs you exactly zero attention after the
            first setup.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          {metrics.map((m, i) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[13px] font-mono ${dark ? "text-zinc-400" : "text-zinc-500"}`}
                >
                  {m.label}
                </span>
                <span
                  className={`text-[13px] font-mono font-semibold ${dark ? "text-zinc-200" : "text-zinc-800"}`}
                >
                  {m.value}
                </span>
              </div>
              <div
                className={`h-1.5 rounded-full overflow-hidden ${dark ? "bg-zinc-800" : "bg-zinc-200"}`}
              >
                <motion.div
                  className={`h-full rounded-full ${m.color}`}
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${m.width}%` } : {}}
                  transition={{
                    delay: 0.4 + i * 0.1,
                    duration: 0.9,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          ))}
          <p
            className={`text-[11px] font-mono pt-1 ${dark ? "text-zinc-600" : "text-zinc-400"}`}
          >
            Measured on a mid-range laptop · M1 MacBook Air
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Compare ─────────────────────────────────────────────────────────────── */
const ROWS = [
  { feat: "Fully offline & local", rm: true, po: false, ins: false },
  { feat: "No account required", rm: true, po: false, ins: false },
  { feat: "No subscription fees", rm: true, po: false, ins: false },
  { feat: "Runs in your browser tab", rm: true, po: true, ins: true },
  { feat: "Open source", rm: true, po: false, ins: true },
  { feat: "Zero data collection", rm: true, po: false, ins: false },
  { feat: "Auto-updates from Git", rm: true, po: true, ins: true },
  { feat: "One-time setup forever", rm: true, po: false, ins: false },
];

function Compare({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <section
      id="compare"
      ref={ref}
      className={`py-28 px-6 ${dark ? "bg-zinc-900" : "bg-zinc-50"}`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span
            className={`text-[11px] font-mono font-semibold tracking-[0.15em] uppercase block mb-4 ${dark ? "text-zinc-500" : "text-zinc-400"}`}
          >
            Comparison
          </span>
          <h2
            className={`text-[clamp(28px,4.5vw,52px)] font-bold tracking-[-0.025em] ${dark ? "text-zinc-50" : "text-zinc-950"}`}
          >
            Why teams switch to RestMan
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className={`rounded-2xl border overflow-hidden ${dark ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"}`}
        >
          {/* Head */}
          <div
            className={`grid grid-cols-4 border-b ${dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-100 bg-zinc-50"}`}
          >
            <div className="py-4 px-4 sm:px-6" />
            {[
              { n: "RestMan", h: true },
              { n: "Postman", h: false },
              { n: "Insomnia", h: false },
            ].map((c) => (
              <div
                key={c.n}
                className={`py-4 px-2 text-center text-[13px] font-semibold ${c.h ? "text-amber-400" : dark ? "text-zinc-400" : "text-zinc-500"}`}
              >
                {c.h && (
                  <span
                    className={`block text-[10px] font-mono mb-0.5 ${dark ? "text-zinc-600" : "text-zinc-400"}`}
                  >
                    free
                  </span>
                )}
                {c.n}
              </div>
            ))}
          </div>
          {ROWS.map((row, i) => (
            <motion.div
              key={row.feat}
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.055, duration: 0.4 }}
              className={`grid grid-cols-4 items-center ${i < ROWS.length - 1 ? (dark ? "border-b border-zinc-800" : "border-b border-zinc-100") : ""}`}
            >
              <div
                className={`py-4 px-4 sm:px-6 text-[13px] ${dark ? "text-zinc-300" : "text-zinc-700"}`}
              >
                {row.feat}
              </div>
              {[row.rm, row.po, row.ins].map((ok, j) => (
                <div
                  key={j}
                  className={`py-4 text-center ${j === 0 ? (dark ? "bg-amber-400/4" : "bg-amber-50/50") : ""}`}
                >
                  {ok ? (
                    <span className="text-[15px] text-emerald-400 font-bold">
                      ✓
                    </span>
                  ) : (
                    <span
                      className={`text-[13px] ${dark ? "text-zinc-700" : "text-zinc-300"}`}
                    >
                      ✕
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Testimonials ────────────────────────────────────────────────────────── */
const TESTI = [
  {
    q: "Switched from Postman after the paywall. RestMan is snappier, my credentials never leave my laptop, and I haven't thought about it since I set it up. That's the dream.",
    name: "Priya S.",
    role: "Backend Engineer",
    co: "Fintech",
    av: "PS",
  },
  {
    q: "The 'always in my browser' thing is huge. I'm already in Chrome debugging — I open a new tab and my entire API workspace is there. No app switching at all.",
    name: "Marcus T.",
    role: "Senior Dev",
    co: "SaaS",
    av: "MT",
  },
  {
    q: "Security-sensitive environment. Fully offline was non-negotiable. RestMan was the only tool that delivered. And it's free. Still can't believe it.",
    name: "Leila K.",
    role: "Security Eng.",
    co: "Enterprise",
    av: "LK",
  },
  {
    q: "Set it up once six months ago. Haven't touched it since. It just works, updates itself, and is waiting for me every time I open a tab. Zero maintenance.",
    name: "Raj M.",
    role: "Full-stack Dev",
    co: "Indie",
    av: "RM",
  },
];

function Testimonials({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState(0);

  return (
    <section
      id="testimonials"
      ref={ref}
      className={`py-28 px-6 ${dark ? "bg-zinc-950" : "bg-white"}`}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span
            className={`text-[11px] font-mono font-semibold tracking-[0.15em] uppercase block mb-4 ${dark ? "text-zinc-500" : "text-zinc-400"}`}
          >
            Testimonials
          </span>
          <h2
            className={`text-[clamp(28px,4.5vw,52px)] font-bold tracking-[-0.025em] ${dark ? "text-zinc-50" : "text-zinc-950"}`}
          >
            Developers don't lie
          </h2>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-2xl border p-8 md:p-12 ${dark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
            >
              <svg
                width="32"
                height="22"
                viewBox="0 0 32 22"
                fill="none"
                className="mb-6 opacity-40"
              >
                <path
                  d="M0 22V13.2C0 9.73.9 6.8 2.7 4.4 4.5 2 7.27.53 11 0l1.6 2.6C9.87 3.2 8.1 4.2 6.9 5.6 5.7 7 5.13 8.6 5.2 10.4H9V22H0zm18 0V13.2c0-3.47.9-6.4 2.7-8.8C22.5 2 25.27.53 29 0l1.6 2.6c-2.73.6-4.5 1.6-5.7 3-1.2 1.4-1.77 3-1.7 4.8H27V22H18z"
                  fill="currentColor"
                />
              </svg>
              <p
                className={`text-[clamp(16px,2vw,20px)] leading-[1.7] font-light mb-8 ${dark ? "text-zinc-200" : "text-zinc-700"}`}
              >
                {TESTI[active].q}
              </p>
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold font-mono shrink-0 ${dark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-600"}`}
                >
                  {TESTI[active].av}
                </div>
                <div>
                  <div
                    className={`text-[14px] font-semibold ${dark ? "text-zinc-100" : "text-zinc-900"}`}
                  >
                    {TESTI[active].name}
                  </div>
                  <div
                    className={`text-[12px] font-mono ${dark ? "text-zinc-500" : "text-zinc-400"}`}
                  >
                    {TESTI[active].role} · {TESTI[active].co}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() =>
                      setActive((a) => (a - 1 + TESTI.length) % TESTI.length)
                    }
                    className={`cursor-pointer w-9 h-9 rounded-full border flex items-center justify-center text-[16px] transition-colors ${dark ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"}`}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setActive((a) => (a + 1) % TESTI.length)}
                    className={`cursor-pointer w-9 h-9 rounded-full border flex items-center justify-center text-[16px] transition-colors ${dark ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"}`}
                  >
                    ›
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-2 mt-5">
            {TESTI.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`cursor-pointer transition-all duration-300 rounded-full ${i === active ? "w-6 h-1.5 bg-amber-400" : `w-1.5 h-1.5 ${dark ? "bg-zinc-700 hover:bg-zinc-500" : "bg-zinc-300 hover:bg-zinc-500"}`}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ───────────────────────────────────────────────────────────── */
function FinalCTA({ os, dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section
      ref={ref}
      className={`py-36 px-6 relative overflow-hidden ${dark ? "bg-zinc-950" : "bg-white"}`}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-100 rounded-full blur-[140px] ${dark ? "opacity-20 bg-amber-600" : "opacity-20 bg-amber-300"}`}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-3xl mx-auto text-center"
      >
        <span
          className={`text-[11px] font-mono font-semibold tracking-[0.15em] uppercase block mb-6 ${dark ? "text-zinc-500" : "text-zinc-400"}`}
        >
          Get started
        </span>
        <h2
          className={`text-[clamp(34px,6vw,72px)] font-bold tracking-[-0.03em] leading-[1.05] mb-6 ${dark ? "text-zinc-50" : "text-zinc-950"}`}
        >
          Your API workflow,
          <br />
          <span className="text-amber-500 italic font-light">
            finally free.
          </span>
        </h2>
        <p
          className={`text-[17px] font-light leading-[1.7] mb-10 max-w-xl mx-auto ${dark ? "text-zinc-400" : "text-zinc-500"}`}
        >
          Install once. Open your browser. Start testing. It's ready before you
          think to reach for it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <DownloadBtn os={os} size="lg" variant="primary" />
          <DownloadBtn os={os} size="lg" variant="ghost" />
        </div>
        <a
          href="mailto:restmansupport@paper.neuto.in"
          className={`cursor-pointer inline-flex items-center gap-2 text-[14px] font-mono transition-colors ${dark ? "text-zinc-600 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700"}`}
        >
          Questions?{" "}
          <span className="underline underline-offset-4">
            restmansupport@paper.neuto.in
          </span>{" "}
          →
        </a>
      </motion.div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
function Footer({ dark }) {
  return (
    <footer
      className={`border-t px-6 py-10 ${dark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          className={`flex items-center gap-2.5 font-semibold text-[15px] ${dark ? "text-zinc-300" : "text-zinc-700"}`}
        >
          <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
            <rect x="1" y="1" width="11" height="11" rx="3" fill="#fbbf24" />
            <rect
              x="14"
              y="1"
              width="11"
              height="11"
              rx="3"
              fill="#fbbf24"
              opacity="0.5"
            />
            <rect
              x="1"
              y="14"
              width="11"
              height="11"
              rx="3"
              fill="#fbbf24"
              opacity="0.5"
            />
            <rect
              x="14"
              y="14"
              width="11"
              height="11"
              rx="3"
              fill="#fbbf24"
              opacity="0.2"
            />
          </svg>
          RestMan
        </div>
        <div
          className={`flex items-center gap-6 text-[13px] font-mono ${dark ? "text-zinc-500" : "text-zinc-400"}`}
        >
          <a
            href="https://github.com/nithin-sivakumar/open-restman"
            target="_blank"
            rel="noopener"
            className={`cursor-pointer transition-colors ${dark ? "hover:text-zinc-200" : "hover:text-zinc-700"}`}
          >
            GitHub
          </a>
          <a
            href="mailto:restmansupport@paper.neuto.in"
            className={`cursor-pointer transition-colors ${dark ? "hover:text-zinc-200" : "hover:text-zinc-700"}`}
          >
            Support
          </a>
          <span>© {new Date().getFullYear()} RestMan. Open source.</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Root ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [dark, setDark] = useState(true);
  const [os, setOs] = useState("unknown");
  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    setOs(detectOS());
    const pref = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(pref);
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      setParticlesReady(true);
    });
  }, []);

  const toggle = useCallback(() => setDark((d) => !d), []);

  const particlesOpts = useMemo(
    () => ({
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      particles: {
        number: { value: 24, density: { enable: true, area: 900 } },
        color: { value: dark ? "#52525b" : "#d4d4d8" },
        links: {
          enable: true,
          color: dark ? "#3f3f46" : "#e4e4e7",
          distance: 180,
          opacity: 0.35,
          width: 0.5,
        },
        move: { enable: true, speed: 0.35, random: true, outModes: "out" },
        opacity: { value: { min: 0.05, max: 0.3 } },
        size: { value: { min: 1, max: 1.5 } },
      },
      detectRetina: true,
      interactivity: {
        events: { onHover: { enable: true, mode: "grab" }, resize: true },
        modes: { grab: { distance: 140, links: { opacity: 0.4 } } },
      },
    }),
    [dark],
  );

  return (
    <div style={{ fontFamily: "'Sora', sans-serif" }}>
      <FontLink />
      <Noise />
      <CursorGlow dark={dark} />
      {particlesReady && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{ height: "100vh" }}
        >
          <Particles
            id="tsparticles"
            options={particlesOpts}
            className="w-full h-full"
          />
        </div>
      )}
      <div
        className={`relative min-h-screen transition-colors duration-500 ${dark ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"}`}
      >
        <Navbar dark={dark} onToggle={toggle} os={os} />
        <main>
          <Hero os={os} dark={dark} />
          <Stats dark={dark} />
          <Features dark={dark} />
          <Lightweight dark={dark} />
          <Compare dark={dark} />
          <Testimonials dark={dark} />
          <FinalCTA os={os} dark={dark} />
        </main>
        <Footer dark={dark} />
      </div>
    </div>
  );
}
