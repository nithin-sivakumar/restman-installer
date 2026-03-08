const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const { exec, spawn, execSync } = require("child_process");
const fs = require("fs");
const os = require("os");

let mainWindow;

function ensureAdmin() {
  if (process.platform !== "win32") return;
  try {
    execSync("net session", { stdio: "ignore" });
  } catch {
    // Not admin — relaunch elevated
    // shell.openExternal(""); // flush
    const args = process.argv
      .slice(1)
      .map((a) => `"${a}"`)
      .join(" ");
    execSync(
      `powershell -Command "Start-Process '${process.execPath}' -ArgumentList '${args}' -Verb RunAs"`,
      { stdio: "ignore" },
    );
    app.exit(0);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    resizable: false,
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "assets", "icon.png"),
    backgroundColor: "#0a0a0f",
  });
  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  ensureAdmin();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ── helpers ──────────────────────────────────────────────────────────────────

function send(event, data) {
  if (mainWindow && !mainWindow.isDestroyed())
    mainWindow.webContents.send(event, data);
}

function getCommandEnv(extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };

  // Electron apps on macOS may not inherit a login shell PATH (Finder launch).
  if (process.platform === "darwin") {
    const normalizedPath = [
      env.PATH,
      "/opt/homebrew/bin",
      "/usr/local/bin",
      "/usr/bin",
      "/bin",
      "/usr/sbin",
      "/sbin",
    ]
      .join(":")
      .split(":")
      .map((p) => p.trim())
      .filter(Boolean);

    env.PATH = [...new Set(normalizedPath)].join(":");
  }

  return env;
}

function run(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    const { env: customEnv, ...restOpts } = opts;
    const child = exec(cmd, {
      ...restOpts,
      maxBuffer: 50 * 1024 * 1024,
      windowsHide: true,
      env: getCommandEnv(customEnv),
    });
    let out = "",
      err = "";
    child.stdout?.on("data", (d) => {
      out += d;
      send("log", d.toString().trimEnd() + "\n");
    });
    child.stderr?.on("data", (d) => {
      err += d;
      send("log", d.toString().trimEnd() + "\n");
    });
    child.on("close", (code) =>
      code === 0
        ? resolve(out)
        : reject(new Error(`[cmd: ${cmd}]\n${err || out || `exit ${code}`}`)),
    );
  });
}

// ── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle("pick-folder", async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
  });
  return res.canceled ? null : res.filePaths[0];
});

ipcMain.handle("get-platform", () => process.platform);
ipcMain.handle("get-home", () =>
  process.platform === "win32" ? "C:\\Program Files" : os.homedir(),
);

ipcMain.handle("check-deps", async (_, { checkMongo = true } = {}) => {
  const checkWithVersion = async (cmd, name) => {
    try {
      const version = await run(cmd);
      send("log", `✅ ${name} found — ${version.trim()}\n`);
      return true;
    } catch {
      send("log", `❌ ${name} not found\n`);
      return false;
    }
  };

  send("log", `🔍 Scanning system for required dependencies...\n`);
  send("log", `📋 Platform: ${process.platform} | Arch: ${process.arch}\n`);
  send("log", `─────────────────────────────────\n`);

  send("log", `⏳ Checking Node.js...\n`);
  const node = await checkWithVersion("node --version", "Node.js");

  send("log", `⏳ Checking npm...\n`);
  const npm = await checkWithVersion("npm --version", "npm");

  let mongod = true; // default true so it's never flagged as missing when sqlite
  if (checkMongo) {
    send("log", `⏳ Checking MongoDB...\n`);
    mongod = await checkWithVersion("mongosh --version", "MongoDB Shell");
  } else {
    send("log", `ℹ️  MongoDB check skipped (SQLite selected)\n`);
  }

  send("log", `⏳ Checking Git...\n`);
  const git = await checkWithVersion("git --version", "Git");

  send("log", `⏳ Checking PM2...\n`);
  const pm2 = await checkWithVersion("pm2 --version", "PM2");

  send("log", `─────────────────────────────────\n`);
  const missing = [
    !node && "Node.js",
    !npm && "npm",
    !mongod && "MongoDB",
    !git && "Git",
    !pm2 && "PM2",
  ].filter(Boolean);
  if (missing.length === 0) {
    send("log", `🎉 All dependencies are present! Ready to install.\n`);
  } else {
    send(
      "log",
      `⚠️  Missing: ${missing.join(", ")} — install them before proceeding.\n`,
    );
  }

  return { node, npm, mongod, git, pm2 };
});

