/**
 * RestMan Landing Page V3
 * ─────────────────────────────────────────────
 * Theme is controlled via themes.json — set "active" to any key.
 * No theme UI is exposed in the landing page itself.
 *
 * Dependencies (already in package.json assumed):
 *   motion/react, lucide-react, prismjs
 *
 * Downloads served from public/:
 *   RestMan_Installer.AppImage
 *   RestMan_Installer.dmg
 *   RestMan_Installer-arm64.dmg
 *   RestMan_Installer_Setup.exe
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
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
  ArrowRight,
  Terminal,
  Globe,
  ExternalLink,
} from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css";

/* ── Load theme from themes.json ───────────────────────── */
import themesConfig from "./themes.json";

const DARK_THEME_KEYS = [
  "obsidian",
  "midnight",
  "ember",
  "forest",
  "rose",
  "slate",
  "aurora",
  "lava",
  "carbon",
  "ocean",
  "neon",
];

const ACTIVE_THEME_KEY = (() => {
  const last = localStorage.getItem("rm_last_theme");
  const pool = last
    ? DARK_THEME_KEYS.filter((k) => k !== last)
    : DARK_THEME_KEYS;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  localStorage.setItem("rm_last_theme", pick);
  return pick;
})();

const BASE_DARK_THEME = themesConfig.themes[ACTIVE_THEME_KEY];
// Opposite-mode counterpart used when the user toggles dark/light.
// Picks the light/dark variant that best matches, falling back to safe defaults.
const BASE_LIGHT_THEME = (() => {
  // If active theme is already light, use it as-is
  if (!BASE_DARK_THEME.dark) return BASE_DARK_THEME;

  // Map dark themes to their closest light counterpart by accent family
  const DARK_TO_LIGHT = {
    obsidian: "lavender", // violet → lavender
    midnight: "glacier", // cyan → glacier
    ember: "sand", // orange → sand
    forest: "mint", // green → mint
    rose: "sakura", // pink → sakura
    slate: "ghost", // indigo → ghost
    aurora: "mint", // teal → mint
    lava: "sand", // red → sand
    carbon: "ivory", // gold → ivory
    ocean: "glacier", // sky → glacier
    neon: "mint", // lime → mint
    noir: "ghost", // mono → ghost
    dusk: "ivory", // amber → ivory
    void: "ghost", // mono → ghost
  };

  const mappedKey = DARK_TO_LIGHT[ACTIVE_THEME_KEY];
  return themesConfig.themes[mappedKey] || themesConfig.themes["ghost"];
})();

const BASE_REAL_DARK_THEME = BASE_DARK_THEME.dark
  ? BASE_DARK_THEME
  : themesConfig.themes[ACTIVE_THEME_KEY] || BASE_DARK_THEME;

/* ── Theme context ──────────────────────────────────────── */
const ThemeCtx = createContext(BASE_DARK_THEME);
const useT = () => useContext(ThemeCtx);

const SIGNER_URL = import.meta.env.VITE_SIGNER_URL;

async function fetchSignedUrl(fileKey) {
  const res = await fetch(SIGNER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileKey }),
  });
  const data = await res.json();
  return data.url;
}

/* ── CSS vars injection ─────────────────────────────────── */
function ThemeInjector({ theme }) {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries({
      "--bg": theme.bg,
      "--bg-alt": theme.bgAlt,
      "--bg-card": theme.bgCard,
      "--border": theme.border,
      "--border-hover": theme.borderHover,
      "--text": theme.text,
      "--text-muted": theme.textMuted,
      "--text-faint": theme.textFaint,
      "--accent": theme.accent,
      "--accent-hover": theme.accentHover,
      "--accent-muted": theme.accentMuted,
      "--accent-text": theme.accentText,
      "--green": theme.green,
      "--red": theme.red,
      "--blue": theme.blue,
      "--cursor-color": theme.cursor,
      "--nav-bg": theme.navBg,
    }).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [theme]);
  return null;
}

/* ── Google Fonts ──────────────────────────────────────── */
function Fonts() {
  return (
    <link
      href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
  );
}

/* ── OS detection ──────────────────────────────────────── */
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

/* Platform download config */
const PLATFORMS = {
  windows: {
    label: "Download for Windows",
    sub: "RestMan_Installer_Setup.exe · 64-bit",
    glyph: "⊞",
    fileKey: "releases/windows/RestMan_Installer_Setup.exe",
    variants: [
      {
        label: "Windows 64-bit (.exe)",
        fileKey: "releases/windows/RestMan_Installer_Setup.exe",
      },
    ],
  },
  mac: {
    label: "Download for macOS",
    sub: "Choose Intel or Apple Silicon",
    glyph: "",
    fileKey: "releases/mac/RestMan_Installer.dmg",
    variants: [
      {
        label: "macOS Apple Silicon (.dmg)",
        fileKey: "releases/mac/RestMan_Installer-arm64.dmg",
      },
      {
        label: "macOS Intel (.dmg)",
        fileKey: "releases/mac/RestMan_Installer.dmg",
      },
    ],
  },
  linux: {
    label: "Download for Linux",
    sub: "RestMan_Installer.AppImage",
    glyph: "🐧",
    fileKey: "releases/linux/RestMan_Installer.AppImage",
    variants: [
      {
        label: "Linux (.AppImage)",
        fileKey: "releases/linux/RestMan_Installer.AppImage",
      },
    ],
  },
};

const ALL_PLATFORMS_LIST = [
  { os: "windows", ...PLATFORMS.windows },
  { os: "mac", ...PLATFORMS.mac },
  { os: "linux", ...PLATFORMS.linux },
];

const MOBILE_OS = new Set(["android", "ios"]);

