import React from 'react';
import { X, Trash2, History, ArrowUpRight, FileJson, Clock, QrCode } from 'lucide-react';

export const ScanHistory = ({ isOpen, onClose, history, onSelectHistoryItem, onClearHistory }) => {
  if (!isOpen) return null;

  const exportAllHistory = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr_scan_history_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scan History</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{history.length} scans saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        {history.length > 0 && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={exportAllHistory}
              className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
            >
              <FileJson className="w-3 h-3" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <QrCode className="w-10 h-10 stroke-[1.2] opacity-40" />
              <p className="text-xs">No scan history recorded yet</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={item.timestamp || idx}
                onClick={() => {
                  onSelectHistoryItem(item.result);
                  onClose();
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.result.title}
                    </span>
                    <span className="px-1 py-0.2 rounded text-[9px] uppercase font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                      {item.result.data_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.result.summary}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="p-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