ipcMain.handle("install-deps", async (_, { missing, platform }) => {
  // Helper that streams output to the dep-install-log channel in real time
  function runStreamed(cmd, opts = {}) {
    return new Promise((resolve, reject) => {
      const { env: customEnv, ...restOpts } = opts;
      const child = exec(cmd, {
        ...restOpts,
        maxBuffer: 50 * 1024 * 1024,
        windowsHide: true,
        env: getCommandEnv(customEnv),
      });
      let out = "",
        err = "";
      child.stdout?.on("data", (d) => {
        out += d;
        send("dep-install-log", d.toString().trimEnd() + "\n");
      });
      child.stderr?.on("data", (d) => {
        err += d;
        // Many package managers write progress to stderr — show it anyway
        send("dep-install-log", d.toString().trimEnd() + "\n");
      });
      child.on("close", (code) =>
        code === 0
          ? resolve(out)
          : reject(new Error(`[exit ${code}]\n${err || out}`)),
      );
    });
  }

  function progress(percent, label) {
    send("dep-install-progress", { percent, label });
    send("dep-install-log", `\n⏳ ${label}\n`);
  }

  try {
    const total = missing.length + (missing.includes("pm2") ? 0 : 0); // just use index-based %
    let done = 0;

    if (platform === "win32") {
      if (missing.includes("node")) {
        progress(
          Math.round((done / missing.length) * 90),
          "Installing Node.js via winget…",
        );
        await runStreamed(
          "winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements",
        );
        send("dep-install-log", "✅ Node.js installed\n");
        done++;
      }
      if (missing.includes("mongod")) {
        progress(
          Math.round((done / missing.length) * 90),
          "Installing MongoDB via winget…",
        );
        await runStreamed(
          "winget install MongoDB.Server --accept-source-agreements --accept-package-agreements",
        );
        send("dep-install-log", "✅ MongoDB installed\n");
        done++;
      }
      if (missing.includes("git")) {
        progress(
          Math.round((done / missing.length) * 90),
          "Installing Git via winget…",
        );
        await runStreamed(
          "winget install Git.Git --accept-source-agreements --accept-package-agreements",
        );
        send("dep-install-log", "✅ Git installed\n");
        done++;
      }
    } else if (platform === "darwin") {
      const hasBrew = await runStreamed("brew --version")
        .then(() => true)
        .catch(() => false);
      if (!hasBrew) {
        progress(5, "Installing Homebrew (this may take a few minutes)…");
        await runStreamed(
          '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
        );
        send("dep-install-log", "✅ Homebrew installed\n");
      }
      if (missing.includes("node")) {
        progress(
          Math.round((done / missing.length) * 90),
          "Installing Node.js via Homebrew…",
        );
        await runStreamed("brew install node");
        send("dep-install-log", "✅ Node.js installed\n");
        done++;
      }
      if (missing.includes("mongod")) {
        progress(
          Math.round((done / missing.length) * 90),
          "Installing MongoDB via Homebrew…",
        );
        await runStreamed(
          "brew tap mongodb/brew && brew install mongodb-community",
        );
        await runStreamed("brew services start mongodb-community");
        send("dep-install-log", "✅ MongoDB installed & started\n");
        done++;
      }
      if (missing.includes("git")) {
        progress(
          Math.round((done / missing.length) * 90),
          "Installing Git via Homebrew…",
        );
        await runStreamed("brew install git");
        send("dep-install-log", "✅ Git installed\n");
        done++;
      }
    } else {
      // Linux
      progress(5, "Updating apt package list…");
      await runStreamed("sudo apt-get update -y");

      if (missing.includes("node")) {
        progress(
          Math.round((done / missing.length) * 85) + 5,
          "Installing Node.js LTS via NodeSource…",
        );
        await runStreamed(
          "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -",
        );
        await runStreamed("sudo apt-get install -y nodejs");
        send("dep-install-log", "✅ Node.js installed\n");
        done++;
      }
      if (missing.includes("mongod")) {
        progress(
          Math.round((done / missing.length) * 85) + 5,
          "Installing MongoDB…",
        );
        await runStreamed(
          "curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor",
        );
        await runStreamed(
          'echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list',
        );
        await runStreamed(
          "sudo apt-get update -y && sudo apt-get install -y mongodb-org",
        );
        await runStreamed(
          "sudo systemctl enable mongod && sudo systemctl start mongod",
        );
        send("dep-install-log", "✅ MongoDB installed & started\n");
        done++;
      }
      if (missing.includes("git")) {
        progress(
          Math.round((done / missing.length) * 85) + 5,
          "Installing Git…",
        );
        await runStreamed("sudo apt-get install -y git");
        send("dep-install-log", "✅ Git installed\n");
        done++;
      }
    }

    if (missing.includes("pm2")) {
      progress(92, "Installing PM2 globally…");
      await runStreamed("npm install -g pm2");
      send("dep-install-log", "✅ PM2 installed\n");
    }

    progress(100, "All dependencies installed!");
    return { ok: true };
  } catch (e) {
    send("dep-install-log", `\n❌ ${e.message}\n`);
    return { ok: false, error: e.message };
  }
});