/* ── Custom cursor ─────────────────────────────────────── */
function CustomCursor() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 800, damping: 50, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 800, damping: 50, mass: 0.4 });

  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      setVisible(true);
    };
    const leave = () => setVisible(false);
    const over = (e) =>
      setHovered(!!e.target.closest("a,button,[data-cursor]"));

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    document.addEventListener("mouseleave", leave);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  // Choose image based on hover state
  const cursorSrc = hovered
    ? "/pointer.png" // hover image
    : "/cursor.png"; // default image

  return (
    <motion.img
      src={cursorSrc}
      alt="cursor"
      className="fixed z-9999 pointer-events-none hidden md:block"
      style={{
        x: sx,
        y: sy,
        opacity: visible ? 1 : 0,

        // ⭐ VERY IMPORTANT — pointer hotspot correction
        translateX: "0px",
        translateY: "0px",

        width: 20,
        height: 20,
      }}
    />
  );
}

/* ── Smooth section entrance ───────────────────────────── */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated counter ──────────────────────────────────── */
function Counter({ to, suffix = "", decimals = 0 }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = null;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / 1400, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(e * to);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return (
    <span ref={ref}>
      {decimals ? val.toFixed(decimals) : Math.floor(val)}
      {suffix}
    </span>
  );
}

/* ── Typewriter ────────────────────────────────────────── */
function Typewriter({ phrases }) {
  const T = useT();
  const [pi, setPi] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const target = phrases[pi];
    if (!del && txt === target) {
      const t = setTimeout(() => setDel(true), 2200);
      return () => clearTimeout(t);
    }
    if (del && txt === "") {
      setDel(false);
      setPi((i) => (i + 1) % phrases.length);
      return;
    }
    const t = setTimeout(
      () => setTxt(del ? txt.slice(0, -1) : target.slice(0, txt.length + 1)),
      del ? 28 : 60,
    );
    return () => clearTimeout(t);
  }, [txt, del, pi, phrases]);
  return (
    <span
      style={{
        color: T.text,
        fontFamily: "'Geist Mono', monospace",
        fontSize: "13px",
      }}
    >
      {txt}
      <motion.span
        style={{
          display: "inline-block",
          width: 2,
          height: "1em",
          background: T.accent,
          marginLeft: 2,
          verticalAlign: "middle",
        }}
        // animate={{ opacity: [1, 1] }}
        transition={{ repeat: Infinity, duration: 0.6 }}
      />
    </span>
  );
}

