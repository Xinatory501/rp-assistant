import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';

interface HotkeyRecorderProps {
  value: string;
  onChange: (key: string) => void;
  placeholder?: string;
  className?: string;
}

export default function HotkeyRecorder({
  value,
  onChange,
  placeholder = 'Нажмите клавишу...',
  className = '',
}: HotkeyRecorderProps) {
  const [recording, setRecording] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Don't record modifier-only presses as the final key
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return;
      }

      // If user pressed Escape while recording, cancel or clear
      if (e.key === 'Escape') {
        setRecording(false);
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');

      let mainKey = e.key;

      // Clean up key names
      if (e.code.startsWith('Numpad')) {
        mainKey = 'Num ' + e.code.replace('Numpad', '');
      } else if (e.code.startsWith('Key')) {
        mainKey = e.code.replace('Key', '').toUpperCase();
      } else if (e.code.startsWith('Digit')) {
        mainKey = e.code.replace('Digit', '');
      } else if (e.key === ' ') {
        mainKey = 'Space';
      }

      parts.push(mainKey);
      const combo = parts.join('+');

      onChange(combo);
      setRecording(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setRecording(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [recording, onChange]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setRecording(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
          recording
            ? 'bg-purple-600/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/30 animate-pulse'
            : value
            ? 'bg-zinc-800 text-zinc-200 border-white/10 hover:border-white/25 hover:bg-zinc-750'
            : 'bg-zinc-900 text-zinc-500 border-dashed border-white/15 hover:border-white/30'
        }`}
      >
        <Keyboard size={13} className={recording ? 'text-purple-400' : 'text-zinc-500'} />
        <span>{recording ? 'Нажмите комбинацию...' : value || placeholder}</span>
      </button>

      {value && !recording && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
          }}
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-zinc-300 flex items-center justify-center text-[9px]"
          title="Сбросить"
        >
          <X size={8} />
        </button>
      )}
    </div>
  );
}
