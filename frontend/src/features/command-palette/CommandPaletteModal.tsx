import React, { useState, useEffect, useRef } from 'react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNav: (tabId: string) => void;
  onInjectAnomaly: () => void;
  onRefreshAi: () => void;
  onToggleTheme: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectNav,
  onInjectAnomaly,
  onRefreshAi,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState<string>('');
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      setQuery('');
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items = [
    { type: 'nav', id: 'dashboard', label: 'Jump to Dashboard', icon: 'fa-gauge-high' },
    { type: 'nav', id: 'twin', label: 'Jump to Digital Twin', icon: 'fa-diagram-project' },
    { type: 'nav', id: 'ai', label: 'Jump to AI Command Center', icon: 'fa-wand-magic-sparkles' },
    { type: 'nav', id: 'analytics', label: 'Jump to Telemetry Trends', icon: 'fa-chart-line' },
    { type: 'nav', id: 'alerts', label: 'Jump to Alerts', icon: 'fa-triangle-exclamation' },
    { type: 'nav', id: 'reports', label: 'Jump to Incident Reports', icon: 'fa-file-contract' },
    { type: 'action', id: 'inject', label: 'Inject Simulated Anomaly', icon: 'fa-bolt text-warning', fn: onInjectAnomaly },
    { type: 'action', id: 'ai-refresh', label: 'Run Grok AI Analysis', icon: 'fa-robot text-accent', fn: onRefreshAi },
    { type: 'action', id: 'theme', label: 'Toggle Dark/Light Theme', icon: 'fa-moon', fn: onToggleTheme },
  ];

  const filtered = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <dialog ref={dialogRef} className="cmd-dialog" onClick={(e) => e.target === dialogRef.current && onClose()}>
      <div className="cmd-dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-header">
          <i className="fa-solid fa-magnifying-glass cmd-icon"></i>
          <input
            type="text"
            className="cmd-input"
            placeholder="Type a command or view name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="cmd-esc-kbd" onClick={onClose}>ESC</kbd>
        </div>
        <div className="cmd-results">
          <div className="cmd-group-title">COMMAND ACTIONS</div>
          {filtered.map((item) => (
            <div
              className="cmd-item"
              key={item.id}
              onClick={() => {
                if (item.type === 'nav') onSelectNav(item.id);
                else item.fn?.();
                onClose();
              }}
            >
              <i className={`fa-solid ${item.icon}`}></i> {item.label}
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
};