/* ── Navbar ────────────────────────────────────────────── */
function Navbar({ os, isDark, onToggleDark }) {
  const T = useT();
  const [scrolled, setScrolled] = useState(false);
  const [mOpen, setMOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: scrolled ? T.navBg : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${T.border}` : "none",
        transition:
          "background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease",
      }}
    >
      {/* ── Main bar: left logo | center links (absolute) | right actions ── */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Left: Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Geist', sans-serif",
            fontWeight: 500,
            fontSize: 16,
            color: T.text,
            flexShrink: 0,
          }}
        >
          <LogoMark />
          RestMan
        </div>

        {/* Center: nav links — absolutely centered so right-side width doesn't affect position */}
        <div
          className="hidden md:flex"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            // display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {["Features", "Compare", "Testimonials"].map((l) => (
            <a
              key={l}
              onClick={() => {
                window.location.href = `#${l.toLowerCase()}`;
              }}
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 13,
                color: T.textMuted,
                padding: "6px 14px",
                borderRadius: 10,
                transition: "all 0.18s ease",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = T.text;
                e.currentTarget.style.background = T.bgCard;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = T.textMuted;
                e.currentTarget.style.background = "transparent";
              }}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Right: dark/light toggle + download */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {/* Dark/light toggle */}
          <motion.button
            onClick={onToggleDark}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.textMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.18s, color 0.18s",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.borderHover;
              e.currentTarget.style.color = T.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.color = T.textMuted;
            }}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <div className="hidden md:block">
            <DownloadBtn os={os} size="sm" ghost />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMOpen((o) => !o)}
            className="md:hidden p-2"
            style={{
              color: T.textMuted,
              background: "transparent",
              border: "none",
            }}
          >
            <div
              style={{
                width: 20,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  height: 1.5,
                  background: T.textMuted,
                  borderRadius: 2,
                  display: "block",
                  transition: "all 0.2s",
                  transform: mOpen ? "translateY(5.5px) rotate(45deg)" : "none",
                }}
              />
              <span
                style={{
                  height: 1.5,
                  background: T.textMuted,
                  borderRadius: 2,
                  display: "block",
                  opacity: mOpen ? 0 : 1,
                  transition: "all 0.2s",
                }}
              />
              <span
                style={{
                  height: 1.5,
                  background: T.textMuted,
                  borderRadius: 2,
                  display: "block",
                  width: mOpen ? "100%" : "65%",
                  transition: "all 0.2s",
                  transform: mOpen
                    ? "translateY(-5.5px) rotate(-45deg)"
                    : "none",
                }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              overflow: "hidden",
              borderTop: `1px solid ${T.border}`,
              background: T.navBg,
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {["Features", "Compare", "Testimonials"].map((l) => (
                <a
                  key={l}
                  onClick={() => {
                    setMOpen(false);
                    window.location.href = `#${l.toLowerCase()}`;
                  }}
                  style={{
                    fontFamily: "'Geist', sans-serif",
                    fontSize: 15,
                    color: T.textMuted,
                    padding: "10px 14px",
                    borderRadius: 10,
                    display: "block",
                    textDecoration: "none",
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function LogoMark({ size = 22 }) {
  const T = useT();
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="0" y="0" width="10" height="10" rx="2.5" fill={T.accent} />
      <rect
        x="12"
        y="0"
        width="10"
        height="10"
        rx="2.5"
        fill={T.accent}
        opacity="0.45"
      />
      <rect
        x="0"
        y="12"
        width="10"
        height="10"
        rx="2.5"
        fill={T.accent}
        opacity="0.25"
      />
      <rect
        x="12"
        y="12"
        width="10"
        height="10"
        rx="2.5"
        fill={T.accent}
        opacity="0.1"
      />
    </svg>
  );
}

/* ── Download Button ───────────────────────────────────── */
function DownloadBtn({ os, size = "md", ghost = false }) {
  const T = useT();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef();
  const isMobile = MOBILE_OS.has(os);
  const platform = PLATFORMS[os];

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const sz = {
    lg: { px: 28, py: 14, fs: 15, icon: 17 },
    md: { px: 22, py: 11, fs: 14, icon: 15 },
    sm: { px: 16, py: 8, fs: 13, icon: 13 },
  }[size];

  const textColor = ghost ? T.textMuted : T.dark ? "black" : "white";
  const subColor = ghost ? T.textFaint : T.dark ? "black" : "white";

  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: sz.icon - 2,
    padding: `${sz.py}px ${sz.px}px`,
    borderRadius: 14,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 500,
    fontSize: sz.fs,
    color: textColor,
    transition: "all 0.18s ease",
    border: "1px solid",
    textDecoration: "none",
    whiteSpace: "nowrap",
    outline: "none",
    ...(ghost
      ? { background: "transparent", borderColor: T.border }
      : { background: T.accent, borderColor: T.accent }),
  };

  const hoverStyle = ghost
    ? { borderColor: T.borderHover, color: T.text }
    : { background: T.accentHover, borderColor: T.accentHover };

  const labelSpan = (label, sub) => (
    <span className="flex flex-col items-start leading-tight">
      <span style={{ color: textColor }}>{label}</span>
      {size !== "sm" && sub && (
        <span
          style={{
            fontSize: 10,
            opacity: 0.5,
            marginTop: 1,
            fontFamily: "'Geist Mono', monospace",
            color: subColor,
          }}
        >
          {sub}
        </span>
      )}
    </span>
  );

  const spinnerOrIcon = (icon) =>
    loading ? (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        style={{ display: "flex", color: textColor }}
      >
        <RefreshCw size={sz.icon} />
      </motion.span>
    ) : (
      <span style={{ display: "flex", color: textColor }}>{icon}</span>
    );

  // Desktop — single variant: direct signed download
  if (!isMobile && platform && platform.variants.length === 1) {
    return (
      <motion.button
        onClick={async () => {
          setLoading(true);
          try {
            const url = await fetchSignedUrl(platform.fileKey);
            const a = document.createElement("a");
            a.href = url;
            a.download = platform.fileKey.split("/").pop();
            document.body.appendChild(a);
            a.click();
            a.remove();
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
        style={{ ...baseStyle, opacity: loading ? 0.75 : 1 }}
        whileHover={!loading ? { scale: 1.02, ...hoverStyle } : {}}
        whileTap={!loading ? { scale: 0.97 } : {}}
      >
        {spinnerOrIcon(<Download size={sz.icon} />)}
        {labelSpan(
          loading ? "Preparing download..." : platform.label,
          loading ? null : platform.sub,
        )}
      </motion.button>
    );
  }

  // Mac (2 variants) or mobile/unknown: dropdown
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        style={baseStyle}
        whileHover={{ scale: 1.02, ...hoverStyle }}
        whileTap={{ scale: 0.97 }}
      >
        {spinnerOrIcon(<Download size={sz.icon} />)}
        {labelSpan(
          isMobile ? "Download RestMan" : platform?.label || "Download RestMan",
          isMobile ? "Choose platform" : platform?.sub || "Choose platform",
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ opacity: 0.5, display: "flex", color: textColor }}
        >
          <ChevronDown size={12} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              zIndex: 100,
              minWidth: 260,
              borderRadius: 14,
              overflow: "hidden",
              border: `1px solid ${T.border}`,
              background: T.dark
                ? `color-mix(in srgb, ${T.bg} 90%, transparent)`
                : `color-mix(in srgb, ${T.bg} 95%, transparent)`,
              backdropFilter: "blur(24px)",
              boxShadow: `0 20px 60px ${T.dark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.12)"}`,
            }}
          >
            {os === "mac" &&
              platform?.variants.map((v, i) => (
                <DropItem
                  key={i}
                  label={v.label}
                  fileKey={v.fileKey}
                  isLast={i === platform.variants.length - 1}
                />
              ))}
            {(isMobile || os === "unknown") &&
              ALL_PLATFORMS_LIST.map((p, i) =>
                p.variants.map((v, j) => (
                  <DropItem
                    key={`${i}-${j}`}
                    label={v.label}
                    fileKey={v.fileKey}
                    isLast={
                      i === ALL_PLATFORMS_LIST.length - 1 &&
                      j === p.variants.length - 1
                    }
                  />
                )),
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropItem({ label, fileKey, isLast }) {
  const T = useT();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const url = await fetchSignedUrl(fileKey);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileKey.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        fontFamily: "'Geist', sans-serif",
        fontSize: 13,
        color: loading ? T.textFaint : T.text,
        background: "transparent",
        border: "none",
        borderBottom: isLast ? "none" : `1px solid ${T.border}`,
        width: "100%",
        textAlign: "left",
        transition: "background 0.14s ease",
        outline: "none",
      }}
      onMouseEnter={(e) =>
        !loading && (e.currentTarget.style.background = T.bgCard)
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          style={{ display: "flex" }}
        >
          <RefreshCw size={13} style={{ color: T.textMuted }} />
        </motion.span>
      ) : (
        <Download size={13} style={{ color: T.textMuted, flexShrink: 0 }} />
      )}
      {loading ? "Preparing download..." : label}
    </button>
  );
}

/* ── Card ──────────────────────────────────────────────── */
function Card({ children, className = "", style = {}, hover = true }) {
  const T = useT();
  const [hov, setHov] = useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        borderRadius: 20,
        border: `1px solid ${hov ? T.borderHover : T.border}`,
        background: T.bgCard,
        backdropFilter: "blur(16px)",
        transition: "border-color 0.22s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════ */
function Hero({ os }) {
  const T = useT();
  const ref = useRef();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const op = useTransform(scrollYProgress, [0.3, 0.85], [1, 0]);

  return (
    <section
      ref={ref}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: T.bg,
      }}
    >
      {/* Ambient gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: T.gradientHero,
          pointerEvents: "none",
        }}
      />

      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.035,
          backgroundImage: `linear-gradient(${T.text} 1px, transparent 1px), linear-gradient(90deg, ${T.text} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />

      <motion.div
        style={{
          y,
          opacity: op,
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          padding: "100px 24px 80px",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 36,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 100,
              border: `1px solid ${T.border}`,
              background: T.bgCard,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              color: T.textMuted,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: T.green,
                display: "inline-block",
              }}
            />
            Free · Open Source · No sign-up
          </span>
        </motion.div>

        {/* Headline */}
        <div style={{ marginBottom: 28, overflow: "hidden" }}>
          {[
            { text: "Test APIs.", italic: false, big: true },
            { text: "Without switching apps.", italic: true, big: false },
            { text: "Ever.", italic: false, big: true },
          ].map((line, i) => (
            <div key={i} style={{ overflow: "hidden" }}>
              <motion.h1
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.14 + i * 0.1,
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  display: "block",
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: line.italic ? "italic" : "normal",
                  fontSize: line.big
                    ? "clamp(44px, 8vw, 100px)"
                    : "clamp(34px, 6.5vw, 82px)",
                  lineHeight: 1.06,
                  letterSpacing: "-0.03em",
                  color: line.italic ? T.accent : T.text,
                  margin: 0,
                }}
              >
                {line.text}
              </motion.h1>
            </div>
          ))}
        </div>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "'Geist', sans-serif",
            fontWeight: 300,
            fontSize: "clamp(15px, 2vw, 18px)",
            lineHeight: 1.8,
            color: T.textMuted,
            maxWidth: 520,
            margin: "0 auto 16px",
            padding: "0 8px",
          }}
        >
          RestMan runs at{" "}
          <code
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: "0.88em",
              color: T.accent,
              background: T.accentMuted,
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            localhost:7777
          </code>{" "}
          as a system service. Starts with your machine. Never asks for
          attention again.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.62, duration: 0.5 }}
          style={{ marginBottom: 44 }}
        >
          <Typewriter
            phrases={[
              "No app switching. Ever.",
              "One install. Lifetime usage.",
              "Zero data collection.",
              "No subscription. No sign-in.",
              "100% offline. Fully yours.",
            ]}
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-3"
          style={{ marginBottom: 60 }}
        >
          <DownloadBtn os={os} size="md" />
          <motion.a
            onClick={() =>
              window.open(
                "https://github.com/nithin-sivakumar/open-restman",
                "_blank",
              )
            }
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "11px 22px",
              borderRadius: 14,
              fontFamily: "'Geist', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: T.textMuted,
              border: `1px solid ${T.border}`,
              background: "transparent",
              textDecoration: "none",
              transition: "all 0.18s ease",
            }}
            whileHover={{
              borderColor: T.borderHover,
              color: T.text,
              scale: 1.02,
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Github size={15} />
            GitHub
            <ExternalLink size={11} style={{ opacity: 0.4 }} />
          </motion.a>
          <a
            onClick={() => (window.location.href = "#features")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "'Geist', sans-serif",
              fontSize: 13,
              color: T.textFaint,
              textDecoration: "none",
              transition: "color 0.18s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.textMuted)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.textFaint)}
          >
            See how it works
            <motion.span
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ChevronDown size={13} />
            </motion.span>
          </a>
        </motion.div>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.78, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroMockup />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── Hero Browser Mockup ───────────────────────────────── */
function HeroMockup() {
  const T = useT();
  const [tab, setTab] = useState(0);
  const tabs = [
    { method: "POST", path: "/auth/login", color: T.blue },
    { method: "GET", path: "/users/me", color: T.green },
    { method: "DELETE", path: "/cache/all", color: T.red },
  ];
  const bodies = [
    `{\n  "token": "eyJhbGci...",\n  "user": {\n    "id": "usr_9fk2x",\n    "email": "dev@acme.io",\n    "role": "admin"\n  }\n}`,
    `{\n  "id": "usr_9fk2x",\n  "name": "Alex Dev",\n  "plan": "pro",\n  "createdAt": "2024-01-12"\n}`,
    `{\n  "status": "success",\n  "operation": "cache.clear",\n  "timestamp": "2024-01-12T10:42:11Z"\n}`,
  ];
  const statuses = ["200 OK · 124ms", "200 OK · 88ms", "204 No Content · 61ms"];

  return (
    <div style={{ padding: "0 4px" }}>
      <Card
        hover={false}
        style={{ overflow: "hidden", maxWidth: 780, margin: "0 auto" }}
      >
        {/* Chrome bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {["#f87171", "#fb923c", "#4ade80"].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: c,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              margin: "0 10px",
              padding: "4px 12px",
              borderRadius: 8,
              background: T.bgCard,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              color: T.textFaint,
              textAlign: "center",
            }}
          >
            localhost:7777
          </div>
          <motion.div
            style={{
              fontSize: 10,
              fontFamily: "'Geist Mono', monospace",
              color: T.green,
              background: T.accentMuted,
              padding: "3px 8px",
              borderRadius: 20,
            }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
          >
            ● live
          </motion.div>
        </div>

        <div className="flex" style={{ minHeight: 220 }}>
          {/* Sidebar */}
          <div
            className="hidden sm:flex flex-col"
            style={{
              width: 130,
              flexShrink: 0,
              borderRight: `1px solid ${T.border}`,
            }}
          >
            <div
              style={{
                padding: "10px 14px 6px",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: T.textFaint,
              }}
            >
              Collections
            </div>
            {[
              { n: "Auth", c: T.blue },
              { n: "Users", c: T.green },
              { n: "Payments", c: T.accent },
            ].map((item, i) => (
              <div
                key={item.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontFamily: "'Geist', sans-serif",
                  color: i === 0 ? T.text : T.textFaint,
                  background: i === 0 ? T.bgCard : "transparent",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: item.c,
                    flexShrink: 0,
                  }}
                />
                {item.n}
              </div>
            ))}
          </div>

          {/* Main */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: `1px solid ${T.border}`,
                overflowX: "auto",
              }}
            >
              {tabs.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTab(i)}
                  style={{
                    flexShrink: 0,
                    padding: "8px 14px",
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 11,
                    background: tab === i ? T.bgCard : "transparent",
                    color: tab === i ? T.text : T.textFaint,
                    // borderRight: `1px solid ${T.border}`,
                    border: "none",
                    borderBottom:
                      tab === i
                        ? `2px solid ${T.accent}`
                        : "1px solid transparent",
                    transition: "all 0.15s ease",
                    outline: "none",
                  }}
                >
                  <span style={{ color: t.color }}>{t.method}</span> {t.path}
                </button>
              ))}
            </div>
            {/* Response */}
            <div style={{ flex: 1, justifyContent: "start", padding: "16px" }}>
              <div
                style={{
                  marginBottom: 10,
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  color: T.green,
                }}
              >
                {statuses[tab]}
              </div>
              <AnimatePresence mode="popLayout">
                <motion.pre
                  key={tab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    margin: 0,
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: T.dark ? "rgba(0,0,0,0.35)" : T.bgAlt,
                    overflowX: "auto",
                    textAlign: "left",
                    whiteSpace: "pre",
                    lineHeight: 1.1,
                    tabSize: 2,
                  }}
                >
                  <code
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
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
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STATS BAR
══════════════════════════════════════════════════════ */
function StatsBar() {
  const T = useT();
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const items = [
    { value: 3000, suffix: "+", label: "Active installs", dec: 0 },
    { value: 4.9, suffix: "★", label: "Avg. rating", dec: 1 },
    { custom: "Free", label: "Forever. Always." },
    { value: 3, suffix: "", label: "Platforms supported", dec: 0 },
  ];

  return (
    <section
      ref={ref}
      style={{
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        background: T.bgAlt,
      }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {items.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: i * 0.07,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              padding: "36px 28px",
              borderLeft: i > 0 ? `1px solid ${T.border}` : "none",
            }}
          >
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(32px, 5vw, 52px)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: T.text,
                marginBottom: 8,
              }}
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
            <div
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 12,
                color: T.textFaint,
              }}
            >
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   FEATURES — sticky scroll
══════════════════════════════════════════════════════ */
const FEATURES = [
  {
    id: "browser",
    tag: "Zero friction",
    title: "Your entire API workspace lives in a browser tab.",
    body: "Open a new tab — RestMan is already there at localhost:7777. No launcher, no dock icon, no loading screen. The fastest API client you'll ever use because there's nothing to open.",
    accentColor: null,
  },
  {
    id: "service",
    tag: "Always on",
    title: "Install once. Never think about it again.",
    body: "RestMan registers as a system service on first install. Starts with your machine, updates itself silently from Git every 30 minutes, and auto-recovers if it crashes.",
    accentColor: null,
  },
  {
    id: "env",
    tag: "Environments",
    title: "Switch between dev, staging, and prod in one click.",
    body: "Define your environment variables once. Every request resolves them automatically. Your secrets never leave the machine — no cloud sync, no shared state.",
    accentColor: null,
  },
  {
    id: "privacy",
    tag: "Privacy first",
    title: "Your data has never left this machine. It never will.",
    body: "Zero telemetry. Zero analytics. No account. No email. RestMan works fully offline — air-gapped environments, restricted networks, it doesn't matter. What you test stays with you.",
    accentColor: null,
  },
];

