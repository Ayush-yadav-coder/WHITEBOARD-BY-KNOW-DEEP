import React, { useState } from 'react';
import { X, Globe, Copy, Check, Share2, Link2, Monitor, Users } from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="share-link-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="share-link-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-8 animate-in fade-in zoom-in-95 duration-300 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3 text-cyan-600 dark:text-cyan-400">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Shareable Whiteboard Link
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

        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
              <Monitor className="w-8 h-8" />
            </div>
            <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="p-3 rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-500/30">
              <Share2 className="w-8 h-8" />
            </div>
            <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
              <Users className="w-8 h-8" />
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium px-4">
            Anyone with this link can view the entire whiteboard session, including all pages and live updates in real time.
          </p>
        </div>

        <div className="relative mb-6">
          <div className="flex items-center w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 pr-14 overflow-hidden">
            <Link2 className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-300 truncate select-all">
              {shareUrl}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={`absolute right-2 top-2 bottom-2 px-3 rounded-xl flex items-center justify-center transition-all ${
              copied 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm border border-slate-200 dark:border-slate-600'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            id="copy-share-link-full-btn"
            type="button"
            onClick={handleCopy}
            className="w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl text-sm font-black flex items-center justify-center space-x-3 shadow-[0_10px_20px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>Link Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy Shareable Link</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
            Professional AI Engineering Verified
          </p>
        </div>
      </div>
    </div>
  );
};
