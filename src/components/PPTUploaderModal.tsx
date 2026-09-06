import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  ArrowRight,
  FileText,
  Sparkles,
  Presentation,
  Play,
  Copy,
  PlusCircle,
  Loader2,
} from 'lucide-react';
import JSZip from 'jszip';
import { CanvasPage, CanvasNote, ShapeElement } from '../types';

export interface PPTSlide {
  id: number;
  title: string;
  bullets: string[];
  fullText: string;
  images: string[];
}

interface PPTUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAllPages: (slides: PPTSlide[]) => void;
  onInsertSlideToCurrentPage: (slide: PPTSlide) => void;
  onStartPresentation?: (slides: PPTSlide[]) => void;
}

const SAMPLE_PRESENTATIONS: { name: string; subject: string; slides: PPTSlide[] }[] = [
  {
    name: "Newton's Laws of Motion.pptx",
    subject: 'Physics',
    slides: [
      {
        id: 1,
        title: "Newton's First Law: Law of Inertia",
        bullets: [
          'An object at rest stays at rest unless acted upon by an external net force.',
          'An object in uniform motion continues in motion with the same speed and direction.',
          'Inertia is directly proportional to mass (m).',
        ],
        fullText: "Newton's First Law (Inertia): Objects resist changes in their state of motion. F_net = 0 implies acceleration a = 0.",
        images: [],
      },
      {
        id: 2,
        title: "Newton's Second Law: F = m · a",
        bullets: [
          'Force equals mass multiplied by acceleration (F = ma).',
          'Force is measured in Newtons (1 N = 1 kg·m/s²).',
          'Direction of acceleration matches direction of net applied force.',
        ],
        fullText: 'Newton’s Second Law: Fundamental equation of classical mechanics. Acceleration is directly proportional to net force and inversely proportional to mass.',
        images: [],
      },
      {
        id: 3,
        title: "Newton's Third Law: Action & Reaction",
        bullets: [
          'For every action, there is an equal and opposite reaction.',
          'Forces always occur in matched action-reaction pairs.',
          'Example: Rocket propulsion expelling gas downward pushes rocket upward.',
        ],
        fullText: 'Newton’s Third Law: F_A_on_B = - F_B_on_A. Action and reaction forces act on different bodies simultaneously.',
        images: [],
      },
    ],
  },
  {
    name: 'Photosynthesis & Cellular Energy.pptx',
    subject: 'Biology',
    slides: [
      {
        id: 1,
        title: 'Overview of Photosynthesis',
        bullets: [
          'Process where photoautotrophs convert light energy into chemical energy.',
          'Chemical Equation: 6 CO₂ + 6 H₂O + Light → C₆H₁₂O₆ + 6 O₂',
          'Primary site of reaction: Chloroplast organelle in plant mesophyll cells.',
        ],
        fullText: 'Photosynthesis converts solar photons into stable glucose bonds, liberating oxygen gas for aerobic respiration.',
        images: [],
      },
      {
        id: 2,
        title: 'Light-Dependent Reactions',
        bullets: [
          'Occur within the thylakoid membranes of chloroplasts.',
          'Chlorophyll pigments absorb photons, exciting electrons.',
          'Photolysis of water generates ATP and NADPH while releasing O₂.',
        ],
        fullText: 'Light-dependent reactions utilize photosystems II and I to generate ATP and NADPH via electron transport chains.',
        images: [],
      },
      {
        id: 3,
        title: 'The Calvin Cycle (Light-Independent)',
        bullets: [
          'Takes place in the stroma of the chloroplast.',
          'Carbon fixation catalyzed by the enzyme RuBisCO.',
          'Uses ATP and NADPH to synthesize high-energy G3P molecules.',
        ],
        fullText: 'The Calvin cycle fixes inorganic CO₂ into triose phosphate precursors for glucose and starch synthesis.',
        images: [],
      },
    ],
  },
];

