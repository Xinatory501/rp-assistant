import React, { useEffect, useState } from "react";
import { useAppStore } from "./store";
import Welcome from "./pages/Welcome";
import Main from "./pages/Main";
import Landing from "./pages/Landing";
import AdminPage from "./pages/Admin";
import FileDropZone from "./components/FileDropZone";

// Non-trivial secret route checker (disguised as telemetry/system status)
function isSecretRoute(): boolean {
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  const path = window.location.pathname.toLowerCase();

  return (
    hash === '#telemetry' ||
    hash === '#status' ||
    hash === '#core' ||
    hash === '#node' ||
    hash === '#admin' ||
    path.includes('/telemetry') ||
    path.includes('/status') ||
    search.includes('telemetry') ||
    search.includes('sys=core')
  );
}

export default function App() {
  const { settings, loadFromStore } = useAppStore();
  const [loaded, setLoaded] = useState(false);
  const [isSecretView, setIsSecretView] = useState(() => isSecretRoute());

  const isElectron = Boolean((window as any).electronAPI);

  useEffect(() => {
    const checkRoute = () => {
      setIsSecretView(isSecretRoute());
    };

    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);

    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  useEffect(() => {
    if (isElectron) {
      document.body.classList.add('electron-mode');
    } else {
      document.body.classList.remove('electron-mode');
    }
    loadFromStore().finally(() => setLoaded(true));
  }, [isElectron]);

  // Apply accent color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", settings.accentColor);
  }, [settings.accentColor]);

  if (!loaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#171615] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d97757]/30 border-t-[#d97757] rounded-full animate-spin" />
          <span className="text-xs text-[#8e8579] font-mono tracking-wider">ЗАГРУЗКА RP ASSISTANT...</span>
        </div>
      </div>
    );
  }

  // Disguised Secret Route (Renders Vercel 404 disguise with triple-click unlock)
  if (isSecretView) {
    return (
      <AdminPage
        onBack={() => {
          window.location.hash = '';
          setIsSecretView(false);
        }}
      />
    );
  }

  // If running inside Electron desktop app, render pure overlay window
  if (isElectron) {
    return (
      <FileDropZone>
        {settings.firstRun ? <Welcome /> : <Main />}
      </FileDropZone>
    );
  }

  // Web Browser Experience -> Clean Landing Page
  return (
    <Landing
      onOpenApp={() => {
        const el = document.getElementById("pricing");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }}
    />
  );
}
