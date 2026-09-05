import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Share2, Users } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const classroomPin = '849-210';
  const shareUrl = window.location.href;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="qr-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="qr-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400">
            <QrCode className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Student Screen Share
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Students can scan with their tablet or smartphone camera to view and collaborate on this board in real time.
        </p>

        {/* QR Code Graphic (SVG generated clean QR) */}
        <div className="mx-auto p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm mb-4">
          <svg
            className="w-44 h-44 mx-auto"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Corner Squares */}
            <rect x="5" y="5" width="26" height="26" rx="4" fill="#0f172a" />
            <rect x="9" y="9" width="18" height="18" rx="2" fill="white" />
            <rect x="13" y="13" width="10" height="10" rx="1" fill="#0284c7" />

            <rect x="69" y="5" width="26" height="26" rx="4" fill="#0f172a" />
            <rect x="73" y="9" width="18" height="18" rx="2" fill="white" />
            <rect x="77" y="13" width="10" height="10" rx="1" fill="#0284c7" />

            <rect x="5" y="69" width="26" height="26" rx="4" fill="#0f172a" />
            <rect x="9" y="73" width="18" height="18" rx="2" fill="white" />
            <rect x="13" y="77" width="10" height="10" rx="1" fill="#0284c7" />

            {/* Pattern Dots */}
            <rect x="37" y="7" width="6" height="6" fill="#0f172a" rx="1" />
            <rect x="47" y="15" width="8" height="6" fill="#0f172a" rx="1" />
            <rect x="57" y="9" width="6" height="6" fill="#0284c7" rx="1" />

            <rect x="37" y="37" width="26" height="26" rx="3" fill="#0f172a" />
            <rect x="41" y="41" width="18" height="18" rx="1" fill="white" />
            <rect x="45" y="45" width="10" height="10" fill="#0284c7" />

            <rect x="7" y="37" width="6" height="6" fill="#0f172a" rx="1" />
            <rect x="17" y="47" width="6" height="12" fill="#0f172a" rx="1" />
            <rect x="25" y="39" width="6" height="6" fill="#0284c7" rx="1" />

            <rect x="69" y="37" width="10" height="6" fill="#0f172a" rx="1" />
            <rect x="83" y="45" width="12" height="6" fill="#0284c7" rx="1" />
            <rect x="73" y="55" width="8" height="8" fill="#0f172a" rx="1" />

            <rect x="37" y="69" width="6" height="12" fill="#0284c7" rx="1" />
            <rect x="47" y="77" width="16" height="6" fill="#0f172a" rx="1" />
            <rect x="69" y="69" width="12" height="6" fill="#0f172a" rx="1" />
            <rect x="85" y="77" width="10" height="10" fill="#0284c7" rx="1" />
          </svg>
        </div>

        {/* Classroom PIN Code */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 mb-4">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block mb-1">
            Classroom Quick PIN
          </span>
          <span className="text-2xl font-mono font-bold text-sky-600 dark:text-sky-400 tracking-widest">
            {classroomPin}
          </span>
        </div>

        {/* Copy Link */}
        <button
          id="copy-classroom-link-btn"
          type="button"
          onClick={handleCopy}
          className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-md transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Board Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
