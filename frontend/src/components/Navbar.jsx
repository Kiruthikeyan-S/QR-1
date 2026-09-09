import React, { useState } from 'react';
import { Menu, X, QrCode, Image as ImageIcon, FileText, Plus, Check } from 'lucide-react';

export const Navbar = ({ currentView, onChangeView, onOpenGenerator }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'scanner',
      label: 'QR Code Scanner',
      desc: 'Scan images & webcam feed',
      icon: QrCode,
    },
    {
      id: 'image-gen',
      label: 'Product Image Studio',
      desc: 'Generate studio product renders',
      icon: ImageIcon,
    },
    {
      id: 'text-gen',
      label: 'Text Studio & Grammar',
      desc: 'Fix grammar, rewrite tone & copy',
      icon: FileText,
    },
  ];

  const handleSelectView = (viewId) => {
    onChangeView(viewId);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="w-full border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Menu Bar Hamburger Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-2"
              title="Open Navigation Menu"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 hidden sm:inline">
                Menu
              </span>
            </button>

            {/* Current View Indicator Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
              {currentView === 'scanner' && <QrCode className="w-3.5 h-3.5 text-emerald-600" />}
              {currentView === 'image-gen' && <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />}
              {currentView === 'text-gen' && <FileText className="w-3.5 h-3.5 text-emerald-600" />}
              <span>
                {currentView === 'scanner'
                  ? 'QR Scanner'
                  : currentView === 'image-gen'
                  ? 'Product Studio'
                  : 'Text Studio'}
              </span>
            </div>
          </div>

          {/* Center Tabs (visible when on Scanner mode) */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action: Create Button */}
          <div>
            <button
              onClick={onOpenGenerator}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create QR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-start bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm h-full bg-white border-r border-slate-200 shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Application Menu</h3>
                  <p className="text-[11px] text-slate-500">Select a tool to get started</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectView(item.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-start justify-between group ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl border ${
                          isSelected
                            ? 'bg-white border-emerald-200 text-emerald-600'
                            : 'bg-white border-slate-200 text-slate-600 group-hover:text-emerald-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            isSelected ? 'text-emerald-900' : 'text-slate-800'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-600 mt-1" />}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  onOpenGenerator();
                  setIsMenuOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New QR Code</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
