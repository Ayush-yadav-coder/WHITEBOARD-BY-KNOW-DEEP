import React, { useState, useRef } from 'react';
import { X, Sun, Minimize2, Maximize2, Move, ChevronDown, ChevronUp } from 'lucide-react';
import { ClassroomSpotlightState } from '../types';

interface SpotlightCurtainWidgetProps {
  state: ClassroomSpotlightState;
  onUpdate: (updated: Partial<ClassroomSpotlightState>) => void;
  onClose: () => void;
}

export const SpotlightCurtainWidget: React.FC<SpotlightCurtainWidgetProps> = ({
  state,
  onUpdate,
  onClose,
}) => {
  const [isDraggingSpotlight, setIsDraggingSpotlight] = useState(false);
  const [isDraggingCurtain, setIsDraggingCurtain] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!state.active || state.mode === 'none') return null;

  // Handle Spotlight Drag
  const handleSpotlightPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingSpotlight(true);
    dragStartRef.current = { x: e.clientX - state.x, y: e.clientY - state.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleSpotlightPointerMove = (e: React.PointerEvent) => {
    if (isDraggingSpotlight) {
      onUpdate({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleSpotlightPointerUp = (e: React.PointerEvent) => {
    setIsDraggingSpotlight(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Handle Curtain Drag
  const handleCurtainPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingCurtain(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCurtainPointerMove = (e: React.PointerEvent) => {
    if (isDraggingCurtain) {
      const percentage = Math.max(5, Math.min(95, (e.clientY / window.innerHeight) * 100));
      onUpdate({ curtainTop: percentage });
    }
  };

  const handleCurtainPointerUp = (e: React.PointerEvent) => {
    setIsDraggingCurtain(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* 1. SPOTLIGHT MODE */}
      {state.mode === 'spotlight' && (
        <div
          id="samsung-classroom-spotlight-overlay"
          className="fixed inset-0 z-40 pointer-events-none select-none"
        >
          {/* SVG Mask with clear circular aperture */}
          <svg className="w-full h-full pointer-events-none">
            <defs>
              <mask id="spotlightMask">
                {/* White background = visible mask (dim overlay) */}
                <rect width="100%" height="100%" fill="white" />
                {/* Black circle = cutout hole where whiteboard shows through */}
                <circle cx={state.x} cy={state.y} r={state.radius} fill="black" />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.88)"
              mask="url(#spotlightMask)"
            />
          </svg>

          {/* Interactive Aperture Ring & Controller */}
          <div
            className="absolute rounded-full border-4 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.5)] pointer-events-auto cursor-move flex items-center justify-center transition-shadow"
            style={{
              left: `${state.x - state.radius}px`,
              top: `${state.y - state.radius}px`,
              width: `${state.radius * 2}px`,
              height: `${state.radius * 2}px`,
            }}
            onPointerDown={handleSpotlightPointerDown}
            onPointerMove={handleSpotlightPointerMove}
            onPointerUp={handleSpotlightPointerUp}
          >
            {/* Top Control Bar on the spotlight */}
            <div
              className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-full border border-slate-700 shadow-xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Spotlight</span>

              {/* Smaller radius */}
              <button
                type="button"
                onClick={() => onUpdate({ radius: Math.max(80, state.radius - 30) })}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
                title="Shrink Spotlight"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              {/* Larger radius */}
              <button
                type="button"
                onClick={() => onUpdate({ radius: Math.min(400, state.radius + 30) })}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
                title="Enlarge Spotlight"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                title="Exit Spotlight"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CURTAIN MODE */}
      {state.mode === 'curtain' && (
        <div
          id="samsung-classroom-curtain-overlay"
          className="fixed inset-0 z-40 select-none pointer-events-none"
        >
          {/* Top Shade */}
          <div
            className="absolute top-0 left-0 right-0 bg-slate-950/95 border-b-4 border-cyan-500 shadow-2xl backdrop-blur-md pointer-events-auto transition-all flex flex-col justify-end"
            style={{ height: `${state.curtainTop}%` }}
          >
            {/* Curtain Pattern Decor */}
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Classroom Curtain Shield
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Drag the handle to reveal questions or solutions step-by-step
              </p>
            </div>

            {/* Draggable Pull Handle Bar */}
            <div
              className="w-full py-2 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-t border-cyan-500/30 flex items-center justify-between px-6 cursor-ns-resize shadow-md"
              onPointerDown={handleCurtainPointerDown}
              onPointerMove={handleCurtainPointerMove}
              onPointerUp={handleCurtainPointerUp}
            >
              <div className="flex items-center space-x-2 text-cyan-300">
                <ChevronDown className="w-4 h-4 animate-bounce" />
                <span className="text-xs font-bold tracking-wide">Drag to Reveal</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onUpdate({ curtainTop: 10 })}
                  className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                >
                  Reveal All
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ curtainTop: 85 })}
                  className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                >
                  Cover All
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 hover:bg-rose-500/20 text-rose-400 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
