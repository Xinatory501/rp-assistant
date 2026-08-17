import React, { useEffect, useState } from "react";
import { useAppStore } from "./store";
import Welcome from "./pages/Welcome";
import Main from "./pages/Main";
import Landing from "./pages/Landing";
import AdminPanel from "./pages/AdminPanel";
import FileDropZone from "./components/FileDropZone";

export default function App() {
  const { settings, loadFromStore } = useAppStore();
  const [loaded, setLoaded] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return (
      window.location.hash === '#admin' ||
      window.location.pathname.includes('/admin') ||
      window.location.search.includes('admin')
    );
  });

  const isElectron = Boolean((window as any).electronAPI);

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminRoute(
        window.location.hash === '#admin' ||
        window.location.pathname.includes('/admin') ||
        window.location.search.includes('admin')
      );
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
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
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-mono tracking-wider">ЗАГРУЗКА RP ASSISTANT...</span>
        </div>
      </div>
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

  // Web Admin Panel Route (e.g. amzrp.vercel.app/#admin or amzrp.vercel.app/?admin)
  if (isAdminRoute) {
    return (
      <AdminPanel
        onBackToSite={() => {
          window.location.hash = '';
          setIsAdminRoute(false);
        }}
      />
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

