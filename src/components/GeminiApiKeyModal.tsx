import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Save, Info } from 'lucide-react';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Check for existing key in localStorage
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      id="gemini-api-key-modal-overlay"
      className="fixed inset-0 z-55 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="gemini-api-key-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-8 animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Gemini AI Integration
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                To power AI features like <span className="font-bold text-indigo-600 dark:text-indigo-400">Circle to Search</span>, <span className="font-bold text-indigo-600 dark:text-indigo-400">Handwriting Refinement</span>, and <span className="font-bold text-indigo-600 dark:text-indigo-400">Voice Summary</span>, please provide your Gemini API key.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-1">
              Google AI API Key
            </label>
            <div className="relative group">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key here..."
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 pr-12 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center space-x-1 transition-colors"
              >
                <span>Get API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-slate-400 font-medium italic">
                Key is stored locally in your browser
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className={`w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center space-x-3 transition-all shadow-xl ${
              isSaved
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed'
            }`}
          >
            {isSaved ? (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Configuration Saved</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save API Key</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-center mt-4">
            Professional AI Engineering Verified Integration
          </p>
        </div>
      </div>
    </div>
  );
};
