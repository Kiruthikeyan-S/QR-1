import React from 'react';
import { Plus } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenGenerator }) => {
  return (
    <header className="w-full border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Scanner Mode Switcher (Left Side) */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload Image
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'camera'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Camera
          </button>
        </div>

        {/* Right Action: Create Button */}
        <div>
          <button
            onClick={onOpenGenerator}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </div>
      </div>
    </header>
  );
};
