import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Palette,
  Layers,
  FileDown,
  Sparkles,
  Eye,
} from 'lucide-react';
import { PPTSlide } from './PPTUploaderModal';
import { renderSlideToGraphicDataUrl } from '../utils/slideRenderer';

export interface ActivePresentationState {
  slides: PPTSlide[];
  currentSlideIndex: number;
  isCoverPage: boolean;
  theme: 'modern-blue' | 'dark-slate' | 'emerald' | 'warm-amber';
}

interface PPTPresentationOverlayProps {
  presentation: ActivePresentationState | null;
  onClose: () => void;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onJumpToSlide: (index: number) => void;
  onToggleCoverPage: () => void;
  onChangeTheme: (theme: 'modern-blue' | 'dark-slate' | 'emerald' | 'warm-amber') => void;
  onExportCurrentSlidePDF?: () => void;
}

export const PPTPresentationOverlay: React.FC<PPTPresentationOverlayProps> = ({
  presentation,
  onClose,
  onNextSlide,
  onPrevSlide,
  onJumpToSlide,
  onToggleCoverPage,
  onChangeTheme,
  onExportCurrentSlidePDF,
}) => {
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState<boolean>(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presentation) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        onNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        onPrevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation, onNextSlide, onPrevSlide, onClose]);

  if (!presentation || presentation.slides.length === 0) return null;

  const currentSlide = presentation.slides[presentation.currentSlideIndex] || presentation.slides[0];
  const slideImageUrl = renderSlideToGraphicDataUrl(
    currentSlide,
    presentation.currentSlideIndex,
    presentation.slides.length,
    presentation.theme
  );

  return (
    <div
      id="ppt-presentation-container"
      className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between select-none"
    >
      {/* 1. SLIDE BACKGROUND / COVER IMAGE (UNDER ANNOTATIONS) */}
      <div
        id="ppt-slide-canvas-underlay"
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          presentation.isCoverPage
            ? 'p-0 w-full h-full'
            : 'p-8 sm:p-12 md:p-16'
        }`}
      >
        <div
          id="active-ppt-slide-frame"
          className={`relative w-full h-full max-w-[1920px] max-h-[1080px] aspect-[16/9] shadow-2xl transition-all duration-300 flex items-center justify-center overflow-hidden ${
            presentation.isCoverPage
              ? 'rounded-none border-none'
              : 'rounded-3xl border-4 border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
          }`}
        >
          {/* Rendered Slide Image */}
          <img
            id="active-ppt-slide-image"
            src={slideImageUrl}
            alt={currentSlide.title}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* TOP-RIGHT ATTACHED CLOSE CROSS BUTTON (LIKE GOODLY) */}
          <div className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center space-x-2">
            <button
              id="close-active-ppt-btn"
              type="button"
              onClick={onClose}
              title="Close PPT Presentation"
              className="p-2.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-xl shadow-red-950/50 backdrop-blur-md border border-red-400/60 transition-all hover:scale-110 active:scale-95 group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* TOP-LEFT SLIDE TITLE BADGE (ATTACHED TO SLIDE) */}
          <div className="absolute top-4 left-4 z-30 pointer-events-auto flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-1.5 shadow-lg text-white">
            <span className="text-xs font-black text-cyan-400">
              📊 Slide {presentation.currentSlideIndex + 1}/{presentation.slides.length}:
            </span>
            <span className="text-xs font-bold text-slate-200 max-w-[200px] sm:max-w-xs truncate">
              {currentSlide.title}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ATTACHED FLOATING CONTROL BAR AT BOTTOM (GOODLY STYLE CONTROLLER) */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center space-y-2">
        {/* Thumbnails Quick Jump Popover */}
        {isThumbnailsOpen && (
          <div className="mb-2 p-3 bg-slate-900/95 border-2 border-cyan-500/50 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center space-x-2.5 max-w-[90vw] overflow-x-auto">
            {presentation.slides.map((slide, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onJumpToSlide(idx);
                  setIsThumbnailsOpen(false);
                }}
                className={`flex-shrink-0 w-28 h-18 rounded-xl border p-2 text-left flex flex-col justify-between transition-all ${
                  presentation.currentSlideIndex === idx
                    ? 'border-cyan-400 bg-cyan-950/80 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400/50'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold text-cyan-300">#{idx + 1}</span>
                <span className="text-[10px] font-semibold text-white truncate">{slide.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Theme Picker Popover */}
        {isThemeMenuOpen && (
          <div className="mb-2 p-2 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-xl backdrop-blur-md flex items-center space-x-2 text-xs">
            {(
              [
                { id: 'modern-blue', label: 'Modern Blue', color: 'bg-cyan-500' },
                { id: 'dark-slate', label: 'Dark Slate', color: 'bg-indigo-500' },
                { id: 'emerald', label: 'Emerald Green', color: 'bg-emerald-500' },
                { id: 'warm-amber', label: 'Warm Amber', color: 'bg-amber-500' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChangeTheme(t.id);
                  setIsThemeMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-2 transition-all ${
                  presentation.theme === t.id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${t.color}`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Dock Controller */}
        <div
          id="ppt-control-bar"
          className="flex items-center space-x-2 bg-slate-900/95 border-2 border-cyan-500/60 rounded-full px-4 py-2 shadow-2xl backdrop-blur-xl text-white select-none"
        >
          {/* Previous Slide Button */}
          <button
            id="ppt-prev-slide-btn"
            type="button"
            onClick={onPrevSlide}
            disabled={presentation.currentSlideIndex === 0}
            title="Previous Slide (Left Arrow)"
            className="p-2 rounded-full hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Slide Indicator & Thumbnail Drawer Button */}
          <button
            id="ppt-slide-counter-btn"
            type="button"
            onClick={() => setIsThumbnailsOpen((prev) => !prev)}
            title="View All Slides"
            className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center space-x-2 text-xs font-black text-cyan-300 transition-all hover:scale-105 active:scale-95"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {presentation.currentSlideIndex + 1} / {presentation.slides.length}
            </span>
          </button>

          {/* Next Slide Button */}
          <button
            id="ppt-next-slide-btn"
            type="button"
            onClick={onNextSlide}
            disabled={presentation.currentSlideIndex === presentation.slides.length - 1}
            title="Next Slide (Right Arrow / Space)"
            className="p-2 rounded-full hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1" />

          {/* Cover Page / Full Width Toggle */}
          <button
            id="ppt-toggle-cover-btn"
            type="button"
            onClick={onToggleCoverPage}
            title={presentation.isCoverPage ? 'Windowed Slide Frame' : 'Cover Entire Canvas'}
            className={`p-2 rounded-full transition-all active:scale-95 ${
              presentation.isCoverPage
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            {presentation.isCoverPage ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Theme Palette Toggle */}
          <button
            id="ppt-theme-btn"
            type="button"
            onClick={() => setIsThemeMenuOpen((prev) => !prev)}
            title="Change Presentation Theme"
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 active:scale-95 transition-all"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Export PDF Directly */}
          {onExportCurrentSlidePDF && (
            <button
              id="ppt-export-pdf-btn"
              type="button"
              onClick={onExportCurrentSlidePDF}
              title="Export Current Slide + Annotations to PDF"
              className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95 transition-all shadow-md shadow-cyan-600/30"
            >
              <FileDown className="w-4 h-4" />
            </button>
          )}

          <div className="w-px h-5 bg-slate-700 mx-1" />

          {/* Close PPT button */}
          <button
            id="ppt-control-close-btn"
            type="button"
            onClick={onClose}
            title="Exit Presentation Mode (Esc)"
            className="p-1.5 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
