/**
 * RestMan /download page
 * ─────────────────────────────────────────────
 * - OS detection → primary CTA for detected OS
 * - All platforms always visible below
 * - Uses same ThemeCtx / Navbar / Footer as App.jsx
 * - Downloads proxied through your domain via /download-file/ route
 *   (CloudFront → Lambda URL rewrite — see AWS setup guide)
 * - Fully responsive, Tailwind + inline theme vars
 */

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useSpring,
} from "motion/react";
import {
  Download,
  Github,
  Mail,
  CheckCircle2,
  Monitor,
  Apple,
  Terminal,
  Smartphone,
  ChevronDown,
  ArrowRight,
  Shield,
  Zap,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

// ── Import shared pieces from App.jsx ──────────────────────
// These are re-exported from App.jsx or a shared module.
// Adjust paths to match your project structure.
import { ThemeCtx, useT, LogoMark, Navbar, Footer } from "./App.jsx";

// ── Proxy download base path ───────────────────────────────
// CloudFront rewrites /download-file/<key> → Lambda streams from S3
// The browser sees YOUR domain, not S3.
const DOWNLOAD_BASE = import.meta.env.VITE_CDN_URL;

// File keys inside your S3 bucket
const FILES = {
  win: "releases/windows/restman-setup.exe",
  mac_arm: "releases/mac/restman-setup-arm64.dmg",
  mac_intel: "releases/mac/restman-setup.dmg",
  linux: "releases/linux/restman-setup.AppImage",
};

function proxyUrl(fileKey) {
  // Encodes the S3 key as a path segment — Lambda decodes it
  console.log(`${DOWNLOAD_BASE}/${fileKey}`);
  return `${DOWNLOAD_BASE}/${fileKey}`;
}

// ── OS detection ───────────────────────────────────────────
function detectOS() {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "mobile";
  if (/iPad|iPhone|iPod/.test(ua)) return "mobile";
  if (ua.includes("Win")) return "win";
  if (ua.includes("Mac")) return "mac";
  if (ua.includes("Linux")) return "linux";
  return "unknown";
}

// ── Platform metadata ──────────────────────────────────────
const PLATFORMS = {
  win: {
    key: "win",
    label: "Windows",
    sublabel: "Windows 10 / 11 · 64-bit",
    icon: Monitor,
    accent: "#60a5fa", // blue
    variants: [
      {
        label: "Windows 64-bit (.exe)",
        fileKey: FILES.win,
        fileName: "restman-setup.exe",
      },
    ],
  },
  mac: {
    key: "mac",
    label: "macOS",
    sublabel: "Apple Silicon & Intel",
    icon: Apple,
    accent: "#a78bfa", // violet
    variants: [
      {
        label: "Apple Silicon (.dmg)",
        fileKey: FILES.mac_arm,
        fileName: "restman-setup-arm64.dmg",
        badge: "M1/M2/M3",
      },
      {
        label: "Intel (.dmg)",
        fileKey: FILES.mac_intel,
        fileName: "restman-setup.dmg",
        badge: "Intel",
      },
    ],
  },
  linux: {
    key: "linux",
    label: "Linux",
    sublabel: "Ubuntu, Fedora, Arch & more",
    icon: Terminal,
    accent: "#34d399", // green
    variants: [
      {
        label: "Linux (.AppImage)",
        fileKey: FILES.linux,
        fileName: "restman-setup.AppImage",
      },
    ],
  },
};

const ORDERED_PLATFORMS = ["win", "mac", "linux"];

// ── Tiny components ────────────────────────────────────────
function Badge({ children, color }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium"
      style={{ background: `${color}20`, color }}
    >
      {children}
    </span>
  );
}

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

