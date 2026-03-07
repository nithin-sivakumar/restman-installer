# App Installer — Developer Guide

A cross-platform GUI installer (Electron) for your React + Node/Express app.  
Targets: **Windows**, **macOS**, **Linux**.

---

## What it does

| Feature | Details |
|---|---|
| **Dependency check** | Detects Node.js, npm, MongoDB, Git, PM2 |
| **Auto-install deps** | Uses winget (Win), Homebrew (macOS), apt (Linux) |
| **Repo clone** | `git clone` your public GitHub repo |
| **Env config** | User fills in all `.env` vars via GUI |
| **Port config** | User picks frontend + backend ports |
| **Persistent** | PM2 starts app on boot via `pm2 startup` |
| **Auto-update** | Polls GitHub every 5 min, pulls + restarts on new commit |

---

## Project structure

```
installer/
├── main.js          ← Electron main process (all shell logic)
├── index.html       ← Renderer (full GUI, vanilla JS)
├── package.json     ← Build config (electron-builder)
├── assets/
│   ├── icon.png     ← 512×512 PNG  (Linux + fallback)
│   ├── icon.icns    ← macOS icon
│   └── icon.ico     ← Windows icon
└── dist/            ← Built installers go here
```

---

## Quick start (development)

```bash
# 1. Install dependencies
npm install

# 2. Run in dev mode
npm start
```

---

## Building distributables

```bash
# macOS (.dmg — universal: Intel + Apple Silicon)
npm run dist:mac

# Windows (.exe NSIS installer)
npm run dist:win

# Linux (.AppImage + .deb)
npm run dist:linux

# All three at once (requires macOS or Docker)
npm run dist:all
```

Outputs go to `dist/`.

---

## Customising the default env vars

Open `index.html` and find this block near the bottom of the `<script>`:

```js
['MONGO_URI', 'JWT_SECRET', 'NODE_ENV'].forEach((k, i) => {
  addEnvRow(k, ['mongodb://localhost:27017/myapp', 'changeme_secret', 'production'][i]);
});
addEnvRow('REACT_APP_API_URL', 'http://localhost:5000');
```

Replace/add rows to match your app's actual `.env` variables.  
The user can still edit them in the GUI — these are just pre-filled defaults.

---

## Changing the auto-update interval

In `main.js`, find the updater script template (search `setInterval`) and change `5 * 60 * 1000` to your desired interval in milliseconds.

---

## How auto-updates work

1. The installer creates `<install-dir>/updater/updater.js`
2. PM2 runs it as a process called `app-updater`
3. Every 5 minutes it runs `git fetch` and compares `HEAD` to `origin/main`
4. If there's a new commit: `git pull` → `npm install` → rebuild frontend → `pm2 reload`

**To push an update:** just `git push` to your `main` branch. All installed copies will update within 5 minutes.

---

## Assets required before building

You need icons in `assets/`:

- `icon.png` — 512×512 PNG (required for Linux; also used as fallback)
- `icon.icns` — macOS icon (can convert from PNG using `iconutil`)
- `icon.ico` — Windows icon (can convert from PNG using ImageMagick or an online tool)

**Quick macOS icon generation:**
```bash
mkdir icon.iconset
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset -o assets/icon.icns
```

**Quick Windows icon (requires ImageMagick):**
```bash
convert assets/icon.png -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico
```

---

## PM2 reference (post-install)

| Command | Action |
|---|---|
| `pm2 list` | Show all processes |
| `pm2 logs app-backend` | Stream backend logs |
| `pm2 logs app-frontend` | Stream frontend logs |
| `pm2 logs app-updater` | Stream updater logs |
| `pm2 restart all` | Restart everything |
| `pm2 stop all` | Stop everything |
| `pm2 monit` | Live dashboard |

---

## Troubleshooting

**PM2 startup doesn't persist after reboot (Linux/macOS)**  
The installer prints a `sudo` command in the log window. Run it manually once in your terminal:
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

**App won't start — port conflict**  
Run `pm2 list` to see if processes are running. Check your chosen ports aren't in use with `lsof -i :3000`.

**MongoDB not connecting**  
Ensure mongod is running: `sudo systemctl start mongod` (Linux) or `brew services start mongodb-community` (macOS).
