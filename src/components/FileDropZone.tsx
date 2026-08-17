import React, { useState, useEffect } from 'react';
import { FileUp, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { parseAhkScript } from '../lib/ahkParser';

export default function FileDropZone({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [importNotification, setImportNotification] = useState<{ title: string; count: number } | null>(null);

  const { addProfile, setActiveProfile, addBind, importConfig, saveCurrentAsConfig } = useAppStore();

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter = 0;

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        const ok = importConfig(text);
        if (ok) {
          setImportNotification({ title: `Конфиг «${file.name}»`, count: 1 });
          setTimeout(() => setImportNotification(null), 3000);
        }
      } else {
        // Parse .ahk / .txt
        const parsed = parseAhkScript(text, file.name);
        
        // 1. Create Profile
        const profId = 'prof-ahk-' + Math.random().toString(36).slice(2, 7);
        addProfile({
          name: parsed.profileName,
          server: parsed.server,
          org: parsed.org,
          dept: parsed.dept,
          rank: parsed.rank,
          callsign: 'Сокол-1',
          post: 'Мост г. Южный',
        });

        // 2. Add Binds
        parsed.binds.forEach(b => addBind(b));

        // 3. Save as Config
        saveCurrentAsConfig(`Импорт: ${parsed.title}`, `Импортировано из ${file.name} (${parsed.binds.length} биндов)`);

        setImportNotification({ title: parsed.title, count: parsed.binds.length });
        setTimeout(() => setImportNotification(null), 3500);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {children}

      {/* Global Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-500 rounded-2xl animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mb-4 animate-bounce">
            <FileUp size={32} className="text-purple-400" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            Отпустите .ahk или .json файл
          </h3>
          <p className="text-zinc-400 text-xs max-w-xs text-center leading-relaxed">
            Система автоматически извлечёт профиль персонажа, все горячие клавиши, задержки и создаст готовый бинд-пак!
          </p>
        </div>
      )}

      {/* Success Notification Banner */}
      {importNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#181924] border border-purple-500/40 shadow-2xl flex items-center gap-2.5 text-xs text-white animate-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Check size={14} />
          </div>
          <div>
            <p className="font-semibold text-zinc-100">Файл успешно импортирован!</p>
            <p className="text-zinc-400 text-[11px]">
              {importNotification.title} · Импортировано биндов: <b>{importNotification.count}</b>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
