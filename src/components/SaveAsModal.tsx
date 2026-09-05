import React, { useState } from 'react';
import { X, Download, FileImage, FileCode, Printer, FileText } from 'lucide-react';

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPNG: (filename: string) => void;
  onExportJSON: (filename: string) => void;
  onPrintPDF: () => void;
}

export const SaveAsModal: React.FC<SaveAsModalProps> = ({
  isOpen,
  onClose,
  onExportPNG,
  onExportJSON,
  onPrintPDF,
}) => {
  const [filename, setFilename] = useState('classroom-board-lesson');
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'json' | 'pdf'>('png');

  if (!isOpen) return null;

  const handleExport = () => {
    const cleanName = filename.trim() || 'whiteboard-notes';
    if (selectedFormat === 'png') {
      onExportPNG(`${cleanName}.png`);
    } else if (selectedFormat === 'json') {
      onExportJSON(`${cleanName}.kdw`);
    } else if (selectedFormat === 'pdf') {
      onPrintPDF();
    }
    onClose();
  };

  return (
    <div
      id="save-as-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="save-as-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400">
            <Download className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Save Canvas As...
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

        {/* Filename Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            File Name
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Format Selection Cards */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Select Export Format
          </label>

          <div
            onClick={() => setSelectedFormat('png')}
            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center space-x-3 transition-all ${
              selectedFormat === 'png'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400">
              <FileImage className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">PNG Image (.png)</span>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">High Res</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Standard image for slide decks, homework posts, and documents.
              </p>
            </div>
          </div>

          <div
            onClick={() => setSelectedFormat('json')}
            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center space-x-3 transition-all ${
              selectedFormat === 'json'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">Know Deep Project (.kdw)</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Editable</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Vector stroke data you can reopen and continue editing anytime.
              </p>
            </div>
          </div>

          <div
            onClick={() => setSelectedFormat('pdf')}
            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center space-x-3 transition-all ${
              selectedFormat === 'pdf'
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-white'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <Printer className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">Printable Classroom PDF</span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Handout</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Print directly or save as PDF document for student binders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            id="save-as-export-btn"
            type="button"
            onClick={handleExport}
            className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md transition-colors"
          >
            Save File
          </button>
        </div>
      </div>
    </div>
  );
};
