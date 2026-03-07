import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  AnimatePresence,
  useInView,
} from "motion/react";
import {
  Download,
  Github,
  Mail,
  Check,
  X,
  ChevronDown,
  Zap,
  Shield,
  RefreshCw,
  Server,
  Cpu,
  Moon,
  Sun,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   GOOGLE FONTS — injected via <link> tag only
───────────────────────────────────────────────────────── */
function FontsLink() {
  return (
    <link
      href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  );
}

/* ─────────────────────────────────────────────────────────
   FONT CLASS HELPERS (Tailwind arbitrary value classes)
───────────────────────────────────────────────────────── */
const SYNE = "font-['Syne',sans-serif]";
const MONO = "font-['JetBrains_Mono',monospace]";

/* ─────────────────────────────────────────────────────────
   OS DETECTION
───────────────────────────────────────────────────────── */
function detectOS() {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/ipad|iphone|ipod/i.test(ua)) return "ios";
  if (/win/i.test(ua)) return "windows";
  if (/mac/i.test(ua)) return "mac";
  if (/linux/i.test(ua)) return "linux";
  return "unknown";
}

const PLATFORMS = {
  windows: { label: "Download for Windows", sub: ".exe · 64-bit", glyph: "⊞" },
  mac: {
    label: "Download for macOS",
    sub: ".dmg · Universal (M1+Intel)",
    glyph: "",
  },
  linux: { label: "Download for Linux", sub: ".AppImage or .deb", glyph: "🐧" },
};
const ALL_PLATFORMS = Object.entries(PLATFORMS).map(([os, d]) => ({
  os,
  ...d,
}));
const MOBILE_OS = ["android", "ios", "unknown"];

