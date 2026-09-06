import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { ShareLinkModal } from './components/ShareLinkModal';
import { EmailModal } from './components/EmailModal';
import { SaveAsModal } from './components/SaveAsModal';
import { PPTUploaderModal, PPTSlide } from './components/PPTUploaderModal';
import { QuizGeneratorModal } from './components/QuizGeneratorModal';
import { WhiteboardLogo } from './components/WhiteboardLogo';
import { WhiteboardSearchBar } from './components/WhiteboardSearchBar';
import { PPTPresentationOverlay, ActivePresentationState } from './components/PPTPresentationOverlay';
import { renderSlideToGraphicDataUrl } from './utils/slideRenderer';
import { exportWhiteboardToPDF } from './utils/pdfExport';
import { Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { decodeBoardState } from './utils/shareableLink';
import { OCRSearchMatch, CameraFocusTarget } from './types';

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
  const [isConvertingText, setIsConvertingText] = useState(false);

  // Active PPT presentation overlay state (Goodly style presenter)
  const [activePresentation, setActivePresentation] = useState<ActivePresentationState | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

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
  const [isShareLinkOpen, setIsShareLinkOpen] = useState(false);
  const [isGeminiKeyOpen, setIsGeminiKeyOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [isPeriodicTableOpen, setIsPeriodicTableOpen] = useState(false);
  const [isClassroomPickerOpen, setIsClassroomPickerOpen] = useState(false);
  const [isThumbnailDrawerOpen, setIsThumbnailDrawerOpen] = useState(false);
  const [isPPTModalOpen, setIsPPTModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  // Circle to Search AI Query trigger
  const [aiSearchQuery, setAiSearchQuery] = useState<CircleToSearchPayload | string | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Samsung WAF Side Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<'left' | 'right'>('left');

  // OCR & Keyword Handwriting Search State
  const [searchHighlight, setSearchHighlight] = useState<OCRSearchMatch | null>(null);
  const [cameraFocusTarget, setCameraFocusTarget] = useState<CameraFocusTarget | null>(null);

  const getCanvasSnapshotBase64 = useCallback((): string | null => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    try {
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  }, []);

  const handleFocusOCRMatch = useCallback((match: OCRSearchMatch) => {
    setSearchHighlight(match);
    setCameraFocusTarget({
      x: match.x,
      y: match.y,
      width: match.width,
      height: match.height,
      highlightText: match.text,
      source: match.source,
    });
  }, []);

  const handleClearSearchHighlight = useCallback(() => {
    setSearchHighlight(null);
    setCameraFocusTarget(null);
  }, []);

  // Whiteboard Settings
  const [settings, setSettings] = useState<WhiteboardSettings>({
    multiTouchEnabled: true,
    background: 'white',
    penColor: '#0f172a',
    penWidth: 4,
    eraserSize: 32,
    gridSize: 25,
    autoRecognizeShapes: false,
    handwritingToText: false,
    snapToGrid: false,
    toolbarSize: 'normal',
    studentMode: false,
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

  // Change Pen Sub-Mode (Standard, Calligraphy, Pencil, Shape Pen, Text Pen, Highlighter)
  const handleSelectPenMode = (
    mode: 'pen' | 'pencil' | 'calligraphy' | 'shape-pen' | 'text-pen' | 'highlighter'
  ) => {
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
          setIsConvertingText(true);
          // Send to server-side Gemini OCR endpoint
          const res = await fetch('/api/convert-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image }),
          });

          const data = await res.json();
          const recognizedText = data.success && data.text ? data.text.trim() : '';

          const textStrokeIds = textStrokes.map((st) => st.id);
          const hasNoText = recognizedText === '' || recognizedText.includes('[No readable text recognized]') || recognizedText.includes('[No clear text recognized]');

          const newTextShape: ShapeElement | null = hasNoText ? null : {
            id: `text-shape-${Date.now()}`,
            type: 'text',
            x: Math.max(40, minX - 20),
            y: Math.max(40, minY - 20),
            width: Math.max(250, maxX - minX + 40),
            height: Math.max(100, maxY - minY + 40),
            text: recognizedText,
            color: currentPenConfig.color,
            strokeWidth: 2,
            fontSize: 24,
            fontFamily: 'sans',
          };

          // Save current state into undo history
          pushToHistory(page);

          // Update state: Filter out converted strokes and append the new editable text element if recognized
          setPages((prevPages) =>
            prevPages.map((p, idx) =>
              idx === freshIndex
                ? {
                    ...p,
                    strokes: p.strokes.filter((s) => !textStrokeIds.includes(s.id)),
                    shapes: newTextShape ? [...p.shapes, newTextShape] : p.shapes,
                  }
                : p
            )
          );
        } catch (error) {
          console.error('Error during ink-to-text OCR conversion:', error);
        } finally {
          setIsConvertingText(false);
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

  // Start Goodly-style PPT Presentation
  const handleStartPresentation = (slides: PPTSlide[]) => {
    setActivePresentation({
      slides,
      currentSlideIndex: 0,
      isCoverPage: true,
      theme: 'modern-blue',
    });
  };

  const handleNextSlide = () => {
    setActivePresentation((prev) => {
      if (!prev) return null;
      const nextIdx = Math.min(prev.slides.length - 1, prev.currentSlideIndex + 1);
      return { ...prev, currentSlideIndex: nextIdx };
    });
  };

  const handlePrevSlide = () => {
    setActivePresentation((prev) => {
      if (!prev) return null;
      const prevIdx = Math.max(0, prev.currentSlideIndex - 1);
      return { ...prev, currentSlideIndex: prevIdx };
    });
  };

  const handleJumpToSlide = (index: number) => {
    setActivePresentation((prev) => {
      if (!prev) return null;
      return { ...prev, currentSlideIndex: Math.max(0, Math.min(prev.slides.length - 1, index)) };
    });
  };

  const handleToggleCoverPage = () => {
    setActivePresentation((prev) => {
      if (!prev) return null;
      return { ...prev, isCoverPage: !prev.isCoverPage };
    });
  };

  const handleChangePresentationTheme = (
    theme: 'modern-blue' | 'dark-slate' | 'emerald' | 'warm-amber'
  ) => {
    setActivePresentation((prev) => {
      if (!prev) return null;
      return { ...prev, theme };
    });
  };

  // Import all PPT Slides as new whiteboard pages with graphic slide images (not text sticky notes)
  const handleImportAllSlidesAsPages = (slides: PPTSlide[]) => {
    const newPages: CanvasPage[] = slides.map((s, idx) => {
      const slideImageUrl = renderSlideToGraphicDataUrl(s, idx, slides.length, 'modern-blue');
      const slideImageShape: ShapeElement = {
        id: `shape-slide-img-${Date.now()}-${idx}`,
        type: 'image',
        x: Math.max(20, (window.innerWidth - 1100) / 2),
        y: Math.max(20, (window.innerHeight - 620) / 2),
        width: 1100,
        height: 618,
        color: '#06b6d4',
        strokeWidth: 0,
        imageUrl: slideImageUrl,
      };

      return {
        id: `page-ppt-${Date.now()}-${idx}`,
        title: `Slide ${s.id}: ${s.title.slice(0, 24)}`,
        strokes: [],
        shapes: [slideImageShape],
        notes: [],
      };
    });

    setPages((prev) => [...prev, ...newPages]);
    setCurrentPageIndex(pages.length);
  };

  // Insert a single PPT slide as a graphic image directly on the whiteboard canvas
  const handleInsertSlideToCurrentPage = (slide: PPTSlide) => {
    const slideImageUrl = renderSlideToGraphicDataUrl(slide, 0, 1, 'modern-blue');
    const slideImageShape: ShapeElement = {
      id: `shape-slide-img-${Date.now()}`,
      type: 'image',
      x: Math.max(30, (window.innerWidth - 960) / 2),
      y: Math.max(30, (window.innerHeight - 540) / 2),
      width: 960,
      height: 540,
      color: '#06b6d4',
      strokeWidth: 0,
      imageUrl: slideImageUrl,
    };

    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex ? { ...page, shapes: [...page.shapes, slideImageShape] } : page
      )
    );
  };

  // Stamp quiz questions directly onto the whiteboard
  const handleStampQuizToWhiteboard = (
    questions: { id: number; question: string; options: string[]; correctIndex: number; explanation: string }[]
  ) => {
    const newNotes: CanvasNote[] = questions.map((q, idx) => {
      const formattedText =
        `### ❓ Quiz Q${q.id}\n${q.question}\n\n` +
        q.options.map((opt, oIdx) => `${String.fromCharCode(65 + oIdx)}. ${opt}`).join('\n') +
        `\n\n*(Answer: ${String.fromCharCode(65 + q.correctIndex)} — ${q.explanation})*`;

      return {
        id: `note-quiz-${Date.now()}-${idx}`,
        x: 100 + (idx % 3) * 310,
        y: 100 + Math.floor(idx / 3) * 240,
        title: `❓ Quiz Q${q.id}`,
        text: formattedText,
        color: idx % 2 === 0 ? 'green' : 'yellow',
        timestamp: Date.now(),
      };
    });

    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex ? { ...page, notes: [...page.notes, ...newNotes] } : page
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

  const handleUpdateShape = (shapeId: string, updates: Partial<ShapeElement>) => {
    setPages((prevPages) =>
      prevPages.map((page, idx) =>
        idx === currentPageIndex
          ? {
              ...page,
              shapes: page.shapes.map((sh) => (sh.id === shapeId ? { ...sh, ...updates } : sh)),
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

  const handleResizeSelected = (shapeId: string, width: number, height: number) => {
    setPages((prevPages) =>
      prevPages.map((page, idx) => {
        if (idx !== currentPageIndex) return page;
        const updatedShapes = page.shapes.map((sh) => {
          if (sh.id === shapeId) {
            return {
              ...sh,
              width,
              height,
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

  const handleExportPDF = async (exportAll = false) => {
    setIsExportingPDF(true);
    try {
      await exportWhiteboardToPDF(pages, currentPageIndex, settings, activePresentation, exportAll);
    } catch (err) {
      console.error('PDF export error:', err);
      try {
        window.print();
      } catch (printErr) {
        console.warn('Fallback print error:', printErr);
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrintPDF = () => {
    handleExportPDF(false);
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
      const base64Url = event.target?.result as string;
      const newImageShape: ShapeElement = {
        id: `shape-img-${Date.now()}`,
        type: 'image',
        x: 150,
        y: 150,
        width: 400,
        height: 300,
        color: '#ffffff',
        strokeWidth: 0,
        imageUrl: base64Url,
      };
      setPages((prevPages) =>
        prevPages.map((page, idx) =>
          idx === currentPageIndex ? { ...page, shapes: [...page.shapes, newImageShape] } : page
        )
      );
      setActiveTool('lasso');
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

  const isDarkBg =
    settings.background === 'black' ||
    settings.background === 'chalkboard' ||
    settings.background === 'midnight' ||
    settings.background === 'graphite';

  return (
    <div
      id="know-deep-whiteboard-app"
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${
        settings.background === 'black' 
          ? 'bg-[#0f172a]' 
          : settings.background === 'midnight'
          ? 'bg-[#0b1528]'
          : settings.background === 'graphite'
          ? 'bg-[#181d24]'
          : settings.background === 'chalkboard'
          ? 'bg-[#1b4332]'
          : settings.background === 'beige'
          ? 'bg-[#f7f5eb]'
          : settings.background === 'mint'
          ? 'bg-[#f0f9f4]'
          : settings.background === 'yellow'
          ? 'bg-[#fdfcf0]'
          : settings.background === 'skyblue'
          ? 'bg-[#e0f2fe]'
          : settings.background === 'peach'
          ? 'bg-[#ffedd5]'
          : settings.background === 'lavender'
          ? 'bg-[#f3e8ff]'
          : settings.background === 'rose'
          ? 'bg-[#ffe4e6]'
          : 'bg-slate-50'
      }`}
    >
      {/* BRANDING LOGO, TITLE & FULLSCREEN TOGGLE (TOP LEFT CORNER) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto flex items-center space-x-3 select-none">
        {/* Whiteboard Note Logo from user photo */}
        <WhiteboardLogo size={40} className="shrink-0" />

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

      {/* OCR HANDWRITING & KEYWORD SEARCH BAR (TOP CENTER) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center justify-center">
        <WhiteboardSearchBar
          isDarkBg={isDarkBg}
          strokes={currentPage.strokes}
          shapes={currentPage.shapes}
          notes={currentPage.notes}
          onFocusMatch={handleFocusOCRMatch}
          onClearHighlight={handleClearSearchHighlight}
          getCanvasSnapshotBase64={getCanvasSnapshotBase64}
        />
      </div>

      {/* 5. GOODLY-STYLE PPT PRESENTATION SLIDE OVERLAY (Full Board Cover / Windowed, Attached Controls, Top-Right Cross) */}
      <PPTPresentationOverlay
        presentation={activePresentation}
        onClose={() => setActivePresentation(null)}
        onNextSlide={handleNextSlide}
        onPrevSlide={handlePrevSlide}
        onJumpToSlide={handleJumpToSlide}
        onToggleCoverPage={handleToggleCoverPage}
        onChangeTheme={handleChangePresentationTheme}
        onExportCurrentSlidePDF={() => handleExportPDF(false)}
      />

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
        searchHighlight={searchHighlight}
        cameraFocusTarget={cameraFocusTarget}
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
        onResizeSelected={handleResizeSelected}
        onUpdateShape={handleUpdateShape}
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
        onOpenQuizGenerator={() => setIsQuizModalOpen(true)}
        onOpenPPTUploader={() => setIsPPTModalOpen(true)}
        onAddStickyNote={handleAddStickyNote}
        onSlidePageLeft={handleSlidePageLeft}
        onToggleBrowser={() => setIsBrowserOpen(!isBrowserOpen)}
        onToggleTimer={() => setIsTimerOpen(!isTimerOpen)}
        onToggleThumbnailDrawer={() => setIsThumbnailDrawerOpen(!isThumbnailDrawerOpen)}
        onToggleAI={() => setIsAIOpen(!isAIOpen)}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* AI Conversion Toast */}
      <AnimatePresence>
        {isConvertingText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
          >
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="font-medium tracking-wide">Refining handwriting with AI...</span>
          </motion.div>
        )}
      </AnimatePresence>

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
        onExportPDF={handlePrintPDF}
        onUploadImage={handleUploadImage}
        onOpenQRCode={() => setIsShareLinkOpen(true)}
        onOpenEmail={() => setIsEmailOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPPTUploader={() => setIsPPTModalOpen(true)}
        isStudentMode={settings.studentMode}
        onToggleStudentMode={() => handleUpdateSettings({ studentMode: !settings.studentMode })}
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
          // Generate inline SVG Data URL for the element card
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="220" viewBox="0 0 180 220" style="background:#090d16; font-family:sans-serif; rx:16px;">
            <rect width="180" height="220" rx="16" fill="#0f172a" stroke="#06b6d4" stroke-width="3"/>
            <text x="16" y="28" font-size="14" font-weight="bold" fill="#06b6d4">${el.number}</text>
            <text x="160" y="28" font-size="10" font-weight="bold" fill="#94a3b8" text-anchor="end">${el.category.toUpperCase().slice(0,8)}</text>
            <text x="90" y="105" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">${el.symbol}</text>
            <text x="90" y="145" font-size="16" font-weight="bold" fill="#38bdf8" text-anchor="middle">${el.name}</text>
            <text x="90" y="175" font-size="12" fill="#cbd5e1" text-anchor="middle">Mass: ${el.mass} u</text>
            <text x="90" y="195" font-size="10" fill="#64748b" text-anchor="middle">Group ${el.group} • Period ${el.period}</text>
          </svg>`;
          const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svgContent);

          const newImageShape: ShapeElement = {
            id: `shape-elem-img-${Date.now()}`,
            type: 'image',
            x: window.innerWidth / 2 - 90,
            y: window.innerHeight / 2 - 110,
            width: 180,
            height: 220,
            color: '#06b6d4',
            strokeWidth: 2,
            imageUrl: svgDataUrl,
          };

          const newTextShape: ShapeElement = {
            id: `shape-elem-txt-${Date.now() + 1}`,
            type: 'text',
            x: window.innerWidth / 2 + 100,
            y: window.innerHeight / 2 - 50,
            width: 260,
            height: 100,
            color: '#06b6d4',
            strokeWidth: 2,
            text: `⚛️ ${el.name} (${el.symbol})\nAtomic Number: ${el.number}\nAtomic Mass: ${el.mass} u\nCategory: ${el.category}`,
            fontSize: 16,
          };

          setPages((prevPages) =>
            prevPages.map((page, idx) =>
              idx === currentPageIndex
                ? { ...page, shapes: [...page.shapes, newImageShape, newTextShape] }
                : page
            )
          );
          setIsPeriodicTableOpen(false);
        }}
        onStampFullTableImage={() => {
          const fullTableShape: ShapeElement = {
            id: `shape-full-periodic-${Date.now()}`,
            type: 'image',
            x: Math.max(20, window.innerWidth / 2 - 350),
            y: Math.max(40, window.innerHeight / 2 - 220),
            width: 700,
            height: 440,
            color: '#06b6d4',
            strokeWidth: 2,
            imageUrl: '/periodic-table.svg',
          };
          setPages((prevPages) =>
            prevPages.map((page, idx) =>
              idx === currentPageIndex
                ? { ...page, shapes: [...page.shapes, fullTableShape] }
                : page
            )
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

      {/* SHARE LINK STUDENT SCREEN SHARE MODAL */}
      <ShareLinkModal
        isOpen={isShareLinkOpen}
        onClose={() => setIsShareLinkOpen(false)}
      />

      {/* EMAIL BOARD SUMMARY MODAL */}
      <EmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        getCanvasImage={getCanvasImage}
        pages={pages}
      />

      {/* PPT / SLIDES UPLOADER & VIEWER MODAL */}
      <PPTUploaderModal
        isOpen={isPPTModalOpen}
        onClose={() => setIsPPTModalOpen(false)}
        onImportAllPages={handleImportAllSlidesAsPages}
        onInsertSlideToCurrentPage={handleInsertSlideToCurrentPage}
        onStartPresentation={handleStartPresentation}
      />

      {/* INTERACTIVE CLASSROOM QUIZ GENERATOR MODAL */}
      <QuizGeneratorModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        notes={currentPage?.notes || []}
        strokes={currentPage?.strokes || []}
        shapes={currentPage?.shapes || []}
        onStampQuizToWhiteboard={handleStampQuizToWhiteboard}
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