ipcMain.handle(
  "do-install",
  async (
    _,
    {
      repoUrl,
      installDir,
      envVars,
      frontendPort,
      backendPort,
      dbType,
      platform,
    },
  ) => {
    try {
      const appDir = path.join(installDir);
      const updaterDir = path.join(installDir, "updater");

      // ── 1. Clone repo ────────────────────────────────────────────────────────
      send("log", `\n${"═".repeat(40)}\n`);
      send("log", `\n🔁 Cloning ${repoUrl}…\n`);
      send("log", `${"═".repeat(40)}\n`);

      if (fs.existsSync(appDir)) {
        send("log", "⚠️  Directory exists — pulling latest instead.\n");
        await run("git pull", { cwd: appDir });
      } else {
        await run(`git clone "${repoUrl}" "${appDir}"`);
      }

      // ── 2. Write .env files ──────────────────────────────────────────────────
      send("log", `\n${"═".repeat(40)}\n`);
      send("log", "\n📝 Writing .env files…\n");
      send("log", `${"═".repeat(40)}\n`);

      const frontendEnv = Object.entries(envVars)
        .filter(([k]) => k.startsWith("REACT_APP_") || k === "PORT_FRONTEND")
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");

      const backendEnvEntries = Object.entries(envVars).filter(
        ([k]) => !k.startsWith("REACT_APP_"),
      );
      const backendEnvFinal =
        `PORT=${backendPort}\nDB_TYPE=${dbType}\n` +
        backendEnvEntries.map(([k, v]) => `${k}=${v}`).join("\n");

      const feDir = path.join(appDir, "frontend");
      const beDir = path.join(appDir, "backend");
      if (fs.existsSync(feDir))
        fs.writeFileSync(path.join(feDir, ".env"), frontendEnv);
      if (fs.existsSync(beDir))
        fs.writeFileSync(path.join(beDir, ".env"), backendEnvFinal);

      send("log", `✅ .env written (DB: ${dbType})\n`);

      // ── 3. npm install ───────────────────────────────────────────────────────
      if (fs.existsSync(feDir)) {
        send("log", `\n${"═".repeat(40)}\n`);
        send("log", "\n📦 Installing frontend dependencies…\n");
        send("log", `${"═".repeat(40)}\n`);
        await run("npm install", { cwd: feDir });
      }
      if (fs.existsSync(beDir)) {
        send("log", `\n${"═".repeat(40)}\n`);
        send("log", "\n📦 Installing backend dependencies…\n");
        send("log", `${"═".repeat(40)}\n`);
        await run("npm install", { cwd: beDir });
      }

      // ── 4. Build frontend ────────────────────────────────────────────────────
      if (fs.existsSync(feDir)) {
        const pkgFe = JSON.parse(
          fs.readFileSync(path.join(feDir, "package.json"), "utf8"),
        );
        if (pkgFe.scripts?.build) {
          send("log", `\n${"═".repeat(40)}\n`);
          send("log", "\n🏗️  Building frontend…\n");
          send("log", `${"═".repeat(40)}\n`);
          await run("npm run build", { cwd: feDir });
        }
      }

      // ── 5. PM2 ecosystem file ────────────────────────────────────────────────
      send("log", `\n${"═".repeat(40)}\n`);
      send("log", "\n⚙️  Configuring PM2…\n");
      send("log", `${"═".repeat(40)}\n`);
      const ecosystem = {
        apps: [],
      };
      if (fs.existsSync(beDir)) {
        ecosystem.apps.push({
          name: "restman-app",
          cwd: beDir,
          script: process.platform === "win32" ? "node" : "node",
          args:
            process.platform === "win32" ? "src/server.js" : "src/server.js",
          env: {
            NODE_ENV: "production",
            PORT: backendPort,
            ...Object.fromEntries(
              Object.entries(envVars).filter(
                ([k]) => !k.startsWith("REACT_APP_"),
              ),
            ),
          },
          watch: false,
          autorestart: true,
          restart_delay: 5000,
        });
      }
      // if (fs.existsSync(feDir)) {
      //   ecosystem.apps.push({
      //     name: "app-frontend",
      //     cwd: feDir,
      //     script: process.platform === "win32" ? "cmd" : "npm",
      //     args: process.platform === "win32" ? "/c npm run dev" : "run dev",
      //     env: {
      //       PORT: frontendPort,
      //       VITE_PORT: frontendPort,
      //       VITE_BACKEND_PORT: backendPort,
      //       ...Object.fromEntries(
      //         Object.entries(envVars).filter(([k]) =>
      //           k.startsWith("REACT_APP_"),
      //         ),
      //       ),
      //     },
      //     watch: false,
      //     autorestart: true,
      //     restart_delay: 5000,
      //   });
      // }

      const ecoPath = path.join(installDir, "ecosystem.config.js");
      fs.writeFileSync(
        ecoPath,
        `module.exports = ${JSON.stringify(ecosystem, null, 2)};`,
      );

      // ── 6. Auto-updater script ───────────────────────────────────────────────
      send("log", `\n${"═".repeat(40)}\n`);
      send("log", "\n🔄 Writing auto-updater…\n");
      send("log", `${"═".repeat(40)}\n`);
      if (!fs.existsSync(updaterDir))
        fs.mkdirSync(updaterDir, { recursive: true });
      const updaterScript = `
const { exec } = require('child_process');
const path = require('path');

const APP_DIR = ${JSON.stringify(appDir)};
const ECO_PATH = ${JSON.stringify(ecoPath)};
const FRONTEND_DIR = path.join(APP_DIR, 'frontend');
const BACKEND_DIR = path.join(APP_DIR, 'backend');

function run(cmd, cwd) {
  return new Promise((res, rej) => {
    exec(cmd, { cwd, maxBuffer: 50 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
      if (err) return rej(err);
      res(stdout);
    });
  });
}

async function checkForUpdates() {
  try {
    await run('git fetch origin', APP_DIR);
    const local = (await run('git rev-parse HEAD', APP_DIR)).trim();
    const remote = (await run('git rev-parse origin/main', APP_DIR)).trim();
    if (local === remote) return console.log('[updater] Up to date:', local.slice(0,7));
    console.log('[updater] New commit detected — updating…');
    await run('git pull origin main', APP_DIR);
    await run('npm install', FRONTEND_DIR);
    await run('npm install', BACKEND_DIR);
    const pkg = JSON.parse(require('fs').readFileSync(require('path').join(FRONTEND_DIR, 'package.json'), 'utf8'));
    if (pkg.scripts?.build) await run('npm run build', FRONTEND_DIR);
    await run('pm2 reload \"' + ECO_PATH + '\" --update-env', APP_DIR);
    console.log('[updater] ✅ Update applied:', remote.slice(0,7));
  } catch (e) {
    console.error('[updater] ❌ Error:', e);
  }
}

async function loop() {
  await checkForUpdates();
  setTimeout(loop, 30 * 60 * 1000); // every 30 minutes
}

loop();
`;
      fs.writeFileSync(path.join(updaterDir, "updater.js"), updaterScript);

      // ── 7. Start PM2 ────────────────────────────────────────────────────────
      send("log", `\n${"═".repeat(40)}\n`);
      send("log", "\n🚀 Starting apps with PM2…\n");
      send("log", `${"═".repeat(40)}\n`);
      const pm2List2 = () =>
        new Promise((resolve, reject) => {
          exec(
            "pm2 jlist",
            {
              maxBuffer: 50 * 1024 * 1024,
              windowsHide: true,
              env: getCommandEnv(),
            },
            (err, stdout) => {
              if (err) return reject(err);
              resolve(JSON.parse(stdout));
            },
          );
        });
      const procs2 = await pm2List2();
      const runningNames = procs2.map((p) => p.name);
      const appsToStart = ecosystem.apps.filter(
        (a) => !runningNames.includes(a.name),
      );
      const appsToRestart = ecosystem.apps.filter((a) =>
        runningNames.includes(a.name),
      );

      for (const a of appsToRestart) await run(`pm2 restart ${a.name}`);
      if (appsToStart.length > 0) await run(`pm2 start "${ecoPath}"`);

      const updaterPath = path.join(updaterDir, "updater.js");
      const pm2List = () =>
        new Promise((resolve, reject) => {
          exec(
            "pm2 jlist",
            {
              maxBuffer: 50 * 1024 * 1024,
              windowsHide: true,
              env: getCommandEnv(),
            },
            (err, stdout) => {
              if (err) return reject(err);
              resolve(JSON.parse(stdout));
            },
          );
        });
      const procs = await pm2List();
      const updaterRunning = procs.some((p) => p.name === "app-updater");
      if (updaterRunning) {
        await run(`pm2 restart app-updater`);
      } else {
        await run(`pm2 start "${updaterPath}" --name app-updater`);
      }

      // ── 8. PM2 startup (survive reboots) ─────────────────────────────────────
      send("log", `\n${"═".repeat(40)}\n`);
      send("log", "\n🔒 Registering PM2 startup hook…\n");
      send("log", `${"═".repeat(40)}\n`);
      try {
        if (platform === "win32") {
          // Use Task Scheduler for Windows auto-start
          const pm2Path = (await run("where.exe pm2"))
            .split(/\r?\n/)
            .map((p) => p.trim())
            .find((p) => p.endsWith(".cmd") || p.endsWith(".exe"));

          await run("pm2 save");

          try {
            await run("where.exe nssm");

            send("log", "🔧 Installing RestMan as Windows service...\n");

            await run(`nssm install RestManPM2 "${pm2Path}" resurrect`);
            await run(`nssm set RestManPM2 Start SERVICE_AUTO_START`);
            await run(`nssm start RestManPM2`);

            send("log", "✅ Windows service installed via NSSM\n");
          } catch {
            send("log", "⚠️ NSSM not found, falling back to Task Scheduler\n");

            const taskCmd =
              `schtasks /create /tn "RestMan-PM2" ` +
              `/tr "cmd /c \\"\\"${pm2Path}\\" resurrect\\"" ` +
              `/sc onlogon /rl highest /ru "%USERNAME%" /f`;

            await run(taskCmd);
          }
        } else if (platform === "darwin") {
          // Prefer LaunchAgent on macOS to avoid interactive sudo requirements.
          const uid = (await run("id -u")).trim();
          const pm2Path = (await run("command -v pm2"))
            .trim()
            .split(/\r?\n/)[0];
          const launchAgentsDir = path.join(
            os.homedir(),
            "Library",
            "LaunchAgents",
          );
          const launchAgentLabel = "com.restman.pm2";
          const launchAgentPath = path.join(
            launchAgentsDir,
            `${launchAgentLabel}.plist`,
          );
          const launchPath = getCommandEnv().PATH || process.env.PATH || "";

          if (!fs.existsSync(launchAgentsDir)) {
            fs.mkdirSync(launchAgentsDir, { recursive: true });
          }

          const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${launchAgentLabel}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${pm2Path}</string>
    <string>resurrect</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${launchPath}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
`;

          fs.writeFileSync(launchAgentPath, plist);

          await run("pm2 save");

          try {
            await run(`launchctl bootout gui/${uid} "${launchAgentPath}"`);
          } catch {
            // Ignore when not loaded yet.
          }
          await run(`launchctl bootstrap gui/${uid} "${launchAgentPath}"`);
          await run(`launchctl enable gui/${uid}/${launchAgentLabel}`);

          send("log", "✅ macOS autorun configured via LaunchAgent\n");
          send("log", `ℹ️  LaunchAgent: ${launchAgentPath}\n`);
          send(
            "log",
            "ℹ️  App will auto-start at login using `pm2 resurrect` (no sudo prompt needed).\n",
          );
        } else {
          const startupOut = await run("pm2 startup");
          const match = startupOut.match(/sudo\s+.+/);
          if (match) {
            send("log", `⚠️  Run this to finalize startup:\n${match[0]}\n`);
          }

          await run("pm2 save");
        }
      } catch (e) {
        send("log", `⚠️  Startup hook skipped: ${e.message}\n`);
      }

      // ── 9. Write install manifest ─────────────────────────────────────────────
      fs.writeFileSync(
        path.join(installDir, "install.json"),
        JSON.stringify(
          {
            repoUrl,
            installDir,
            frontendPort,
            backendPort,
            installedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      );

      send("log", `\n${"═".repeat(40)}\n`);
      send("log", "\n✅ Installation complete!\n");
      send("log", `${"═".repeat(40)}\n`);
      return { ok: true };
    } catch (e) {
      send("log", `\n❌ Error: ${e.message}\n`);
      return { ok: false, error: e.message };
    }
  },
);

ipcMain.handle("open-browser", (_, url) => shell.openExternal(url));
ipcMain.on("quit-app", () => app.quit());
ipcMain.on("minimize-app", () => mainWindow.minimize());
