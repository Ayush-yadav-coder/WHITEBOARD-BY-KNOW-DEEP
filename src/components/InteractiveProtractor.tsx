import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, X, Check, Compass } from 'lucide-react';
import { ProtractorState } from '../types';

interface InteractiveProtractorProps {
  protractor: ProtractorState;
  onUpdate: (updated: Partial<ProtractorState>) => void;
  onDrawAngleLine?: (originX: number, originY: number, angleDeg: number, length: number) => void;
  onClose: () => void;
}

export const InteractiveProtractor: React.FC<InteractiveProtractorProps> = ({
  protractor,
  onUpdate,
  onDrawAngleLine,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotateStartAngleRef = useRef<number>(0);

  if (!protractor.visible) return null;

  const size = protractor.radius * 2;
  const centerX = protractor.x;
  const centerY = protractor.y;

  const handlePointerDownDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - protractor.x, y: e.clientY - protractor.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent) => {
    if (isDragging) {
      onUpdate({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    } else if (isRotating) {
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const rad = Math.atan2(dy, dx);
      let deg = Math.round((rad * 180) / Math.PI);
      if (deg < 0) deg += 360;
      onUpdate({ angle: deg });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setIsRotating(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerDownRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsRotating(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Generate degree tick marks (every 5° and 10°)
  const ticks = [];
  for (let d = 0; d <= 180; d += 5) {
    const isMajor = d % 10 === 0;
    const isPrimary = d % 30 === 0;
    const tickLength = isPrimary ? 18 : isMajor ? 12 : 7;
    const rad = (d * Math.PI) / 180;
    const x1 = protractor.radius - Math.cos(rad) * protractor.radius;
    const y1 = protractor.radius - Math.sin(rad) * protractor.radius;
    const x2 = protractor.radius - Math.cos(rad) * (protractor.radius - tickLength);
    const y2 = protractor.radius - Math.sin(rad) * (protractor.radius - tickLength);

    ticks.push(
      <g key={d}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#0f172a"
          strokeWidth={isPrimary ? 2 : 1}
          opacity={isPrimary ? 0.9 : 0.6}
        />
        {isPrimary && (
          <text
            x={protractor.radius - Math.cos(rad) * (protractor.radius - 28)}
            y={protractor.radius - Math.sin(rad) * (protractor.radius - 28) + 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#0f172a"
            transform={`rotate(${d - 90}, ${protractor.radius - Math.cos(rad) * (protractor.radius - 28)}, ${
              protractor.radius - Math.sin(rad) * (protractor.radius - 28) + 4
            })`}
          >
            {d}°
          </text>
        )}
      </g>
    );
  }

  return (
    <div
      id="samsung-interactive-protractor"
      className="fixed z-40 select-none touch-none pointer-events-auto"
      style={{
        left: `${protractor.x - protractor.radius}px`,
        top: `${protractor.y - protractor.radius}px`,
        width: `${size}px`,
        height: `${protractor.radius + 40}px`,
        transform: `rotate(${protractor.angle}deg)`,
        transformOrigin: `${protractor.radius}px ${protractor.radius}px`,
      }}
      onPointerMove={handlePointerMoveDrag}
      onPointerUp={handlePointerUp}
    >
      {/* Semi-circular Acrylic Protractor Shell */}
      <div className="relative w-full h-full">
        <svg
          viewBox={`0 0 ${size} ${protractor.radius + 20}`}
          className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.25)]"
        >
          <defs>
            <linearGradient id="protractorGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Semicircle body */}
          <path
            d={`M 10 ${protractor.radius} A ${protractor.radius - 10} ${
              protractor.radius - 10
            } 0 0 1 ${size - 10} ${protractor.radius} L ${size - 10} ${protractor.radius} L 10 ${
              protractor.radius
            } Z`}
            fill="url(#protractorGlass)"
            stroke="#0284c7"
            strokeWidth="2.5"
            className="backdrop-blur-md"
          />

          {/* Inner cutout */}
          <path
            d={`M ${protractor.radius - 60} ${protractor.radius} A 60 60 0 0 1 ${
              protractor.radius + 60
            } ${protractor.radius} Z`}
            fill="#ffffff"
            fillOpacity="0.75"
            stroke="#0284c7"
            strokeWidth="1.5"
          />

          {/* Center alignment point */}
          <circle
            cx={protractor.radius}
            cy={protractor.radius}
            r="4"
            fill="#e11d48"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* Crosshairs */}
          <line
            x1={protractor.radius - 40}
            y1={protractor.radius}
            x2={protractor.radius + 40}
            y2={protractor.radius}
            stroke="#e11d48"
            strokeWidth="1.5"
          />
          <line
            x1={protractor.radius}
            y1={protractor.radius - 40}
            x2={protractor.radius}
            y2={protractor.radius}
            stroke="#e11d48"
            strokeWidth="1.5"
          />

          {/* Tick marks & Numbers */}
          {ticks}
        </svg>

        {/* Center Drag & Controls Hub */}
        <div
          onPointerDown={handlePointerDownDrag}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-10 bg-slate-900/90 text-white rounded-full flex items-center justify-between px-3 shadow-lg border border-sky-400/50 cursor-move"
          title="Drag to Move Protractor"
        >
          <div className="flex items-center space-x-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-white font-mono">
              {protractor.angle}°
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {/* Draw Angle Ray */}
            {onDrawAngleLine && (
              <button
                type="button"
                onClick={() =>
                  onDrawAngleLine(protractor.x, protractor.y, protractor.angle, protractor.radius)
                }
                className="p-1 rounded-full text-emerald-400 hover:bg-slate-800"
                title="Draw Straight Ray along Current Angle"
              >
                <Check className="w-3 h-3" />
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Rotation Handle on Outer Arc */}
        <div
          onPointerDown={handlePointerDownRotate}
          className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md border-2 border-white"
          title="Rotate Protractor Angle"
        >
          <RotateCw className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
