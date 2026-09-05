import React, { useState } from 'react';
import { X, Sliders, ShieldCheck, Check, Palette, Touchpad, Server, Cpu, Sparkles } from 'lucide-react';
import { WhiteboardSettings, WhiteboardBackground } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: WhiteboardSettings;
  onUpdateSettings: (newSettings: Partial<WhiteboardSettings>) => void;
  onClose: () => void;
}

const BACKGROUND_OPTIONS: { id: WhiteboardBackground; label: string; previewClass: string; desc: string }[] = [
  {
    id: 'white',
    label: 'Pure White',
    previewClass: 'bg-white border-slate-300',
    desc: 'Clean, high-contrast digital board',
  },
  {
    id: 'beige',
    label: 'Soft Beige',
    previewClass: 'bg-[#f7f5eb] border-[#e1ded1]',
    desc: 'Comfortable, warm off-white canvas',
  },
  {
    id: 'mint',
    label: 'Light Mint',
    previewClass: 'bg-[#f0f9f4] border-[#d1e8db]',
    desc: 'Refreshing soft pastel mint',
  },
  {
    id: 'yellow',
    label: 'Pale Yellow',
    previewClass: 'bg-[#fdfcf0] border-[#ebe7c9]',
    desc: 'Soothing classic cream yellow',
  },
  {
    id: 'chalkboard',
    label: 'Chalkboard Green',
    previewClass: 'bg-[#1b4332] border-[#2d6a4f]',
    desc: 'Classic tactile emerald school board',
  },
  {
    id: 'black',
    label: 'Deep Black',
    previewClass: 'bg-[#0f172a] border-slate-700',
    desc: 'OLED dark mode for low-light classrooms',
  },
  {
    id: 'grid',
    label: 'Math Grid',
    previewClass: 'bg-white border-sky-300 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:8px_8px]',
    desc: 'Coordinate & geometry graph paper',
  },
  {
    id: 'ruled',
    label: 'Ruled Lines',
    previewClass: 'bg-white border-blue-200 [background-image:linear-gradient(#e2e8f0_1px,transparent_1px)] [background-size:100%_8px]',
    desc: 'Notebook handwriting practice lines',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'touch' | 'background'>('touch');

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="settings-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Whiteboard Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure touch interaction and canvas styles
              </p>
            </div>
          </div>
          <button
            id="settings-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50/60 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab('touch')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'touch'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Touchpad className="w-4 h-4" />
            <span>Touch Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('background')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'background'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Backgrounds</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          {/* TAB 1: TOUCH SETTINGS */}
          {activeTab === 'touch' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Interactive Touch &amp; Multi-User Mode
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optimized for interactive classroom flat-panels (IFPs) like Samsung WAF series, SMART Boards, and Promethean.
                </p>
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => onUpdateSettings({ multiTouchEnabled: true })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                    settings.multiTouchEnabled
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Multi-User Touch (Up to 20 Touch Points)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold">
                        Recommended for Classrooms
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Enables up to 20 simultaneous finger/stylus inputs so multiple students can solve equations or draw side-by-side.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                      settings.multiTouchEnabled
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-slate-400'
                    }`}
                  >
                    {settings.multiTouchEnabled && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div
                  onClick={() => onUpdateSettings({ multiTouchEnabled: false })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                    !settings.multiTouchEnabled
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Single-Finger Pan &amp; Strict Palm Rejection
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Treats primary touch as pen and second touch as viewport pan/zoom. Ideal for individual tablet or desktop use.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                      !settings.multiTouchEnabled
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-slate-400'
                    }`}
                  >
                    {!settings.multiTouchEnabled && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKGROUNDS */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Canvas Background Presets
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch the writing backdrop to suit the pedagogical subject (Math, Science, English, or Classical Chalkboard).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BACKGROUND_OPTIONS.map((bg) => (
                  <div
                    key={bg.id}
                    onClick={() => onUpdateSettings({ background: bg.id })}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center space-x-3 ${
                      settings.background === bg.id
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg border-2 shadow-inner shrink-0 ${bg.previewClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {bg.label}
                        </span>
                        {settings.background === bg.id && (
                          <Check className="w-4 h-4 text-sky-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {bg.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex justify-end">
          <button
            id="settings-done-button"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