/* ─────────────────────────────────────────────────────────
   MASCOT — BYTE (robot dev)
───────────────────────────────────────────────────────── */
function ByteMascot({ mood = "happy", size = 56, className = "" }) {
  const moods = {
    happy: { eyeColor: "text-amber-400", eyeSymbol: "●", mouth: "⌣" },
    excited: { eyeColor: "text-emerald-400", eyeSymbol: "◉", mouth: "D" },
    thinking: { eyeColor: "text-blue-400", eyeSymbol: "●", mouth: "—" },
    shocked: { eyeColor: "text-rose-400", eyeSymbol: "◎", mouth: "O" },
    cool: { eyeColor: "text-amber-300", eyeSymbol: "▬", mouth: "‿" },
  };
  const m = moods[mood] || moods.happy;

  return (
    <motion.div
      className={`relative select-none cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.18, rotate: [0, -6, 6, 0] }}
      transition={{ type: "spring", stiffness: 280, damping: 14 }}
    >
      {/* Floating animation on body */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-zinc-800 border-2 border-zinc-600 flex flex-col items-center justify-center overflow-visible"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        {/* Antenna */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <motion.div
            className="w-2 h-2 rounded-full bg-amber-400"
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          />
          <div className="w-px h-3 bg-zinc-600" />
        </div>

        {/* Screen */}
        <div
          className="rounded-xl bg-zinc-950 border border-zinc-700 flex flex-col items-center justify-center gap-0.5"
          style={{ width: "68%", height: "52%" }}
        >
          <div className="flex gap-1.5">
            <motion.span
              className={`text-[8px] leading-none ${m.eyeColor}`}
              animate={{ scaleY: [1, 0.08, 1] }}
              transition={{ repeat: Infinity, duration: 4, delay: 1.5 }}
            >
              {m.eyeSymbol}
            </motion.span>
            <motion.span
              className={`text-[8px] leading-none ${m.eyeColor}`}
              animate={{ scaleY: [1, 0.08, 1] }}
              transition={{ repeat: Infinity, duration: 4, delay: 1.9 }}
            >
              {m.eyeSymbol}
            </motion.span>
          </div>
          <span className={`text-[7px] leading-none ${m.eyeColor}`}>
            {m.mouth}
          </span>
        </div>

        {/* Arms */}
        <div className="absolute -left-2 top-1/2 w-2 h-3 rounded-full bg-zinc-700 -translate-y-1/2" />
        <div className="absolute -right-2 top-1/2 w-2 h-3 rounded-full bg-zinc-700 -translate-y-1/2" />
        {/* Legs */}
        <div className="absolute -bottom-2 left-1/3 w-2 h-2.5 rounded-b-full bg-zinc-700 -translate-x-1/2" />
        <div className="absolute -bottom-2 right-1/3 w-2 h-2.5 rounded-b-full bg-zinc-700 translate-x-1/2" />
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   MASCOT — REX (dinosaur who hates app-switching)
───────────────────────────────────────────────────────── */
function RexMascot({ mood = "happy", size = 56, className = "" }) {
  const expressions = {
    happy: "😄",
    angry: "😤",
    relieved: "😌",
    excited: "🤩",
    sleeping: "😴",
  };
  const expr = expressions[mood] || expressions.happy;

  return (
    <motion.div
      className={`relative select-none cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -5, 0] }}
      transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
      whileHover={{ scale: 1.22, rotate: 12 }}
    >
      <div className="absolute inset-0 flex items-end justify-center">
        {/* Body */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-emerald-700 border-2 border-emerald-500 rounded-[40%_60%_55%_45%/35%_35%_65%_65%]"
          style={{ width: "70%", height: "58%" }}
        />
        {/* Head */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 bg-emerald-600 border-2 border-emerald-400 rounded-[50%_50%_42%_42%/58%_58%_42%_42%] flex items-center justify-center"
          style={{ width: "64%", height: "54%" }}
        >
          <span className="text-base leading-none">{expr}</span>
        </div>
        {/* Spikes */}
        <div className="absolute top-0.5 right-[20%] flex gap-0.5">
          {[8, 13, 9].map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-t-full bg-emerald-500"
              style={{ height: h }}
            />
          ))}
        </div>
        {/* Tail */}
        <motion.div
          className="absolute bottom-[12%] -right-2.5 w-7 h-3 rounded-full bg-emerald-700 border border-emerald-500 origin-left"
          animate={{ rotate: [0, 22, 0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
        />
        {/* Arms */}
        <div
          className="absolute bg-emerald-600 border border-emerald-400 rounded-full"
          style={{
            width: 10,
            height: 7,
            bottom: "36%",
            left: "10%",
            transform: "rotate(-22deg)",
          }}
        />
        <div
          className="absolute bg-emerald-600 border border-emerald-400 rounded-full"
          style={{
            width: 10,
            height: 7,
            bottom: "36%",
            right: "10%",
            transform: "rotate(22deg)",
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   SPEECH BUBBLE
───────────────────────────────────────────────────────── */
function SpeechBubble({ text, dark, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      className={`text-[11px] px-3 py-2 rounded-2xl rounded-bl-none border max-w-30 text-center leading-tight ${MONO} ${dark ? "bg-zinc-900 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-500"}`}
    >
      {text}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   CURSOR GLOW
───────────────────────────────────────────────────────── */
function CursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 80, damping: 22 });
  const sy = useSpring(y, { stiffness: 80, damping: 22 });
  useEffect(() => {
    const h = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return (
    <motion.div
      className="pointer-events-none fixed z-9999 rounded-full"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: 380,
        height: 380,
        background:
          "radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 65%)",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────── */
function Counter({ to, suffix = "", decimals = 0 }) {
  const [val, setVal] = useState("0");
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 2000, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(
        decimals
          ? (ease * to).toFixed(decimals)
          : String(Math.floor(ease * to)),
      );
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, decimals]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   TYPEWRITER
───────────────────────────────────────────────────────── */
function Typewriter({ phrases }) {
  const [pi, setPi] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const target = phrases[pi];
    if (!del && text === target) {
      const t = setTimeout(() => setDel(true), 2000);
      return () => clearTimeout(t);
    }
    if (del && text === "") {
      setDel(false);
      setPi((i) => (i + 1) % phrases.length);
      return;
    }
    const t = setTimeout(
      () => {
        setText(del ? text.slice(0, -1) : target.slice(0, text.length + 1));
      },
      del ? 38 : 75,
    );
    return () => clearTimeout(t);
  }, [text, del, pi, phrases]);
  return (
    <span>
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.65 }}
        className="inline-block w-0.5 h-5 bg-amber-400 ml-0.5 align-middle"
      />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   DOWNLOAD BUTTON
───────────────────────────────────────────────────────── */
function DownloadBtn({ os, size = "lg", variant = "primary" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const isMobile = MOBILE_OS.includes(os);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const szCls = {
    lg: "px-7 py-4 text-[15px]",
    md: "px-5 py-3.5 text-[14px]",
    sm: "px-4 py-2.5 text-[13px]",
  }[size];
  const base = `cursor-pointer inline-flex items-center gap-3 rounded-2xl font-semibold transition-all duration-200 select-none ${SYNE} ${szCls}`;
  const primary = `${base} bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_70px_rgba(251,191,36,0.55)] active:scale-[0.97]`;
  const ghost = `${base} bg-transparent text-zinc-300 border border-zinc-700 hover:border-amber-400/60 hover:text-white active:scale-[0.97]`;
  const cls = variant === "primary" ? primary : ghost;
  const platform = PLATFORMS[os];

  if (!isMobile && platform) {
    return (
      <motion.a
        href="#"
        className={cls}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
      >
        <Download size={size === "lg" ? 20 : 15} className="shrink-0" />
        <span className="flex flex-col items-start leading-tight">
          <span>{platform.label}</span>
          {size !== "sm" && (
            <span
              className={`text-[11px] font-normal opacity-60 mt-0.5 ${MONO}`}
            >
              {platform.sub}
            </span>
          )}
        </span>
      </motion.a>
    );
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className={`${cls} ${open ? "ring-2 ring-amber-400/30" : ""}`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
      >
        <Download size={size === "lg" ? 20 : 15} className="shrink-0" />
        <span className="flex flex-col items-start leading-tight">
          <span>Download RestMan</span>
          {size !== "sm" && (
            <span
              className={`text-[11px] font-normal opacity-60 mt-0.5 ${MONO}`}
            >
              Choose your platform
            </span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-1 opacity-50"
        >
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.17 }}
            className="absolute top-full left-0 mt-2 z-50 min-w-72 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          >
            {ALL_PLATFORMS.map((d, i) => (
              <a
                key={d.os}
                href="#"
                onClick={() => setOpen(false)}
                className={`cursor-pointer flex items-center gap-3 px-5 py-4 hover:bg-zinc-800 transition-colors ${i < ALL_PLATFORMS.length - 1 ? "border-b border-zinc-800" : ""}`}
              >
                <span className="text-2xl w-8 text-center shrink-0">
                  {d.glyph}
                </span>
                <span className="flex flex-col">
                  <span
                    className={`text-[14px] font-semibold text-zinc-100 ${SYNE}`}
                  >
                    {d.label}
                  </span>
                  <span className={`text-[11px] text-zinc-500 mt-0.5 ${MONO}`}>
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

/* ─────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────── */
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
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-zinc-950/88 backdrop-blur-2xl border-b border-zinc-800/60" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div
          className={`flex items-center gap-2.5 text-[18px] font-bold tracking-tight ${SYNE} ${dark ? "text-zinc-100" : "text-zinc-900"}`}
        >
          <div className="w-7 h-7 grid grid-cols-2 grid-rows-2 gap-0.5">
            <div className="rounded-sm bg-amber-400" />
            <div className="rounded-sm bg-amber-400 opacity-50" />
            <div className="rounded-sm bg-amber-400 opacity-50" />
            <div className="rounded-sm bg-amber-400 opacity-20" />
          </div>
          RestMan
        </div>
        <div className="hidden md:flex items-center gap-1">
          {["Features", "Compare", "Testimonials"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className={`cursor-pointer px-4 py-2 rounded-xl text-[14px] font-medium transition-all duration-150 ${SYNE} ${dark ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}
            >
              {l}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className={`cursor-pointer w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${dark ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="hidden md:block">
            <DownloadBtn os={os} size="sm" />
          </div>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className={`cursor-pointer md:hidden flex flex-col gap-1.5 p-2 rounded-xl ${dark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
          >
            <span
              className={`block w-5 h-px ${dark ? "bg-zinc-300" : "bg-zinc-700"}`}
            />
            <span
              className={`block w-5 h-px ${dark ? "bg-zinc-300" : "bg-zinc-700"}`}
            />
            <span
              className={`block w-3 h-px ${dark ? "bg-zinc-300" : "bg-zinc-700"}`}
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
            className={`overflow-hidden border-t ${dark ? "border-zinc-800 bg-zinc-950/95 backdrop-blur-xl" : "border-zinc-200 bg-white"}`}
          >
            <div className="px-6 py-4 flex flex-col gap-2">
              {["Features", "Compare", "Testimonials"].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  onClick={() => setMobileOpen(false)}
                  className={`cursor-pointer px-4 py-3 rounded-xl text-[15px] font-medium ${SYNE} ${dark ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                >
                  {l}
                </a>
              ))}
              <div className="pt-2">
                <DownloadBtn os={os} size="md" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ─────────────────────────────────────────────────────────
   BROWSER MOCKUP
───────────────────────────────────────────────────────── */
function BrowserMockup({ dark }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { label: "POST /auth/login", color: "text-blue-400" },
    { label: "GET /users/me", color: "text-emerald-400" },
    { label: "DELETE /cache", color: "text-rose-400" },
  ];
  const responses = [
    {
      status: "200 OK",
      ms: "124ms",
      body: `{\n  "token": "eyJhbGci...",\n  "user": {\n    "id": "usr_9fk2x",\n    "role": "admin"\n  }\n}`,
    },
    {
      status: "200 OK",
      ms: "88ms",
      body: `{\n  "id": "usr_9fk2x",\n  "name": "Alex Dev",\n  "plan": "pro"\n}`,
    },
    {
      status: "204 No Content",
      ms: "61ms",
      body: `// Cache cleared.\n// No body returned.`,
    },
  ];
  const r = responses[activeTab];
  return (
    <motion.div
      className={`w-full max-w-2xl mx-auto rounded-3xl overflow-hidden border shadow-2xl ${dark ? "bg-zinc-900 border-zinc-700/60 shadow-black/60" : "bg-white border-zinc-200 shadow-zinc-200/80"}`}
      initial={{ y: 60, opacity: 0, scale: 0.94 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
          className={`flex-1 mx-3 px-3 py-1 rounded-lg text-[12px] text-center truncate ${MONO} ${dark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}`}
        >
          🔒 localhost:7777
        </div>
        <motion.div
          className={`text-[10px] px-2 py-0.5 rounded-full ${MONO} ${dark ? "bg-emerald-900/50 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ● live
        </motion.div>
      </div>
      <div className="flex" style={{ height: 320 }}>
        {/* Sidebar */}
        <div
          className={`w-36 shrink-0 border-r flex flex-col ${dark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
        >
          <div
            className={`px-3 py-2.5 text-[9px] font-semibold tracking-widest uppercase ${MONO} ${dark ? "text-zinc-600" : "text-zinc-400"}`}
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
              <span className={`truncate ${SYNE}`}>{c.name}</span>
              <span
                className={`ml-auto text-[10px] ${MONO} ${dark ? "text-zinc-600" : "text-zinc-400"}`}
              >
                {c.count}
              </span>
            </div>
          ))}
          <div
            className={`mt-auto px-3 py-3 border-t ${dark ? "border-zinc-800" : "border-zinc-200"}`}
          >
            <div
              className={`text-[10px] ${MONO} ${dark ? "text-zinc-600" : "text-zinc-400"}`}
            >
              ENV · production
            </div>
          </div>
        </div>
        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            className={`flex border-b overflow-x-auto shrink-0 ${dark ? "border-zinc-800" : "border-zinc-200"}`}
          >
            {tabs.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`cursor-pointer shrink-0 px-3 py-2.5 text-[11px] transition-colors border-r ${MONO} ${dark ? "border-zinc-800" : "border-zinc-200"} ${activeTab === i ? (dark ? "bg-zinc-800 text-zinc-100" : "bg-white text-zinc-900") : dark ? "text-zinc-600 hover:text-zinc-400 bg-zinc-900" : "text-zinc-400 bg-zinc-50"}`}
              >
                <span className={t.color}>{t.label.split(" ")[0]}</span>{" "}
                {t.label.split(" ").slice(1).join(" ")}
              </button>
            ))}
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`text-[11px] font-semibold text-emerald-400 ${MONO}`}
              >
                {r.status}
              </span>
              <span
                className={`text-[10px] ${MONO} ${dark ? "text-zinc-600" : "text-zinc-400"}`}
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
                transition={{ duration: 0.2 }}
                className={`text-[12px] leading-relaxed whitespace-pre-wrap ${MONO} ${dark ? "text-zinc-300" : "text-zinc-700"}`}
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

/* ─────────────────────────────────────────────────────────
   HERO
───────────────────────────────────────────────────────── */
function Hero({ os, dark }) {
  const ref = useRef();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [rexMood, setRexMood] = useState("angry");

  useEffect(() => {
    const t = setTimeout(() => setRexMood("relieved"), 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16 px-6"
    >
      {/* Background */}
      <div
        className={`absolute inset-0 ${dark ? "bg-zinc-950" : "bg-slate-50"}`}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glows */}
      <motion.div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] pointer-events-none ${dark ? "bg-amber-600/20" : "bg-amber-200/40"}`}
        style={{ width: 700, height: 500 }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ repeat: Infinity, duration: 8 }}
      />
      <motion.div
        className={`absolute bottom-0 right-1/4 rounded-full blur-[100px] pointer-events-none ${dark ? "bg-orange-700/12" : "bg-orange-100/30"}`}
        style={{ width: 400, height: 300 }}
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ repeat: Infinity, duration: 6, delay: 2 }}
      />

      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto text-center"
        style={{ y, opacity }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-8"
        >
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[12px] font-medium ${MONO} ${dark ? "bg-zinc-900/80 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-500"}`}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-emerald-400 inline-block"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            Free · Open Source · No sign-up · No BS
          </div>
        </motion.div>

        {/* Headline with flanking mascots */}
        <div className="mb-6 relative">
          <motion.div
            className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
          >
            <SpeechBubble text="New tab. Ready. 🚀" dark={dark} delay={1.9} />
            <ByteMascot mood="excited" size={60} />
          </motion.div>

          <motion.div
            className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            <SpeechBubble
              text={
                rexMood === "angry" ? "Not ANOTHER app! 😤" : "Finally free! 😌"
              }
              dark={dark}
              delay={2}
            />
            <RexMascot mood={rexMood} size={60} />
          </motion.div>

          {["Test APIs", "without leaving", "your browser."].map((word, i) => (
            <div key={i} className="overflow-hidden">
              <motion.h1
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.2 + i * 0.13,
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`text-[clamp(40px,7.5vw,96px)] leading-[1.06] font-bold tracking-[-0.03em] ${SYNE} ${i === 1 ? "italic font-light text-amber-500" : dark ? "text-zinc-50" : "text-zinc-950"}`}
              >
                {word}
              </motion.h1>
            </div>
          ))}
        </div>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68, duration: 0.7 }}
          className={`text-[clamp(16px,2.2vw,20px)] font-light leading-[1.7] max-w-2xl mx-auto mb-3 ${SYNE} ${dark ? "text-zinc-400" : "text-zinc-500"}`}
        >
          RestMan runs as a background service at{" "}
          <code
            className={`text-amber-500 text-[0.88em] px-2 py-0.5 rounded-lg ${MONO} ${dark ? "bg-zinc-800" : "bg-zinc-100"}`}
          >
            localhost:7777
          </code>
          . One install. Always on. Always there.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.88, duration: 0.7 }}
          className={`text-[clamp(14px,1.8vw,17px)] font-light mb-10 ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
        >
          <Typewriter
            phrases={[
              "No app switching. Ever.",
              "One install. Lifetime usage.",
              "Zero data collection.",
              "No subscription. No sign-in.",
              "Fully offline. Fully yours.",
            ]}
          />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
        >
          <DownloadBtn os={os} size="lg" variant="primary" />
          <a
            href="https://github.com/nithin-sivakumar/open-restman"
            target="_blank"
            rel="noopener"
            className={`cursor-pointer inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl border font-semibold text-[15px] transition-all duration-200 ${SYNE} ${dark ? "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"}`}
          >
            <Github size={18} />
            View on GitHub
          </a>
          <a
            href="#features"
            className={`cursor-pointer inline-flex items-center gap-2 text-[15px] font-medium transition-colors ${SYNE} ${dark ? "text-zinc-500 hover:text-zinc-200" : "text-zinc-400 hover:text-zinc-800"}`}
          >
            See how it works
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
            >
              <ChevronDown size={16} />
            </motion.span>
          </a>
        </motion.div>

        {/* Proof pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-14"
        >
          {[
            "No sign-up",
            "No cloud",
            "No subscription",
            "No data collection",
            "No promo emails",
          ].map((item) => (
            <motion.span
              key={item}
              whileHover={{ scale: 1.07, y: -2 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] cursor-default ${MONO} ${dark ? "bg-zinc-900/80 border border-zinc-800 text-zinc-500" : "bg-zinc-100 border border-zinc-200 text-zinc-500"}`}
            >
              <Check size={9} className="text-amber-500 shrink-0" />
              {item}
            </motion.span>
          ))}
        </motion.div>

        <BrowserMockup dark={dark} />
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   STATS
───────────────────────────────────────────────────────── */
function Stats({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const items = [
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
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {items.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className={`py-12 px-6 text-center flex flex-col gap-2 ${i > 0 ? (dark ? "border-l border-zinc-800" : "border-l border-zinc-200") : ""}`}
          >
            <div
              className={`text-[clamp(36px,5vw,54px)] font-bold tracking-[-0.03em] leading-none ${SYNE} ${dark ? "text-zinc-50" : "text-zinc-900"}`}
            >
              {s.custom ? (
                s.custom
              ) : (
                <Counter to={s.to} suffix={s.suffix} decimals={s.dec} />
              )}
            </div>
            <div
              className={`text-[13px] ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
            >
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   FEATURE SECTION VISUALS
───────────────────────────────────────────────────────── */
function VisualBrowser({ dark }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden border ${dark ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"}`}
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
          className={`flex-1 text-center text-[11px] ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
        >
          localhost:7777 · RestMan
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        {[
          { m: "POST", p: "/auth/token", c: "text-blue-400" },
          { m: "GET", p: "/v2/users", c: "text-emerald-400" },
          { m: "PUT", p: "/orders/91", c: "text-amber-400" },
          { m: "DEL", p: "/cache/all", c: "text-rose-400" },
        ].map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ x: 5 }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] cursor-pointer transition-colors ${MONO} ${dark ? "bg-zinc-800/80 hover:bg-zinc-800" : "bg-zinc-50 hover:bg-zinc-100"}`}
          >
            <span className={`font-bold text-[10px] w-8 shrink-0 ${r.c}`}>
              {r.m}
            </span>
            <span
              className={`flex-1 truncate ${dark ? "text-zinc-300" : "text-zinc-700"}`}
            >
              {r.p}
            </span>
            <span className="text-emerald-400 text-[10px]">200</span>
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
          icon: <Zap size={16} />,
          label: "Starts automatically",
          desc: "Runs on every boot",
          color: "text-amber-400",
        },
        {
          icon: <RefreshCw size={16} />,
          label: "Auto-updates via Git",
          desc: "Every 30 min, silently",
          color: "text-blue-400",
        },
        {
          icon: <Cpu size={16} />,
          label: "~45MB RAM",
          desc: "Less than a Chrome tab",
          color: "text-emerald-400",
        },
        {
          icon: <Server size={16} />,
          label: "Always listening",
          desc: "Port 7777 · Ready instantly",
          color: "text-purple-400",
        },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ x: 5, scale: 1.01 }}
          className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border cursor-default transition-all ${dark ? "bg-zinc-900 border-zinc-700/80 hover:border-zinc-600" : "bg-white border-zinc-200 hover:border-zinc-300"}`}
        >
          <span className={`shrink-0 ${item.color}`}>{item.icon}</span>
          <div className="flex-1 min-w-0">
            <div
              className={`text-[13px] font-semibold truncate ${SYNE} ${dark ? "text-zinc-200" : "text-zinc-800"}`}
            >
              {item.label}
            </div>
            <div
              className={`text-[11px] ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
            >
              {item.desc}
            </div>
          </div>
          <motion.span
            className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
          />
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
      className={`rounded-2xl border overflow-hidden ${dark ? "bg-zinc-950 border-zinc-700" : "bg-white border-zinc-200"}`}
    >
      <div
        className={`flex border-b ${dark ? "border-zinc-800" : "border-zinc-100"}`}
      >
        {envs.map((e, i) => (
          <button
            key={e}
            onClick={() => setEnv(i)}
            className={`cursor-pointer flex-1 py-3 text-[11px] font-semibold uppercase tracking-wider transition-all ${MONO} ${i === env ? (dark ? "bg-zinc-800 text-amber-400" : "bg-zinc-900 text-amber-400") : dark ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"}`}
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
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {values[env].map(([k, v]) => (
              <div
                key={k}
                className={`flex items-center gap-3 text-[12px] ${MONO}`}
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
    <div className="flex flex-col items-center gap-5 py-4">
      <motion.div
        animate={{ scale: [1, 1.07, 1], rotate: [0, 2, -2, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 ${dark ? "bg-zinc-900 border-zinc-700" : "bg-zinc-100 border-zinc-200"}`}
      >
        <Shield size={36} className="text-rose-400" />
      </motion.div>
      <div className="text-center">
        <div
          className={`text-[16px] font-bold mb-1 ${SYNE} ${dark ? "text-zinc-100" : "text-zinc-900"}`}
        >
          Air-gapped capable
        </div>
        <div
          className={`text-[13px] ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
        >
          Works with zero internet
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        {["No telemetry", "No accounts", "No cloud sync", "Fully local"].map(
          (item) => (
            <motion.div
              key={item}
              whileHover={{ scale: 1.04 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] cursor-default transition-all ${MONO} ${dark ? "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700" : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}
            >
              <Check size={10} className="text-emerald-400 shrink-0" />
              {item}
            </motion.div>
          ),
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FEATURES — sticky scroll
───────────────────────────────────────────────────────── */
const FEATS = [
  {
    id: "browser",
    tag: "Zero friction",
    title: "Lives in your browser.\nAlways ready.",
    body: "RestMan sits at localhost:7777, ready the moment you open a tab. No app switching. No loading. Your entire API workspace is always one new tab away.",
    accent: "text-amber-500",
    Visual: VisualBrowser,
    byteMood: "excited",
    rexMood: "relieved",
    byteQuote: "New tab. Ready. 🚀",
    rexQuote: "No switching! 🙌",
  },
  {
    id: "service",
    tag: "Always on",
    title: "One install.\nLifetime usage.",
    body: "Installs as a system service. Starts with your machine. Updates itself every 30 minutes. You never manage it again — it silently does its job.",
    accent: "text-emerald-400",
    Visual: VisualService,
    byteMood: "cool",
    rexMood: "sleeping",
    byteQuote: "Set it. Forget it.",
    rexQuote: "Zzz...always on 😴",
  },
  {
    id: "env",
    tag: "Environments",
    title: "Context-aware\nvariables.",
    body: "Dev, staging, production — switch with one click. Variables auto-resolve across every request. Secrets stay local, never touching a cloud.",
    accent: "text-blue-400",
    Visual: VisualEnv,
    byteMood: "thinking",
    rexMood: "happy",
    byteQuote: "ENV resolved! ✓",
    rexQuote: "Local = safe 🔐",
  },
  {
    id: "privacy",
    tag: "Privacy first",
    title: "Your data never\nleaves this machine.",
    body: "No telemetry. No analytics. No account. No promo emails. RestMan is 100% offline-capable. Your keys and responses stay yours — forever.",
    accent: "text-rose-400",
    Visual: VisualPrivacy,
    byteMood: "happy",
    rexMood: "excited",
    byteQuote: "Your data. Period.",
    rexQuote: "Zero tracking! 🦕",
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
        {/* Subtle dot bg */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
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
                    animate={{ height: i === active ? 28 : 14 }}
                    transition={{ duration: 0.3 }}
                    className={`w-0.5 rounded-full transition-colors duration-300 ${i === active ? "bg-amber-400" : dark ? "bg-zinc-700 group-hover:bg-zinc-500" : "bg-zinc-200 group-hover:bg-zinc-400"}`}
                  />
                  <span
                    className={`text-[10px] hidden sm:block transition-colors duration-300 ${MONO} ${i === active ? "text-amber-400" : dark ? "text-zinc-600" : "text-zinc-400"}`}
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
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <span
                  className={`text-[11px] font-semibold tracking-[0.15em] uppercase mb-4 block ${MONO} ${f.accent}`}
                >
                  {f.tag}
                </span>
                <h2
                  className={`text-[clamp(28px,3.8vw,52px)] font-bold leading-[1.08] tracking-[-0.025em] mb-5 whitespace-pre-line ${SYNE} ${dark ? "text-zinc-50" : "text-zinc-950"}`}
                >
                  {f.title}
                </h2>
                <p
                  className={`text-[16px] leading-[1.75] font-light max-w-md ${SYNE} ${dark ? "text-zinc-400" : "text-zinc-500"}`}
                >
                  {f.body}
                </p>

                {/* Mascots reacting to each feature */}
                <div className="flex items-end gap-5 mt-8">
                  <div className="flex flex-col items-center gap-2">
                    <SpeechBubble text={f.byteQuote} dark={dark} delay={0.2} />
                    <ByteMascot mood={f.byteMood} size={50} />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <SpeechBubble text={f.rexQuote} dark={dark} delay={0.35} />
                    <RexMascot mood={f.rexMood} size={50} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right visual */}
          <div className="hidden lg:flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={f.id}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md"
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

/* ─────────────────────────────────────────────────────────
   LIGHTWEIGHT
───────────────────────────────────────────────────────── */
function Lightweight({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(null);
  const metrics = [
    {
      label: "RAM",
      value: "~45MB",
      pct: 9,
      color: "bg-emerald-400",
      note: "Less than one Chrome tab",
    },
    {
      label: "CPU idle",
      value: "~0.1%",
      pct: 1,
      color: "bg-blue-400",
      note: "Practically invisible",
    },
    {
      label: "Boot time",
      value: "<2s",
      pct: 12,
      color: "bg-amber-400",
      note: "Ready before you type",
    },
    {
      label: "Disk",
      value: "~80MB",
      pct: 8,
      color: "bg-rose-400",
      note: "Smaller than most updates",
    },
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
          <div className="flex items-center gap-4 mb-6">
            <ByteMascot mood="cool" size={48} />
            <motion.div
              className={`text-[12px] px-3 py-2 rounded-2xl border ${MONO} ${dark ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-500"}`}
              animate={{ x: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              I barely exist. 🤏
            </motion.div>
          </div>
          <span
            className={`text-[11px] font-semibold tracking-[0.15em] uppercase block mb-4 ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
          >
            Lightweight
          </span>
          <h2
            className={`text-[clamp(28px,4vw,50px)] font-bold tracking-[-0.025em] leading-[1.08] mb-5 ${SYNE} ${dark ? "text-zinc-50" : "text-zinc-950"}`}
          >
            Barely there.
            <br />
            <span className="text-amber-500 italic font-light">
              Always there.
            </span>
          </h2>
          <p
            className={`text-[16px] font-light leading-[1.75] ${SYNE} ${dark ? "text-zinc-400" : "text-zinc-500"}`}
          >
            RestMan uses less memory than a Chrome tab. It runs silently 24/7,
            auto-updates itself, and costs you exactly zero attention after
            setup.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="space-y-5"
        >
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              className="cursor-default"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[13px] font-semibold ${MONO} ${dark ? "text-zinc-400" : "text-zinc-500"}`}
                  >
                    {m.label}
                  </span>
                  <AnimatePresence>
                    {hovered === i && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={`text-[11px] ${MONO} ${dark ? "text-zinc-600" : "text-zinc-400"}`}
                      >
                        · {m.note}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span
                  className={`text-[13px] font-semibold ${MONO} ${dark ? "text-zinc-200" : "text-zinc-800"}`}
                >
                  {m.value}
                </span>
              </div>
              <div
                className={`h-2 rounded-full overflow-hidden ${dark ? "bg-zinc-800" : "bg-zinc-200"}`}
              >
                <motion.div
                  className={`h-full rounded-full ${m.color} transition-opacity ${hovered === i ? "opacity-100" : "opacity-75"}`}
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${m.pct}%` } : {}}
                  transition={{
                    delay: 0.4 + i * 0.1,
                    duration: 1,
                    ease: "easeOut",
                  }}
                />
              </div>
            </motion.div>
          ))}
          <p
            className={`text-[11px] pt-1 ${MONO} ${dark ? "text-zinc-600" : "text-zinc-400"}`}
          >
            Measured on M1 MacBook Air
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPARE
───────────────────────────────────────────────────────── */
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
          <div className="flex items-center justify-center gap-4 mb-5">
            <RexMascot mood="excited" size={44} />
            <motion.div
              className={`text-[12px] px-3 py-2 rounded-2xl border ${MONO} ${dark ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-500"}`}
            >
              Free AND better?? No way! 🦕
            </motion.div>
          </div>
          <span
            className={`text-[11px] font-semibold tracking-[0.15em] uppercase block mb-4 ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
          >
            Comparison
          </span>
          <h2
            className={`text-[clamp(28px,4.5vw,54px)] font-bold tracking-[-0.025em] ${SYNE} ${dark ? "text-zinc-50" : "text-zinc-950"}`}
          >
            Why teams switch to RestMan
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className={`rounded-3xl border overflow-hidden ${dark ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"}`}
        >
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
                className={`py-4 px-2 text-center text-[13px] font-semibold ${SYNE} ${c.h ? "text-amber-400" : dark ? "text-zinc-400" : "text-zinc-500"}`}
              >
                {c.h && (
                  <span
                    className={`block text-[10px] font-normal mb-0.5 ${MONO} ${dark ? "text-zinc-600" : "text-zinc-400"}`}
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
              transition={{ delay: 0.3 + i * 0.055 }}
              className={`grid grid-cols-4 items-center ${i < ROWS.length - 1 ? (dark ? "border-b border-zinc-800" : "border-b border-zinc-100") : ""}`}
            >
              <div
                className={`py-4 px-4 sm:px-6 text-[13px] ${SYNE} ${dark ? "text-zinc-300" : "text-zinc-700"}`}
              >
                {row.feat}
              </div>
              {[row.rm, row.po, row.ins].map((ok, j) => (
                <div
                  key={j}
                  className={`py-4 text-center ${j === 0 ? (dark ? "bg-amber-400/4" : "bg-amber-50/50") : ""}`}
                >
                  {ok ? (
                    <Check size={16} className="text-emerald-400 mx-auto" />
                  ) : (
                    <X
                      size={14}
                      className={`mx-auto ${dark ? "text-zinc-700" : "text-zinc-300"}`}
                    />
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

/* ─────────────────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────────────────── */
const TESTI = [
  {
    q: "Switched from Postman after the paywall. RestMan is snappier, my credentials never leave my laptop, and I haven't thought about it since I set it up. That's the dream.",
    name: "Priya S.",
    role: "Backend Engineer",
    co: "Fintech",
    av: "PS",
    byteMood: "excited",
  },
  {
    q: "The 'always in my browser' thing is huge. I'm already in Chrome debugging — I open a new tab and my entire API workspace is there. No app switching at all.",
    name: "Marcus T.",
    role: "Senior Dev",
    co: "SaaS",
    av: "MT",
    byteMood: "happy",
  },
  {
    q: "Security-sensitive environment. Fully offline was non-negotiable. RestMan was the only tool that delivered. And it's free. Still can't believe it.",
    name: "Leila K.",
    role: "Security Eng.",
    co: "Enterprise",
    av: "LK",
    byteMood: "cool",
  },
  {
    q: "Set it up once six months ago. Haven't touched it since. It just works, updates itself, and is waiting for me every time I open a tab. Zero maintenance.",
    name: "Raj M.",
    role: "Full-stack Dev",
    co: "Indie",
    av: "RM",
    byteMood: "thinking",
  },
];

function Testimonials({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState(0);
  const t = TESTI[active];
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
            className={`text-[11px] font-semibold tracking-[0.15em] uppercase block mb-4 ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
          >
            Testimonials
          </span>
          <h2
            className={`text-[clamp(28px,4.5vw,54px)] font-bold tracking-[-0.025em] ${SYNE} ${dark ? "text-zinc-50" : "text-zinc-950"}`}
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
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-3xl border p-8 md:p-12 ${dark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
            >
              <div
                className={`text-6xl leading-none mb-4 ${dark ? "text-zinc-700" : "text-zinc-200"} ${SYNE}`}
              >
                "
              </div>
              <p
                className={`text-[clamp(16px,2vw,21px)] leading-[1.7] font-light mb-8 ${SYNE} ${dark ? "text-zinc-200" : "text-zinc-700"}`}
              >
                {t.q}
              </p>
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-bold shrink-0 ${MONO} ${dark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-600"}`}
                >
                  {t.av}
                </div>
                <div>
                  <div
                    className={`text-[14px] font-semibold ${SYNE} ${dark ? "text-zinc-100" : "text-zinc-900"}`}
                  >
                    {t.name}
                  </div>
                  <div
                    className={`text-[12px] ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
                  >
                    {t.role} · {t.co}
                  </div>
                </div>
                <div className="ml-4 hidden sm:block">
                  <ByteMascot mood={t.byteMood} size={44} />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setActive((a) => (a - 1 + TESTI.length) % TESTI.length)
                    }
                    className={`cursor-pointer w-9 h-9 rounded-2xl border flex items-center justify-center text-[16px] transition-colors ${dark ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100" : "border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"}`}
                  >
                    ‹
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActive((a) => (a + 1) % TESTI.length)}
                    className={`cursor-pointer w-9 h-9 rounded-2xl border flex items-center justify-center text-[16px] transition-colors ${dark ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100" : "border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"}`}
                  >
                    ›
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-2 mt-5">
            {TESTI.map((_, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.3 }}
                onClick={() => setActive(i)}
                className={`cursor-pointer rounded-full transition-all duration-300 ${i === active ? "w-6 h-1.5 bg-amber-400" : `w-1.5 h-1.5 ${dark ? "bg-zinc-700 hover:bg-zinc-500" : "bg-zinc-300 hover:bg-zinc-500"}`}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   FINAL CTA
───────────────────────────────────────────────────────── */
function FinalCTA({ os, dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [dlHovered, setDlHovered] = useState(false);
  return (
    <section
      ref={ref}
      className={`py-36 px-6 relative overflow-hidden ${dark ? "bg-zinc-950" : "bg-white"}`}
    >
      {/* Dot bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glow */}
      <motion.div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] pointer-events-none ${dark ? "bg-amber-600/12" : "bg-amber-300/18"}`}
        style={{ width: 700, height: 400 }}
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ repeat: Infinity, duration: 8 }}
      />
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-3xl mx-auto text-center"
      >
        {/* Mascots celebrating */}
        <div className="flex items-end justify-center gap-6 mb-8">
          <motion.div
            animate={{ rotate: dlHovered ? [-6, 6, -6] : 0 }}
            transition={{ repeat: dlHovered ? Infinity : 0, duration: 0.4 }}
          >
            <ByteMascot mood={dlHovered ? "excited" : "happy"} size={62} />
          </motion.div>
          <motion.div
            className={`text-[13px] px-4 py-2.5 rounded-2xl border mb-3 ${MONO} ${dark ? "bg-zinc-900 border-zinc-700 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"}`}
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
          >
            {dlHovered ? "Yes!! Download us! 🎉" : "We're waiting for you..."}
          </motion.div>
          <motion.div
            animate={{ rotate: dlHovered ? [6, -6, 6] : 0 }}
            transition={{ repeat: dlHovered ? Infinity : 0, duration: 0.4 }}
          >
            <RexMascot mood={dlHovered ? "excited" : "happy"} size={62} />
          </motion.div>
        </div>

        <span
          className={`text-[11px] font-semibold tracking-[0.15em] uppercase block mb-6 ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
        >
          Get started
        </span>
        <h2
          className={`text-[clamp(34px,6vw,76px)] font-bold tracking-[-0.03em] leading-[1.04] mb-6 ${SYNE} ${dark ? "text-zinc-50" : "text-zinc-950"}`}
        >
          Your API workflow,
          <br />
          <span className="text-amber-500 italic font-light">
            finally free.
          </span>
        </h2>
        <p
          className={`text-[17px] font-light leading-[1.7] mb-10 max-w-xl mx-auto ${SYNE} ${dark ? "text-zinc-400" : "text-zinc-500"}`}
        >
          Install once. Open your browser. Start testing. It's ready before you
          think to reach for it.
        </p>
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          onMouseEnter={() => setDlHovered(true)}
          onMouseLeave={() => setDlHovered(false)}
        >
          <DownloadBtn os={os} size="lg" variant="primary" />
          <DownloadBtn os={os} size="lg" variant="ghost" />
        </div>
        <a
          href="mailto:restmansupport@paper.neuto.in"
          className={`cursor-pointer inline-flex items-center gap-2 text-[14px] transition-colors ${MONO} ${dark ? "text-zinc-600 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700"}`}
        >
          <Mail size={14} />
          Questions? restmansupport@paper.neuto.in →
        </a>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────── */
function Footer({ dark }) {
  return (
    <footer
      className={`border-t px-6 py-10 ${dark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          className={`flex items-center gap-2.5 font-semibold text-[16px] ${SYNE} ${dark ? "text-zinc-300" : "text-zinc-700"}`}
        >
          <div className="w-6 h-6 grid grid-cols-2 grid-rows-2 gap-0.5">
            <div className="rounded-sm bg-amber-400" />
            <div className="rounded-sm bg-amber-400 opacity-50" />
            <div className="rounded-sm bg-amber-400 opacity-50" />
            <div className="rounded-sm bg-amber-400 opacity-20" />
          </div>
          RestMan
        </div>
        <div
          className={`flex items-center gap-6 text-[13px] ${MONO} ${dark ? "text-zinc-500" : "text-zinc-400"}`}
        >
          <a
            href="https://github.com/nithin-sivakumar/open-restman"
            target="_blank"
            rel="noopener"
            className={`cursor-pointer inline-flex items-center gap-1.5 transition-colors ${dark ? "hover:text-zinc-200" : "hover:text-zinc-700"}`}
          >
            <Github size={13} /> GitHub
          </a>
          <a
            href="mailto:restmansupport@paper.neuto.in"
            className={`cursor-pointer inline-flex items-center gap-1.5 transition-colors ${dark ? "hover:text-zinc-200" : "hover:text-zinc-700"}`}
          >
            <Mail size={13} /> Support
          </a>
          <span>© {new Date().getFullYear()} RestMan. Open source.</span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────
   ROOT
───────────────────────────────────────────────────────── */
export default function App() {
  const [dark, setDark] = useState(true);
  const [os, setOs] = useState("unknown");

  useEffect(() => {
    setOs(detectOS());
    if (window.matchMedia) {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  const toggle = useCallback(() => setDark((d) => !d), []);

  return (
    <div
      className={`${SYNE} transition-colors duration-500 overflow-x-hidden ${dark ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"}`}
    >
      <FontsLink />
      {/* <CursorGlow /> */}
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
  );
}
