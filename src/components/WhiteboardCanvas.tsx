import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ToolType,
  ShapeType,
  Stroke,
  ShapeElement,
  CanvasNote,
  WhiteboardSettings,
  SplitZoneCount,
  Point,
  CircleToSearchPayload,
} from '../types';
import { recognizeShape } from '../utils/shapeRecognizer';
import {
  X,
  Trash2,
  Pin,
  Move,
  Sparkles,
  Copy,
  Search,
  Check,
  Type,
  Palette,
} from 'lucide-react';

interface WhiteboardCanvasProps {
  strokes: Stroke[];
  shapes: ShapeElement[];
  notes: CanvasNote[];
  activeTool: ToolType;
  selectedShape: ShapeType;
  penColor: string;
  penWidth: number;
  eraserSize: number;
  eraserMode?: 'custom' | 'palm' | 'clear';
  settings: WhiteboardSettings;
  splitZones: SplitZoneCount;
  pageSlideOffset: number;
  onAddStroke: (stroke: Stroke) => void;
  onAddShape: (shape: ShapeElement) => void;
  onUpdateNote: (noteId: string, updates: Partial<CanvasNote>) => void;
  onDeleteNote: (noteId: string) => void;
  onClearZone: (zoneIndex: number) => void;
  onCircleToSearchAI?: (payload: CircleToSearchPayload | string) => void;
  onDeleteSelected?: (strokeIds: string[], shapeIds: string[]) => void;
  onDuplicateSelected?: (strokeIds: string[], shapeIds: string[]) => void;
  onMoveSelected?: (strokeIds: string[], shapeIds: string[], dx: number, dy: number) => void;
  onRotateSelected?: (shapeId: string, rotation: number) => void;
  onUpdateEraserSize?: (size: number) => void;
}

