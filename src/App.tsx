import React, { useState, useEffect, useRef } from 'react';
import {
  ToolType,
  ShapeType,
  Stroke,
  ShapeElement,
  CanvasNote,
  CanvasPage,
  WhiteboardSettings,
  SplitZoneCount,
  RulerState,
  ProtractorState,
  ClassroomSpotlightState,
  DualPenConfig,
  CircleToSearchPayload,
} from './types';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { BottomToolbar } from './components/BottomToolbar';
import { SideDrawer } from './components/SideDrawer';
import { SettingsModal } from './components/SettingsModal';
import { KnowDeepAI } from './components/KnowDeepAI';
import { TimerWidget } from './components/TimerWidget';
import { BrowserWidget } from './components/BrowserWidget';
import { InteractiveRuler } from './components/InteractiveRuler';
import { InteractiveProtractor } from './components/InteractiveProtractor';
import { SpotlightCurtainWidget } from './components/SpotlightCurtainWidget';
import { PeriodicTableModal } from './components/PeriodicTableModal';
import { ClassroomPickerModal } from './components/ClassroomPickerModal';
import { PageThumbnailDrawer } from './components/PageThumbnailDrawer';
import { QRCodeModal } from './components/QRCodeModal';
import { EmailModal } from './components/EmailModal';
import { SaveAsModal } from './components/SaveAsModal';
import { Maximize, Minimize } from 'lucide-react';
import { decodeBoardState } from './utils/shareableLink';