function FeatureViz({ id }) {
  const T = useT();
  if (id === "browser")
    return (
      <Card style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { m: "POST", p: "/auth/token", c: T.blue },
            { m: "GET", p: "/v2/users", c: T.green },
            { m: "PUT", p: "/orders/91", c: T.accent },
            { m: "DEL", p: "/cache/all", c: T.red },
          ].map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ x: 4 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: T.bgCard,
                border: `1px solid ${T.border}`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  color: r.c,
                  width: 32,
                  flexShrink: 0,
                }}
              >
                {r.m}
              </span>
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 13,
                  color: T.textMuted,
                  flex: 1,
                }}
              >
                {r.p}
              </span>
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 10,
                  color: T.green,
                }}
              >
                200
              </span>
            </motion.div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 14px",
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              color: T.textFaint,
            }}
          >
            <span>localhost:7777</span>
            <motion.span
              style={{ color: T.green }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ● live
            </motion.span>
          </div>
        </div>
      </Card>
    );

  if (id === "service")
    return (
      <Card style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { icon: <Zap size={14} />, label: "Starts on boot", c: T.accent },
            {
              icon: <RefreshCw size={14} />,
              label: "Auto-updates every 30min",
              c: T.blue,
            },
            {
              icon: <Cpu size={14} />,
              label: "~45MB RAM footprint",
              c: T.green,
            },
            {
              icon: <Server size={14} />,
              label: "Port 7777, customizable",
              c: T.red,
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ x: 4 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: T.bgCard,
                border: `1px solid ${T.border}`,
              }}
            >
              <span style={{ color: item.c }}>{item.icon}</span>
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 13,
                  color: T.text,
                  flex: 1,
                }}
              >
                {item.label}
              </span>
              <motion.span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: T.green,
                  display: "block",
                }}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
              />
            </motion.div>
          ))}
        </div>
      </Card>
    );

  if (id === "env") {
    const [env, setEnv] = useState(0);
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
      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
          {envs.map((e, i) => (
            <motion.button
              key={e}
              onClick={() => setEnv(i)}
              whileHover={{
                backgroundColor: T.borderHover,
                color: T.accentText,
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                background: "transparent",
                border: "none",
                borderBottom:
                  i === env ? `2px solid ${T.accent}` : "2px solid transparent",
                color: i === env ? T.accent : T.textFaint,
                transition: "all 0.15s ease",
                outline: "none",
              }}
            >
              {e}
            </motion.button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={env}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.16 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {rows[env].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{ width: 76, flexShrink: 0, color: T.textFaint }}
                  >
                    {k}
                  </span>
                  <span style={{ color: T.text }}>{v}</span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
    );
  }

  if (id === "privacy")
    return (
      <Card style={{ padding: 20 }}>
        <motion.div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <motion.div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: T.bgCard,
              border: `1px solid ${T.border}`,
            }}
            animate={{ rotate: [0, 1, -1, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          >
            <Shield size={26} style={{ color: T.red }} />
          </motion.div>
        </motion.div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
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
              whileHover={{ color: T.text }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                background: T.bgCard,
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                color: T.textMuted,
              }}
            >
              <Check size={10} style={{ color: T.green, flexShrink: 0 }} />
              {item}
            </motion.div>
          ))}
        </div>
      </Card>
    );

  return null;
}

