import React from 'react';
import { Plus, Trash2, Copy, X, FileText, Check } from 'lucide-react';
import { CanvasPage } from '../types';

interface PageThumbnailDrawerProps {
  isOpen: boolean;
  pages: CanvasPage[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onClose: () => void;
}

export const PageThumbnailDrawer: React.FC<PageThumbnailDrawerProps> = ({
  isOpen,
  pages,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="samsung-page-thumbnail-drawer"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-4xl bg-slate-900/95 border-2 border-cyan-500/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-4 flex flex-col select-none animate-in fade-in slide-in-from-bottom-6 duration-200 pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">
              Page Manager &amp; Thumbnails
            </h3>
            <span className="text-[10px] text-slate-400">
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} in current lesson session
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onAddPage}
            className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
            title="Add Blank Whiteboard Page"
          >
            <Plus className="w-4 h-4" />
            <span>New Page</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pages Carousel */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {pages.map((p, idx) => {
          const isActive = idx === currentPageIndex;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPage(idx)}
              className={`relative shrink-0 w-44 h-32 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between p-2.5 overflow-hidden ${
                isActive
                  ? 'border-cyan-400 bg-slate-800 shadow-[0_0_20px_rgba(34,211,238,0.35)] scale-102'
                  : 'border-slate-700/80 bg-slate-950/70 hover:border-slate-500 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Top Row: Page number & Active Pill */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-300">
                  Page {idx + 1}
                </span>
                {isActive ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500 text-slate-950 flex items-center space-x-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500">
                    {p.strokes.length} strokes
                  </span>
                )}
              </div>

              {/* Middle preview representation with mini SVG thumbnail */}
              <div className="flex-1 my-1 bg-slate-900/90 rounded-lg border border-slate-800/80 flex items-center justify-center p-1 relative overflow-hidden">
                <svg
                  className="w-full h-full pointer-events-none"
                  viewBox="0 0 1200 800"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <rect width="1200" height="800" fill="#0f172a" rx="12" />
                  {/* Draw mini shapes */}
                  {p.shapes.map((s) => {
                    if (s.type === 'rect') {
                      return <rect key={s.id} x={s.x} y={s.y} width={s.width} height={s.height} fill="none" stroke={s.color || '#38bdf8'} strokeWidth={s.strokeWidth * 2} />;
                    } else if (s.type === 'circle') {
                      return <circle key={s.id} cx={s.x + s.width / 2} cy={s.y + s.height / 2} r={s.width / 2} fill="none" stroke={s.color || '#38bdf8'} strokeWidth={s.strokeWidth * 2} />;
                    } else if (s.type === 'image' && s.imageUrl) {
                      return <image key={s.id} x={s.x} y={s.y} width={s.width} height={s.height} href={s.imageUrl} preserveAspectRatio="xMidYMid slice" />;
                    }
                    return null;
                  })}
                  {/* Draw mini strokes */}
                  {p.strokes.map((st, sIdx) => {
                    if (!st.points || st.points.length < 2) return null;
                    const pathData = st.points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                    return (
                      <path
                        key={sIdx}
                        d={pathData}
                        fill="none"
                        stroke={st.color || '#22d3ee'}
                        strokeWidth={Math.max(2, st.width * 1.5)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={st.isHighlighter ? 0.6 : 1}
                      />
                    );
                  })}
                </svg>

                {p.strokes.length === 0 && p.shapes.length === 0 && p.notes.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 bg-slate-950/40">
                    <span className="text-[10px] text-slate-500 font-medium">Blank Canvas</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions: Duplicate & Delete */}
              <div
                className="flex items-center justify-end space-x-1 pt-1 border-t border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onDuplicatePage(idx)}
                  className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 transition-colors"
                  title="Duplicate Page"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeletePage(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