function DownloadRow({ variant, isLast }) {
  const T = useT();
  const [state, setState] = useState("idle"); // idle | downloading | done

  const handleDownload = () => {
    setState("downloading");
    const url = proxyUrl(variant.fileKey);
    const a = document.createElement("a");
    a.href = url;
    a.download = variant.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Show "done" briefly
    setTimeout(() => setState("done"), 800);
    setTimeout(() => setState("idle"), 3500);
  };

  return (
    <motion.button
      onClick={handleDownload}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
        !isLast ? "border-b" : ""
      }`}
      style={{
        borderColor: T.border,
        background: "transparent",
        outline: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.bgCard)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "idle" && (
          <motion.span
            key="dl"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Download size={14} style={{ color: T.textMuted }} />
          </motion.span>
        )}
        {state === "downloading" && (
          <motion.span
            key="spin"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 360 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{
              scale: { duration: 0.15 },
              opacity: { duration: 0.15 },
              rotate: { repeat: Infinity, duration: 0.8, ease: "linear" },
            }}
          >
            <RefreshCw size={14} style={{ color: T.accent }} />
          </motion.span>
        )}
        {state === "done" && (
          <motion.span
            key="done"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CheckCircle2 size={14} style={{ color: T.green }} />
          </motion.span>
        )}
      </AnimatePresence>

      <span
        className="flex-1 font-['Geist',sans-serif] text-[13px]"
        style={{
          color:
            state === "done"
              ? T.green
              : state === "downloading"
                ? T.accent
                : T.text,
        }}
      >
        {state === "done"
          ? "Download started!"
          : state === "downloading"
            ? "Preparing download…"
            : variant.label}
      </span>

      {variant.badge && state === "idle" && (
        <Badge color={T.accent}>{variant.badge}</Badge>
      )}
    </motion.button>
  );
}

// ── Primary Download Card ──────────────────────────────────
function PrimaryCard({ platform, isDetected }) {
  const T = useT();
  const Icon = platform.icon;
  const [expanded, setExpanded] = useState(false);
  const singleVariant = platform.variants.length === 1;
  const [state, setState] = useState("idle");

  const handleSingleDownload = () => {
    setState("downloading");
    const v = platform.variants[0];
    const url = proxyUrl(v.fileKey);
    const a = document.createElement("a");
    a.href = url;
    a.download = v.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => setState("done"), 800);
    setTimeout(() => setState("idle"), 3500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${isDetected ? platform.accent + "60" : T.border}`,
        background: T.bgCard,
        boxShadow: isDetected
          ? `0 0 0 1px ${platform.accent}20, 0 20px 60px ${platform.accent}10`
          : "none",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-4 px-6 py-5"
        style={{
          borderBottom: `1px solid ${T.border}`,
          background: isDetected ? `${platform.accent}08` : "transparent",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${platform.accent}18`,
            border: `1px solid ${platform.accent}30`,
          }}
        >
          <Icon size={20} style={{ color: platform.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-['Geist',sans-serif] font-medium text-[15px]"
              style={{ color: T.text }}
            >
              {platform.label}
            </span>
            {isDetected && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
                style={{
                  background: `${platform.accent}20`,
                  color: platform.accent,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: platform.accent }}
                />
                Detected
              </span>
            )}
          </div>
          <div
            className="font-mono text-[11px] mt-0.5"
            style={{ color: T.textFaint }}
          >
            {platform.sublabel}
          </div>
        </div>
      </div>

      {/* Download actions */}
      {singleVariant ? (
        <motion.button
          onClick={handleSingleDownload}
          whileHover={{ backgroundColor: T.bgAlt }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center gap-3 px-6 py-4 transition-colors duration-150"
          style={{ background: "transparent", outline: "none", border: "none" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {state === "idle" && (
              <motion.span
                key="dl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Download size={15} style={{ color: T.textMuted }} />
              </motion.span>
            )}
            {state === "downloading" && (
              <motion.span
                key="spin"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              >
                <RefreshCw size={15} style={{ color: T.accent }} />
              </motion.span>
            )}
            {state === "done" && (
              <motion.span
                key="done"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <CheckCircle2 size={15} style={{ color: T.green }} />
              </motion.span>
            )}
          </AnimatePresence>
          <span
            className="font-['Geist',sans-serif] text-[13px]"
            style={{
              color:
                state === "done"
                  ? T.green
                  : state === "downloading"
                    ? T.accent
                    : T.text,
            }}
          >
            {state === "done"
              ? "Download started!"
              : state === "downloading"
                ? "Preparing…"
                : platform.variants[0].label}
          </span>
        </motion.button>
      ) : (
        <>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center gap-3 px-6 py-4 transition-colors duration-150"
            style={{
              background: "transparent",
              outline: "none",
              border: "none",
              borderBottom: expanded ? `1px solid ${T.border}` : "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.bgAlt)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Download size={15} style={{ color: T.textMuted }} />
            <span
              className="flex-1 font-['Geist',sans-serif] text-[13px] text-left"
              style={{ color: T.text }}
            >
              Choose version
            </span>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={13} style={{ color: T.textFaint }} />
            </motion.span>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: "hidden" }}
              >
                {platform.variants.map((v, i) => (
                  <DownloadRow
                    key={v.label}
                    variant={v}
                    isLast={i === platform.variants.length - 1}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// ── Other platforms section ────────────────────────────────
function OtherPlatforms({ detectedOS }) {
  const T = useT();
  const others = ORDERED_PLATFORMS.filter((k) => k !== detectedOS);
  if (others.length === 0) return null;

  return (
    <div className="mt-12">
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em] mb-5"
        style={{ color: T.textFaint }}
      >
        Other platforms
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {others.map((key, i) => {
          const p = PLATFORMS[key];
          const Icon = p.icon;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + i * 0.08,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="rounded-2xl overflow-hidden"
              style={{
                border: `1px solid ${T.border}`,
                background: T.bgCard,
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderBottom: `1px solid ${T.border}` }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: `${p.accent}18`,
                    border: `1px solid ${p.accent}30`,
                  }}
                >
                  <Icon size={16} style={{ color: p.accent }} />
                </div>
                <div>
                  <div
                    className="font-['Geist',sans-serif] font-medium text-[13px]"
                    style={{ color: T.text }}
                  >
                    {p.label}
                  </div>
                  <div
                    className="font-mono text-[10px]"
                    style={{ color: T.textFaint }}
                  >
                    {p.sublabel}
                  </div>
                </div>
              </div>
              {/* Variants */}
              {p.variants.map((v, vi) => (
                <DownloadRow
                  key={v.label}
                  variant={v}
                  isLast={vi === p.variants.length - 1}
                />
              ))}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Trust badges ───────────────────────────────────────────
function TrustRow() {
  const T = useT();
  const items = [
    { icon: Shield, label: "No account required" },
    { icon: Zap, label: "One-time install" },
    { icon: RefreshCw, label: "Self-updating" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            border: `1px solid ${T.border}`,
            background: T.bgCard,
          }}
        >
          <Icon size={11} style={{ color: T.textFaint }} />
          <span
            className="font-mono text-[11px]"
            style={{ color: T.textFaint }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Mobile notice ──────────────────────────────────────────
function MobileNotice() {
  const T = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-6 text-center"
      style={{
        border: `1px solid ${T.border}`,
        background: T.bgCard,
      }}
    >
      <Smartphone
        size={28}
        style={{ color: T.textFaint, margin: "0 auto 12px" }}
      />
      <p
        className="font-['Geist',sans-serif] text-[14px] mb-4"
        style={{ color: T.textMuted }}
      >
        RestMan is a desktop app. Visit this page on your Mac, Windows, or Linux
        machine to download.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {ORDERED_PLATFORMS.map((key) => {
          const p = PLATFORMS[key];
          return (
            <div
              key={key}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ border: `1px solid ${T.border}`, background: T.bg }}
            >
              <p.icon size={14} style={{ color: p.accent }} />
              <span
                className="font-['Geist',sans-serif] text-[12px]"
                style={{ color: T.textMuted }}
              >
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
//  Main Download Page
// ══════════════════════════════════════════════════════════
export default function DownloadPage() {
  const T = useT();
  const [os, setOs] = useState("unknown");
  const { isDark, toggleDark } = T;

  // Re-use same dark toggle as App.jsx (if ThemeCtx is provided by a parent Router wrapper)
  // If ThemeCtx provider wraps the Router (recommended), isDark/toggle come from context.
  // Otherwise, keep local state here:
  //   const toggleDark = () => setIsDark((d) => !d);

  useEffect(() => {
    setOs(detectOS());
    // if (window.matchMedia) {
    //   setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    // }
    document.documentElement.style.cursor = "none";
    return () => {
      document.documentElement.style.cursor = "";
    };
  }, []);

  const isMobile = os === "mobile";
  const detectedPlatform = PLATFORMS[os];

  // If unknown OS, show all platforms with no "detected" highlight
  const primaryKey = ORDERED_PLATFORMS.includes(os) ? os : "win";
  const primaryPlatform = PLATFORMS[primaryKey];

  return (
    <div
      className="min-h-screen"
      style={{
        background: T.bg,
        color: T.text,
        overflowX: "clip",
        transition: "background 0.35s ease, color 0.35s ease",
      }}
    >
      <Navbar os={os} isDark={isDark} onToggleDark={toggleDark} />
      <CustomCursor />
      <main
        className="max-w-2xl mx-auto px-4 sm:px-6"
        style={{ paddingTop: 112, paddingBottom: 120 }}
      >
        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
            style={{
              borderColor: T.border,
              background: T.bgCard,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: T.green }}
            />
            <span
              className="font-mono text-[11px]"
              style={{ color: T.textMuted }}
            >
              Free · Open Source · No sign-up
            </span>
          </div>

          <h1
            className="font-['Instrument_Serif',serif] leading-tight mb-4"
            style={{
              fontSize: "clamp(32px, 6vw, 58px)",
              letterSpacing: "-0.03em",
              color: T.text,
            }}
          >
            Download{" "}
            <em style={{ color: T.accent, fontStyle: "italic" }}>RestMan</em>
          </h1>

          {!isMobile && (
            <p
              className="font-['Geist',sans-serif] font-light leading-relaxed"
              style={{
                fontSize: "clamp(14px, 2vw, 16px)",
                color: T.textMuted,
                maxWidth: 440,
                margin: "0 auto",
              }}
            >
              {detectedPlatform
                ? `We detected ${detectedPlatform.label}. Your installer is ready.`
                : "Choose your platform below."}
            </p>
          )}
        </motion.div>

        {/* ── Content ── */}
        {isMobile ? (
          <MobileNotice />
        ) : (
          <>
            {/* Primary CTA */}
            <PrimaryCard
              platform={primaryPlatform}
              isDetected={ORDERED_PLATFORMS.includes(os)}
            />

            {/* Other platforms */}
            <OtherPlatforms detectedOS={os} />

            {/* Trust row */}
            <TrustRow />

            {/* Version note */}
            <div className="mt-8 text-center">
              <p
                className="font-mono text-[11px]"
                style={{ color: T.textFaint }}
              >
                Having trouble?{" "}
                <a
                  href="mailto:restmansupport@paper.neuto.in"
                  className="underline underline-offset-2 transition-colors duration-150"
                  style={{ color: T.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = T.textMuted)
                  }
                >
                  Contact support
                </a>{" "}
                or{" "}
                <a
                  href="https://github.com/nithin-sivakumar/open-restman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-2 transition-colors duration-150"
                  style={{ color: T.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = T.textMuted)
                  }
                >
                  open an issue on GitHub
                  <ExternalLink size={9} />
                </a>
              </p>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