function Features() {
  const T = useT();
  const [activeIdx, setActiveIdx] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveIdx(Number(e.target.dataset.index));
        }),
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" style={{ background: T.bg, position: "relative" }}>
      {/* Sticky panel */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-20">
          {/* Left text */}
          <div>
            {/* Progress dots */}
            <div style={{ display: "flex", gap: 6, marginBottom: 36 }}>
              {FEATURES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === activeIdx ? 24 : 6,
                    opacity: i === activeIdx ? 1 : 0.2,
                  }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: i === activeIdx ? T.accent : T.textFaint,
                  }}
                />
              ))}
            </div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                <span
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: T.accent,
                    display: "block",
                    marginBottom: 18,
                  }}
                >
                  {FEATURES[activeIdx].tag}
                </span>
                <h2
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "clamp(26px, 3vw, 42px)",
                    lineHeight: 1.15,
                    color: T.text,
                    marginBottom: 20,
                    margin: "0 0 18px",
                  }}
                >
                  {FEATURES[activeIdx].title}
                </h2>
                <p
                  style={{
                    fontFamily: "'Geist', sans-serif",
                    fontWeight: 300,
                    fontSize: 15,
                    lineHeight: 1.85,
                    color: T.textMuted,
                  }}
                >
                  {FEATURES[activeIdx].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right visual */}
          <div className="hidden lg:block">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                style={{ maxWidth: 420, marginLeft: "auto" }}
              >
                <FeatureViz id={FEATURES[activeIdx].id} />
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
          style={{ height: "100vh" }}
        />
      ))}
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   LIGHTWEIGHT
══════════════════════════════════════════════════════ */
function Lightweight() {
  const T = useT();
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hov, setHov] = useState(null);

  const metrics = [
    {
      label: "Memory",
      value: "~45MB",
      pct: 9,
      color: T.green,
      note: "Less than a Chrome tab",
    },
    {
      label: "CPU idle",
      value: "~0.1%",
      pct: 3,
      color: T.blue,
      note: "Invisible at rest",
    },
    {
      label: "Boot time",
      value: "<3s",
      pct: 12,
      color: T.accent,
      note: "Ready before you blink",
    },
    {
      label: "Disk",
      value: "~400MB",
      pct: 8,
      color: T.red,
      note: "Smaller than most apps",
    },
  ];

  return (
    <section
      ref={ref}
      style={{
        padding: "120px 24px",
        background: T.bgAlt,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <Reveal>
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: T.textFaint,
              display: "block",
              marginBottom: 18,
            }}
          >
            Lightweight
          </span>
          <h2
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(28px, 4vw, 46px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: T.text,
              margin: "0 0 18px",
            }}
          >
            Barely there.{" "}
            <em style={{ color: T.accent, fontStyle: "italic" }}>
              Always there.
            </em>
          </h2>
          <p
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 300,
              fontSize: 15,
              lineHeight: 1.8,
              color: T.textMuted,
            }}
          >
            RestMan consumes fewer resources than a single browser tab. It runs
            24/7, updates itself, and demands exactly zero attention after first
            setup.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: 12,
                        color: T.text,
                      }}
                    >
                      {m.label}
                    </span>
                    <AnimatePresence>
                      {hov === i && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          style={{
                            fontFamily: "'Geist', sans-serif",
                            fontSize: 11,
                            color: T.textMuted,
                          }}
                        >
                          {m.note}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 12,
                      color: T.text,
                    }}
                  >
                    {m.value}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: T.bgCard,
                    border: `1px solid ${T.border}`,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    style={{
                      height: "100%",
                      borderRadius: 2,
                      background: m.color,
                      opacity: hov === i ? 1 : 0.55,
                    }}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${m.pct}%` } : {}}
                    transition={{
                      delay: 0.3 + i * 0.08,
                      duration: 0.9,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </motion.div>
            ))}
            <span
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: 12,
                color: T.textFaint,
              }}
            >
              Measured on mid-load workday
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   COMPARE
══════════════════════════════════════════════════════ */
const ROWS = [
  { feat: "Fully offline & local", rm: true, po: false, ins: false },
  { feat: "No account required", rm: true, po: false, ins: false },
  { feat: "No subscription", rm: true, po: false, ins: false },
  { feat: "Runs in your browser", rm: true, po: true, ins: true },
  { feat: "Open source", rm: true, po: false, ins: true },
  { feat: "Zero data collection", rm: true, po: false, ins: false },
  { feat: "Self-updating service", rm: true, po: true, ins: true },
  { feat: "One-time setup, lifetime use", rm: true, po: false, ins: false },
];

function Compare() {
  const T = useT();
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="compare"
      ref={ref}
      style={{ padding: "100px 24px", background: T.bg }}
    >
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: T.textFaint,
              display: "block",
              marginBottom: 16,
            }}
          >
            Comparison
          </span>
          <h2
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(28px, 5vw, 52px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: T.text,
              margin: "0 0 48px",
            }}
          >
            Why teams switch
            <br />
            <span style={{ color: T.accent }}>to RestMan.</span>
          </h2>
        </Reveal>

        {/* Mobile */}
        <div
          className="flex md:hidden"
          style={{ flexDirection: "column", gap: 10 }}
        >
          {ROWS.map((row, i) => (
            <Card
              key={row.feat}
              style={{
                padding: "14px 16px",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(8px)",
                transition: `opacity 0.4s ease ${i * 0.04}s, transform 0.4s ease ${i * 0.04}s`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 13,
                  color: T.text,
                  marginBottom: 12,
                }}
              >
                {row.feat}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  textAlign: "center",
                }}
              >
                {[
                  { n: "RestMan", v: row.rm, hi: true },
                  { n: "Postman", v: row.po },
                  { n: "Insomnia", v: row.ins },
                ].map((item) => (
                  <div
                    key={item.n}
                    style={{
                      padding: "8px 4px",
                      borderRadius: 8,
                      background: item.hi ? T.accentMuted : "transparent",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Geist', sans-serif",
                        fontSize: 9,
                        color: T.textFaint,
                        marginBottom: 5,
                      }}
                    >
                      {item.n}
                    </div>
                    {item.v ? (
                      <Check
                        size={13}
                        style={{ color: T.green, margin: "0 auto" }}
                      />
                    ) : (
                      <X
                        size={12}
                        style={{ color: T.border, margin: "0 auto" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <Card
            hover={false}
            style={{
              overflow: "hidden",
              borderRadius: 16,
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <div style={{ padding: "16px 20px" }} />
              {["RestMan", "Postman", "Insomnia"].map((n, i) => (
                <div
                  key={n}
                  style={{
                    padding: "16px 20px",
                    textAlign: "center",
                    fontFamily: "'Geist', sans-serif",
                    fontSize: 13,
                    color: i === 0 ? T.accent : T.textFaint,
                    fontWeight: i === 0 ? 500 : 400,
                  }}
                  className="flex items-center justify-center gap-1"
                >
                  {i === 0 && (
                    <div
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: 13,
                        color: T.text,
                        // marginBottom: 3,
                      }}
                    >
                      🎉
                    </div>
                  )}
                  {n}
                </div>
              ))}
            </div>

            {/* Data rows — plain divs, no motion, CSS transition on the parent Card handles the reveal */}
            {ROWS.map((row, i) => (
              <div
                key={row.feat}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  borderBottom:
                    i < ROWS.length - 1 ? `1px solid ${T.border}` : "none",
                }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    fontFamily: "'Geist', sans-serif",
                    fontSize: 13,
                    color: T.textMuted,
                  }}
                >
                  {row.feat}
                </div>
                {[row.rm, row.po, row.ins].map((ok, j) => (
                  <div
                    key={j}
                    style={{
                      padding: "14px 20px",
                      textAlign: "center",
                      background: j === 0 ? T.accentMuted : "transparent",
                    }}
                  >
                    {ok ? (
                      <Check
                        size={14}
                        style={{ color: T.green, margin: "0 auto" }}
                      />
                    ) : (
                      <X
                        size={13}
                        style={{ color: T.border, margin: "0 auto" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════ */
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
    q: "I use it mainly for quick endpoint checks while building features. The fact that it's browser-based makes it ridiculously convenient.",
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
];

function Testimonials() {
  const T = useT();
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((a) => (a + 1) % TESTI.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  const t = TESTI[active];

  return (
    <section
      id="testimonials"
      ref={ref}
      style={{
        padding: "120px 24px",
        background: T.bgAlt,
        borderTop: `1px solid ${T.border}`,
      }}
    >
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: T.textFaint,
              display: "block",
              marginBottom: 16,
            }}
          >
            Testimonials
          </span>
          <h2
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(28px, 4.5vw, 52px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: T.text,
              marginBottom: 48,
              margin: "0 0 48px",
            }}
          >
            Developers don't lie.
          </h2>
        </Reveal>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card style={{ padding: "clamp(24px, 5vw, 52px)" }}>
              <p
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontSize: "clamp(16px, 2.2vw, 21px)",
                  lineHeight: 1.75,
                  color: T.text,
                  marginBottom: 28,
                  margin: "0 0 28px",
                }}
              >
                "{t.q}"
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: T.bgCard,
                      border: `1px solid ${T.border}`,
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 12,
                      color: T.text,
                    }}
                  >
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Geist', sans-serif",
                        fontSize: 13,
                        fontWeight: 500,
                        color: T.text,
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Geist', sans-serif",
                        fontSize: 11,
                        color: T.textFaint,
                      }}
                    >
                      {t.role} · {t.co}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["‹", "›"].map((ch, j) => (
                    <motion.button
                      key={j}
                      onClick={() =>
                        setActive((a) =>
                          j === 0
                            ? (a - 1 + TESTI.length) % TESTI.length
                            : (a + 1) % TESTI.length,
                        )
                      }
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        border: `1px solid ${T.border}`,
                        background: "transparent",
                        color: T.textMuted,
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = T.borderHover;
                        e.currentTarget.style.color = T.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.color = T.textMuted;
                      }}
                    >
                      {ch}
                    </motion.button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
          {TESTI.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setActive(i)}
              animate={{
                width: i === active ? 22 : 6,
                opacity: i === active ? 1 : 0.25,
              }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: 4,
                borderRadius: 2,
                background: i === active ? T.accent : T.textFaint,
                border: "none",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   FINAL CTA
══════════════════════════════════════════════════════ */
function FinalCTA({ os }) {
  const T = useT();
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      style={{
        padding: "140px 24px",
        background: T.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: T.gradientCta,
          pointerEvents: "none",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          maxWidth: 680,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: T.textFaint,
            display: "block",
            marginBottom: 24,
          }}
        >
          Get started
        </span>
        <h2
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(38px, 6.5vw, 76px)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: T.text,
            margin: "0 0 20px",
          }}
        >
          Your API workflow,
          <br />
          <em style={{ color: T.accent, fontStyle: "italic" }}>
            finally free.
          </em>
        </h2>
        <p
          style={{
            fontFamily: "'Geist', sans-serif",
            fontWeight: 300,
            fontSize: 16,
            lineHeight: 1.75,
            color: T.textMuted,
            maxWidth: 480,
            margin: "0 auto 44px",
          }}
        >
          Install once. Open your browser. Start testing. RestMan is ready
          before you think to look for it.
        </p>
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ marginBottom: 36 }}
        >
          <DownloadBtn os={os} size="lg" />
          <motion.a
            onClick={() =>
              window.open(
                "https://github.com/nithin-sivakumar/open-restman",
                "_blank",
              )
            }
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "14px 28px",
              borderRadius: 14,
              fontFamily: "'Geist', sans-serif",
              fontSize: 15,
              fontWeight: 500,
              color: T.textMuted,
              border: `1px solid ${T.border}`,
              background: "transparent",
              textDecoration: "none",
              transition: "all 0.18s ease",
            }}
            whileHover={{
              borderColor: T.borderHover,
              color: T.text,
              scale: 1.02,
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Github size={16} />
            View on GitHub
          </motion.a>
        </div>
        <a
          onClick={() => window.open("mailto:restmansupport@paper.neuto.in")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 12,
            color: T.textFaint,
            textDecoration: "none",
            transition: "color 0.18s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.textMuted)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.textFaint)}
        >
          <Mail size={12} />
          restmansupport@paper.neuto.in
        </a>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════ */
function Footer() {
  const T = useT();
  return (
    <footer
      style={{
        borderTop: `1px solid ${T.border}`,
        background: T.bgAlt,
        padding: "28px 24px",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Geist', sans-serif",
            fontWeight: 500,
            fontSize: 14,
            color: T.textMuted,
          }}
        >
          <LogoMark size={18} />
          RestMan
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11,
            color: T.textFaint,
          }}
        >
          <a
            onClick={() =>
              window.open("https://github.com/nithin-sivakumar/open-restman")
            }
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              color: T.textFaint,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.textMuted)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.textFaint)}
          >
            <Github size={12} /> GitHub
          </a>
          <a
            onClick={() => window.open("mailto:restmansupport@paper.neuto.in")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              color: T.textFaint,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.textMuted)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.textFaint)}
          >
            <Mail size={12} /> Support
          </a>
          <span>© {new Date().getFullYear()} RestMan</span>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════ */
export default function App() {
  const [os, setOs] = useState("unknown");
  const [isDark, setIsDark] = useState(BASE_DARK_THEME.dark);

  // Resolve which theme object to use based on current isDark state
  const activeTheme = isDark ? BASE_REAL_DARK_THEME : BASE_LIGHT_THEME;

  const toggleDark = useCallback(() => setIsDark((d) => !d), []);

  useEffect(() => {
    setOs(detectOS());
    // Respect system preference on first load
    if (window.matchMedia) {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";
    return () => {
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <ThemeCtx.Provider value={activeTheme}>
      <div
        style={{
          background: activeTheme.bg,
          color: activeTheme.text,
          overflowX: "clip",
          transition: "background 0.35s ease, color 0.35s ease",
        }}
      >
        <Fonts />
        <ThemeInjector theme={activeTheme} />
        <CustomCursor />
        <Navbar os={os} isDark={isDark} onToggleDark={toggleDark} />
        <main>
          <Hero os={os} />
          <StatsBar />
          <Features />
          <Lightweight />
          <Compare />
          <Testimonials />
          <FinalCTA os={os} />
        </main>
        <Footer />
      </div>
    </ThemeCtx.Provider>
  );
}