export default function App() {
  // Page collection & active page index
  const [pages, setPages] = useState<CanvasPage[]>([
    {
      id: 'page-1',
      title: 'Classroom Lesson 1',
      strokes: [],
      shapes: [],
      notes: [],
    },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Synchronize state values to refs to avoid stale closures in timeouts or callbacks
  const pagesRef = useRef(pages);
  const currentPageIndexRef = useRef(currentPageIndex);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    currentPageIndexRef.current = currentPageIndex;
  }, [currentPageIndex]);

  // Undo / Redo history for active page
  const [history, setHistory] = useState<CanvasPage[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasPage[]>([]);

  // Sliding page transition animation offset
  const [pageSlideOffset, setPageSlideOffset] = useState(0);

  // Fullscreen mode state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.warn('Error exiting fullscreen:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Dual Pen configuration (Samsung WAF Dual-Pen feature)
  const [dualPen, setDualPen] = useState<DualPenConfig>({
    activePen: 'penA',
    penA: { color: '#0f172a', width: 4, type: 'pen' },
    penB: { color: '#ef4444', width: 12, type: 'pen' },
  });

  // Active Drawing Tools
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [eraserSize, setEraserSize] = useState(32);
  const [eraserMode, setEraserMode] = useState<'custom' | 'palm' | 'clear'>('custom');

  // Split Screen Zones (1, 2, 3, or 4 independent student zones)
  const [splitZones, setSplitZones] = useState<SplitZoneCount>(1);

  // On-screen Measuring Ruler
  const [ruler, setRuler] = useState<RulerState>({
    visible: false,
    x: 200,
    y: 200,
    angle: 0,
    length: 500,
  });

  // On-screen Interactive Protractor (Angle measurement)
  const [protractor, setProtractor] = useState<ProtractorState>({
    visible: false,
    x: 350,
    y: 280,
    angle: 0,
    radius: 175,
  });

  // Classroom Spotlight & Curtain Suite
  const [spotlightState, setSpotlightState] = useState<ClassroomSpotlightState>({
    active: false,
    mode: 'none',
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    radius: 180,
    curtainHeight: 280,
  });

  // Floating Widgets & Modals State
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [isPeriodicTableOpen, setIsPeriodicTableOpen] = useState(false);
  const [isClassroomPickerOpen, setIsClassroomPickerOpen] = useState(false);
  const [isThumbnailDrawerOpen, setIsThumbnailDrawerOpen] = useState(false);

  // Circle to Search AI Query trigger
  const [aiSearchQuery, setAiSearchQuery] = useState<CircleToSearchPayload | string | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Samsung WAF Side Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<'left' | 'right'>('left');

  // Whiteboard Settings
  const [settings, setSettings] = useState<WhiteboardSettings>({
    multiTouchEnabled: true,
    background: 'white',
    penColor: '#0f172a',
    penWidth: 4,
    eraserSize: 32,
    gridSize: 25,
  });

  // Load saved background preference from localStorage on mount & check for shareable board link
  useEffect(() => {
    try {
      const storedBg = localStorage.getItem('WHITEBOARD_BACKGROUND') as WhiteboardSettings['background'];
      if (storedBg) {
        setSettings((prev) => ({
          ...prev,
          background: storedBg,
        }));
      }

      // Check for shared board link
      const params = new URLSearchParams(window.location.search);
      const boardData = params.get('board');
      if (boardData) {
        const decoded = decodeBoardState(boardData);
        if (decoded && decoded.length > 0) {
          setPages(decoded);
          setCurrentPageIndex(0);
        }
      }
    } catch (err) {
      console.warn('Could not load shared board state:', err);
    }
  }, []);

  const currentPage = pages[currentPageIndex] || pages[0];

  // Current active pen properties derived from dualPen
  const currentPenConfig = dualPen.activePen === 'penA' ? dualPen.penA : dualPen.penB;

  // Toggle Dual Pen (Pen A <-> Pen B)
  const handleToggleDualPen = () => {
    const nextPen = dualPen.activePen === 'penA' ? 'penB' : 'penA';
    setDualPen((prev) => ({ ...prev, activePen: nextPen }));
    const targetConfig = nextPen === 'penA' ? dualPen.penA : dualPen.penB;
    setActiveTool(targetConfig.type || 'pen');
  };

  // Change Active Pen Color
  const handleChangePenColor = (color: string) => {
    setDualPen((prev) => {
      const isA = prev.activePen === 'penA';
      return {
        ...prev,
        penA: isA ? { ...prev.penA, color } : prev.penA,
        penB: !isA ? { ...prev.penB, color } : prev.penB,
      };
    });
  };

  // Change Active Pen Width
  const handleChangePenWidth = (width: number) => {
    setDualPen((prev) => {
      const isA = prev.activePen === 'penA';
      return {
        ...prev,
        penA: isA ? { ...prev.penA, width } : prev.penA,
        penB: !isA ? { ...prev.penB, width } : prev.penB,
      };
    });
  };

  // Change Pen Sub-Mode (Standard, Shape Pen, Text Pen, Highlighter)
  const handleSelectPenMode = (mode: 'pen' | 'shape-pen' | 'text-pen' | 'highlighter') => {
    setActiveTool(mode);
    setDualPen((prev) => {
      const isA = prev.activePen === 'penA';
      return {
        ...prev,
        penA: isA ? { ...prev.penA, type: mode } : prev.penA,
        penB: !isA ? { ...prev.penB, type: mode } : prev.penB,
      };
    });
  };

  const pushToHistory = (page: CanvasPage) => {
    const clonedPage: CanvasPage = {
      ...page,
      strokes: [...page.strokes],
      shapes: [...page.shapes],
      notes: page.notes.map((n) => ({ ...n })),
    };
    setHistory((prev) => [...prev, clonedPage]);
    setRedoStack([]);
  };

  // Helper: Update strokes on current page
  const updateCurrentPageStrokes = (newStrokes: Stroke[]) => {
    pushToHistory(currentPage);

    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex ? { ...page, strokes: newStrokes } : page
      )
    );
  };

  const textPenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddStroke = (stroke: Stroke) => {
    const nextStrokes = [...currentPage.strokes, stroke];
    updateCurrentPageStrokes(nextStrokes);

    // If text pen is selected, trigger 3-second OCR conversion delay
    if (stroke.tool === 'text-pen') {
      if (textPenTimeoutRef.current) {
        clearTimeout(textPenTimeoutRef.current);
      }

      textPenTimeoutRef.current = setTimeout(async () => {
        // Retrieve fresh page reference to avoid stale closures
        const freshPages = pagesRef.current;
        const freshIndex = currentPageIndexRef.current;
        const page = freshPages[freshIndex];
        if (!page) return;

        // Extract all text-pen strokes on the current page
        const textStrokes = page.strokes.filter((s) => s.tool === 'text-pen');
        if (textStrokes.length === 0) return;

        // Compute exact bounding box of handwriting
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        textStrokes.forEach((s) => {
          s.points.forEach((p) => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
          });
        });

        if (minX === Infinity) return;

        // Draw handwriting onto a clean high-contrast offscreen canvas for optimal OCR accuracy
        const tempCanvas = document.createElement('canvas');
        const padding = 24;
        const w = (maxX - minX) + padding * 2;
        const h = (maxY - minY) + padding * 2;
        tempCanvas.width = w;
        tempCanvas.height = h;

        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // Fill background white
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, w, h);

        // Draw handwriting strokes in solid black
        tempCtx.strokeStyle = '#000000';
        tempCtx.lineWidth = 4;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';

        textStrokes.forEach((st) => {
          if (st.points.length < 2) return;
          tempCtx.beginPath();
          tempCtx.moveTo(st.points[0].x - minX + padding, st.points[0].y - minY + padding);
          for (let i = 1; i < st.points.length; i++) {
            tempCtx.lineTo(st.points[i].x - minX + padding, st.points[i].y - minY + padding);
          }
          tempCtx.stroke();
        });

        const base64Image = tempCanvas.toDataURL('image/png');

        try {
          // Send to server-side Gemini OCR endpoint
          const res = await fetch('/api/convert-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image }),
          });

          const data = await res.json();
          const recognizedText = data.success && data.text ? data.text : '[No readable text recognized]';

          const textStrokeIds = textStrokes.map((st) => st.id);

          const newNote: CanvasNote = {
            id: `text-note-${Date.now()}`,
            x: Math.max(40, minX - 20),
            y: Math.max(40, minY - 20),
            title: 'Ink-to-Text Card',
            text: recognizedText,
            color: 'blue',
            fontSize: 24,
            fontFamily: 'sans',
            timestamp: Date.now(),
          };

          // Save current state into undo history
          pushToHistory(page);

          // Update state: Filter out converted strokes and append the new editable note element
          setPages((prevPages) =>
            prevPages.map((p, idx) =>
              idx === freshIndex
                ? {
                    ...p,
                    strokes: p.strokes.filter((s) => !textStrokeIds.includes(s.id)),
                    notes: [...p.notes, newNote],
                  }
                : p
            )
          );
        } catch (error) {
          console.error('Error during ink-to-text OCR conversion:', error);
        }
      }, 3000);
    }
  };

  const handleAddShape = (shape: ShapeElement) => {
    pushToHistory(currentPage);
    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex ? { ...page, shapes: [...page.shapes, shape] } : page
      )
    );
  };

  const handleClearCanvas = () => {
    pushToHistory(currentPage);
    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex
          ? { ...page, strokes: [], shapes: [], notes: [] }
          : page
      )
    );
  };

  // Undo / Redo
  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];

    const currentClone: CanvasPage = {
      ...currentPage,
      strokes: [...currentPage.strokes],
      shapes: [...currentPage.shapes],
      notes: currentPage.notes.map((n) => ({ ...n })),
    };

    setRedoStack((prev) => [...prev, currentClone]);
    setHistory((prev) => prev.slice(0, -1));

    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex ? previousState : page
      )
    );
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];

    const currentClone: CanvasPage = {
      ...currentPage,
      strokes: [...currentPage.strokes],
      shapes: [...currentPage.shapes],
      notes: currentPage.notes.map((n) => ({ ...n })),
    };

    setHistory((prev) => [...prev, currentClone]);
    setRedoStack((prev) => prev.slice(0, -1));

    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex ? nextState : page
      )
    );
  };

  // Page Navigation & Red '+' Slide Left
  const handleAddPage = () => {
    const newPageNumber = pages.length + 1;
    const newPage: CanvasPage = {
      id: `page-${Date.now()}`,
      title: `Classroom Lesson ${newPageNumber}`,
      strokes: [],
      shapes: [],
      notes: [],
    };
    setPages((prev) => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
    setHistory([]);
    setRedoStack([]);
  };

  const handleSlidePageLeft = () => {
    setPageSlideOffset(-window.innerWidth);

    setTimeout(() => {
      const newPageNumber = pages.length + 1;
      const newPage: CanvasPage = {
        id: `page-${Date.now()}`,
        title: `Classroom Lesson ${newPageNumber}`,
        strokes: [],
        shapes: [],
        notes: [],
      };

      setPages((prev) => [...prev, newPage]);
      setCurrentPageIndex(pages.length);
      setHistory([]);
      setRedoStack([]);
      setPageSlideOffset(0);
    }, 280);
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      setHistory([]);
      setRedoStack([]);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      setHistory([]);
      setRedoStack([]);
    }
  };

  // Duplicate Page
  const handleDuplicatePage = (index: number) => {
    const pageToDup = pages[index];
    if (!pageToDup) return;
    const duplicated: CanvasPage = {
      ...pageToDup,
      id: `page-${Date.now()}`,
      title: `${pageToDup.title} (Copy)`,
      strokes: JSON.parse(JSON.stringify(pageToDup.strokes)),
      shapes: JSON.parse(JSON.stringify(pageToDup.shapes)),
      notes: JSON.parse(JSON.stringify(pageToDup.notes)),
    };
    const newPages = [...pages];
    newPages.splice(index + 1, 0, duplicated);
    setPages(newPages);
    setCurrentPageIndex(index + 1);
  };

  // Delete Page
  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      handleClearCanvas();
      return;
    }
    const newPages = pages.filter((_, idx) => idx !== index);
    setPages(newPages);
    setCurrentPageIndex(Math.max(0, index - 1));
  };

  // Notes Management & Sticky Notes
  const handleAddStickyNote = () => {
    const colors = ['yellow', 'blue', 'green', 'pink', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newNote: CanvasNote = {
      id: `sticky-${Date.now()}`,
      x: window.innerWidth / 2 - 140,
      y: window.innerHeight / 2 - 100,
      title: 'Classroom Note',
      text: 'Type student thoughts, vocabulary, or lesson concepts here...',
      color: randomColor,
      timestamp: Date.now(),
    };
    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex ? { ...page, notes: [...page.notes, newNote] } : page
      )
    );
  };

  const handlePasteToWhiteboard = (
    text: string,
    title?: string,
    position?: { x: number; y: number },
    color?: string
  ) => {
    const newNote: CanvasNote = {
      id: `note-${Date.now()}`,
      x: position ? Math.min(window.innerWidth - 340, Math.max(20, position.x)) : window.innerWidth / 2 - 160,
      y: position ? Math.min(window.innerHeight - 260, Math.max(40, position.y)) : window.innerHeight / 2 - 120,
      title: title || 'Know Deep AI Math Solution',
      text,
      color: color || 'blue',
      timestamp: Date.now(),
    };
    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex ? { ...page, notes: [...page.notes, newNote] } : page
      )
    );
  };

  const handleUpdateNote = (noteId: string, updates: Partial<CanvasNote>) => {
    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex
          ? {
              ...page,
              notes: page.notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
            }
          : page
      )
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex
          ? { ...page, notes: page.notes.filter((n) => n.id !== noteId) }
          : page
      )
    );
  };

  // Student Zone Clearing (When split zones is active)
  const handleClearZone = (zoneIndex: number) => {
    const zoneWidth = window.innerWidth / splitZones;
    const minX = zoneIndex * zoneWidth;
    const maxX = (zoneIndex + 1) * zoneWidth;

    setPages((prevPages) =>
      prevPages.map((page, idx) => {
        if (idx !== currentPageIndex) return page;
        const filteredStrokes = page.strokes.filter((stroke) => {
          return stroke.points.some((pt) => pt.x < minX || pt.x > maxX);
        });
        const filteredShapes = page.shapes.filter((shape) => {
          const shapeMidX = shape.x + shape.width / 2;
          return shapeMidX < minX || shapeMidX > maxX;
        });
        return {
          ...page,
          strokes: filteredStrokes,
          shapes: filteredShapes,
        };
      })
    );
  };

  // Lasso Actions (Duplicate, Delete, Circle-to-Search)
  const handleDuplicateSelected = (strokeIds: string[], shapeIds: string[]) => {
    setPages((prevPages) =>
      prevPages.map((page, idx) => {
        if (idx !== currentPageIndex) return page;
        const offset = 30;
        const dupStrokes: Stroke[] = page.strokes
          .filter((s) => strokeIds.includes(s.id))
          .map((s) => ({
            ...s,
            id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            points: s.points.map((p) => ({ ...p, x: p.x + offset, y: p.y + offset })),
          }));
        const dupShapes: ShapeElement[] = page.shapes
          .filter((sh) => shapeIds.includes(sh.id))
          .map((sh) => ({
            ...sh,
            id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            x: sh.x + offset,
            y: sh.y + offset,
          }));
        return {
          ...page,
          strokes: [...page.strokes, ...dupStrokes],
          shapes: [...page.shapes, ...dupShapes],
        };
      })
    );
  };

  const handleDeleteSelected = (strokeIds: string[], shapeIds: string[]) => {
    setPages((prevPages) =>
      prevPages.map((page, idx) => {
        if (idx !== currentPageIndex) return page;
        return {
          ...page,
          strokes: page.strokes.filter((s) => !strokeIds.includes(s.id)),
          shapes: page.shapes.filter((sh) => !shapeIds.includes(sh.id)),
        };
      })
    );
  };

  const handleMoveSelected = (strokeIds: string[], shapeIds: string[], dx: number, dy: number) => {
    setPages((prevPages) =>
      prevPages.map((page, idx) => {
        if (idx !== currentPageIndex) return page;
        const updatedStrokes = page.strokes.map((s) => {
          if (strokeIds.includes(s.id)) {
            return {
              ...s,
              points: s.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
            };
          }
          return s;
        });
        const updatedShapes = page.shapes.map((sh) => {
          if (shapeIds.includes(sh.id)) {
            return {
              ...sh,
              x: sh.x + dx,
              y: sh.y + dy,
            };
          }
          return sh;
        });
        return {
          ...page,
          strokes: updatedStrokes,
          shapes: updatedShapes,
        };
      })
    );
  };

  const handleRotateSelected = (shapeId: string, rotation: number) => {
    setPages((prevPages) =>
      prevPages.map((page, idx) => {
        if (idx !== currentPageIndex) return page;
        const updatedShapes = page.shapes.map((sh) => {
          if (sh.id === shapeId) {
            return {
              ...sh,
              rotation,
            };
          }
          return sh;
        });
        return {
          ...page,
          shapes: updatedShapes,
        };
      })
    );
  };

  // Protractor Draw Ray Line directly onto whiteboard
  const handleProtractorDrawRay = (
    originX: number,
    originY: number,
    angleDeg: number,
    length: number
  ) => {
    const rad = (angleDeg * Math.PI) / 180;
    const endX = originX + Math.cos(rad) * length;
    const endY = originY + Math.sin(rad) * length;

    const newShape: ShapeElement = {
      id: `ray-${Date.now()}`,
      type: 'arrow',
      x: originX,
      y: originY,
      width: endX - originX,
      height: endY - originY,
      color: currentPenConfig.color,
      strokeWidth: currentPenConfig.width,
    };
    handleAddShape(newShape);
  };

  // Side Drawer Actions
  const handleToggleDrawer = (side: 'left' | 'right') => {
    setDrawerSide(side);
    setIsDrawerOpen((prev) => (drawerSide === side ? !prev : true));
  };

  const handleNewCanvas = () => {
    if (window.confirm('Create a new blank canvas page?')) {
      const newPage: CanvasPage = {
        id: `page-${Date.now()}`,
        title: `Classroom Lesson ${pages.length + 1}`,
        strokes: [],
        shapes: [],
        notes: [],
      };
      setPages([newPage]);
      setCurrentPageIndex(0);
      setHistory([]);
      setRedoStack([]);
    }
  };

  const handleQuickSave = () => {
    const canvas = document.getElementById('whiteboard-html5-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `know-deep-whiteboard-p${currentPageIndex + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPNG = (filename: string) => {
    const canvas = document.getElementById('whiteboard-html5-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportJSON = (filename: string) => {
    const dataStr = JSON.stringify(pages, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.kdw') || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const loadedPages = JSON.parse(event.target?.result as string);
          if (Array.isArray(loadedPages) && loadedPages.length > 0) {
            setPages(loadedPages);
            setCurrentPageIndex(0);
          }
        } catch {
          alert('Could not parse project file.');
        }
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newNote: CanvasNote = {
        id: `note-img-${Date.now()}`,
        x: 100,
        y: 100,
        title: `Uploaded: ${file.name}`,
        text: `[Image Asset Attached]\n${file.name}`,
        color: 'blue',
        timestamp: Date.now(),
      };
      setPages((prevPages) =>
        prevPages.map((page, idx) =>
          idx === currentPageIndex ? { ...page, notes: [...page.notes, newNote] } : page
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.kdw,.json,image/*';
    input.onchange = (e) => {
      handleUploadImage(e as unknown as React.ChangeEvent<HTMLInputElement>);
    };
    input.click();
  };

  const handleExit = () => {
    if (window.confirm('Exit whiteboard session? Unsaved notes will be cleared.')) {
      handleClearCanvas();
    }
  };

  const getCanvasImage = () => {
    const canvas = document.getElementById('whiteboard-html5-canvas') as HTMLCanvasElement;
    return canvas ? canvas.toDataURL('image/png') : null;
  };

  const handleUpdateSettings = (newSettings: Partial<WhiteboardSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.background) {
        localStorage.setItem('WHITEBOARD_BACKGROUND', newSettings.background);
      }
      return updated;
    });
  };

  const isDarkBg = settings.background === 'black' || settings.background === 'chalkboard';

  return (
    <div
      id="know-deep-whiteboard-app"
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${
        settings.background === 'black' 
          ? 'bg-[#0f172a]' 
          : settings.background === 'chalkboard'
          ? 'bg-[#1b4332]'
          : settings.background === 'beige'
          ? 'bg-[#f7f5eb]'
          : settings.background === 'mint'
          ? 'bg-[#f0f9f4]'
          : settings.background === 'yellow'
          ? 'bg-[#fdfcf0]'
          : 'bg-slate-50'
      }`}
    >
      {/* BRANDING LOGO & FULLSCREEN TOGGLE (TOP LEFT) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto flex items-center space-x-3 select-none">
        {/* Animated Inline Logo Wrapper */}
        <div className="animate-logo-appear shrink-0">
          <svg viewBox="0 0 100 100" className={`w-12 h-12 shadow-md rounded-2xl border transition-all duration-300 ${isDarkBg ? 'border-white/30 bg-[#a0d2f3]' : 'border-slate-200 bg-[#a0d2f3]'}`}>
            {/* Rounded square light blue background */}
            <rect x="2" y="2" width="96" height="96" rx="20" fill="#a0d2f3" />
            
            {/* Stylus Pen */}
            {/* Pencil body */}
            <path d="M 24 28 L 30 28 L 30 84 L 24 84 Z" fill="#ffffff" />
            {/* Pencil tip cone */}
            <path d="M 24 28 L 27 16 L 30 28 Z" fill="#ffffff" />
            {/* Pencil tip dark point / lead */}
            <path d="M 26.5 18 L 27 16 L 27.5 18 Z" fill={isDarkBg ? "#ffffff" : "#4b5563"} />
            {/* Pill button on pencil */}
            <rect x="25.5" y="44" width="3.5" height="16" rx="1.5" fill={isDarkBg ? "#ffffff" : "#1e293b"} />
            
            {/* Wavy strokes */}
            <path d="M 44 32 Q 50 18 55 27 T 68 26 T 82 25" fill="none" stroke={isDarkBg ? "#ffffff" : "#1e293b"} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 44 50 Q 50 36 55 45 T 68 44 T 82 43" fill="none" stroke={isDarkBg ? "#ffffff" : "#1e293b"} strokeWidth="5.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Sliding Text Brand Container */}
        <div className="animate-text-slide-in flex flex-col items-start leading-none pr-1">
          <h1 className={`text-xl sm:text-2xl font-black tracking-tight leading-none drop-shadow-sm transition-colors duration-300 ${isDarkBg ? 'text-white' : 'text-slate-800'}`}>
            Whiteboard
          </h1>
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-1 transition-colors duration-300 ${isDarkBg ? 'text-cyan-300' : 'text-cyan-600'}`}>
            by Know Deep
          </span>
        </div>

        {/* Dynamic, modern Fullscreen button with ripple and sleek hover state */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`flex items-center justify-center w-9 h-9 rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 border ${
            isDarkBg 
              ? 'bg-slate-900/80 hover:bg-slate-800 text-white border-slate-700 hover:border-slate-600' 
              : 'bg-white/90 hover:bg-cyan-50 text-slate-700 hover:text-cyan-600 border-slate-200 hover:border-cyan-200'
          }`}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* 1. FULLSCREEN HTML5 CANVAS */}
      <WhiteboardCanvas
        strokes={currentPage.strokes}
        shapes={currentPage.shapes}
        notes={currentPage.notes}
        activeTool={activeTool}
        selectedShape={selectedShape}
        penColor={currentPenConfig.color}
        penWidth={currentPenConfig.width}
        eraserSize={eraserSize}
        eraserMode={eraserMode}
        settings={settings}
        splitZones={splitZones}
        pageSlideOffset={pageSlideOffset}
        onAddStroke={handleAddStroke}
        onAddShape={handleAddShape}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onClearZone={handleClearZone}
        onCircleToSearchAI={(query) => {
          setAiSearchQuery(query);
          setIsAIOpen(true);
        }}
        onDuplicateSelected={handleDuplicateSelected}
        onDeleteSelected={handleDeleteSelected}
        onMoveSelected={handleMoveSelected}
        onRotateSelected={handleRotateSelected}
        onUpdateEraserSize={setEraserSize}
      />

      {/* 1. CORE DRAWING & TEACHING TOOLBAR (BOTTOM CENTER) */}
      <BottomToolbar
        activeTool={activeTool}
        selectedShape={selectedShape}
        penColor={currentPenConfig.color}
        penWidth={currentPenConfig.width}
        eraserSize={eraserSize}
        dualPen={dualPen}
        isRulerVisible={ruler.visible}
        isProtractorVisible={protractor.visible}
        spotlightState={spotlightState}
        isBrowserOpen={isBrowserOpen}
        isTimerOpen={isTimerOpen}
        isThumbnailDrawerOpen={isThumbnailDrawerOpen}
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        isAIOpen={isAIOpen}
        drawerSide={drawerSide}
        eraserMode={eraserMode}
        onChangeEraserMode={setEraserMode}
        onSelectTool={setActiveTool}
        onSelectShape={setSelectedShape}
        onChangePenColor={handleChangePenColor}
        onChangePenWidth={handleChangePenWidth}
        onChangeEraserSize={setEraserSize}
        onToggleDualPen={handleToggleDualPen}
        onSelectPenMode={handleSelectPenMode}
        onClearCanvas={handleClearCanvas}
        onToggleRuler={() => setRuler((r) => ({ ...r, visible: !r.visible }))}
        onToggleProtractor={() => setProtractor((p) => ({ ...p, visible: !p.visible }))}
        onToggleSpotlight={() =>
          setSpotlightState((s) => ({
            ...s,
            active: s.mode === 'spotlight' && s.active ? false : true,
            mode: 'spotlight',
          }))
        }
        onToggleCurtain={() =>
          setSpotlightState((s) => ({
            ...s,
            active: s.mode === 'curtain' && s.active ? false : true,
            mode: 'curtain',
          }))
        }
        onOpenPeriodicTable={() => setIsPeriodicTableOpen(true)}
        onOpenClassroomPicker={() => setIsClassroomPickerOpen(true)}
        onAddStickyNote={handleAddStickyNote}
        onSlidePageLeft={handleSlidePageLeft}
        onToggleBrowser={() => setIsBrowserOpen(!isBrowserOpen)}
        onToggleTimer={() => setIsTimerOpen(!isTimerOpen)}
        onToggleThumbnailDrawer={() => setIsThumbnailDrawerOpen(!isThumbnailDrawerOpen)}
        onToggleAI={() => setIsAIOpen(!isAIOpen)}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* 2. DUAL-SIDE ACCESSIBILITY & THREE-LINE MENU DRAWER */}
      <SideDrawer
        isOpen={isDrawerOpen}
        drawerSide={drawerSide}
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        splitZones={splitZones}
        onToggleDrawer={handleToggleDrawer}
        onCloseDrawer={() => setIsDrawerOpen(false)}
        onSwitchSide={(side) => setDrawerSide(side)}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onNewCanvas={handleNewCanvas}
        onOpenFile={handleOpenFile}
        onQuickSave={handleQuickSave}
        onOpenSaveAs={() => setIsSaveAsOpen(true)}
        onUploadImage={handleUploadImage}
        onOpenQRCode={() => setIsQRCodeOpen(true)}
        onOpenEmail={() => setIsEmailOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExit={handleExit}
        onChangeSplitZones={setSplitZones}
        onAddPage={handleAddPage}
        onOpenPagePreview={() => setIsThumbnailDrawerOpen(true)}
      />

      {/* 4. KNOW DEEP AI ASSISTANT IN MAIN AREA WITH CIRCLE-TO-SEARCH INTEGRATION */}
      <KnowDeepAI
        settings={settings}
        onPasteToWhiteboard={handlePasteToWhiteboard}
        externalQuery={aiSearchQuery}
        onClearExternalQuery={() => setAiSearchQuery(null)}
        isOpen={isAIOpen}
        drawerSide={drawerSide}
        onClose={() => setIsAIOpen(false)}
        onOpen={() => setIsAIOpen(true)}
      />

      {/* SAMSUNG WAF SPOTLIGHT & QUIZ CURTAIN WIDGET */}
      <SpotlightCurtainWidget
        state={spotlightState}
        onUpdate={(updated) => setSpotlightState((s) => ({ ...s, ...updated }))}
        onClose={() => setSpotlightState((s) => ({ ...s, active: false, mode: 'none' }))}
      />

      {/* INTERACTIVE MEASURING RULER */}
      <InteractiveRuler
        ruler={ruler}
        onChange={setRuler}
        onClose={() => setRuler((r) => ({ ...r, visible: false }))}
      />

      {/* INTERACTIVE MEASURING PROTRACTOR */}
      <InteractiveProtractor
        protractor={protractor}
        onUpdate={(updated) => setProtractor((p) => ({ ...p, ...updated }))}
        onDrawAngleLine={handleProtractorDrawRay}
        onClose={() => setProtractor((p) => ({ ...p, visible: false }))}
      />

      {/* SAMSUNG WAF PAGE THUMBNAIL DRAWER */}
      <PageThumbnailDrawer
        isOpen={isThumbnailDrawerOpen}
        pages={pages}
        currentPageIndex={currentPageIndex}
        onSelectPage={(idx) => {
          setCurrentPageIndex(idx);
          setIsThumbnailDrawerOpen(false);
        }}
        onAddPage={handleSlidePageLeft}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onClose={() => setIsThumbnailDrawerOpen(false)}
      />

      {/* PERIODIC TABLE 118-ELEMENT SCIENCE TOOL */}
      <PeriodicTableModal
        isOpen={isPeriodicTableOpen}
        onClose={() => setIsPeriodicTableOpen(false)}
        onStampElement={(el) => {
          handlePasteToWhiteboard(
            `⚛️ ELEMENT: ${el.name} (${el.symbol})\n• Atomic Number: ${el.number}\n• Atomic Mass: ${el.mass} u\n• Group: ${el.group} | Period: ${el.period}\n• Category: ${el.category}`,
            `Element #${el.number} - ${el.name}`
          );
          setIsPeriodicTableOpen(false);
        }}
      />

      {/* CLASSROOM DICE ROLLER & STUDENT PICKER */}
      <ClassroomPickerModal
        isOpen={isClassroomPickerOpen}
        onClose={() => setIsClassroomPickerOpen(false)}
        onStampResult={(text, title) => {
          handlePasteToWhiteboard(text, title);
          setIsClassroomPickerOpen(false);
        }}
      />

      {/* SMARTWATCH FLOATING TIMER WIDGET */}
      <TimerWidget
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />

      {/* CONSTRAINED CLASSROOM WEB BROWSER WINDOW */}
      <BrowserWidget
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
      />

      {/* 3. SETTINGS MODAL & API KEY MANAGEMENT */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* QR CODE STUDENT SCREEN SHARE MODAL */}
      <QRCodeModal
        isOpen={isQRCodeOpen}
        onClose={() => setIsQRCodeOpen(false)}
      />

      {/* EMAIL BOARD SUMMARY MODAL */}
      <EmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        getCanvasImage={getCanvasImage}
        pages={pages}
      />

      {/* SAVE AS MODAL */}
      <SaveAsModal
        isOpen={isSaveAsOpen}
        onClose={() => setIsSaveAsOpen(false)}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onPrintPDF={handlePrintPDF}
      />
    </div>
  );
}
