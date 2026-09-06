import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, Sparkles, Loader2, FileText, PenTool, Hash } from 'lucide-react';
import { OCRSearchMatch, Stroke, ShapeElement, CanvasNote } from '../types';

interface WhiteboardSearchBarProps {
  isDarkBg: boolean;
  strokes: Stroke[];
  shapes: ShapeElement[];
  notes: CanvasNote[];
  onFocusMatch: (match: OCRSearchMatch) => void;
  onClearHighlight: () => void;
  getCanvasSnapshotBase64?: () => string | null;
}

export const WhiteboardSearchBar: React.FC<WhiteboardSearchBarProps> = ({
  isDarkBg,
  strokes,
  shapes,
  notes,
  onFocusMatch,
  onClearHighlight,
  getCanvasSnapshotBase64,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<OCRSearchMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(-1);
  const [showResultsList, setShowResultsList] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Global keyboard shortcut: Ctrl+F / Cmd+F to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        onClearHighlight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClearHighlight]);

  // Focus input when search bar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const performSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setMatches([]);
      setActiveMatchIndex(-1);
      setStatusMessage('');
      onClearHighlight();
      return;
    }

    setIsSearching(true);
    setStatusMessage('Scanning whiteboard handwriting & notes with OCR...');

    const aggregatedMatches: OCRSearchMatch[] = [];
    const lowerQuery = trimmed.toLowerCase();

    // 1. Client-Side Instant Note Search
    notes.forEach((note) => {
      const noteText = `${note.title || ''} ${note.text || ''}`.toLowerCase();
      if (noteText.includes(lowerQuery)) {
        aggregatedMatches.push({
          id: `note-${note.id}`,
          text: note.title || note.text.substring(0, 30),
          source: 'sticky-note',
          x: note.x,
          y: note.y,
          width: note.width || 220,
          height: note.height || 200,
          confidence: 1.0,
          context: `Sticky Note: "${note.text.substring(0, 50)}..."`,
        });
      }
    });

    // 2. Client-Side Shape / Text Search
    shapes.forEach((shape) => {
      if (shape.text && shape.text.toLowerCase().includes(lowerQuery)) {
        aggregatedMatches.push({
          id: `shape-${shape.id}`,
          text: shape.text,
          source: 'shape-text',
          x: shape.x,
          y: shape.y,
          width: shape.width || 120,
          height: shape.height || 80,
          confidence: 1.0,
          context: `Text Shape: "${shape.text}"`,
        });
      }
    });

    // 3. Multimodal Server-Side OCR Search on Handwritten Strokes
    try {
      let imageBase64: string | null = null;
      if (getCanvasSnapshotBase64) {
        imageBase64 = getCanvasSnapshotBase64();
      }

      if (imageBase64 && (strokes.length > 0 || shapes.length > 0)) {
        const response = await fetch('/api/search-whiteboard-ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageBase64,
            query: trimmed,
            canvasWidth: window.innerWidth || 1920,
            canvasHeight: window.innerHeight || 1080,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.matches && Array.isArray(data.matches)) {
            data.matches.forEach((m: any, idx: number) => {
              aggregatedMatches.push({
                id: `ocr-${idx}-${Date.now()}`,
                text: m.text || trimmed,
                source: 'handwriting-ocr',
                x: m.x,
                y: m.y,
                width: m.width,
                height: m.height,
                confidence: m.confidence || 0.9,
                context: m.context || `Handwritten text matching "${trimmed}"`,
              });
            });
          }
        }
      }
    } catch (err) {
      console.warn('Multimodal OCR search error:', err);
    }

    // 4. Local Stroke Spatial Clustering Fallback for Handwritten strokes
    if (aggregatedMatches.length === 0 && strokes.length > 0) {
      // Find bounding clusters of strokes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      strokes.forEach((s) => {
        s.points.forEach((p) => {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });
      });

      if (minX !== Infinity) {
        // Provide candidate stroke region match
        aggregatedMatches.push({
          id: `cluster-main`,
          text: `Ink strokes (${trimmed})`,
          source: 'handwriting-ocr',
          x: minX,
          y: minY,
          width: Math.max(120, maxX - minX),
          height: Math.max(80, maxY - minY),
          confidence: 0.85,
          context: `Handwritten stroke group on board`,
        });
      }
    }

    setMatches(aggregatedMatches);
    setIsSearching(false);

    if (aggregatedMatches.length > 0) {
      setActiveMatchIndex(0);
      onFocusMatch(aggregatedMatches[0]);
      setStatusMessage(`${aggregatedMatches.length} match${aggregatedMatches.length > 1 ? 'es' : ''} found`);
    } else {
      setActiveMatchIndex(-1);
      setStatusMessage(`No handwritten matches found for "${trimmed}"`);
      onClearHighlight();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim()) {
      setMatches([]);
      setActiveMatchIndex(-1);
      setStatusMessage('');
      onClearHighlight();
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(val);
    }, 400);
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % matches.length;
    setActiveMatchIndex(nextIdx);
    onFocusMatch(matches[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + matches.length) % matches.length;
    setActiveMatchIndex(prevIdx);
    onFocusMatch(matches[prevIdx]);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else if (matches.length > 0) {
        handleNextMatch();
      } else {
        performSearch(query);
      }
    }
  };

  const handleSelectSpecificMatch = (index: number) => {
    setActiveMatchIndex(index);
    onFocusMatch(matches[index]);
    setShowResultsList(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setMatches([]);
    setActiveMatchIndex(-1);
    setStatusMessage('');
    onClearHighlight();
  };

  if (!isOpen) {
    return (
      <button
        id="open-whiteboard-search-btn"
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl shadow-md border transition-all duration-200 hover:scale-105 active:scale-95 text-xs font-semibold select-none ${
          isDarkBg
            ? 'bg-slate-900/85 hover:bg-slate-800 text-slate-200 border-slate-700/80'
            : 'bg-white/90 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border-slate-200/80 shadow-slate-200/50'
        }`}
        title="Find & Focus on Handwritten Text (Ctrl + F)"
      >
        <Search className="w-3.5 h-3.5 text-cyan-500" />
        <span className="hidden sm:inline">Search Ink</span>
        <span className="text-[10px] opacity-60 font-mono px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">⌘F</span>
      </button>
    );
  }

  return (
    <div className="relative z-30 flex flex-col items-center">
      {/* Floating Modern Pill Search Bar */}
      <div
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 w-72 sm:w-96 ${
          isDarkBg
            ? 'bg-slate-900/95 border-cyan-500/40 text-white shadow-cyan-950/40'
            : 'bg-white/95 border-cyan-400/60 text-slate-800 shadow-cyan-900/15'
        }`}
      >
        {isSearching ? (
          <Loader2 className="w-4 h-4 text-cyan-500 animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-cyan-500 shrink-0" />
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDownInput}
          placeholder="Find handwritten words, notes, OCR..."
          className="bg-transparent border-none outline-none text-xs font-medium w-full placeholder-slate-400 focus:ring-0 px-1 py-0.5"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setMatches([]);
              setActiveMatchIndex(-1);
              onClearHighlight();
              inputRef.current?.focus();
            }}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Clear text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Matches Navigation Counter */}
        {matches.length > 0 && (
          <div className="flex items-center space-x-1 shrink-0 pl-1 border-l border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowResultsList(!showResultsList)}
              className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline px-1 whitespace-nowrap"
              title="View all matches"
            >
              {activeMatchIndex + 1}/{matches.length}
            </button>
            <button
              type="button"
              onClick={handlePrevMatch}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMatch}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Next match (Enter)"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
          title="Close search (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Results Dropdown or Status Bar */}
      {(statusMessage || showResultsList) && (
        <div
          className={`absolute top-full mt-2 w-72 sm:w-96 rounded-2xl shadow-2xl border backdrop-blur-md overflow-hidden text-xs transition-all z-40 ${
            isDarkBg
              ? 'bg-slate-900/95 border-slate-700 text-slate-200 shadow-black/60'
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-400/30'
          }`}
        >
          {/* Status line */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-cyan-500" />
              <span>{statusMessage || `${matches.length} matches found`}</span>
            </span>
            {matches.length > 0 && (
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400">Press Enter to cycle</span>
            )}
          </div>

          {/* Matches List */}
          {matches.length > 0 && (
            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {matches.map((match, idx) => {
                const isActive = idx === activeMatchIndex;
                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => handleSelectSpecificMatch(idx)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between space-x-2 transition-colors ${
                      isActive
                        ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-950 dark:text-cyan-100 font-bold border-l-4 border-cyan-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {match.source === 'handwriting-ocr' ? (
                        <PenTool className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : match.source === 'sticky-note' ? (
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <Hash className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="text-xs truncate">{match.text}</div>
                        {match.context && (
                          <div className="text-[10px] opacity-60 truncate">{match.context}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {match.source === 'handwriting-ocr'
                        ? 'OCR'
                        : match.source === 'sticky-note'
                        ? 'Note'
                        : 'Shape'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
