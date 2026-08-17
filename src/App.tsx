import React, { useEffect, useState } from "react";
import { useAppStore } from "./store";
import Welcome from "./pages/Welcome";
import Main from "./pages/Main";
import Landing from "./pages/Landing";
import AdminPage from "./pages/Admin";
import FileDropZone from "./components/FileDropZone";

export default function App() {
  const { settings, loadFromStore } = useAppStore();
  const [loaded, setLoaded] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return (
      window.location.hash === '#admin' ||
      window.location.pathname === '/admin' ||
      window.location.pathname.includes('/admin') ||
      window.location.search.includes('admin')
    );
  });

  const isElectron = Boolean((window as any).electronAPI);

  useEffect(() => {
    const checkRoute = () => {
      setIsAdminRoute(
        window.location.hash === '#admin' ||
        window.location.pathname === '/admin' ||
        window.location.pathname.includes('/admin') ||
        window.location.search.includes('admin')
      );
    };

    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);

    // Global shortcut Ctrl+Shift+A to open Admin panel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')) {
        e.preventDefault();
        window.location.hash = '#admin';
        setIsAdminRoute(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('keydown', handleKeyDown);
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

  // Admin Route -> Render Admin Panel (Accessible via #admin, /admin, or Ctrl+Shift+A)
  if (isAdminRoute) {
    return (
      <AdminPage
        onBack={() => {
          window.location.hash = '';
          setIsAdminRoute(false);
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