const STICKY_COLORS: Record<string, { bg: string; border: string; header: string; text: string }> = {
  yellow: { bg: 'bg-amber-100 dark:bg-amber-950/80', border: 'border-amber-300 dark:border-amber-700', header: 'bg-amber-400 text-slate-950', text: 'text-amber-950 dark:text-amber-100' },
  blue: { bg: 'bg-sky-100 dark:bg-sky-950/80', border: 'border-sky-300 dark:border-sky-700', header: 'bg-sky-400 text-slate-950', text: 'text-sky-950 dark:text-sky-100' },
  green: { bg: 'bg-emerald-100 dark:bg-emerald-950/80', border: 'border-emerald-300 dark:border-emerald-700', header: 'bg-emerald-400 text-slate-950', text: 'text-emerald-950 dark:text-emerald-100' },
  pink: { bg: 'bg-rose-100 dark:bg-rose-950/80', border: 'border-rose-300 dark:border-rose-700', header: 'bg-rose-400 text-slate-950', text: 'text-rose-950 dark:text-rose-100' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-950/80', border: 'border-purple-300 dark:border-purple-700', header: 'bg-purple-400 text-slate-950', text: 'text-purple-950 dark:text-purple-100' },
};

  export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  strokes,
  shapes,
  notes,
  activeTool,
  selectedShape,
  penColor,
  penWidth,
  eraserSize,
  eraserMode = 'custom',
  settings,
  splitZones,
  pageSlideOffset,
  onAddStroke,
  onAddShape,
  onUpdateNote,
  onDeleteNote,
  onClearZone,
  onCircleToSearchAI,
  onDeleteSelected,
  onDuplicateSelected,
  onMoveSelected,
  onRotateSelected,
  onUpdateEraserSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Rotation dragging state
  const isRotatingSelectionRef = useRef(false);
  const rotationStartAngleRef = useRef(0);
  const rotationInitialShapeAngleRef = useRef(0);
  const dragSelectionRotationRef = useRef(0);

  // Pan offset for Navigation Tool
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  // Palm mode / Pinch resize refs
  const palmPointerIdsRef = useRef<Set<number>>(new Set());
  const activeTouchPointsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialEraserSizeRef = useRef<number>(eraserSize);

  // Multi-touch active pointer storage (up to 20 touch points)
  const activePointersRef = useRef<Map<number, Point[]>>(new Map());

  // Current interactive shape preview on drag
  const [activeShapePreview, setActiveShapePreview] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Lasso custom selection path & selected elements
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectionBounds, setSelectionBounds] = useState<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null>(null);

  // Selection dragging state
  const isDraggingSelectionRef = useRef(false);
  const dragSelectionStartRef = useRef<Point>({ x: 0, y: 0 });
  const dragSelectionOffsetRef = useRef<Point>({ x: 0, y: 0 });

  // Dragging note cards
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const noteDragOffsetRef = useRef<Point>({ x: 0, y: 0 });

  // Canvas redraw trigger
  const [, setRenderTrigger] = useState(0);

  // Setup high-DPI canvas sizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      setRenderTrigger((prev) => prev + 1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Apply pan offset & page slide animation offset
    const totalOffsetX = panOffset.x + pageSlideOffset;
    const totalOffsetY = panOffset.y;

    // 1. Draw Background
    drawBackground(ctx, width, height, settings.background, totalOffsetX, totalOffsetY);

    // Apply viewport translation for canvas elements
    ctx.save();
    ctx.translate(totalOffsetX, totalOffsetY);

    // 2. Draw Committed Strokes
    strokes.forEach((stroke) => {
      const isSelected = selectedStrokeIds.includes(stroke.id);
      let strokeToDraw = stroke;
      if (isSelected && isDraggingSelectionRef.current) {
        const dx = dragSelectionOffsetRef.current.x;
        const dy = dragSelectionOffsetRef.current.y;
        strokeToDraw = {
          ...stroke,
          points: stroke.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
        };
      }
      drawSingleStroke(ctx, strokeToDraw, settings.background, isSelected);
    });

    // 3. Draw Active In-Progress Strokes (for multi-touch or single-pen)
    activePointersRef.current.forEach((pts, pointerId) => {
      if (pts.length < 2) return;
      const isPalmEraser = palmPointerIdsRef.current.has(pointerId);
      const isEraser = activeTool === 'eraser' || isPalmEraser;
      const isHighlighter = activeTool === 'highlighter' && !isPalmEraser;
      const stroke: Stroke = {
        id: 'active',
        tool: isEraser ? 'eraser' : isHighlighter ? 'highlighter' : 'pen',
        color: isEraser ? '#ffffff' : penColor,
        width: isEraser ? (isPalmEraser ? Math.max(eraserSize, 80) : eraserSize) : penWidth,
        points: pts,
        opacity: isHighlighter ? 0.35 : 1,
      };
      drawSingleStroke(ctx, stroke, settings.background, false);
    });

    // 4. Draw Committed 2D Shapes
    shapes.forEach((shape) => {
      const isSelected = selectedShapeIds.includes(shape.id);
      let shapeToDraw = shape;
      if (isSelected && isDraggingSelectionRef.current) {
        const dx = dragSelectionOffsetRef.current.x;
        const dy = dragSelectionOffsetRef.current.y;
        shapeToDraw = {
          ...shape,
          x: shape.x + dx,
          y: shape.y + dy,
        };
      }
      drawSingleShape(ctx, shapeToDraw, false, isSelected);
    });

    // 5. Draw Interactive Shape Preview
    if (activeShapePreview) {
      const sx = activeShapePreview.startX - totalOffsetX;
      const sy = activeShapePreview.startY - totalOffsetY;
      const cx = activeShapePreview.currentX - totalOffsetX;
      const cy = activeShapePreview.currentY - totalOffsetY;

      const previewShape: ShapeElement = {
        id: 'preview',
        type: selectedShape,
        x: Math.min(sx, cx),
        y: Math.min(sy, cy),
        width: Math.abs(cx - sx),
        height: Math.abs(cy - sy),
        color: penColor,
        strokeWidth: penWidth,
      };
      drawSingleShape(ctx, previewShape, true, false);
    }

    // 6. Draw Custom Lasso Path Preview (The Dragger custom shape)
    if ((activeTool === 'lasso' || (activeTool === 'eraser' && eraserMode === 'custom')) && lassoPoints.length > 1) {
      ctx.save();
      const isEraserLasso = activeTool === 'eraser' && eraserMode === 'custom';
      ctx.strokeStyle = isEraserLasso ? '#f43f5e' : '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.fillStyle = isEraserLasso ? 'rgba(244, 63, 94, 0.08)' : 'rgba(34, 211, 238, 0.08)';
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x - totalOffsetX, lassoPoints[0].y - totalOffsetY);
      for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x - totalOffsetX, lassoPoints[i].y - totalOffsetY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 7. Draw Selection Bounds (when elements selected via lasso)
    if (selectionBounds && (selectedStrokeIds.length > 0 || selectedShapeIds.length > 0)) {
      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      const pad = 10;
      const dx = isDraggingSelectionRef.current ? dragSelectionOffsetRef.current.x : 0;
      const dy = isDraggingSelectionRef.current ? dragSelectionOffsetRef.current.y : 0;
      const x1 = selectionBounds.minX - pad + dx;
      const y1 = selectionBounds.minY - pad + dy;
      const w = selectionBounds.maxX - selectionBounds.minX + pad * 2;
      const h = selectionBounds.maxY - selectionBounds.minY + pad * 2;

      ctx.strokeRect(x1, y1, w, h);

      // Draw a sleek rotation handle if exactly one shape is selected
      const singleSelectedShape = selectedShapeIds.length === 1 && selectedStrokeIds.length === 0
        ? shapes.find((s) => s.id === selectedShapeIds[0])
        : null;

      if (singleSelectedShape) {
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = '#06b6d4';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 2;

        const handleX = x1 + w / 2;
        const handleY = y1 - 25;

        // Connector line
        ctx.beginPath();
        ctx.moveTo(x1 + w / 2, y1);
        ctx.lineTo(handleX, handleY);
        ctx.stroke();

        // Control point circle
        ctx.beginPath();
        ctx.arc(handleX, handleY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Little inner rotation icon dot
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(handleX, handleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();

    // 8. Draw Split Zone Boundaries (When Split Screen is Active)
    if (splitZones > 1) {
      drawSplitZoneDividers(ctx, width, height, splitZones);
    }

    ctx.restore();
  }, [
    strokes,
    shapes,
    activeTool,
    selectedShape,
    penColor,
    penWidth,
    eraserSize,
    settings.background,
    splitZones,
    panOffset,
    pageSlideOffset,
    activeShapePreview,
    lassoPoints,
    selectedStrokeIds,
    selectedShapeIds,
    selectionBounds,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.pointerType === 'touch') {
      activeTouchPointsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      
      // If we have exactly 2 active touches, initialize our pinch-to-scale metrics for eraser
      if (activeTouchPointsRef.current.size === 2) {
        const pts = Array.from(activeTouchPointsRef.current.values()) as { x: number; y: number }[];
        const dist = Math.sqrt((pts[0].x - pts[1].x) ** 2 + (pts[0].y - pts[1].y) ** 2);
        initialPinchDistRef.current = dist;
        initialEraserSizeRef.current = eraserSize;
      }
    }

    // Detect Palm Erase: broad physical touch on interactive flat panel
    const isPalm = (e.width > 25 && e.height > 25) || (e.pointerType === 'touch' && e.width > 35);
    if (isPalm) {
      palmPointerIdsRef.current.add(e.pointerId);
    } else {
      palmPointerIdsRef.current.delete(e.pointerId);
    }
    const effectiveTool = isPalm ? 'eraser' : activeTool;

    // Custom Eraser Lasso Mode (Encircle to Erase)
    if (effectiveTool === 'eraser' && eraserMode === 'custom') {
      setLassoPoints([{ x, y }]);
      return;
    }

    // Pan Viewport
    if (effectiveTool === 'pan') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    // Lasso Selection / Drag selected elements / Rotate selected shape
    if (effectiveTool === 'lasso') {
      const clickX = x - (panOffset.x + pageSlideOffset);
      const clickY = y - panOffset.y;

      // Check if clicked the rotation handle of a single selected shape
      const singleSelectedShape = selectedShapeIds.length === 1 && selectedStrokeIds.length === 0
        ? shapes.find((s) => s.id === selectedShapeIds[0])
        : null;

      if (singleSelectedShape && selectionBounds) {
        const pad = 10;
        const x1 = selectionBounds.minX - pad;
        const y1 = selectionBounds.minY - pad;
        const w = selectionBounds.maxX - selectionBounds.minX + pad * 2;
        const handleX = x1 + w / 2;
        const handleY = y1 - 25;

        const dist = Math.sqrt((clickX - handleX) ** 2 + (clickY - handleY) ** 2);
        if (dist <= 15) {
          isRotatingSelectionRef.current = true;
          const centerX = (selectionBounds.minX + selectionBounds.maxX) / 2;
          const centerY = (selectionBounds.minY + selectionBounds.maxY) / 2;
          rotationStartAngleRef.current = Math.atan2(clickY - centerY, clickX - centerX) * (180 / Math.PI);
          rotationInitialShapeAngleRef.current = singleSelectedShape.rotation || 0;
          return;
        }
      }

      const clickInsideSelection = selectionBounds &&
        clickX >= selectionBounds.minX &&
        clickX <= selectionBounds.maxX &&
        clickY >= selectionBounds.minY &&
        clickY <= selectionBounds.maxY;

      if (clickInsideSelection) {
        isDraggingSelectionRef.current = true;
        dragSelectionStartRef.current = { x: clickX, y: clickY };
        dragSelectionOffsetRef.current = { x: 0, y: 0 };
      } else {
        setLassoPoints([{ x, y }]);
        setSelectedStrokeIds([]);
        setSelectedShapeIds([]);
        setSelectionBounds(null);
      }
      return;
    }

    // Interactive Shape Tool
    if (effectiveTool === 'shape') {
      setActiveShapePreview({ startX: x, startY: y, currentX: x, currentY: y });
      return;
    }

    // Drawing with Pen, Shape-Pen, Text-Pen, Highlighter, or Eraser
    const currentOffsetX = panOffset.x + pageSlideOffset;
    const currentOffsetY = panOffset.y;

    const initialPoint: Point = {
      x: x - currentOffsetX,
      y: y - currentOffsetY,
      pressure: e.pressure || 0.5,
    };

    activePointersRef.current.set(e.pointerId, [initialPoint]);
    renderCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.pointerType === 'touch') {
      activeTouchPointsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Update palm detection during active dragging
      const isPalm = (e.width > 25 && e.height > 25) || (e.pointerType === 'touch' && e.width > 35);
      if (isPalm) {
        palmPointerIdsRef.current.add(e.pointerId);
      }

      // Check if we are doing a two-finger pinch gesture
      if (activeTouchPointsRef.current.size === 2 && initialPinchDistRef.current !== null) {
        const pts = Array.from(activeTouchPointsRef.current.values()) as { x: number; y: number }[];
        const dist = Math.sqrt((pts[0].x - pts[1].x) ** 2 + (pts[0].y - pts[1].y) ** 2);
        const ratio = dist / initialPinchDistRef.current;
        const newSize = Math.max(10, Math.min(250, Math.round(initialEraserSizeRef.current * ratio)));
        if (onUpdateEraserSize) {
          onUpdateEraserSize(newSize);
        }
      }
    }

    // Pan viewport
    if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    // Lasso Path (The Dragger drawing custom shapes)
    if (activeTool === 'lasso' && lassoPoints.length > 0) {
      setLassoPoints((prev) => [...prev, { x, y }]);
      renderCanvas();
      return;
    }

    // Custom Eraser Lasso Path
    if (activeTool === 'eraser' && eraserMode === 'custom' && lassoPoints.length > 0) {
      setLassoPoints((prev) => [...prev, { x, y }]);
      renderCanvas();
      return;
    }

    // Shape Rotation Dragging
    if (isRotatingSelectionRef.current && selectionBounds && selectedShapeIds.length === 1) {
      const centerX = (selectionBounds.minX + selectionBounds.maxX) / 2;
      const centerY = (selectionBounds.minY + selectionBounds.maxY) / 2;
      const clickX = x - (panOffset.x + pageSlideOffset);
      const clickY = y - panOffset.y;

      const currentAngle = Math.atan2(clickY - centerY, clickX - centerX) * (180 / Math.PI);
      const angleDiff = currentAngle - rotationStartAngleRef.current;
      const newRotation = (rotationInitialShapeAngleRef.current + angleDiff + 360) % 360;

      if (onRotateSelected) {
        onRotateSelected(selectedShapeIds[0], Math.round(newRotation));
      }
      renderCanvas();
      return;
    }

    // Selection Dragging
    if (isDraggingSelectionRef.current) {
      const clickX = x - (panOffset.x + pageSlideOffset);
      const clickY = y - panOffset.y;
      const dx = clickX - dragSelectionStartRef.current.x;
      const dy = clickY - dragSelectionStartRef.current.y;
      dragSelectionOffsetRef.current = { x: dx, y: dy };
      renderCanvas();
      return;
    }

    // Shape Preview
    if (activeShapePreview) {
      setActiveShapePreview((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
      return;
    }

    // Active Pen / Eraser pointer movement
    if (activePointersRef.current.has(e.pointerId)) {
      const currentOffsetX = panOffset.x + pageSlideOffset;
      const currentOffsetY = panOffset.y;
      const pts = activePointersRef.current.get(e.pointerId)!;
      pts.push({
        x: x - currentOffsetX,
        y: y - currentOffsetY,
        pressure: e.pressure || 0.5,
      });
      renderCanvas();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    activeTouchPointsRef.current.delete(e.pointerId);
    const isPalmEraser = palmPointerIdsRef.current.has(e.pointerId);
    palmPointerIdsRef.current.delete(e.pointerId);
    if (activeTouchPointsRef.current.size < 2) {
      initialPinchDistRef.current = null;
    }

    // Finish Panning
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    // Finish rotating
    if (isRotatingSelectionRef.current) {
      isRotatingSelectionRef.current = false;
      dragSelectionRotationRef.current = 0;
      renderCanvas();
      return;
    }

    // Finish selection dragging
    if (isDraggingSelectionRef.current) {
      isDraggingSelectionRef.current = false;
      const dx = dragSelectionOffsetRef.current.x;
      const dy = dragSelectionOffsetRef.current.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        if (onMoveSelected) {
          onMoveSelected(selectedStrokeIds, selectedShapeIds, dx, dy);
        }
        if (selectionBounds) {
          setSelectionBounds({
            minX: selectionBounds.minX + dx,
            minY: selectionBounds.minY + dy,
            maxX: selectionBounds.maxX + dx,
            maxY: selectionBounds.maxY + dy,
          });
        }
      }
      dragSelectionOffsetRef.current = { x: 0, y: 0 };
      renderCanvas();
      return;
    }

    const currentOffsetX = panOffset.x + pageSlideOffset;
    const currentOffsetY = panOffset.y;

    // Commit Custom Eraser Lasso Selection (Encircle to Erase)
    if (activeTool === 'eraser' && eraserMode === 'custom' && lassoPoints.length > 0) {
      const ptsInCanvas = lassoPoints.map((p) => ({
        x: p.x - currentOffsetX,
        y: p.y - currentOffsetY,
      }));

      if (ptsInCanvas.length > 2) {
        // Find strokes intersecting or residing inside custom freeform polygon
        const selectedStrokes = strokes.filter((st) =>
          st.points.some((p) => isPointInPolygon(p, ptsInCanvas))
        );

        // Find shapes whose center lies inside the custom polygon
        const selectedShapes = shapes.filter((sh) => {
          const cx = sh.x + sh.width / 2;
          const cy = sh.y + sh.height / 2;
          return isPointInPolygon({ x: cx, y: cy }, ptsInCanvas);
        });

        if ((selectedStrokes.length > 0 || selectedShapes.length > 0) && onDeleteSelected) {
          onDeleteSelected(selectedStrokes.map((s) => s.id), selectedShapes.map((s) => s.id));
        }
      }

      setLassoPoints([]);
      renderCanvas();
      return;
    }

    // Commit Lasso Selection (Custom polygon)
    if (activeTool === 'lasso' && lassoPoints.length > 0) {
      const ptsInCanvas = lassoPoints.map((p) => ({
        x: p.x - currentOffsetX,
        y: p.y - currentOffsetY,
      }));

      if (ptsInCanvas.length > 2) {
        // Calculate custom selection bounds from the freeform polygon points
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        ptsInCanvas.forEach((p) => {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });

        // Find strokes intersecting or residing inside custom freeform polygon
        const selectedStrokes = strokes.filter((st) =>
          st.points.some((p) => isPointInPolygon(p, ptsInCanvas))
        );

        // Find shapes whose center lies inside the custom polygon
        const selectedShapes = shapes.filter((sh) => {
          const cx = sh.x + sh.width / 2;
          const cy = sh.y + sh.height / 2;
          return isPointInPolygon({ x: cx, y: cy }, ptsInCanvas);
        });

        setSelectedStrokeIds(selectedStrokes.map((s) => s.id));
        setSelectedShapeIds(selectedShapes.map((s) => s.id));

        if (selectedStrokes.length > 0 || selectedShapes.length > 0) {
          setSelectionBounds({ minX, minY, maxX, maxY });
        } else {
          setSelectionBounds(null);
        }
      } else {
        setSelectionBounds(null);
      }

      setLassoPoints([]);
      renderCanvas();
      return;
    }

    // Commit Shape Tool
    if (activeShapePreview) {
      const sx = activeShapePreview.startX - currentOffsetX;
      const sy = activeShapePreview.startY - currentOffsetY;
      const ex = activeShapePreview.currentX - currentOffsetX;
      const ey = activeShapePreview.currentY - currentOffsetY;

      const width = Math.abs(ex - sx);
      const height = Math.abs(ey - sy);

      if (width > 5 || height > 5) {
        const newShape: ShapeElement = {
          id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: selectedShape,
          x: Math.min(sx, ex),
          y: Math.min(sy, ey),
          width,
          height,
          color: penColor,
          strokeWidth: penWidth,
        };
        onAddShape(newShape);
      }
      setActiveShapePreview(null);
      return;
    }

    // Commit Stroke (Pen / Shape-Pen / Text-Pen / Eraser)
    if (activePointersRef.current.has(e.pointerId)) {
      const pts = activePointersRef.current.get(e.pointerId)!;
      if (pts.length > 1) {
        // 1. Samsung WAF Shape-Pen: Auto Shape Recognition
        if (activeTool === 'shape-pen' && !isPalmEraser) {
          const recognized = recognizeShape(pts);
          if (recognized) {
            const newShape: ShapeElement = {
              id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: recognized.type,
              x: recognized.x,
              y: recognized.y,
              width: recognized.width,
              height: recognized.height,
              color: penColor,
              strokeWidth: penWidth,
            };
            onAddShape(newShape);
            activePointersRef.current.delete(e.pointerId);
            renderCanvas();
            return;
          }
        }

        // 2. Samsung WAF Text-Pen: Ink-to-Text OCR Card Conversion
        if (activeTool === 'text-pen' && !isPalmEraser) {
          // Compute bounding box
          let minX = Infinity;
          let minY = Infinity;
          pts.forEach((p) => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
          });

          // Add a neat converted text card note at stroke location
          const noteText = 'Handwritten Equation / Notes converted to digital text.';
          onAddStroke({
            id: `stroke-${Date.now()}`,
            tool: 'text-pen',
            color: penColor,
            width: penWidth,
            points: pts,
          });
          activePointersRef.current.delete(e.pointerId);
          renderCanvas();
          return;
        }

        // 3. Normal Pen / Calligraphy / Highlighter / Eraser
        const isEraser = activeTool === 'eraser' || isPalmEraser;
        const isHighlighter = activeTool === 'highlighter' && !isPalmEraser;
        const isCalligraphy = activeTool === 'calligraphy' && !isPalmEraser;
        const stroke: Stroke = {
          id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          tool: isEraser ? 'eraser' : isHighlighter ? 'highlighter' : isCalligraphy ? 'calligraphy' : 'pen',
          color: isEraser ? '#ffffff' : penColor,
          width: isEraser ? (isPalmEraser ? Math.max(eraserSize, 80) : eraserSize) : penWidth,
          points: pts,
          opacity: isHighlighter ? 0.35 : 1,
        };
        onAddStroke(stroke);
      }
      activePointersRef.current.delete(e.pointerId);
      renderCanvas();
    }
  };

  // Dragging Canvas Notes
  const handleNotePointerDown = (e: React.PointerEvent, note: CanvasNote) => {
    e.stopPropagation();
    setDraggingNoteId(note.id);
    noteDragOffsetRef.current = {
      x: e.clientX - note.x,
      y: e.clientY - note.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleNotePointerMove = (e: React.PointerEvent) => {
    if (!draggingNoteId) return;
    const newX = e.clientX - noteDragOffsetRef.current.x;
    const newY = e.clientY - noteDragOffsetRef.current.y;
    onUpdateNote(draggingNoteId, { x: newX, y: newY });
  };

  const handleNotePointerUp = (e: React.PointerEvent) => {
    if (draggingNoteId) {
      setDraggingNoteId(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // High-Resolution Crisp Canvas Crop for Gemini Multimodal Handwritten Math OCR
  const getCroppedImageDataUrl = useCallback((): string | null => {
    if (!selectionBounds) return null;
    const pad = 24;
    const minX = Math.max(0, selectionBounds.minX - pad);
    const minY = Math.max(0, selectionBounds.minY - pad);
    const maxX = selectionBounds.maxX + pad;
    const maxY = selectionBounds.maxY + pad;
    const cropWidth = Math.max(80, maxX - minX);
    const cropHeight = Math.max(80, maxY - minY);

    const offscreen = document.createElement('canvas');
    const scale = 2; // 2x scale for sharp equation recognition
    offscreen.width = Math.min(2048, Math.round(cropWidth * scale));
    offscreen.height = Math.min(2048, Math.round(cropHeight * scale));
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    // Fill with clean high-contrast white background (optimal for formula OCR)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    ctx.scale(scale, scale);
    ctx.translate(-minX, -minY);

    // 1. Render selected strokes
    const selectedStrokes = strokes.filter((s) => selectedStrokeIds.includes(s.id));
    for (const st of selectedStrokes) {
      if (st.points.length < 2) continue;
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Invert white chalk to crisp dark slate ink for high-contrast OCR
      const isLight =
        st.color === '#ffffff' || st.color.toLowerCase() === '#fff' || st.color === '#f8fafc';
      ctx.strokeStyle = isLight ? '#0f172a' : st.color;
      ctx.lineWidth = Math.max(st.width * 1.25, 3.5);
      ctx.moveTo(st.points[0].x, st.points[0].y);
      for (let i = 1; i < st.points.length; i++) {
        ctx.lineTo(st.points[i].x, st.points[i].y);
      }
      ctx.stroke();
    }

    // 2. Render selected shapes
    const selectedShapesList = shapes.filter((sh) => selectedShapeIds.includes(sh.id));
    for (const sh of selectedShapesList) {
      const isLight = sh.color === '#ffffff' || sh.color.toLowerCase() === '#fff';
      ctx.strokeStyle = isLight ? '#0f172a' : sh.color;
      ctx.lineWidth = Math.max(sh.strokeWidth * 1.25, 3);
      if (sh.type === 'rectangle') {
        ctx.strokeRect(sh.x, sh.y, sh.width, sh.height);
      } else if (sh.type === 'circle') {
        ctx.beginPath();
        ctx.ellipse(
          sh.x + sh.width / 2,
          sh.y + sh.height / 2,
          sh.width / 2,
          sh.height / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else if (sh.type === 'line' || sh.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x + sh.width, sh.y + sh.height);
        ctx.stroke();
      } else if (sh.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(sh.x + sh.width / 2, sh.y);
        ctx.lineTo(sh.x + sh.width, sh.y + sh.height);
        ctx.lineTo(sh.x, sh.y + sh.height);
        ctx.closePath();
        ctx.stroke();
      }
    }

    return offscreen.toDataURL('image/png');
  }, [selectionBounds, strokes, selectedStrokeIds, shapes, selectedShapeIds]);

  // Circle to Search: Automatic Handwritten Math Equation Solver
  const handleCircleToSearchMath = () => {
    if (!onCircleToSearchAI || !selectionBounds) return;
    const cropDataUrl = getCroppedImageDataUrl();
    const count = selectedStrokeIds.length + selectedShapeIds.length;

    onCircleToSearchAI({
      prompt: `Recognize this handwritten mathematical equation or expression (${count} canvas elements) and provide a step-by-step pedagogical solution with the final answer.`,
      imageBase64: cropDataUrl || undefined,
      isMathEquation: true,
      selectionBounds: { ...selectionBounds },
    });
  };

  // Circle to Search: General AI Explanation
  const handleCircleToSearchExplain = () => {
    if (!onCircleToSearchAI || !selectionBounds) return;
    const cropDataUrl = getCroppedImageDataUrl();
    const count = selectedStrokeIds.length + selectedShapeIds.length;

    onCircleToSearchAI({
      prompt: `Explain this whiteboard drawing and diagram elements (${count} items) in detail for our lesson.`,
      imageBase64: cropDataUrl || undefined,
      isMathEquation: false,
      selectionBounds: { ...selectionBounds },
    });
  };

  return (
    <div
      ref={containerRef}
      id="classroom-whiteboard-canvas-container"
      className="relative w-full h-full overflow-hidden select-none touch-none"
      style={{
        cursor:
          activeTool === 'pan'
            ? 'grab'
            : activeTool === 'eraser'
            ? 'cell'
            : activeTool === 'lasso'
            ? 'crosshair'
            : 'crosshair',
      }}
    >
      <canvas
        ref={canvasRef}
        id="whiteboard-html5-canvas"
        className="w-full h-full block touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* LASSO SELECTION FLOATING ACTION BAR (Samsung WAF Circle-to-Search / Transform) */}
      {selectionBounds && (selectedStrokeIds.length > 0 || selectedShapeIds.length > 0) && (
        <div
          id="lasso-selection-floating-bar"
          className="absolute z-30 pointer-events-auto bg-slate-900/95 border border-cyan-400/80 rounded-2xl shadow-2xl p-1.5 flex items-center space-x-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-white"
          style={{
            left: `${selectionBounds.minX + panOffset.x + pageSlideOffset + (isDraggingSelectionRef.current ? dragSelectionOffsetRef.current.x : 0)}px`,
            top: `${Math.max(10, selectionBounds.minY + panOffset.y - 48 + (isDraggingSelectionRef.current ? dragSelectionOffsetRef.current.y : 0))}px`,
          }}
        >
          {/* Circle to Search: Solve Math (AI) */}
          {onCircleToSearchAI && (
            <button
              id="circle-to-search-solve-math-btn"
              type="button"
              onClick={handleCircleToSearchMath}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 border border-cyan-300/40"
              title="Circle to Search: Automatically recognize handwritten math equation & display step-by-step solution"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-semibold whitespace-nowrap">Circle to Search: Solve Math (AI)</span>
            </button>
          )}

          {/* Quick Explain Drawing */}
          {onCircleToSearchAI && (
            <button
              type="button"
              onClick={handleCircleToSearchExplain}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs flex items-center space-x-1 border border-slate-700"
              title="Ask Know Deep AI to explain diagram or notes"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Explain</span>
            </button>
          )}

          {/* Duplicate Selected */}
          {onDuplicateSelected && (
            <button
              type="button"
              onClick={() => onDuplicateSelected(selectedStrokeIds, selectedShapeIds)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Duplicate Selected"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Selected */}
          {onDeleteSelected && (
            <button
              type="button"
              onClick={() => {
                onDeleteSelected(selectedStrokeIds, selectedShapeIds);
                setSelectedStrokeIds([]);
                setSelectedShapeIds([]);
                setSelectionBounds(null);
              }}
              className="p-1.5 rounded-xl hover:bg-rose-900/40 text-rose-400"
              title="Delete Selected"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dismiss selection */}
          <button
            type="button"
            onClick={() => {
              setSelectedStrokeIds([]);
              setSelectedShapeIds([]);
              setSelectionBounds(null);
            }}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400"
            title="Deselect"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STUDENT ZONE HEADER BADGES (When Split Screen is Active: 2, 3, or 4 Zones) */}
      {splitZones > 1 && (
        <div className="absolute top-4 left-0 right-0 z-20 pointer-events-none flex justify-around px-8">
          {Array.from({ length: splitZones }).map((_, idx) => (
            <div
              key={`zone-badge-${idx}`}
              className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 border border-sky-300/60 dark:border-sky-900/60 rounded-full px-2.5 py-1 shadow-md flex items-center space-x-1.5 text-xs backdrop-blur-md"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'][idx % 4],
                }}
              />
              <button
                type="button"
                onClick={() => onClearZone(idx)}
                className="p-0.5 text-slate-400 hover:text-rose-500 rounded transition-colors flex items-center justify-center"
                title={`Clear Zone ${idx + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* RENDERED CANVAS STICKY NOTES & AI CARDS */}
      {notes.map((note) => {
        const theme = STICKY_COLORS[note.color || 'yellow'] || STICKY_COLORS.yellow;
        return (
          <div
            key={note.id}
            id={`canvas-note-${note.id}`}
            className={`absolute z-20 pointer-events-auto w-72 sm:w-80 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden border-2 transition-shadow ${theme.bg} ${theme.border}`}
            style={{
              left: `${note.x + panOffset.x + pageSlideOffset}px`,
              top: `${note.y + panOffset.y}px`,
            }}
          >
            {/* Note Drag Header */}
            <div
              className={`flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing text-xs select-none ${theme.header}`}
              onPointerDown={(e) => handleNotePointerDown(e, note)}
              onPointerMove={handleNotePointerMove}
              onPointerUp={handleNotePointerUp}
            >
              <div className="flex items-center space-x-1.5 font-bold truncate">
                <Pin className="w-3.5 h-3.5 fill-current" />
                <span className="truncate">{note.title || 'Sticky Note'}</span>
              </div>
              <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                {/* Ask AI to Expand note */}
                {onCircleToSearchAI && (
                  <button
                    type="button"
                    onClick={() =>
                      onCircleToSearchAI(
                        `Please explain and expand upon this whiteboard lesson note: "${note.text}"`
                      )
                    }
                    className="p-1 hover:bg-black/15 rounded text-slate-900"
                    title="Explain or expand note with Know Deep AI"
                  >
                    <Sparkles className="w-3 h-3" />
                  </button>
                )}
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => onDeleteNote(note.id)}
                  className="p-1 hover:bg-black/15 rounded text-slate-900 transition-colors"
                  title="Remove Note"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Note Body: Editable Textarea */}
            <div className="p-3">
              <textarea
                value={note.text}
                onChange={(e) => onUpdateNote(note.id, { text: e.target.value })}
                placeholder="Type lesson thoughts or student responses here..."
                rows={4}
                style={{
                  fontSize: note.fontSize ? `${note.fontSize}px` : '12px',
                }}
                className={`w-full bg-transparent resize-none border-none outline-none leading-relaxed ${
                  note.fontFamily === 'serif'
                    ? 'font-serif'
                    : note.fontFamily === 'mono'
                    ? 'font-mono'
                    : 'font-sans'
                } ${theme.text}`}
              />
            </div>

            {/* Note Formatting Toolbar */}
            <div className="px-3 pb-2.5 pt-1.5 bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {/* Font Size Selector */}
              <div className="flex items-center space-x-1">
                {[12, 24, 36].map((sz) => (
                  <button
                    key={`sz-${sz}`}
                    type="button"
                    onClick={() => onUpdateNote(note.id, { fontSize: sz as 12 | 24 | 36 })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      (note.fontSize || 12) === sz
                        ? 'bg-sky-500 text-white font-bold'
                        : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Font Family Selector */}
              <div className="flex items-center space-x-1">
                {(['sans', 'serif', 'mono'] as const).map((fam) => (
                  <button
                    key={`fam-${fam}`}
                    type="button"
                    onClick={() => onUpdateNote(note.id, { fontFamily: fam })}
                    className={`px-1.5 py-0.5 rounded text-[10px] capitalize transition-colors ${
                      (note.fontFamily || 'sans') === fam
                        ? 'bg-sky-500 text-white font-bold'
                        : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {fam}
                  </button>
                ))}
              </div>

              {/* Color Selector */}
              <div className="flex items-center space-x-1">
                {['yellow', 'blue', 'green', 'pink', 'purple'].map((col) => (
                  <button
                    key={`col-${col}`}
                    type="button"
                    onClick={() => onUpdateNote(note.id, { color: col })}
                    className={`w-3.5 h-3.5 rounded-full border border-black/10 transition-transform hover:scale-110 ${
                      col === 'yellow' ? 'bg-[#fef08a]' :
                      col === 'blue' ? 'bg-[#93c5fd]' :
                      col === 'green' ? 'bg-[#86efac]' :
                      col === 'pink' ? 'bg-[#fbcfe8]' :
                      'bg-[#c084fc]'
                    } ${note.color === col ? 'ring-2 ring-sky-500 ring-offset-1' : ''}`}
                    title={`Change color to ${col}`}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =================== HELPER DRAWING FUNCTIONS ===================

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg: WhiteboardSettings['background'],
  offsetX: number,
  offsetY: number
) {
  if (bg === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  } else if (bg === 'beige') {
    ctx.fillStyle = '#f7f5eb';
    ctx.fillRect(0, 0, width, height);
  } else if (bg === 'mint') {
    ctx.fillStyle = '#f0f9f4';
    ctx.fillRect(0, 0, width, height);
  } else if (bg === 'yellow') {
    ctx.fillStyle = '#fdfcf0';
    ctx.fillRect(0, 0, width, height);
  } else if (bg === 'chalkboard') {
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let i = 0; i < 40; i++) {
      const rx = (i * 97) % width;
      const ry = (i * 131) % height;
      ctx.fillRect(rx, ry, 60, 40);
    }
  } else if (bg === 'black') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
  } else if (bg === 'grid') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const gridSize = 25;
    const startX = (offsetX % gridSize) - gridSize;
    const startY = (offsetY % gridSize) - gridSize;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < width + gridSize; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height + gridSize; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    const majorGrid = 100;
    const majorStartX = (offsetX % majorGrid) - majorGrid;
    const majorStartY = (offsetY % majorGrid) - majorGrid;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = majorStartX; x < width + majorGrid; x += majorGrid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = majorStartY; y < height + majorGrid; y += majorGrid) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (bg === 'ruled') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const lineSpacing = 32;
    const startY = (offsetY % lineSpacing) - lineSpacing;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = startY; y < height + lineSpacing; y += lineSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    const marginX = 72 + (offsetX % width);
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginX, 0);
    ctx.lineTo(marginX, height);
    ctx.stroke();
  }
}

function drawSingleStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  bg: WhiteboardSettings['background'],
  isSelected = false
) {
  if (stroke.points.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isSelected) {
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
  }

  if (stroke.tool === 'eraser') {
    if (bg === 'chalkboard') ctx.strokeStyle = '#1b4332';
    else if (bg === 'black') ctx.strokeStyle = '#0f172a';
    else ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = stroke.width;
  } else {
    if ((bg === 'black' || bg === 'chalkboard') && stroke.color === '#0f172a') {
      ctx.strokeStyle = '#f8fafc';
    } else {
      ctx.strokeStyle = stroke.color;
    }
    ctx.lineWidth = stroke.width;
    if (stroke.opacity) ctx.globalAlpha = stroke.opacity;
  }

  const pts = stroke.points;
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
    return;
  }

  if (stroke.tool === 'calligraphy') {
    const baseWidth = stroke.width;
    const baseOpacity = stroke.opacity || 1.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = ctx.strokeStyle;

    for (let i = 1; i < pts.length; i++) {
      const p1 = pts[i - 1];
      const p2 = pts[i];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Speed Factor: faster movement creates thinner stroke (emulates brush tension)
      const speedFactor = Math.max(0.18, Math.min(1.4, 14 / (dist + 4)));
      // Pressure Factor: higher pressure makes stroke wider
      const pressureFactor = p2.pressure ? p2.pressure * 1.5 : 1.0;

      const localWidth = Math.max(1.2, Math.min(baseWidth * 2.5, baseWidth * speedFactor * pressureFactor));
      const localOpacity = Math.max(0.35, Math.min(1.0, baseOpacity * (0.35 + pressureFactor * 0.65)));

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineWidth = localWidth;
      ctx.globalAlpha = localOpacity;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }

  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
  ctx.restore();
}

function drawSingleShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeElement,
  isPreview = false,
  isSelected = false
) {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isSelected) {
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;
  }

  if (isPreview) {
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#0284c7';
  }

  const { x, y, width, height, type, rotation } = shape;

  // Apply rotation if defined
  if (rotation && rotation !== 0) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  ctx.beginPath();

  if (type === 'rectangle') {
    ctx.strokeRect(x, y, width, height);
  } else if (type === 'circle') {
    const radiusX = width / 2;
    const radiusY = height / 2;
    const centerX = x + radiusX;
    const centerY = y + radiusY;
    ctx.ellipse(centerX, centerY, Math.max(1, radiusX), Math.max(1, radiusY), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'triangle') {
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.stroke();
  } else if (type === 'line') {
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
  } else if (type === 'arrow') {
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    const headLen = 14;
    const angle = Math.atan2(-height, width);
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(
      x + width - headLen * Math.cos(angle - Math.PI / 6),
      y - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x + width, y);
    ctx.lineTo(
      x + width - headLen * Math.cos(angle + Math.PI / 6),
      y - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  } else if (type === 'star') {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const outerR = Math.min(width, height) / 2;
    const innerR = outerR / 2.5;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / 5;

    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < 5; i++) {
      let px = cx + Math.cos(rot) * outerR;
      let py = cy + Math.sin(rot) * outerR;
      ctx.lineTo(px, py);
      rot += step;

      px = cx + Math.cos(rot) * innerR;
      py = cy + Math.sin(rot) * innerR;
      ctx.lineTo(px, py);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.stroke();
  } else if (type === 'cube') {
    const size = Math.min(width, height);
    const offset = size * 0.25; // isometric/depth offset

    // Front face outline
    ctx.strokeRect(x, y + offset, size - offset, size - offset);

    // Back face outline
    ctx.strokeRect(x + offset, y, size - offset, size - offset);

    // Connect corner lines
    ctx.beginPath();
    // Top-Left corner connection
    ctx.moveTo(x, y + offset);
    ctx.lineTo(x + offset, y);
    // Top-Right corner connection
    ctx.moveTo(x + size - offset, y + offset);
    ctx.lineTo(x + size, y);
    // Bottom-Left corner connection
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + offset, y + size - offset);
    // Bottom-Right corner connection
    ctx.moveTo(x + size - offset, y + size);
    ctx.lineTo(x + size, y + size - offset);
    ctx.stroke();
  } else if (type === 'sphere') {
    const rx = width / 2;
    const ry = height / 2;
    const cx = x + rx;
    const cy = y + ry;

    // Outer silhouette boundary
    ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    ctx.stroke();

    // Equatorial horizontal belt
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry * 0.28), 0, 0, Math.PI * 2);
    ctx.stroke();

    // Prime meridian vertical belt
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(1, rx * 0.28), Math.max(1, ry), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'pyramid') {
    const baseHeight = height * 0.22;
    const apexX = x + width / 2;
    const apexY = y;

    // Corners of the square base in 3D perspective
    const b1 = { x: x + width * 0.18, y: y + height - baseHeight }; // top-left base
    const b2 = { x: x + width * 0.82, y: y + height - baseHeight }; // top-right base
    const b3 = { x: x + width, y: y + height }; // bottom-right base
    const b4 = { x: x, y: y + height }; // bottom-left base

    // Draw perspective base parallelogram
    ctx.moveTo(b1.x, b1.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.lineTo(b3.x, b3.y);
    ctx.lineTo(b4.x, b4.y);
    ctx.closePath();
    ctx.stroke();

    // Draw lines connecting apex point to each base corner
    ctx.beginPath();
    ctx.moveTo(apexX, apexY); ctx.lineTo(b1.x, b1.y);
    ctx.moveTo(apexX, apexY); ctx.lineTo(b2.x, b2.y);
    ctx.moveTo(apexX, apexY); ctx.lineTo(b3.x, b3.y);
    ctx.moveTo(apexX, apexY); ctx.lineTo(b4.x, b4.y);
    ctx.stroke();
  } else if (type === 'cylinder') {
    const rx = width / 2;
    const ry = Math.max(2, height * 0.12);
    const cx = x + rx;

    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(cx, y + ry, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bottom ellipse
    ctx.beginPath();
    ctx.ellipse(cx, y + height - ry, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Vertical columns
    ctx.beginPath();
    ctx.moveTo(x, y + ry);
    ctx.lineTo(x, y + height - ry);
    ctx.moveTo(x + width, y + ry);
    ctx.lineTo(x + width, y + height - ry);
    ctx.stroke();
  } else if (type === 'cone') {
    const rx = width / 2;
    const ry = Math.max(2, height * 0.12);
    const cx = x + rx;

    // Bottom base ellipse
    ctx.beginPath();
    ctx.ellipse(cx, y + height - ry, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Top apex point connection lines to bottom corners
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x, y + height - ry);
    ctx.moveTo(cx, y);
    ctx.lineTo(x + width, y + height - ry);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSplitZoneDividers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zones: SplitZoneCount
) {
  ctx.save();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);

  const zoneWidth = width / zones;
  for (let i = 1; i < zones; i++) {
    const x = i * zoneWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();
}

function isPointInPolygon(p: Point, polygon: Point[]): boolean {
  let isInside = false;
  let j = polygon.length - 1;
  for (let i = 0; i < polygon.length; i++) {
    if (
      (polygon[i].y > p.y) !== (polygon[j].y > p.y) &&
      p.x <
        ((polygon[j].x - polygon[i].x) * (p.y - polygon[i].y)) / (polygon[j].y - polygon[i].y) +
          polygon[i].x
    ) {
      isInside = !isInside;
    }
    j = i;
  }
  return isInside;
}
