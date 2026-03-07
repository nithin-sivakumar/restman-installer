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
  ArrowUpRight,
  Terminal,
  Globe,
} from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css";

/* ── Fonts ────────────────────────────────────────────── */
function Fonts() {
  return (
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
  );
}

/* ── Font helpers ─────────────────────────────────────── */
const SERIF = "font-['DM_Serif_Display',serif]";
const SANS = "font-['DM_Sans',sans-serif]";
const MONO = "font-['JetBrains_Mono',monospace]";

/* ── OS detection ─────────────────────────────────────── */
function detectOS() {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent;

  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (ua.includes("Win")) return "windows";
  if (ua.includes("Mac")) return "mac";
  if (ua.includes("Linux")) return "linux";

  return "unknown";
}

const DOWNLOAD_LINKS = {
  windows: "/RestMan_Installer_Setup.exe",
  mac: "/RestMan_Mac.dmg",
  linux: "/RestMan_Linux.AppImage",
};

const PLATFORMS = {
  windows: {
    label: "Download for Windows",
    sub: ".exe · 64-bit installer",
    glyph: "🪟",
  },
  mac: {
    label: "Download for macOS",
    sub: ".dmg · Universal (M1 + Intel)",
    glyph: "🍎",
  },
  linux: { label: "Download for Linux", sub: ".AppImage or .deb", glyph: "🐧" },
};
const ALL_PLATFORMS = Object.entries(PLATFORMS).map(([os, d]) => ({
  os,
  ...d,
}));
const MOBILE_OS = ["android", "ios", "unknown"];

/* ── Custom cursor ────────────────────────────────────── */
function CustomCursor({ dark }) {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40 });
  const sy = useSpring(y, { stiffness: 500, damping: 40 });
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const enter = () => setHidden(false);
    const leave = () => setHidden(true);
    const over = (e) => {
      const el = e.target.closest("a,button,[data-cursor='pointer']");
      setHovered(!!el);
    };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
    };
  }, []);

  const ringColor = dark ? "border-white/40" : "border-zinc-900/50";
  const dotColor = dark ? "bg-white" : "bg-zinc-900";

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className={` fixed z-9999 rounded-full border ${ringColor} transition-colors duration-300`}
        style={{
          x: sx,
          y: sy,
          translateX: "-50%",
          translateY: "-50%",
          width: hovered ? 44 : 32,
          height: hovered ? 44 : 32,
          opacity: hidden ? 0 : 1,
          transition: "width 0.2s ease, height 0.2s ease, opacity 0.2s ease",
        }}
      />
      {/* Inner dot */}
      <motion.div
        className={` fixed z-9999 rounded-full ${dotColor} transition-colors duration-300`}
        style={{
          x: sx,
          y: sy,
          translateX: "-50%",
          translateY: "-50%",
          width: hovered ? 6 : 4,
          height: hovered ? 6 : 4,
          opacity: hidden ? 0 : 1,
          transition: "width 0.15s ease, height 0.15s ease, opacity 0.2s ease",
        }}
      />
    </>
  );
}

/* ── Typewriter ───────────────────────────────────────── */
function Typewriter({ phrases, className }) {
  const [pi, setPi] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const target = phrases[pi];
    if (!del && text === target) {
      const t = setTimeout(() => setDel(true), 2400);
      return () => clearTimeout(t);
    }
    if (del && text === "") {
      setDel(false);
      setPi((i) => (i + 1) % phrases.length);
      return;
    }
    const t = setTimeout(
      () => setText(del ? text.slice(0, -1) : target.slice(0, text.length + 1)),
      del ? 32 : 68,
    );
    return () => clearTimeout(t);
  }, [text, del, pi, phrases]);

  return (
    <span className={className}>
      {text}
      <motion.span
        className="inline-block w-0.5 h-[1em] bg-orange-400 ml-0.5 align-middle"
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.7 }}
      />
    </span>
  );
}

