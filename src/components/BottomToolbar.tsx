import React, { useState, useRef, useEffect } from 'react';
import {
  Move,
  PenTool,
  Eraser,
  Shapes,
  Plus,
  Globe,
  Timer,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowUpRight,
  Star,
  Ruler,
  Trash2,
  Undo2,
  Redo2,
  ChevronUp,
  Highlighter,
  Sparkles,
  Type,
  Compass,
  Sun,
  ChevronDown,
  Atom,
  Dices,
  StickyNote,
  Files,
  Scissors,
  Layers,
  Hand,
  Navigation,
  BrainCircuit,
  BoxSelect,
  Box,
} from 'lucide-react';
import {
  ToolType,
  ShapeType,
  DualPenConfig,
  ClassroomSpotlightState,
} from '../types';
import { AiLogo } from './AiLogo';

interface BottomToolbarProps {
  activeTool: ToolType;
  selectedShape: ShapeType;
  penColor: string;
  penWidth: number;
  eraserSize: number;
  dualPen: DualPenConfig;
  isRulerVisible: boolean;
  isProtractorVisible: boolean;
  spotlightState: ClassroomSpotlightState;
  isBrowserOpen: boolean;
  isTimerOpen: boolean;
  isThumbnailDrawerOpen: boolean;
  currentPageIndex: number;
  totalPages: number;
  canUndo: boolean;
  canRedo: boolean;
  isAIOpen?: boolean;
  drawerSide?: 'left' | 'right';
  eraserMode?: 'custom' | 'palm' | 'clear';
  onChangeEraserMode?: (mode: 'custom' | 'palm' | 'clear') => void;
  onSelectTool: (tool: ToolType) => void;
  onSelectShape: (shape: ShapeType) => void;
  onChangePenColor: (color: string) => void;
  onChangePenWidth: (width: number) => void;
  onChangeEraserSize: (size: number) => void;
  onToggleDualPen: () => void;
  onSelectPenMode: (mode: 'pen' | 'shape-pen' | 'text-pen' | 'highlighter') => void;
  onClearCanvas: () => void;
  onToggleRuler: () => void;
  onToggleProtractor: () => void;
  onToggleSpotlight: () => void;
  onToggleCurtain: () => void;
  onOpenPeriodicTable: () => void;
  onOpenClassroomPicker: () => void;
  onAddStickyNote: () => void;
  onSlidePageLeft: () => void;
  onToggleBrowser: () => void;
  onToggleTimer: () => void;
  onToggleThumbnailDrawer: () => void;
  onToggleAI?: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const QUICK_COLORS = [
  { name: 'Black', hex: '#0f172a', bgClass: 'bg-slate-900 border-slate-700' },
  { name: 'Red', hex: '#ef4444', bgClass: 'bg-red-500 border-red-600' },
  { name: 'Blue', hex: '#3b82f6', bgClass: 'bg-blue-500 border-blue-600' },
  { name: 'Green', hex: '#10b981', bgClass: 'bg-emerald-500 border-emerald-600' },
  { name: 'Yellow', hex: '#eab308', bgClass: 'bg-amber-400 border-amber-500' },
  { name: 'White', hex: '#ffffff', bgClass: 'bg-white border-slate-300' },
];

const STROKE_WIDTHS = [
  { label: 'Fine', size: 3 },
  { label: 'Medium', size: 6 },
  { label: 'Bold', size: 12 },
  { label: 'Marker', size: 22 },
];

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeTool,
  selectedShape,
  penColor,
  penWidth,
  eraserSize,
  dualPen,
  isRulerVisible,
  isProtractorVisible,
  spotlightState,
  isBrowserOpen,
  isTimerOpen,
  isThumbnailDrawerOpen,
  currentPageIndex,
  totalPages,
  canUndo,
  canRedo,
  isAIOpen = false,
  drawerSide = 'left',
  eraserMode = 'custom',
  onChangeEraserMode,
  onSelectTool,
  onSelectShape,
  onChangePenColor,
  onChangePenWidth,
  onChangeEraserSize,
  onToggleDualPen,
  onSelectPenMode,
  onClearCanvas,
  onToggleRuler,
  onToggleProtractor,
  onToggleSpotlight,
  onToggleCurtain,
  onOpenPeriodicTable,
  onOpenClassroomPicker,
  onAddStickyNote,
  onSlidePageLeft,
  onToggleBrowser,
  onToggleTimer,
  onToggleThumbnailDrawer,
  onToggleAI,
  onUndo,
  onRedo,
}) => {
  const [showPenMenu, setShowPenMenu] = useState(false);
  const [showEraserMenu, setShowEraserMenu] = useState(false);
  const [showGeometryMenu, setShowGeometryMenu] = useState(false);
  const [showTeachingToolsMenu, setShowTeachingToolsMenu] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowPenMenu(false);
        setShowEraserMenu(false);
        setShowGeometryMenu(false);
        setShowTeachingToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentPenConfig = dualPen.activePen === 'penA' ? dualPen.penA : dualPen.penB;

  return (
    <div
      ref={toolbarRef}
      id="bottom-floating-toolbar"
      className={`fixed bottom-4 left-1/2 z-30 select-none pointer-events-auto transition-all duration-300 ease-in-out ${
        drawerSide === 'left'
          ? '-translate-x-[42%] md:-translate-x-[38%]'
          : '-translate-x-[58%] md:-translate-x-[62%]'
      }`}
    >
      {/* 1. PEN MENU POPOVER */}
      {showPenMenu && (
        <div
          id="pen-options-popover"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 backdrop-blur-xl flex flex-col space-y-3.5 w-72 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white"
        >
          {/* Dual Pen Switcher */}
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { if(dualPen.activePen !== 'penA') onToggleDualPen(); }}
              className={`flex-1 py-2 px-3 rounded-xl border flex flex-col items-center transition-all ${
                dualPen.activePen === 'penA'
                  ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-tighter">Pen A</span>
              <span className="text-[8px] opacity-70">(Front Area)</span>
            </button>
            <button
              type="button"
              onClick={() => { if(dualPen.activePen !== 'penB') onToggleDualPen(); }}
              className={`flex-1 py-2 px-3 rounded-xl border flex flex-col items-center transition-all ${
                dualPen.activePen === 'penB'
                  ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-tighter">Pen B</span>
              <span className="text-[8px] opacity-70">(Thick Area)</span>
            </button>
          </div>

          {/* Quick Color Swatches */}
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Active Color ({dualPen.activePen === 'penA' ? 'Pen A' : 'Pen B'})
            </span>
            <div className="flex items-center justify-between">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onChangePenColor(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center ${
                    penColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'ring-2 ring-sky-500 ring-offset-2 scale-110'
                      : 'border-slate-200 dark:border-slate-700'
                  } ${c.bgClass}`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Pen Sub-Modes / Wacom Modes */}
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Tools & AI Refinement
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectPenMode('pen');
                  onSelectTool('calligraphy');
                  onChangePenWidth(8);
                }}
                className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                  activeTool === 'calligraphy'
                    ? 'bg-sky-500 text-white border-sky-500 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                title="Calligraphy: Velocity and pressure based stroke thickness variation"
              >
                <PenTool className="w-4 h-4 text-orange-400" />
                <span className="text-[11px]">Calligraphy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectPenMode('shape-pen');
                  onSelectTool('shape-pen');
                }}
                className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                  activeTool === 'shape-pen'
                    ? 'bg-sky-500 text-white border-sky-500 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                title="Shape Pen: Auto-recognizes geometric shapes with AI assistance"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-[11px]">Shape Pen (AI)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectPenMode('text-pen');
                  onSelectTool('text-pen');
                }}
                className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                  activeTool === 'text-pen'
                    ? 'bg-sky-500 text-white border-sky-500 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                title="Text Pen: Converts handwriting to typed text cards"
              >
                <Type className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">Text Pen (AI)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectPenMode('highlighter');
                  onSelectTool('highlighter');
                }}
                className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                  activeTool === 'highlighter'
                    ? 'bg-sky-500 text-white border-sky-500 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                title="Highlighter: Semi-transparent marker"
              >
                <Highlighter className="w-4 h-4 text-yellow-400" />
                <span className="text-[11px]">Highlighter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ERASER MENU POPOVER */}
      {showEraserMenu && (
        <div
          id="eraser-options-popover"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 backdrop-blur-xl flex flex-col space-y-4 w-80 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Smart Eraser Controls
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Custom Mode (Left) */}
            <button
              type="button"
              onClick={() => {
                onChangeEraserSize(32);
                if (onChangeEraserMode) onChangeEraserMode('custom');
              }}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all text-center ${
                eraserSize !== 120 && (eraserMode === 'custom' || !eraserMode)
                  ? 'bg-sky-500 text-white border-sky-600 shadow-sm font-bold scale-105'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Scissors className="w-5 h-5 text-cyan-500" />
              <span className="text-[10px] uppercase font-black">Custom</span>
            </button>

            {/* Swipe to Clear Slider (Right) */}
            <div className="relative p-3 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center group overflow-hidden">
              <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/5 transition-colors pointer-events-none" />
              <div className="relative w-full h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center p-1 cursor-pointer">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="0"
                  onChange={(e) => {
                    if (e.target.value === '100') {
                      if (window.confirm('Clear entire page?')) {
                        onClearCanvas();
                      }
                      e.target.value = '0';
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className="w-6 h-6 bg-white dark:bg-slate-200 rounded-full shadow-md flex items-center justify-center text-rose-500 pointer-events-none"
                  style={{ marginLeft: '0%' }}
                >
                  <Eraser className="w-3.5 h-3.5" />
                </div>
                <span className="ml-8 text-[9px] font-black text-slate-400 dark:text-slate-500 pointer-events-none uppercase tracking-tighter">Swipe to Clear</span>
              </div>
              <span className="text-[10px] mt-1.5 uppercase font-black text-slate-500 dark:text-slate-400">Clear Page</span>
            </div>
          </div>

          {/* Palm Width (Below) */}
          <button
            type="button"
            onClick={() => {
              onChangeEraserSize(120);
              if (onChangeEraserMode) onChangeEraserMode('palm');
            }}
            className={`p-3 rounded-2xl border flex items-center justify-center space-x-3 transition-all ${
              eraserSize === 120 || eraserMode === 'palm'
                ? 'bg-sky-500 text-white border-sky-600 shadow-sm font-bold'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Hand className="w-5 h-5 text-emerald-500" />
            <div className="text-left">
              <span className="text-xs font-black block uppercase tracking-tight">Palm Width Erase</span>
              <span className="text-[9px] opacity-70">Professional Broad Surface Erasing</span>
            </div>
          </button>
        </div>
      )}

      {/* 3. GEOMETRY & MEASURING TOOLS POPOVER */}
      {showGeometryMenu && (
        <div
          id="geometry-options-popover"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 backdrop-blur-xl flex flex-col space-y-3.5 w-72 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white"
        >
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            2D Geometry Shapes
          </span>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'rectangle' as ShapeType, label: 'Rect', icon: Square },
              { id: 'circle' as ShapeType, label: 'Circ', icon: Circle },
              { id: 'triangle' as ShapeType, label: 'Tri', icon: Triangle },
              { id: 'line' as ShapeType, label: 'Line', icon: Minus },
              { id: 'arrow' as ShapeType, label: 'Arrow', icon: ArrowUpRight },
              { id: 'star' as ShapeType, label: 'Star', icon: Star },
              { id: 'hexagon' as ShapeType, label: 'Hex', icon: Shapes },
              { id: 'pentagon' as ShapeType, label: 'Pent', icon: Shapes },
              { id: 'heart' as ShapeType, label: 'Heart', icon: Star },
              { id: 'diamond' as ShapeType, label: 'Diam', icon: Square },
            ].map((shape) => {
              const Icon = shape.icon;
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => {
                    onSelectShape(shape.id);
                    onSelectTool('shape');
                    setShowGeometryMenu(false);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center space-y-1 transition-all ${
                    activeTool === 'shape' && selectedShape === shape.id
                      ? 'bg-sky-500 text-white border-sky-500 font-semibold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">{shape.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block pt-1.5 border-t border-slate-100 dark:border-slate-800">
            3D Geometry Shapes
          </span>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cube' as ShapeType, label: 'Cube', icon: Square },
              { id: 'sphere' as ShapeType, label: 'Sph', icon: Circle },
              { id: 'pyramid' as ShapeType, label: 'Pyr', icon: Triangle },
              { id: 'cylinder' as ShapeType, label: 'Cyl', icon: Layers },
              { id: 'cone' as ShapeType, label: 'Cone', icon: Compass },
              { id: 'prism' as ShapeType, label: 'Prism', icon: BoxSelect },
              { id: 'torus' as ShapeType, label: 'Torus', icon: Circle },
            ].map((shape) => {
              const Icon = shape.icon;
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => {
                    onSelectShape(shape.id);
                    onSelectTool('shape');
                    setShowGeometryMenu(false);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center space-y-1 transition-all ${
                    activeTool === 'shape' && selectedShape === shape.id
                      ? 'bg-sky-500 text-white border-sky-500 font-semibold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">{shape.label}</span>
                </button>
              );
            })}
          </div>

          {/* Measuring Tools: Ruler & Protractor */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Measurement Instruments
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onToggleRuler();
                  setShowGeometryMenu(false);
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                  isRulerVisible
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Ruler</span>
                </div>
                <span className="text-[9px] font-bold">{isRulerVisible ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleProtractor();
                  setShowGeometryMenu(false);
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                  isProtractorVisible
                    ? 'bg-cyan-500 text-slate-950 border-cyan-600 shadow-sm'
                    : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/80 hover:bg-cyan-100'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Protractor</span>
                </div>
                <span className="text-[9px] font-bold">{isProtractorVisible ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TEACHING & CLASSROOM TOOLS POPOVER */}
      {showTeachingToolsMenu && (
        <div
          id="teaching-tools-popover"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 backdrop-blur-xl flex flex-col space-y-3 w-80 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white"
        >
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            More Classroom Features
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* Spotlight Focus */}
            <button
              type="button"
              onClick={() => {
                onToggleSpotlight();
                setShowTeachingToolsMenu(false);
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col items-start space-y-1 transition-all ${
                spotlightState.mode === 'spotlight'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-500">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">Spotlight</span>
                <span className="text-[9px] opacity-75">Focus aperture</span>
              </div>
            </button>

            {/* Curtain Quiz Reveal */}
            <button
              type="button"
              onClick={() => {
                onToggleCurtain();
                setShowTeachingToolsMenu(false);
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col items-start space-y-1 transition-all ${
                spotlightState.mode === 'curtain'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-600 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-cyan-400/20 text-cyan-500">
                <ChevronDown className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">Curtain</span>
                <span className="text-[9px] opacity-75">Pull-down shade</span>
              </div>
            </button>

            {/* Periodic Table */}
            <button
              type="button"
              onClick={() => {
                onOpenPeriodicTable();
                setShowTeachingToolsMenu(false);
              }}
              className="p-2.5 rounded-xl border text-left flex flex-col items-start space-y-1 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 border-slate-200 dark:border-slate-700 transition-all"
            >
              <div className="p-1.5 rounded-lg bg-emerald-400/20 text-emerald-500">
                <Atom className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">Periodic Table</span>
                <span className="text-[9px] opacity-75">118 Elements</span>
              </div>
            </button>

            {/* Sticky Notes */}
            <button
              type="button"
              onClick={() => {
                onAddStickyNote();
                setShowTeachingToolsMenu(false);
              }}
              className="p-2.5 rounded-xl border text-left flex flex-col items-start space-y-1 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 border-slate-200 dark:border-slate-700 transition-all"
            >
              <div className="p-1.5 rounded-lg bg-indigo-400/20 text-indigo-500">
                <StickyNote className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">Sticky Note</span>
                <span className="text-[9px] opacity-75">Post-it memo</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* MAIN BOTTOM FLOATING DOCK */}
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl px-2.5 py-1.5 backdrop-blur-xl flex items-center space-x-1.5 sm:space-x-2 text-slate-700 dark:text-slate-200">
        {/* Undo / Redo */}
        <div className="flex items-center space-x-0.5 pr-0.5 sm:pr-1 border-r border-slate-200 dark:border-slate-800">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* 1. Samsung Wacom Pen Tool */}
        <div className="relative">
          <button
            id="pen-tool-btn"
            type="button"
            onClick={() => {
              if (
                activeTool === 'pen' ||
                activeTool === 'calligraphy' ||
                activeTool === 'shape-pen' ||
                activeTool === 'text-pen' ||
                activeTool === 'highlighter'
              ) {
                setShowPenMenu(!showPenMenu);
              } else {
                onSelectTool(currentPenConfig.type || 'pen');
                setShowPenMenu(true);
              }
              setShowEraserMenu(false);
              setShowGeometryMenu(false);
              setShowTeachingToolsMenu(false);
            }}
            className={`p-1.5 sm:p-2 rounded-xl flex items-center space-x-1 sm:space-x-1.5 transition-all ${
              activeTool === 'pen' ||
              activeTool === 'calligraphy' ||
              activeTool === 'shape-pen' ||
              activeTool === 'text-pen' ||
              activeTool === 'highlighter'
                ? 'bg-sky-500 text-white shadow-md scale-105 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            title="Samsung Wacom Pen Tool"
          >
            {activeTool === 'shape-pen' ? (
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse" />
            ) : activeTool === 'text-pen' ? (
              <Type className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
            ) : activeTool === 'highlighter' ? (
              <Highlighter className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
            ) : (
              <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-white/80 shadow-sm shrink-0"
              style={{ backgroundColor: penColor }}
            />
            <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60" />
          </button>
        </div>

        {/* 2. Board Eraser Tool */}
        <div className="relative">
          <button
            id="eraser-tool-btn"
            type="button"
            onClick={() => {
              if (activeTool === 'eraser') {
                setShowEraserMenu(!showEraserMenu);
              } else {
                onSelectTool('eraser');
                setShowEraserMenu(true);
              }
              setShowPenMenu(false);
              setShowGeometryMenu(false);
              setShowTeachingToolsMenu(false);
            }}
            className={`p-1.5 sm:p-2 rounded-xl flex items-center space-x-0.5 sm:space-x-1 transition-all ${
              activeTool === 'eraser'
                ? 'bg-sky-500 text-white shadow-md scale-105'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            title="Board Eraser (Precision, Custom Lasso, Palm Erase)"
          >
            <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />
            <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60" />
          </button>
        </div>

        {/* 3. Selection & Drag Tool (Using Navigation Icon) */}
        <button
          id="lasso-selection-tool-btn"
          type="button"
          onClick={() => {
            onSelectTool('lasso');
            setShowPenMenu(false);
            setShowEraserMenu(false);
            setShowGeometryMenu(false);
            setShowTeachingToolsMenu(false);
          }}
          className={`p-1.5 sm:p-2 rounded-xl flex items-center justify-center transition-all ${
            activeTool === 'lasso'
              ? 'bg-sky-500 text-white shadow-md scale-105'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title="Selection & Drag Tool (Encircle area with custom lines to select, move, and rotate shapes)"
        >
          <Navigation className="w-4 h-4 sm:w-5 sm:h-5 rotate-45 text-cyan-500 dark:text-cyan-400" />
        </button>

        {/* 5. Custom Shapes Option */}
        <div className="relative">
          <button
            id="geometry-tool-btn"
            type="button"
            onClick={() => {
              setShowGeometryMenu(!showGeometryMenu);
              setShowPenMenu(false);
              setShowEraserMenu(false);
              setShowTeachingToolsMenu(false);
            }}
            className={`p-1.5 sm:p-2 rounded-xl flex items-center space-x-0.5 sm:space-x-1 transition-all ${
              activeTool === 'shape' || isRulerVisible || isProtractorVisible
                ? 'bg-sky-500 text-white shadow-md scale-105'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            title="Geometry Shapes, Ruler & Protractor"
          >
            <Shapes className="w-4 h-4 sm:w-5 sm:h-5" />
            <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60" />
          </button>
        </div>

        {/* 6. Gemini More Features menu button */}
        <div className="relative">
          <button
            id="teaching-suite-btn"
            type="button"
            onClick={() => {
              setShowTeachingToolsMenu(!showTeachingToolsMenu);
              setShowPenMenu(false);
              setShowEraserMenu(false);
              setShowGeometryMenu(false);
            }}
            className={`p-1.5 sm:p-2 rounded-xl flex items-center space-x-0.5 sm:space-x-1 transition-all ${
              spotlightState.active || showTeachingToolsMenu
                ? 'bg-cyan-600 text-white shadow-md scale-105'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            title="More Gemini Interactive Classroom Features"
          >
            <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 animate-pulse" />
            <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60" />
          </button>
        </div>

        {/* 7. Big Know Deep AI Assistant */}
        <button
          id="know-deep-ai-toolbar-btn"
          type="button"
          onClick={onToggleAI}
          className={`px-1.5 py-1 sm:px-2.5 sm:py-1 rounded-xl flex items-center space-x-1.5 sm:space-x-2 transition-all ${
            isAIOpen
              ? 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] ring-2 ring-cyan-300 scale-105'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-cyan-500/30 shadow-sm hover:scale-105'
          }`}
          title="Know Deep AI Assistant (Teaching & Step-by-Step Math Solver)"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-cyan-400/90 shadow-[0_0_10px_rgba(6,182,212,0.7)] shrink-0">
            <AiLogo size={32} animate={false} />
          </div>
          <span className="text-[11px] sm:text-xs font-black tracking-wider text-cyan-600 dark:text-cyan-400">AI</span>
        </button>

        {/* 8. Web Browser Page Tool */}
        <button
          id="web-browser-tool-btn"
          type="button"
          onClick={onToggleBrowser}
          className={`p-1.5 sm:p-2 rounded-xl flex items-center justify-center transition-all ${
            isBrowserOpen
              ? 'bg-sky-500 text-white shadow-md scale-105'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title="Classroom Web Browser Page"
        >
          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* 9. Timer Tool (using Stopwatch) */}
        <button
          id="timer-tool-btn"
          type="button"
          onClick={onToggleTimer}
          className={`p-1.5 sm:p-2 rounded-xl flex items-center justify-center transition-all ${
            isTimerOpen
              ? 'bg-sky-500 text-white shadow-md scale-105'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
          title="Stopwatch Widget (Timer, Stopwatch, Alarm)"
        >
          <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* 10. Page Shift & Slide area left (Red '+') */}
        <div className="flex items-center pl-0.5 pr-0.5 sm:pl-1 sm:pr-1 border-l border-slate-200 dark:border-slate-800 space-x-1">
          <button
            id="page-shift-add-btn"
            type="button"
            onClick={onSlidePageLeft}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-md transition-all group shrink-0"
            title="Slide Area Left to New Blank Zone (Red '+')"
          >
            <Plus className="w-5 h-5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
          </button>
          <button
            type="button"
            onClick={onToggleThumbnailDrawer}
            className={`flex flex-col text-[9px] sm:text-[10px] font-mono leading-none px-1.5 py-1 rounded-lg border transition-colors shrink-0 ${
              isThumbnailDrawerOpen
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Open Page Thumbnails Drawer"
          >
            <span className="flex items-center space-x-0.5">
              <Files className="w-2.5 h-2.5 inline" />
              <span>PAGE</span>
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {currentPageIndex + 1}/{totalPages}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
