// src/main.jsx
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import DownloadPage from "./DownloadPage.jsx";
import SmoothScroll from "./components/SmoothScroll.jsx";

// ── Theme context must wrap the router so both pages share state ──
// Import the ThemeProvider wrapper you create from App.jsx exports
// (see App.jsx refactor notes in the guide below)
import { AppThemeProvider } from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <AppThemeProvider>
    <SmoothScroll>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/download" element={<DownloadPage />} />
        </Routes>
      </BrowserRouter>
    </SmoothScroll>
  </AppThemeProvider>,
);
