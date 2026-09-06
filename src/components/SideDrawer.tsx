import React, { useRef, useEffect } from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Folder,
  Download,
  FileBox,
  UploadCloud,
  ScanLine,
  Mail,
  Settings,
  ArrowRightCircle,
  Columns2,
  X,
  Files,
  Globe,
  Key,
  Presentation,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { WhiteboardLogo } from './WhiteboardLogo';
import { SplitZoneCount } from '../types';

interface SideDrawerProps {
  isOpen: boolean;
  drawerSide: 'left' | 'right';
  currentPageIndex: number;
  totalPages: number;
  splitZones: SplitZoneCount;
  onToggleDrawer: (side: 'left' | 'right') => void;
  onCloseDrawer: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onNewCanvas: () => void;
  onOpenFile: () => void;
  onQuickSave: () => void;
  onOpenSaveAs: () => void;
  onExportPDF?: () => void;
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenQRCode: () => void;
  onOpenEmail: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
  onChangeSplitZones: (zones: SplitZoneCount) => void;
  onSwitchSide?: (side: 'left' | 'right') => void;
  onAddPage?: () => void;
  onOpenPagePreview?: () => void;
  onOpenPPTUploader?: () => void;
  isStudentMode?: boolean;
  onToggleStudentMode?: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  drawerSide,
  currentPageIndex,
  totalPages,
  splitZones,
  onToggleDrawer,
  onCloseDrawer,
  onPrevPage,
  onNextPage,
  onNewCanvas,
  onOpenFile,
  onQuickSave,
  onOpenSaveAs,
  onExportPDF,
  onUploadImage,
  onOpenQRCode,
  onOpenEmail,
  onOpenSettings,
  onExit,
  onChangeSplitZones,
  onSwitchSide,
  onAddPage,
  onOpenPagePreview,
  onOpenPPTUploader,
  isStudentMode = false,
  onToggleStudentMode,
}) => {
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const leftPillRef = useRef<HTMLDivElement>(null);
  const rightPillRef = useRef<HTMLDivElement>(null);

  const handleSwitch = (newSide: 'left' | 'right') => {
    onCloseDrawer();
    if (onSwitchSide) {
      onSwitchSide(newSide);
    }
  };

  // Click outside to close the upward menu without blurring or covering the board
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(target) &&
        leftPillRef.current &&
        !leftPillRef.current.contains(target) &&
        rightPillRef.current &&
        !rightPillRef.current.contains(target)
      ) {
        onCloseDrawer();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onCloseDrawer]);

  return (
    <>
      {/* Hidden file input for image uploads */}
      <input
        ref={fileUploadInputRef}
        type="file"
        accept="image/*,.kdw,.json"
        className="hidden"
        onChange={onUploadImage}
      />

      {/* =========================================================
          LEFT SIDE CONTROLLER AREA
          If drawerSide === 'left': Show full horizontal controller (Menu ≡, Page Controller [Prev, Page/Add, Next], Switch to Right »)
          If drawerSide === 'right': Show only small compact double arrow button to move controller here!
         ========================================================= */}
      {drawerSide === 'left' ? (
        <div
          ref={leftPillRef}
          id="floating-side-pill-left"
          className="fixed bottom-6 left-4 sm:left-6 z-30 flex flex-row items-center bg-[#136e80]/95 border border-[#2299b0]/80 rounded-full shadow-2xl backdrop-blur-md p-1 space-x-1.5 pointer-events-auto select-none transition-transform hover:scale-[1.02]"
        >
          {/* Hamburger Menu (≡) icon replaced with logo */}
          <button
            id="left-hamburger-menu-btn"
            type="button"
            onClick={() => onToggleDrawer('left')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
              isOpen && drawerSide === 'left'
                ? 'bg-cyan-400 scale-105 shadow-cyan-400/50'
                : 'bg-white/10 hover:bg-white/20 hover:scale-105'
            }`}
            title="Interactive Display Whiteboard Menu (Left)"
          >
            <Menu className="w-4 h-4 text-white stroke-[2.5]" />
          </button>

          {/* Page Controller area in middle */}
          <div className="flex items-center bg-[#0d5968] px-2 py-0.5 rounded-full border border-[#2299b0]/40 space-x-1">
            {currentPageIndex > 0 ? (
              <button
                id="left-pill-prev-page"
                type="button"
                onClick={onPrevPage}
                className="w-6 h-6 rounded-full flex items-center justify-center text-cyan-100 hover:bg-[#19849a] active:scale-95 transition-all"
                title="Previous Page ( < )"
              >
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="w-6" /> // Spacer when hidden to avoid shifting
            )}

            {/* Page Adding & Count Display in the Middle */}
            <div className="flex flex-col items-center justify-center min-w-[48px] text-center">
              <span className="text-[9px] font-mono font-bold text-cyan-200 leading-none mb-0.5">
                {currentPageIndex + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={onAddPage}
                className="w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center active:scale-90 transition-all"
                title="Add New Blank Page"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>

            {currentPageIndex < totalPages - 1 ? (
              <button
                id="left-pill-next-page"
                type="button"
                onClick={onNextPage}
                className="w-6 h-6 rounded-full flex items-center justify-center text-cyan-100 hover:bg-[#19849a] active:scale-95 transition-all"
                title="Next Page ( > )"
              >
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="w-6" /> // Spacer when hidden to avoid shifting
            )}
          </div>

          {/* Double Arrow to move controller to Right side */}
          <button
            id="left-pill-switch-to-right-btn"
            type="button"
            onClick={() => handleSwitch('right')}
            className="w-6 h-6 rounded-full flex items-center justify-center text-cyan-200 hover:text-white bg-[#0e5766] hover:bg-[#19849a] border border-[#2299b0]/50 active:scale-95 transition-all"
            title="Move Controller to Right Side ( » )"
          >
            <ChevronsRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        /* Left Inactive: Small double arrow to bring controller to Left */
        <div
          ref={leftPillRef}
          id="small-arrow-to-left"
          className="fixed bottom-4 left-4 sm:left-6 z-30 pointer-events-auto select-none"
        >
          <button
            type="button"
            onClick={() => handleSwitch('left')}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#136e80]/90 hover:bg-[#19849a] border border-[#2299b0]/80 text-cyan-200 hover:text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
            title="Click to bring controller to Left side"
          >
            <ChevronsRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* =========================================================
          RIGHT SIDE CONTROLLER AREA
          If drawerSide === 'right': Show full horizontal controller (Switch to Left «, Page Controller [Prev, Page/Add, Next], Menu ≡)
          If drawerSide === 'left': Show only small compact double arrow button to move controller here!
         ========================================================= */}
      {drawerSide === 'right' ? (
        <div
          ref={rightPillRef}
          id="floating-side-pill-right"
          className="fixed bottom-6 right-4 sm:right-6 z-30 flex flex-row items-center bg-[#136e80]/95 border border-[#2299b0]/80 rounded-full shadow-2xl backdrop-blur-md p-1 space-x-1.5 pointer-events-auto select-none transition-transform hover:scale-[1.02]"
        >
          {/* Double Arrow to move controller to Left side */}
          <button
            id="right-pill-switch-to-left-btn"
            type="button"
            onClick={() => handleSwitch('left')}
            className="w-6 h-6 rounded-full flex items-center justify-center text-cyan-200 hover:text-white bg-[#0e5766] hover:bg-[#19849a] border border-[#2299b0]/50 active:scale-95 transition-all"
            title="Move Controller to Left Side ( « )"
          >
            <ChevronsLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* Page Controller area in middle */}
          <div className="flex items-center bg-[#0d5968] px-2 py-0.5 rounded-full border border-[#2299b0]/40 space-x-1">
            {currentPageIndex > 0 ? (
              <button
                id="right-pill-prev-page"
                type="button"
                onClick={onPrevPage}
                className="w-6 h-6 rounded-full flex items-center justify-center text-cyan-100 hover:bg-[#19849a] active:scale-95 transition-all"
                title="Previous Page ( < )"
              >
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="w-6" /> // Spacer when hidden to avoid shifting
            )}

            {/* Page Adding & Count Display in the Middle */}
            <div className="flex flex-col items-center justify-center min-w-[48px] text-center">
              <span className="text-[9px] font-mono font-bold text-cyan-200 leading-none mb-0.5">
                {currentPageIndex + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={onAddPage}
                className="w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center active:scale-90 transition-all"
                title="Add New Blank Page"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>

            {currentPageIndex < totalPages - 1 ? (
              <button
                id="right-pill-next-page"
                type="button"
                onClick={onNextPage}
                className="w-6 h-6 rounded-full flex items-center justify-center text-cyan-100 hover:bg-[#19849a] active:scale-95 transition-all"
                title="Next Page ( > )"
              >
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="w-6" /> // Spacer when hidden to avoid shifting
            )}
          </div>

          {/* Hamburger Menu (≡) icon */}
          <button
            id="right-hamburger-menu-btn"
            type="button"
            onClick={() => onToggleDrawer('right')}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
              isOpen && drawerSide === 'right'
                ? 'bg-cyan-400 text-slate-950 scale-105 shadow-cyan-400/50'
                : 'bg-[#19849a] text-cyan-100 hover:text-white hover:bg-[#209bb5] hover:scale-105'
            }`}
            title="Interactive Display Whiteboard Menu (Right)"
          >
            <Menu className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        /* Right Inactive: Small double arrow to bring controller to Right */
        <div
          ref={rightPillRef}
          id="small-arrow-to-right"
          className="fixed bottom-4 right-4 sm:right-6 z-30 pointer-events-auto select-none"
        >
          <button
            type="button"
            onClick={() => handleSwitch('right')}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#136e80]/90 hover:bg-[#19849a] border border-[#2299b0]/80 text-cyan-200 hover:text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
            title="Click to bring controller to Right side"
          >
            <ChevronsLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* 3. UPWARD COMPACT RECTANGLE MENU
          Opens on top line directly above the horizontal controller in the active lower area (left or right).
          Compact, does NOT cover or blur the whiteboard. */}
      {isOpen && (
        <div
          ref={menuContainerRef}
          id="samsung-waf-drawer"
          className={`fixed bottom-16 z-50 w-56 sm:w-60 bg-gradient-to-b from-[#18788c] via-[#136c7e] to-[#0e5766] text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_25px_rgba(34,211,238,0.25)] border-2 border-[#26a1b8]/80 flex flex-col p-2.5 overflow-hidden select-none animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            drawerSide === 'left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-cyan-400/20">
            <div className="flex items-center space-x-2">
              <WhiteboardLogo size={22} className="shrink-0" />
              <h3 className="text-xs font-bold text-white tracking-wide">
                Whiteboard Menu
              </h3>
            </div>

            <button
              id="drawer-close-btn"
              type="button"
              onClick={onCloseDrawer}
              className="p-1 rounded-lg text-cyan-200 hover:text-white hover:bg-cyan-900/40 transition-colors"
              title="Close Menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Student Zone Splitter Row */}
          <div className="mb-2 p-1.5 bg-black/25 rounded-xl border border-cyan-400/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-cyan-100 flex items-center space-x-1">
                <Columns2 className="w-3 h-3 text-cyan-300" />
                <span>Split Zones</span>
              </span>
              <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/30">
                {splitZones === 1 ? '1 Full' : `${splitZones} Zones`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {([1, 2, 3, 4] as SplitZoneCount[]).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onChangeSplitZones(count)}
                  className={`py-0.5 text-[10px] font-bold rounded border transition-all ${
                    splitZones === count
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm'
                      : 'bg-white/10 text-cyan-100 border-cyan-400/20 hover:bg-white/20'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items List: Each option in one clean, short line */}
          <div className="space-y-0.5 font-sans text-xs">
            {/* 1. New */}
            <button
              id="menu-item-new-canvas"
              type="button"
              onClick={() => {
                onNewCanvas();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <Plus className="w-4 h-4 text-[#22d3ee] stroke-[2.5] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">New</span>
            </button>

            {/* 2. Open */}
            <button
              id="menu-item-open"
              type="button"
              onClick={() => {
                onOpenFile();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <Folder className="w-4 h-4 text-[#fcd34d] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">Open</span>
            </button>

            {/* 3. Save */}
            <button
              id="menu-item-save"
              type="button"
              onClick={() => {
                onQuickSave();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <Download className="w-4 h-4 text-[#34d399] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">Save</span>
            </button>

            {/* 4. Save as */}
            <button
              id="menu-item-save-as"
              type="button"
              onClick={() => {
                onOpenSaveAs();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <FileBox className="w-4 h-4 text-[#38bdf8] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">Save as</span>
            </button>

            {/* Dedicated Export to PDF */}
            <button
              id="menu-item-export-pdf"
              type="button"
              onClick={() => {
                if (onExportPDF) onExportPDF();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
              title="Print-friendly classroom document export or save as PDF"
            >
              <FileText className="w-4 h-4 text-[#f43f5e] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between flex-1">
                <span className="font-medium whitespace-nowrap">Export to PDF</span>
                <span className="text-[9px] bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded font-bold">PDF</span>
              </div>
            </button>

            {/* 5. Upload */}
            <button
              id="menu-item-upload"
              type="button"
              onClick={() => {
                fileUploadInputRef.current?.click();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <UploadCloud className="w-4 h-4 text-[#67e8f9] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">Upload</span>
            </button>

            {/* 6. Share Link (Replacing QR code) */}
            <button
              id="menu-item-share-link"
              type="button"
              onClick={() => {
                onOpenQRCode(); // Reusing the same trigger state name for now as a toggle
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <Globe className="w-4 h-4 text-[#818cf8] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">Share Link</span>
            </button>

            {/* 7. Email */}
            <button
              id="menu-item-email"
              type="button"
              onClick={() => {
                onOpenEmail();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <Mail className="w-4 h-4 text-[#fb7185] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">Email</span>
            </button>

            {/* Page Preview */}
            <button
              id="menu-item-page-preview"
              type="button"
              onClick={() => {
                if (onOpenPagePreview) onOpenPagePreview();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <Files className="w-4 h-4 text-[#fbbf24] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">Page Preview</span>
            </button>

            {/* PPT Uploader */}
            <button
              id="menu-item-upload-ppt"
              type="button"
              onClick={() => {
                if (onOpenPPTUploader) onOpenPPTUploader();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <Presentation className="w-4 h-4 text-orange-400 stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">Upload PPT / Slides</span>
            </button>

            {/* Student Mode Toggle */}
            {onToggleStudentMode && (
              <button
                id="menu-item-student-mode"
                type="button"
                onClick={() => {
                  onToggleStudentMode();
                  onCloseDrawer();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
              >
                <div className="flex items-center space-x-2.5">
                  <GraduationCap className="w-4 h-4 text-emerald-400 stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-medium whitespace-nowrap">Student Mode</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isStudentMode
                      ? 'bg-emerald-400 text-slate-950 font-black'
                      : 'bg-white/10 text-cyan-200'
                  }`}
                >
                  {isStudentMode ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {/* Settings */}
            <button
              id="menu-item-settings"
              type="button"
              onClick={() => {
                onOpenSettings();
                onCloseDrawer();
              }}
              className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-white hover:bg-white/15 active:bg-white/25 transition-all text-left group"
            >
              <Settings className="w-4 h-4 text-[#38bdf8] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium whitespace-nowrap">Settings</span>
            </button>

            {/* 9. Exit */}
            <div className="pt-1 mt-1 border-t border-cyan-400/20">
              <button
                id="menu-item-exit"
                type="button"
                onClick={() => {
                  onExit();
                  onCloseDrawer();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl flex items-center space-x-2.5 text-cyan-200 hover:text-white hover:bg-white/15 active:bg-white/25 transition-all text-left font-semibold group"
              >
                <ArrowRightCircle className="w-4 h-4 text-[#38bdf8] stroke-[2] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="whitespace-nowrap">Exit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