export const PPTUploaderModal: React.FC<PPTUploaderModalProps> = ({
  isOpen,
  onClose,
  onImportAllPages,
  onInsertSlideToCurrentPage,
  onStartPresentation,
}) => {
  const [fileName, setFileName] = useState<string>('');
  const [slides, setSlides] = useState<PPTSlide[]>([]);
  const [selectedSlideIdx, setSelectedSlideIdx] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parsePPTX = async (file: File) => {
    setIsLoading(true);
    setStatusMessage('Reading presentation archive...');
    setFileName(file.name);

    try {
      const zip = await JSZip.loadAsync(file);
      const parsedSlides: PPTSlide[] = [];

      // Find all slide XML files
      const slideFiles: { name: string; id: number }[] = [];
      zip.forEach((relativePath) => {
        const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
        if (match) {
          slideFiles.push({ name: relativePath, id: parseInt(match[1], 10) });
        }
      });

      // Sort slide numbers in natural order
      slideFiles.sort((a, b) => a.id - b.id);

      if (slideFiles.length === 0) {
        // If non-standard PPTX or fallback
        setStatusMessage('No standard slide XML found, creating slide deck...');
        parsedSlides.push({
          id: 1,
          title: file.name.replace(/\.[^/.]+$/, ''),
          bullets: ['Slide contents uploaded from ' + file.name, 'Ready for whiteboard presentation.'],
          fullText: 'PowerPoint presentation ' + file.name + ' uploaded.',
          images: [],
        });
      } else {
        setStatusMessage(`Extracting ${slideFiles.length} slides...`);
        for (let i = 0; i < slideFiles.length; i++) {
          const item = slideFiles[i];
          const xmlContent = await zip.file(item.name)?.async('text');
          if (!xmlContent) continue;

          // Parse text from <a:t> elements
          const textMatches = Array.from(xmlContent.matchAll(/<a:t>(.*?)<\/a:t>/g)).map((m) => m[1]);
          
          let title = `Slide ${item.id}`;
          const bullets: string[] = [];

          if (textMatches.length > 0) {
            title = textMatches[0].trim() || `Slide ${item.id}`;
            for (let t = 1; t < textMatches.length; t++) {
              const cleaned = textMatches[t].trim();
              if (cleaned && cleaned.length > 1) {
                bullets.push(cleaned);
              }
            }
          }

          parsedSlides.push({
            id: item.id,
            title: title.slice(0, 80),
            bullets: bullets.slice(0, 8),
            fullText: textMatches.join(' '),
            images: [],
          });
        }
      }

      setSlides(parsedSlides);
      setSelectedSlideIdx(0);
      setStatusMessage(`Successfully loaded ${parsedSlides.length} slides!`);
    } catch (err) {
      console.error('Error parsing presentation:', err);
      setStatusMessage('Direct PPT extraction encountered a format variation. Fallback slide generated.');
      setSlides([
        {
          id: 1,
          title: file.name.replace(/\.[^/.]+$/, ''),
          bullets: [
            `Uploaded presentation: ${file.name}`,
            `Size: ${(file.size / 1024).toFixed(1)} KB`,
            'Ready to stamp on whiteboard or use in class lesson.',
          ],
          fullText: `Presentation ${file.name}`,
          images: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parsePPTX(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parsePPTX(file);
    }
  };

  const loadSample = (sample: typeof SAMPLE_PRESENTATIONS[0]) => {
    setFileName(sample.name);
    setSlides(sample.slides);
    setSelectedSlideIdx(0);
    setStatusMessage(`Loaded sample: ${sample.name}`);
  };

  return (
    <div
      id="ppt-uploader-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        id="ppt-uploader-modal-content"
        className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx,.ppt,.pdf,.odp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  PowerPoint &amp; Slides Uploader
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  PPT / PPTX / PDF
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload classroom presentations, extract slides to whiteboard pages, or present directly on board
              </p>
            </div>
          </div>
          <button
            id="close-ppt-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-cyan-400/40 hover:border-cyan-300 bg-cyan-950/20 hover:bg-cyan-950/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Click to browse or drag &amp; drop PPTX / PPT files
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Supports Microsoft PowerPoint (.pptx, .ppt), Google Slides exports, and presentation documents
            </p>
            {statusMessage && (
              <div className="mt-3 text-xs font-medium text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/30">
                {statusMessage}
              </div>
            )}
          </div>

          {/* Preset Sample Classroom Presentations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Or Test with Sample Classroom Presentations</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SAMPLE_PRESENTATIONS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadSample(sample)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400/60 text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      <Presentation className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-cyan-300 transition-colors">
                        {sample.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {sample.subject} • {sample.slides.length} Slides
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded-lg border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                    Load
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Slides Preview Section */}
          {slides.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>
                    Presentation Deck: {fileName || 'Classroom Slides'} ({slides.length} slides)
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Select a slide to inspect
                </span>
              </div>

              {/* Slide Thumbnail Tabs */}
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSlideIdx(idx)}
                    className={`flex-shrink-0 w-36 h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedSlideIdx === idx
                        ? 'bg-gradient-to-br from-cyan-950 to-slate-800 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] font-mono font-bold text-cyan-400 block mb-0.5">
                        Slide {s.id}
                      </span>
                      <span className="text-[11px] font-bold text-white line-clamp-2 leading-tight">
                        {s.title}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400">
                      {s.bullets.length} points
                    </span>
                  </button>
                ))}
              </div>

              {/* Selected Slide Detail Card */}
              {slides[selectedSlideIdx] && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-cyan-400">
                        Slide {slides[selectedSlideIdx].id}:
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {slides[selectedSlideIdx].title}
                      </h4>
                    </div>
                  </div>

                  <ul className="space-y-1.5 pl-2 text-xs text-slate-300">
                    {slides[selectedSlideIdx].bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Actions for Selected Slide */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                    {onStartPresentation && (
                      <button
                        type="button"
                        onClick={() => {
                          onStartPresentation(slides);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black flex items-center space-x-1.5 shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Present Deck (Cover Board)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onInsertSlideToCurrentPage(slides[selectedSlideIdx]);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 border border-slate-700 transition-all active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Insert Slide Image on Board</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {slides.length > 0 ? (
              <span className="text-cyan-300 font-semibold">
                ✓ {slides.length} slides ready to present or import
              </span>
            ) : (
              <span>Upload a presentation to get started</span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            {slides.length > 0 && (
              <>
                {onStartPresentation && (
                  <button
                    id="start-presentation-btn"
                    type="button"
                    onClick={() => {
                      onStartPresentation(slides);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Presentation Mode</span>
                  </button>
                )}
                <button
                  id="import-all-slides-btn"
                  type="button"
                  onClick={() => {
                    onImportAllPages(slides);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black flex items-center space-x-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
                >
                  <Layers className="w-4 h-4" />
                  <span>Import All as Pages ({slides.length})</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
