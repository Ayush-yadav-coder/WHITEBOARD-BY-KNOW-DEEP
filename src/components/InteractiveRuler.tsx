import React, { useState, useRef } from 'react';
import { RotateCw, X, Move } from 'lucide-react';
import { RulerState } from '../types';

interface InteractiveRulerProps {
  ruler: RulerState;
  onChange: (ruler: RulerState) => void;
  onClose: () => void;
}

export const InteractiveRuler: React.FC<InteractiveRulerProps> = ({
  ruler,
  onChange,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, rulerX: 0, rulerY: 0 });
  const rotateStartRef = useRef({ startAngle: 0, initialRulerAngle: 0 });

  if (!ruler.visible) return null;

  const handlePointerDownDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rulerX: ruler.x,
      rulerY: ruler.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    onChange({
      ...ruler,
      x: dragStartRef.current.rulerX + dx,
      y: dragStartRef.current.rulerY + dy,
    });
  };

  const handlePointerUpDrag = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore pointer release error
      }
    }
  };

  const handlePointerDownRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsRotating(true);
    const rulerCenterX = ruler.x + ruler.length / 2;
    const rulerCenterY = ruler.y + 40;
    const dx = e.clientX - rulerCenterX;
    const dy = e.clientY - rulerCenterY;
    const angleRad = Math.atan2(dy, dx);
    rotateStartRef.current = {
      startAngle: (angleRad * 180) / Math.PI,
      initialRulerAngle: ruler.angle,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveRotate = (e: React.PointerEvent) => {
    if (!isRotating) return;
    const rulerCenterX = ruler.x + ruler.length / 2;
    const rulerCenterY = ruler.y + 40;
    const dx = e.clientX - rulerCenterX;
    const dy = e.clientY - rulerCenterY;
    const currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const angleDiff = currentAngle - rotateStartRef.current.startAngle;
    const newAngle = Math.round((rotateStartRef.current.initialRulerAngle + angleDiff) % 360);
    onChange({
      ...ruler,
      angle: newAngle < 0 ? newAngle + 360 : newAngle,
    });
  };

  const handlePointerUpRotate = (e: React.PointerEvent) => {
    if (isRotating) {
      setIsRotating(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Generate tick marks: length is 500px, 1cm = ~37.8px (roughly 96 DPI / 2.54)
  const totalCm = 15;
  const pxPerCm = ruler.length / totalCm;

  return (
    <div
      id="classroom-interactive-ruler"
      className="absolute select-none pointer-events-auto z-20 cursor-grab active:cursor-grabbing"
      style={{
        left: `${ruler.x}px`,
        top: `${ruler.y}px`,
        width: `${ruler.length}px`,
        height: '80px',
        transform: `rotate(${ruler.angle}deg)`,
        transformOrigin: 'center center',
      }}
      onPointerDown={handlePointerDownDrag}
      onPointerMove={handlePointerMoveDrag}
      onPointerUp={handlePointerUpDrag}
    >
      <div className="relative w-full h-full bg-amber-100/90 backdrop-blur-md rounded-lg border-2 border-amber-300 shadow-xl overflow-hidden flex flex-col justify-between p-1">
        {/* Top edge: CM marks */}
        <div className="w-full h-6 relative border-b border-amber-400/50">
          {Array.from({ length: totalCm + 1 }).map((_, i) => (
            <React.Fragment key={`cm-${i}`}>
              <div
                className="absolute top-0 bottom-0 w-[1.5px] bg-amber-900"
                style={{ left: `${i * pxPerCm}px` }}
              >
                <span className="absolute top-2 -translate-x-1/2 text-[9px] font-bold text-amber-900 select-none">
                  {i}
                </span>
              </div>
              {i < totalCm && (
                <>
                  <div
                    className="absolute top-0 h-3 w-[1px] bg-amber-800"
                    style={{ left: `${(i + 0.5) * pxPerCm}px` }}
                  />
                  {[0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9].map((fraction) => (
                    <div
                      key={`sub-${i}-${fraction}`}
                      className="absolute top-0 h-1.5 w-[0.5px] bg-amber-700/60"
                      style={{ left: `${(i + fraction) * pxPerCm}px` }}
                    />
                  ))}
                </>
              )}
            </React.Fragment>
          ))}
          <span className="absolute right-2 top-0.5 text-[8px] font-semibold text-amber-800 tracking-wider uppercase">
            cm
          </span>
        </div>

        {/* Center info & controls */}
        <div className="flex items-center justify-between px-3 py-1 text-amber-950">
          <div className="flex items-center space-x-1.5 text-xs font-medium">
            <Move className="w-3.5 h-3.5 text-amber-800" />
            <span className="text-[10px] text-amber-800">Drag to move</span>
          </div>

          <div className="bg-amber-200/80 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-amber-900 border border-amber-300/80">
            {ruler.angle}°
          </div>

          <div className="flex items-center space-x-1">
            {/* Rotation handle */}
            <button
              id="ruler-rotate-handle"
              type="button"
              className="p-1 rounded-full bg-amber-300 hover:bg-amber-400 text-amber-900 cursor-crosshair transition-colors"
              title="Drag to rotate ruler"
              onPointerDown={handlePointerDownRotate}
              onPointerMove={handlePointerMoveRotate}
              onPointerUp={handlePointerUpRotate}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            {/* Close button */}
            <button
              id="ruler-close-button"
              type="button"
              className="p-1 rounded-full bg-amber-300/60 hover:bg-amber-400 text-amber-900 transition-colors"
              title="Close ruler"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom edge: Inches */}
        <div className="w-full h-5 relative border-t border-amber-400/50">
          {Array.from({ length: 6 }).map((_, i) => {
            const inchPx = (ruler.length / totalCm) * 2.54;
            return (
              <React.Fragment key={`inch-${i}`}>
                <div
                  className="absolute bottom-0 top-0 w-[1.5px] bg-amber-900"
                  style={{ left: `${i * inchPx}px` }}
                >
                  <span className="absolute bottom-2 -translate-x-1/2 text-[9px] font-bold text-amber-900 select-none">
                    {i}
                  </span>
                </div>
                {i < 5 && (
                  <>
                    <div
                      className="absolute bottom-0 h-3 w-[1px] bg-amber-800"
                      style={{ left: `${(i + 0.5) * inchPx}px` }}
                    />
                    <div
                      className="absolute bottom-0 h-2 w-[0.8px] bg-amber-700"
                      style={{ left: `${(i + 0.25) * inchPx}px` }}
                    />
                    <div
                      className="absolute bottom-0 h-2 w-[0.8px] bg-amber-700"
                      style={{ left: `${(i + 0.75) * inchPx}px` }}
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}
          <span className="absolute right-2 bottom-0.5 text-[8px] font-semibold text-amber-800 tracking-wider uppercase">
            inch
          </span>
        </div>
      </div>
    </div>
  );
};