/* ── Animated counter ─────────────────────────────────── */
function Counter({ to, suffix = "", decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let startTime = null;

    const tick = (time) => {
      if (!startTime) startTime = time;

      const progress = Math.min((time - startTime) / 1800, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(eased * to);

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, to]);

  const display = decimals
    ? value.toFixed(decimals)
    : Math.floor(value).toString();

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

function GithubBtn({ os, dark, size = "lg", ghost = false }) {
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

  const sz = {
    lg: `px-7 py-4 text-[15px] gap-3`,
    md: `px-5 py-3.5 text-[14px] gap-2.5`,
    sm: `px-4 py-2.5 text-[13px] gap-2`,
  }[size];

  const base = `cursor-pointer inline-flex items-center rounded-2xl font-medium select-none transition-all duration-200 ${SANS} ${sz}`;
  const solid = `${base} bg-orange-400 text-zinc-950 hover:bg-orange-300 active:scale-[0.97]`;

  const outline = `${base} border backdrop-blur-sm active:scale-[0.97] ${
    dark
      ? "border-white/15 text-white/70 hover:text-white hover:border-white/30"
      : "border-black/15 text-zinc-700 hover:text-black hover:border-black/30"
  }`;
  const cls = ghost ? outline : solid;

  const platform = {
    label: "GitHub",
    sub: "nithin-sivakumar",
    glyph: "💻",
  };

  if (!isMobile && platform) {
    return (
      <motion.a
        href="https://github.com/nithin-sivakumar/open-restman"
        target="_blank"
        className={cls}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Github size={size === "lg" ? 18 : 14} className="shrink-0" />
        <span className="flex flex-col items-start leading-tight">
          <span>{platform.label}</span>
          {size !== "sm" && (
            <span
              className={`text-[11px] font-normal opacity-50 mt-0.5 ${MONO}`}
            >
              {platform.sub}
            </span>
          )}
        </span>
      </motion.a>
    );
  }

  return (
    <motion.a
      href="https://github.com/nithin-sivakumar/open-restman"
      target="_blank"
      rel="noopener"
      className={cls}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <Github size={size === "lg" ? 18 : 14} className="shrink-0" />
      <span className="flex flex-col items-start leading-tight">
        <span>GitHub</span>
        {size !== "sm" && (
          <span className={`text-[11px] font-normal opacity-50 mt-0.5 ${MONO}`}>
            nithin-sivakumar
          </span>
        )}
      </span>
    </motion.a>
  );
}

/* ── Download button ──────────────────────────────────── */
function DownloadBtn({ os, dark, size = "lg", ghost = false }) {
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

  const sz = {
    lg: `px-7 py-4 text-[15px] gap-3`,
    md: `px-5 py-3.5 text-[14px] gap-2.5`,
    sm: `px-4 py-2.5 text-[13px] gap-2`,
  }[size];

  const base = `cursor-pointer inline-flex items-center rounded-2xl font-medium select-none transition-all duration-200 ${SANS} ${sz}`;
  const solid = `${base} bg-orange-400 text-zinc-950 hover:bg-orange-300 active:scale-[0.97]`;

  const outline = `${base} border backdrop-blur-sm active:scale-[0.97] ${
    dark
      ? "border-white/15 text-white/70 hover:text-white hover:border-white/30"
      : "border-black/15 text-zinc-700 hover:text-black hover:border-black/30"
  }`;
  const cls = ghost ? outline : solid;

  const platform = PLATFORMS[os];

  if (!isMobile && platform) {
    return (
      <motion.a
        href={DOWNLOAD_LINKS[os] || "/RestMan_Installer_Setup.exe"}
        className={cls}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Download size={size === "lg" ? 18 : 14} className="shrink-0" />
        <span className="flex flex-col items-start leading-tight">
          <span>{platform.label}</span>
          {size !== "sm" && (
            <span
              className={`text-[11px] font-normal opacity-50 mt-0.5 ${MONO}`}
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
        className={`${cls} ${open ? "ring-1 ring-orange-400/40" : ""}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Download size={size === "lg" ? 18 : 14} className="shrink-0" />
        <span className="flex flex-col items-start leading-tight">
          <span>Download RestMan</span>
          {size !== "sm" && (
            <span
              className={`text-[11px] font-normal opacity-50 mt-0.5 ${MONO}`}
            >
              Choose your platform
            </span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-1 opacity-40"
        >
          <ChevronDown size={13} />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 mt-2 z-50 min-w-64 rounded-2xl overflow-hidden border backdrop-blur-2xl shadow-xl ${
              dark
                ? "border-white/10 bg-black/80"
                : "border-black/10 bg-white/90"
            }`}
          >
            {ALL_PLATFORMS.map((d, i) => (
              <a
                key={d.os}
                href="#"
                onClick={() => setOpen(false)}
                className={`cursor-pointer flex items-center gap-3 px-5 py-4 transition-colors ${
                  dark ? "hover:bg-white/5" : "hover:bg-black/5"
                } ${i < ALL_PLATFORMS.length - 1 ? (dark ? "border-b border-white/6" : "border-b border-black/6") : ""}`}
              >
                <span className="text-xl w-7 text-center shrink-0">
                  {d.glyph}
                </span>
                <span className="flex flex-col">
                  <span
                    className={`text-[13px] font-medium text-white/90 ${SANS}`}
                  >
                    {d.label}
                  </span>
                  <span className={`text-[10px] text-white/35 mt-0.5 ${MONO}`}>
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

/* ── Navbar ───────────────────────────────────────────── */
function Navbar({ dark, onToggle, os }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navBg = scrolled
    ? dark
      ? "bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/6"
      : "bg-white/80 backdrop-blur-2xl border-b border-black/6"
    : "bg-transparent";

  return (
    <motion.nav
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
    >
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          className={`flex items-center gap-2 text-[17px] font-medium ${SANS} ${dark ? "text-white" : "text-zinc-900"}`}
        >
          <div className="w-6 h-6 grid grid-cols-2 grid-rows-2 gap-0.5">
            <div className="rounded-xs bg-orange-400" />
            <div className="rounded-xs bg-orange-400/50" />
            <div className="rounded-xs bg-orange-400/50" />
            <div className="rounded-xs bg-orange-400/20" />
          </div>
          RestMan
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {["Features", "Compare", "Testimonials"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className={`cursor-pointer px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${SANS} ${dark ? "text-white/40 hover:text-white/90 hover:bg-white/5" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}
            >
              {l}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className={`cursor-pointer w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${dark ? "text-white/40 hover:text-white/80 hover:bg-white/5" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <div className="hidden md:block">
            <DownloadBtn os={os} size="sm" dark={dark} ghost={true} />
          </div>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className={`cursor-pointer md:hidden flex flex-col gap-1.5 p-2 ${dark ? "text-white/50" : "text-zinc-600"}`}
          >
            <span
              className={`block w-5 h-px ${dark ? "bg-white/50" : "bg-zinc-600"}`}
            />
            <span
              className={`block w-5 h-px ${dark ? "bg-white/50" : "bg-zinc-600"}`}
            />
            <span
              className={`block w-3 h-px ${dark ? "bg-white/50" : "bg-zinc-600"}`}
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
            transition={{ duration: 0.22 }}
            className={`overflow-hidden border-t ${dark ? "border-white/6 bg-[#0c0c0c]/95 backdrop-blur-2xl" : "border-zinc-100 bg-white/95"}`}
          >
            <div className="px-8 py-5 flex flex-col gap-1">
              {["Features", "Compare", "Testimonials"].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  onClick={() => setMobileOpen(false)}
                  className={`cursor-pointer px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${SANS} ${dark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-zinc-600 hover:bg-zinc-100"}`}
                >
                  {l}
                </a>
              ))}
              {/* <div className="pt-3">
                <DownloadBtn os={os} size="md" />
              </div> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ── Glass card ───────────────────────────────────────── */
function GlassCard({ children, className = "", dark }) {
  return (
    <div
      className={`rounded-3xl border backdrop-blur-xl transition-all duration-300 ${
        dark
          ? "bg-white/3 border-white/8 hover:border-white/[0.14]"
          : "bg-black/2 border-black/[0.07] hover:border-black/12"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Hero ─────────────────────────────────────────────── */
function Hero({ os, dark }) {
  const ref = useRef();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const heroOpacity = useTransform(scrollYProgress, [0.25, 1], [1, 0]);

  return (
    <section
      ref={ref}
      className={`relative min-h-screen flex items-center justify-center overflow-hidden ${dark ? "bg-[#0a0a0a]" : "bg-transparent"}`}
    >
      {/* Subtle grid */}
      <div
        className={`absolute inset-0  ${dark ? "opacity-[0.05]" : "opacity-[0.05]"}`}
        style={{
          backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Single centered ambient light — very subtle */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 rounded-full  ${dark ? "opacity-[0.12]" : "opacity-[0.08]"}`}
        style={{
          background: "radial-gradient(ellipse, #f59e0b 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-32 text-center"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-10"
        >
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] ${MONO} ${
              dark
                ? "border-white/10 text-white/40 bg-white/3"
                : "border-black/10 text-zinc-500 bg-black/2"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Free · Open Source · No sign-up
          </span>
        </motion.div>

        {/* Headline */}
        <div className="mb-8 overflow-hidden">
          {[
            { text: "Test APIs.", italic: false },
            { text: "Without switching apps.", italic: true },
            { text: "Ever.", italic: false },
          ].map((line, i) => (
            <div key={i} className="overflow-hidden">
              <motion.h1
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.18 + i * 0.11,
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`block leading-[1.06] tracking-[-0.03em] ${SERIF} ${
                  i === 1
                    ? `italic text-orange-400 text-[clamp(32px,6.5vw,82px)]`
                    : `text-[clamp(38px,7.5vw,96px)] ${dark ? "text-white" : "text-zinc-950"}`
                }`}
              >
                {line.text}
              </motion.h1>
            </div>
          ))}
        </div>

        {/* Sub copy */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.7 }}
          className={`text-[clamp(16px,2vw,19px)] font-light leading-[1.75] max-w-xl mx-auto mb-3 ${SANS} ${dark ? "text-white/40" : "text-zinc-500"}`}
        >
          RestMan runs silently at{" "}
          <code
            className={`text-orange-400 text-[0.88em] px-1.5 py-0.5 rounded-lg ${MONO} ${dark ? "bg-white/6" : "bg-black/4"}`}
          >
            localhost:7777
          </code>{" "}
          as a system service that starts with your machine and never asks for
          your attention again.
        </motion.p>

        {/* Typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.78, duration: 0.6 }}
          className="mb-12"
        >
          <Typewriter
            phrases={[
              "No app switching. Ever.",
              "One install. Lifetime usage.",
              "Zero data collection.",
              "No subscription. No sign-in.",
              "100% offline. Fully yours.",
            ]}
            className={`text-[15px] font-light ${MONO} ${dark ? "text-white/25" : "text-zinc-400"}`}
          />
        </motion.div>

        {/* CTA group */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.82, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <DownloadBtn os={os} size="md" dark={dark} />
          <GithubBtn os={os} size="md" dark={dark} ghost={true} />
          {/* <a
            href="https://github.com/nithin-sivakumar/open-restman"
            target="_blank"
            rel="noopener"
            className={`cursor-pointer inline-flex items-center gap-2 px-6 py-4 rounded-2xl border text-[15px] font-medium transition-all duration-200 ${SANS} ${
              dark
                ? "border-white/10 text-white/50 hover:text-white/90 hover:border-white/20"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
            }`}
          >
            <Github size={16} />
            GitHub
            <ArrowUpRight size={13} className="opacity-50" />
          </a> */}
          <a
            href="#features"
            className={`cursor-pointer inline-flex items-center gap-2 text-[14px] font-light transition-colors ${SANS} ${dark ? "text-white/25 hover:text-white/60" : "text-zinc-400 hover:text-zinc-700"}`}
          >
            See how it works
            <motion.span
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ChevronDown size={14} />
            </motion.span>
          </a>
        </motion.div>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.9, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroBrowserMockup dark={dark} />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── Hero browser mockup ──────────────────────────────── */
function HeroBrowserMockup({ dark }) {
  const [tab, setTab] = useState(0);

  const tabs = [
    { method: "POST", path: "/auth/login", color: "text-blue-400" },
    { method: "GET", path: "/users/me", color: "text-emerald-400" },
    { method: "DELETE", path: "/cache/all", color: "text-rose-400" },
  ];

  const bodies = [
    `{
  "token": "eyJhbGci...",
  "user": {
    "id": "usr_9fk2x",
    "email": "dev@acme.io",
    "role": "admin"
  }
}`,
    `{
  "id": "usr_9fk2x",
  "name": "Alex Dev",
  "plan": "pro",
  "createdAt": "2024-01-12"
}`,
    `{
  "status": "success",
  "operation": "cache.clear",
  "timestamp": "2024-01-12T10:42:11Z"
}`,
  ];

  const statuses = ["200 OK · 124ms", "200 OK · 88ms", "204 No Content · 61ms"];

  const frame = dark
    ? "bg-white/[0.025] border-white/[0.08]"
    : "bg-black/[0.02] border-black/[0.07]";

  const barBg = dark ? "bg-white/[0.03]" : "bg-black/[0.02]";
  const urlBg = dark ? "bg-white/[0.04]" : "bg-black/[0.03]";
  const sideBg = dark ? "bg-white/[0.015]" : "bg-black/[0.01]";

  return (
    <div className="px-4 sm:px-6">
      <div
        className={`w-full max-w-3xl mx-auto rounded-3xl border backdrop-blur-xl overflow-hidden ${frame}`}
      >
        {/* Chrome bar */}
        <div
          className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 border-b ${
            dark ? "border-white/6" : "border-black/5"
          } ${barBg}`}
        >
          <div className="flex gap-1.5">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-400/70" />
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-400/70" />
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400/70" />
          </div>

          <div
            className={`flex-1 mx-2 px-2 sm:px-3 py-1 rounded-xl text-[10px] sm:text-[12px] text-center ${MONO} ${urlBg} ${
              dark ? "text-white/30" : "text-zinc-400"
            }`}
          >
            localhost:7777
          </div>

          <motion.div
            className={`hidden sm:block text-[10px] px-2 py-1 rounded-full ${MONO} ${
              dark
                ? "text-emerald-400 bg-emerald-400/10"
                : "text-emerald-600 bg-emerald-50"
            }`}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            ● live
          </motion.div>
        </div>

        <div className="flex min-h-60 sm:min-h-75">
          {/* Sidebar (desktop only) */}
          <div
            className={`hidden md:flex w-36 shrink-0 border-r flex-col ${
              dark ? "border-white/6" : "border-black/5"
            } ${sideBg}`}
          >
            <div
              className={`px-4 py-3 text-[9px] uppercase tracking-[0.2em] ${MONO} ${
                dark ? "text-white/20" : "text-zinc-400"
              }`}
            >
              Collections
            </div>

            {[
              { name: "Auth", dot: "bg-blue-400", count: 12 },
              { name: "Users", dot: "bg-emerald-400", count: 8 },
              { name: "Payments", dot: "bg-orange-400", count: 5 },
            ].map((c, i) => (
              <div
                key={c.name}
                className={`px-4 py-2.5 text-[12px] flex items-center gap-2 ${
                  i === 0
                    ? dark
                      ? "bg-white/4 text-white/80"
                      : "bg-black/4 text-zinc-800"
                    : dark
                      ? "text-white/30"
                      : "text-zinc-400"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>

          {/* Main pane */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div
              className={`flex border-b overflow-x-auto ${
                dark ? "border-white/6" : "border-black/5"
              }`}
            >
              {tabs.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTab(i)}
                  className={`cursor-pointer shrink-0 px-3 sm:px-4 py-2.5 text-[10px] sm:text-[11px] transition-all border-r ${MONO} ${
                    dark ? "border-white/6" : "border-black/5"
                  } ${
                    tab === i
                      ? dark
                        ? "text-white/90 bg-white/4"
                        : "text-zinc-900 bg-black/2"
                      : dark
                        ? "text-white/25 hover:text-white/50"
                        : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  <span className={t.color}>{t.method}</span> {t.path}
                </button>
              ))}
            </div>

            {/* Response */}
            <div className="flex-1 p-3 sm:p-5 overflow-auto text-left">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`text-[10px] sm:text-[11px] font-medium text-emerald-400 ${MONO}`}
                >
                  {statuses[tab]}
                </span>
              </div>

              <AnimatePresence mode="popLayout">
                <motion.pre
                  key={tab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`text-[11px] sm:text-[12px] leading-[1.6] overflow-x-auto rounded-xl p-3 sm:p-4 ${
                    dark ? "bg-black/30" : "bg-zinc-50"
                  }`}
                >
                  <code
                    dangerouslySetInnerHTML={{
                      __html: Prism.highlight(
                        JSON.stringify(JSON.parse(bodies[tab]), null, 2),
                        Prism.languages.json,
                        "json",
                      ),
                    }}
                  />
                </motion.pre>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stats bar ────────────────────────────────────────── */
function StatsBar({ dark }) {
  const ref = useRef();

  const inView = useInView(ref, {
    once: true,
    margin: "-40px",
  });

  const items = [
    { value: 3000, suffix: "+", label: "Active installs", dec: 0 },
    { value: 4.9, suffix: "★", label: "Avg. rating", dec: 1 },
    { custom: "Free", label: "Forever. Always." },
    { value: 3, suffix: "", label: "Platforms", dec: 0 },
  ];

  return (
    <section
      ref={ref}
      className={`border-y ${dark ? "border-white/6" : "border-black/6"}`}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {items.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.55 }}
            className={`py-10 md:py-12 px-6 md:px-8 flex flex-col gap-2 ${
              i > 0
                ? `border-l ${dark ? "border-white/6" : "border-black/6"}`
                : ""
            }`}
          >
            {/* NUMBER */}
            <div
              className={`text-[clamp(30px,6vw,50px)] font-medium tracking-[-0.03em] leading-none ${
                dark ? "text-white" : "text-zinc-900"
              }`}
            >
              {s.custom
                ? s.custom
                : inView && (
                    <Counter
                      key={s.label}
                      to={s.value}
                      suffix={s.suffix}
                      decimals={s.dec}
                    />
                  )}
            </div>

            {/* LABEL */}
            <div
              className={`text-[12px] ${
                dark ? "text-white/30" : "text-zinc-400"
              }`}
            >
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── Features — true split sticky scroll ─────────────── */
const FEATURES = [
  {
    id: "browser",
    tag: "Zero friction",
    title: "Your entire API workspace lives in a browser tab.",
    body: "Open a new tab — RestMan is already there at localhost:7777. No launcher, no dock icon, no loading screen. It's the fastest API client you'll ever use because there's nothing to open.",
    stat: { value: "0ms", label: "Time to open" },
    accent: "text-orange-400",
  },
  {
    id: "service",
    tag: "Always on",
    title: "Install once. Never think about it again.",
    body: "RestMan registers as a system service on first install. It starts with your machine, updates itself silently from Git every 30 minutes, and recovers automatically if it ever crashes.",
    stat: { value: "~45MB", label: "RAM footprint" },
    accent: "text-emerald-400",
  },
  {
    id: "env",
    tag: "Environments",
    title: "Switch between dev, staging, and production in one click.",
    body: "Define your environment variables once. Every request automatically resolves them. Your secrets never leave the machine — no cloud sync, no shared state.",
    stat: { value: "∞", label: "Environments" },
    accent: "text-blue-400",
  },
  {
    id: "privacy",
    tag: "Privacy first",
    title: "Your data has never left this machine. It never will.",
    body: "Zero telemetry. Zero analytics. No account. No promotional email. RestMan works fully offline — air-gapped environments, restricted networks, it doesn't matter. What you test stays with you.",
    stat: { value: "0", label: "Data sent out" },
    accent: "text-rose-400",
  },
];

/* Right-side visual cards for each feature */
function FeatureVisual({ id, dark }) {
  if (id === "browser") {
    return (
      <GlassCard dark={dark} className="p-6 space-y-3">
        {[
          { m: "POST", p: "/auth/token", c: "text-blue-400", s: "200" },
          { m: "GET", p: "/v2/users", c: "text-emerald-400", s: "200" },
          { m: "PUT", p: "/orders/91", c: "text-orange-400", s: "200" },
          { m: "DEL", p: "/cache/all", c: "text-rose-400", s: "204" },
        ].map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ x: 4, transition: { duration: 0.1 } }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${dark ? "bg-white/3 hover:bg-white/6" : "bg-black/2 hover:bg-black/4"}`}
          >
            <span
              className={`font-medium text-[11px] w-9 shrink-0 ${MONO} ${r.c}`}
            >
              {r.m}
            </span>
            <span
              className={`flex-1 text-[13px] truncate ${SANS} ${dark ? "text-white/60" : "text-zinc-600"}`}
            >
              {r.p}
            </span>
            <span className={`text-[11px] text-emerald-400 ${MONO}`}>
              {r.s}
            </span>
          </motion.div>
        ))}
        <div
          className={`flex items-center justify-between px-4 py-2 text-[11px] ${MONO} ${dark ? "text-white/20" : "text-zinc-400"}`}
        >
          <span>localhost:7777</span>
          <motion.span
            className="text-emerald-400"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
          >
            ● live
          </motion.span>
        </div>
      </GlassCard>
    );
  }

  if (id === "service") {
    const items = [
      {
        icon: <Zap size={14} />,
        label: "Starts on boot",
        color: "text-orange-400",
      },
      {
        icon: <RefreshCw size={14} />,
        label: "Auto-updates",
        color: "text-blue-400",
      },
      {
        icon: <Cpu size={14} />,
        label: "~45MB RAM",
        color: "text-emerald-400",
      },
      {
        icon: <Server size={14} />,
        label: "Port 7777, customizable",
        color: "text-purple-400",
      },
    ];
    return (
      <GlassCard dark={dark} className="p-6 space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.09 }}
            whileHover={{ x: 4 }}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${dark ? "bg-white/3 hover:bg-white/6" : "bg-black/2 hover:bg-black/4"}`}
          >
            <span className={`shrink-0 ${item.color}`}>{item.icon}</span>
            <span
              className={`flex-1 text-[13px] font-medium ${SANS} ${dark ? "text-white/70" : "text-zinc-700"}`}
            >
              {item.label}
            </span>
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
            />
          </motion.div>
        ))}
      </GlassCard>
    );
  }

  if (id === "env") {
    const [env, setEnv] = useState(2);
    const envs = ["dev", "staging", "prod"];
    const rows = [
      [
        ["BASE_URL", "localhost:3000"],
        ["API_KEY", "sk-dev-..."],
        ["ENV", "development"],
      ],
      [
        ["BASE_URL", "staging.app.io"],
        ["API_KEY", "sk-stg-••••"],
        ["ENV", "staging"],
      ],
      [
        ["BASE_URL", "api.myapp.com"],
        ["API_KEY", "sk-••••••••"],
        ["ENV", "production"],
      ],
    ];
    return (
      <GlassCard dark={dark} className="overflow-hidden">
        <div
          className={`flex border-b ${dark ? "border-white/6" : "border-black/5"}`}
        >
          {envs.map((e, i) => (
            <button
              key={e}
              onClick={() => setEnv(i)}
              className={`cursor-pointer flex-1 py-3.5 text-[11px] font-medium transition-all ${MONO} ${
                i === env
                  ? dark
                    ? "text-orange-400 border-b-2 border-orange-400"
                    : "text-orange-500 border-b-2 border-orange-400"
                  : dark
                    ? "text-white/25 hover:text-white/50"
                    : "text-zinc-400"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="p-5 space-y-3.5">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={env}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {rows[env].map(([k, v]) => (
                <div
                  key={k}
                  className={`flex items-center gap-4 text-[12px] ${MONO}`}
                >
                  <span
                    className={`w-20 shrink-0 ${dark ? "text-white/25" : "text-zinc-400"}`}
                  >
                    {k}
                  </span>
                  <span
                    className={`flex-1 truncate ${dark ? "text-white/70" : "text-zinc-700"}`}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </GlassCard>
    );
  }

  if (id === "privacy") {
    return (
      <GlassCard dark={dark} className="p-6">
        <div className="flex items-center justify-center mb-6">
          <motion.div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${dark ? "border-white/8 bg-white/3" : "border-black/[0.07] bg-black/2"}`}
            animate={{ rotate: [0, 1, -1, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          >
            <Shield size={28} className="text-rose-400" />
          </motion.div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            "No telemetry",
            "No accounts",
            "No cloud sync",
            "Fully local",
            "Air-gapped",
            "Offline-first",
          ].map((item) => (
            <motion.div
              key={item}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] ${MONO} ${
                dark
                  ? "bg-white/3 border border-white/6 text-white/50 hover:border-white/12"
                  : "bg-black/2 border border-black/6 text-zinc-500"
              } transition-all`}
            >
              <Check size={10} className="text-emerald-400 shrink-0" />
              {item}
            </motion.div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return null;
}

/* ── FEATURES SPLIT LAYOUT ────────────────────────────── */
function Features({ dark }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.index);
            setActiveIdx(idx);
          }
        });
      },
      {
        root: null,
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      },
    );

    stepRefs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className={dark ? "bg-[#0a0a0a]" : "bg-[#f9f8f6]"}>
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 items-center">
          {/* LEFT */}
          <div className="lg:pr-20">
            <div className="flex items-center gap-2 mb-10">
              {FEATURES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === activeIdx ? 24 : 6,
                    opacity: i === activeIdx ? 1 : 0.25,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`h-1 rounded-full ${
                    i === activeIdx
                      ? "bg-orange-400"
                      : dark
                        ? "bg-white/30"
                        : "bg-zinc-300"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45 }}
              >
                <span
                  className={`text-[11px] tracking-[0.2em] uppercase block mb-5 ${FEATURES[activeIdx].accent}`}
                >
                  {FEATURES[activeIdx].tag}
                </span>

                <h2 className="text-[clamp(28px,3.2vw,44px)] leading-[1.15] mb-6">
                  {FEATURES[activeIdx].title}
                </h2>

                <p className="text-[16px] leading-[1.8] mb-8 opacity-60">
                  {FEATURES[activeIdx].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT */}
          <div className="hidden lg:flex items-center justify-center lg:pl-8">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45 }}
                className="w-full max-w-md"
              >
                <FeatureVisual id={FEATURES[activeIdx].id} dark={dark} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Scroll steps */}
      {FEATURES.map((_, i) => (
        <div
          key={i}
          ref={(el) => (stepRefs.current[i] = el)}
          data-index={i}
          className="h-screen"
        />
      ))}
    </section>
  );
}

/* ── Lightweight ──────────────────────────────────────── */
function Lightweight({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hov, setHov] = useState(null);
  const metrics = [
    {
      label: "Memory",
      value: "~45MB",
      pct: 9,
      color: "bg-emerald-400",
      note: "Less than a Chrome tab",
    },
    {
      label: "CPU idle",
      value: "~0.1%",
      pct: 1,
      color: "bg-blue-400",
      note: "Invisible at rest",
    },
    {
      label: "Boot time",
      value: "<2s",
      pct: 12,
      color: "bg-orange-400",
      note: "Ready instantly",
    },
    {
      label: "Disk",
      value: "~300MB",
      pct: 8,
      color: "bg-rose-400",
      note: "Smaller than most apps",
    },
  ];
  return (
    <section
      ref={ref}
      className={`py-36 border-y ${dark ? "border-white/6 bg-[#0d0d0d]" : "border-black/6 bg-zinc-50"}`}
    >
      <div className="max-w-5xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <span
            className={`text-[11px] font-medium tracking-[0.2em] uppercase block mb-5 ${MONO} ${dark ? "text-white/25" : "text-zinc-400"}`}
          >
            Lightweight
          </span>
          <h2
            className={`text-[clamp(28px,4vw,48px)] font-medium tracking-[-0.025em] leading-[1.1] mb-6 ${SERIF} ${dark ? "text-white" : "text-zinc-950"}`}
          >
            Barely there.{" "}
            <em className="text-orange-400 not-italic">Always there.</em>
          </h2>
          <p
            className={`text-[16px] font-light leading-[1.8] ${SANS} ${dark ? "text-white/40" : "text-zinc-500"}`}
          >
            RestMan consumes fewer resources than a single browser tab. It runs
            24/7, updates itself, and demands exactly zero attention after the
            first setup.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="space-y-6"
        >
          {metrics.map((m, i) => (
            <div
              key={m.label}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              className="group"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[13px] font-medium ${MONO} ${dark ? "text-white/50" : "text-zinc-500"}`}
                  >
                    {m.label}
                  </span>
                  <AnimatePresence>
                    {hov === i && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={`text-[11px] font-light ${SANS} ${dark ? "text-white/25" : "text-zinc-400"}`}
                      >
                        {m.note}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span
                  className={`text-[13px] font-medium ${MONO} ${dark ? "text-white/80" : "text-zinc-800"}`}
                >
                  {m.value}
                </span>
              </div>
              <div
                className={`h-1.5 rounded-full overflow-hidden ${dark ? "bg-white/5" : "bg-zinc-200"}`}
              >
                <motion.div
                  className={`h-full rounded-full ${m.color} transition-opacity duration-200 ${hov === i ? "opacity-100" : "opacity-60"}`}
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${m.pct}%` } : {}}
                  transition={{
                    delay: 0.35 + i * 0.1,
                    duration: 1,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          ))}
          <p
            className={`text-[10px] pt-2 font-light ${MONO} ${dark ? "text-white/15" : "text-zinc-400"}`}
          >
            Measured on M1 MacBook Air · mid-load workday
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Compare ──────────────────────────────────────────── */
const ROWS = [
  { feat: "Fully offline & local", rm: true, po: false, ins: false },
  { feat: "No account required", rm: true, po: false, ins: false },
  { feat: "No subscription", rm: true, po: false, ins: false },
  { feat: "Runs in your browser", rm: true, po: true, ins: true },
  { feat: "Open source", rm: true, po: false, ins: true },
  { feat: "Zero data collection", rm: true, po: false, ins: false },
  { feat: "Self-updating", rm: true, po: true, ins: true },
  { feat: "One-time setup, lifetime", rm: true, po: false, ins: false },
];

function Compare({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="compare"
      ref={ref}
      className={`pb-28 pt-24 ${dark ? "bg-[#0a0a0a]" : "bg-[#f9f8f6]"}`}
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <span
            className={`text-[11px] tracking-[0.2em] uppercase block mb-4 ${dark ? "text-white/25" : "text-zinc-400"}`}
          >
            Comparison
          </span>

          <h2
            className={`text-[clamp(26px,6vw,54px)] leading-[1.1] tracking-[-0.025em] ${
              dark ? "text-white" : "text-zinc-950"
            }`}
          >
            Why teams switch
            <br />
            <span className="text-orange-400">to RestMan.</span>
          </h2>
        </motion.div>

        {/* ---------- MOBILE LAYOUT ---------- */}
        <div className="md:hidden space-y-6">
          {ROWS.map((row, i) => (
            <motion.div
              key={row.feat}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-5 ${
                dark ? "border-white/10 bg-white/2" : "border-black/10 bg-white"
              }`}
            >
              <div
                className={`text-sm mb-4 ${
                  dark ? "text-white/70" : "text-zinc-700"
                }`}
              >
                {row.feat}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { name: "RestMan", value: row.rm, highlight: true },
                  { name: "Postman", value: row.po },
                  { name: "Insomnia", value: row.ins },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`rounded-md py-2 ${
                      item.highlight ? "bg-orange-400/10" : ""
                    }`}
                  >
                    <div className="mb-1 text-[10px] opacity-60">
                      {item.name}
                    </div>

                    {item.value ? (
                      <Check size={14} className="mx-auto text-emerald-400" />
                    ) : (
                      <X
                        size={14}
                        className={`mx-auto ${
                          dark ? "text-white/20" : "text-zinc-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ---------- DESKTOP TABLE ---------- */}
        <div className="hidden md:block">
          <div
            className={`overflow-hidden rounded-xl border ${
              dark ? "border-white/10" : "border-black/10"
            }`}
          >
            {/* Header */}
            <div
              className={`grid grid-cols-4 border-b ${
                dark ? "border-white/10" : "border-black/10"
              }`}
            >
              <div className="py-5 px-6" />

              {["RestMan", "Postman", "Insomnia"].map((name, i) => (
                <div
                  key={name}
                  className={`py-5 text-center text-sm ${
                    i === 0
                      ? "text-orange-400 font-medium"
                      : dark
                        ? "text-white/40"
                        : "text-zinc-400"
                  }`}
                >
                  {i === 0 && (
                    <div className="text-[10px] opacity-50 mb-1">free</div>
                  )}
                  {name}
                </div>
              ))}
            </div>

            {ROWS.map((row, i) => (
              <motion.div
                key={row.feat}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.2 + i * 0.04 }}
                className={`grid grid-cols-4 items-center ${
                  i < ROWS.length - 1
                    ? dark
                      ? "border-b border-white/5"
                      : "border-b border-black/5"
                    : ""
                }`}
              >
                <div
                  className={`py-4 px-6 text-sm ${
                    dark ? "text-white/60" : "text-zinc-600"
                  }`}
                >
                  {row.feat}
                </div>

                {[row.rm, row.po, row.ins].map((ok, j) => (
                  <div
                    key={j}
                    className={`py-4 text-center ${
                      j === 0 ? "bg-orange-400/5" : ""
                    }`}
                  >
                    {ok ? (
                      <Check size={15} className="text-emerald-400 mx-auto" />
                    ) : (
                      <X
                        size={14}
                        className={`mx-auto ${
                          dark ? "text-white/20" : "text-zinc-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────── */
const TESTI = [
  {
    q: "Switched from Postman after the paywall. RestMan is snappier, my credentials never leave my laptop, and I haven't thought about it since setup. That's the dream.",
    name: "Priya S.",
    role: "Backend Engineer",
    co: "Fintech",
  },
  {
    q: "The 'always in my browser' thing is huge. I'm already in Chrome debugging. I open a new tab and my entire API workspace is there. Zero switching.",
    name: "Marcus T.",
    role: "Senior Dev",
    co: "SaaS",
  },
  {
    q: "Security sensitive environment. Fully offline was non-negotiable. RestMan was the only tool that delivered. And it's free. Still can't believe it.",
    name: "Leila K.",
    role: "Security Engineer",
    co: "Enterprise",
  },
  {
    q: "Set it up once, six months ago. Haven't touched it since. It just works, updates itself, and is waiting every time I open a tab. Zero maintenance.",
    name: "Raj M.",
    role: "Full-stack Dev",
    co: "Indie",
  },

  {
    q: "Honestly I just wanted something lighter than Postman. RestMan starts instantly and doesn't feel like launching an IDE just to hit an endpoint.",
    name: "Daniel R.",
    role: "Backend Developer",
    co: "Startup",
  },
  {
    q: "I use it mainly for quick endpoint checks while building features. The fact that it's a browser extension makes it ridiculously convenient.",
    name: "Sara L.",
    role: "Frontend Engineer",
    co: "E-commerce",
  },
  {
    q: "My laptop fans used to spin up every time I opened Postman. With RestMan everything feels... quiet. Didn't expect that to matter but it does.",
    name: "Owen B.",
    role: "API Engineer",
    co: "HealthTech",
  },
  {
    q: "What sold me was the offline part. Some of our internal APIs can't touch the internet, so tools that sync to cloud are a hard no.",
    name: "Nikhil P.",
    role: "Platform Engineer",
    co: "Enterprise",
  },
  {
    q: "It's simple in a good way. I can send requests, manage headers, save collections. That's literally all I need most days.",
    name: "Emily C.",
    role: "Software Engineer",
    co: "SaaS",
  },
  {
    q: "I didn't even realize how much friction switching apps caused until I stopped doing it. RestMan just lives in my browser now.",
    name: "Javier M.",
    role: "Full-stack Developer",
    co: "Startup",
  },
  {
    q: "Downloaded it out of curiosity and ended up keeping it. For day-to-day API work it's actually faster than the tools I used before.",
    name: "Tom H.",
    role: "Backend Engineer",
    co: "Fintech",
  },
  {
    q: "Lightweight, local, and no login screen. That's pretty much everything I wanted from an API client.",
    name: "Aisha K.",
    role: "Developer",
    co: "Indie",
  },
];

function Testimonials({ dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(2);
  const t = TESTI[active];

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((a) => (a + 1) % TESTI.length);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <section
      id="testimonials"
      ref={ref}
      className={`pb-48 pt-50 border-y ${dark ? "border-white/6 bg-[#0d0d0d]" : "border-black/6 bg-zinc-50"}`}
    >
      <div className="max-w-4xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.2 }}
          className="mb-16"
        >
          <span
            className={`text-[11px] font-medium tracking-[0.2em] uppercase block mb-5 ${MONO} ${dark ? "text-white/25" : "text-zinc-400"}`}
          >
            Testimonials
          </span>
          <h2
            className={`text-[clamp(28px,4.5vw,54px)] font-medium tracking-[-0.025em] ${SERIF} ${dark ? "text-white" : "text-zinc-950"}`}
          >
            Developers don't lie.
          </h2>
        </motion.div>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard dark={dark} className="p-10 md:p-14">
              <p
                className={`text-[clamp(17px,2.2vw,22px)] font-light leading-[1.75] mb-10 ${dark ? "text-white/75" : "text-zinc-700"}`}
              >
                "{t.q}"
              </p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[12px] font-medium shrink-0 ${MONO} ${dark ? "bg-white/6 text-white/60" : "bg-zinc-100 text-zinc-600"}`}
                  >
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div
                      className={`text-[14px] font-medium ${SANS} ${dark ? "text-white/80" : "text-zinc-900"}`}
                    >
                      {t.name}
                    </div>
                    <div
                      className={`text-[12px] font-light ${SANS} ${dark ? "text-white/30" : "text-zinc-400"}`}
                    >
                      {t.role} · {t.co}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() =>
                      setActive((a) => (a - 1 + TESTI.length) % TESTI.length)
                    }
                    className={`cursor-pointer w-9 h-9 rounded-xl border flex items-center justify-center text-[16px] transition-all ${dark ? "border-white/10 text-white/40 hover:border-white/25 hover:text-white/80" : "border-zinc-200 text-zinc-400 hover:border-zinc-400"}`}
                  >
                    ‹
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setActive((a) => (a + 1) % TESTI.length)}
                    className={`cursor-pointer w-9 h-9 rounded-xl border flex items-center justify-center text-[16px] transition-all ${dark ? "border-white/10 text-white/40 hover:border-white/25 hover:text-white/80" : "border-zinc-200 text-zinc-400 hover:border-zinc-400"}`}
                  >
                    ›
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2 mt-6">
          {TESTI.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setActive(i)}
              animate={{
                width: i === active ? 24 : 6,
                opacity: i === active ? 1 : 0.25,
              }}
              transition={{ duration: 0.25 }}
              className={`cursor-pointer h-1 rounded-full ${i === active ? "bg-orange-400" : dark ? "bg-white/30" : "bg-zinc-300"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ────────────────────────────────────────── */
function FinalCTA({ os, dark }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className={`py-40 relative overflow-hidden ${dark ? "bg-[#0a0a0a]" : "bg-[#f9f8f6]"}`}
    >
      {/* Single soft ambient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-80 "
        style={{
          background:
            "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-3xl mx-auto px-8 text-center"
      >
        <span
          className={`text-[11px] font-medium tracking-[0.2em] uppercase block mb-8 ${MONO} ${dark ? "text-white/25" : "text-zinc-400"}`}
        >
          Get started
        </span>
        <h2
          className={`text-[clamp(36px,6.5vw,78px)] font-medium tracking-[-0.03em] leading-[1.05] mb-8 ${SERIF} ${dark ? "text-white" : "text-zinc-950"}`}
        >
          Your API workflow,
          <br />
          <em className="text-orange-400 not-italic">finally free.</em>
        </h2>
        <p
          className={`text-[17px] font-light leading-[1.75] mb-12 max-w-lg mx-auto ${SANS} ${dark ? "text-white/35" : "text-zinc-500"}`}
        >
          Install once. Open your browser. Start testing. RestMan is ready
          before you think to look for it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <DownloadBtn os={os} size="lg" dark={dark} />
          {/* <DownloadBtn os={os} size="lg" ghost /> */}
        </div>

        <a
          href="mailto:restmansupport@paper.neuto.in"
          className={`cursor-pointer inline-flex items-center gap-2 text-[13px] font-light transition-colors ${MONO} ${dark ? "text-white/20 hover:text-white/50" : "text-zinc-400 hover:text-zinc-700"}`}
        >
          <Mail size={13} />
          restmansupport@paper.neuto.in
        </a>
      </motion.div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────── */
function Footer({ dark }) {
  return (
    <footer
      className={`border-t px-8 py-10 ${dark ? "border-white/6 bg-[#0a0a0a]" : "border-black/6 bg-[#f9f8f6]"}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          className={`flex items-center gap-2 text-[15px] font-medium ${SANS} ${dark ? "text-white/50" : "text-zinc-600"}`}
        >
          <div className="w-5 h-5 grid grid-cols-2 grid-rows-2 gap-0.5">
            <div className="rounded-[1px] bg-orange-400" />
            <div className="rounded-[1px] bg-orange-400/50" />
            <div className="rounded-[1px] bg-orange-400/50" />
            <div className="rounded-[1px] bg-orange-400/20" />
          </div>
          RestMan
        </div>
        <div
          className={`flex items-center gap-6 text-[12px] font-light ${MONO} ${dark ? "text-white/25" : "text-zinc-400"}`}
        >
          <a
            href="https://github.com/nithin-sivakumar/open-restman"
            target="_blank"
            rel="noopener"
            className={`cursor-pointer inline-flex items-center gap-1.5 transition-colors ${dark ? "hover:text-white/60" : "hover:text-zinc-700"}`}
          >
            <Github size={12} /> GitHub
          </a>
          <a
            href="mailto:restmansupport@paper.neuto.in"
            className={`cursor-pointer inline-flex items-center gap-1.5 transition-colors ${dark ? "hover:text-white/60" : "hover:text-zinc-700"}`}
          >
            <Mail size={12} /> Support
          </a>
          <span>© {new Date().getFullYear()} RestMan.</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Root ─────────────────────────────────────────────── */
export default function App() {
  const [dark, setDark] = useState(true);
  const [os, setOs] = useState("unknown");

  useEffect(() => {
    setOs(detectOS());
    if (window.matchMedia) {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    // Hide default cursor
    // document.documentElement.style.cursor = "none";
    return () => {
      document.documentElement.style.cursor = "";
    };
  }, []);

  const toggle = useCallback(() => setDark((d) => !d), []);

  return (
    <div
      className={`${SANS} transition-colors duration-500 overflow-x-clip ${dark ? "bg-[#0a0a0a] text-white" : "bg-[#ededed] text-zinc-900"}`}
    >
      <Fonts />
      {/* <CustomCursor dark={dark} /> */}
      <Navbar dark={dark} onToggle={toggle} os={os} />
      <main>
        <Hero os={os} dark={dark} />
        <StatsBar dark={dark} />
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
