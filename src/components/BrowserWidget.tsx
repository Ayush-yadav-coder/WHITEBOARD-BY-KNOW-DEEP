import React, { useState, useRef } from 'react';
import { Globe, X, ArrowLeft, ArrowRight, RotateCw, ExternalLink, Search, Bookmark, Maximize2, Minimize2 } from 'lucide-react';

interface BrowserWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EducationalResource {
  name: string;
  url: string;
  category: string;
  description: string;
}

const CLASSROOM_RESOURCES: EducationalResource[] = [
  {
    name: 'Desmos Calculator',
    url: 'https://www.desmos.com/calculator',
    category: 'Mathematics',
    description: 'Graphing calculator for functions, geometry, and coordinates.',
  },
  {
    name: 'Wikipedia Classroom',
    url: 'https://en.m.wikipedia.org',
    category: 'Encyclopedia',
    description: 'Free open encyclopedia for history, science, and literature.',
  },
  {
    name: 'PhET Simulations',
    url: 'https://phet.colorado.edu',
    category: 'Physics & Chem',
    description: 'Interactive simulations for science and math.',
  },
  {
    name: 'Khan Academy',
    url: 'https://www.khanacademy.org',
    category: 'Curriculum',
    description: 'Lessons across math, science, and humanities.',
  },
  {
    name: 'World Map & Atlas',
    url: 'https://www.openstreetmap.org',
    category: 'Geography',
    description: 'Interactive global cartography and geographic explorer.',
  },
];

export const BrowserWidget: React.FC<BrowserWidgetProps> = ({ isOpen, onClose }) => {
  const [urlInput, setUrlInput] = useState('https://www.desmos.com/calculator');
  const [currentUrl, setCurrentUrl] = useState('https://www.desmos.com/calculator');
  const [isMaximized, setIsMaximized] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [browserMode, setBrowserMode] = useState<'iframe' | 'portal'>('portal');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Position state for draggable mode
  const [position, setPosition] = useState({ y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startY: 0, initialY: 0 });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let target = urlInput.trim();
    if (!target) return;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      // If it looks like a query (contains spaces or no dots)
      if (!target.includes('.') || target.includes(' ')) {
        target = `https://www.google.com/search?q=${encodeURIComponent(target)}&igu=1`;
      } else {
        target = `https://${target}`;
      }
    }
    setCurrentUrl(target);
    setUrlInput(target);
    setIframeError(false);
    setBrowserMode('iframe');
  };

  const handlePointerDownHeader = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startY: e.clientY,
      initialY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dy = e.clientY - dragStartRef.current.startY;
    setPosition({
      y: Math.max(20, Math.min(window.innerHeight - 300, dragStartRef.current.initialY + dy)),
    });
  };

  const handlePointerUpHeader = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div
      id="classroom-web-browser"
      className={`fixed z-35 bg-slate-900/95 border-2 border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col transition-all overflow-hidden ${
        isMaximized
          ? 'left-6 right-6 top-6 bottom-24'
          : 'left-10 right-10 bottom-24 h-[58vh]'
      }`}
      style={!isMaximized ? { transform: `translateY(${position.y > 100 ? 0 : 0}px)` } : undefined}
    >
      {/* Browser Title / Top Bar */}
      <div
        id="browser-header-drag"
        className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
      >
        <div className="flex items-center space-x-2 text-sky-400">
          <Globe className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Classroom Web Browser
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
            Interactive Portal
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setBrowserMode(browserMode === 'portal' ? 'iframe' : 'portal')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              browserMode === 'portal'
                ? 'bg-sky-600 text-white font-medium'
                : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 inline mr-1" />
            Resources
          </button>

          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close browser"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Address Bar */}
      <div className="flex items-center space-x-2 px-4 py-2 bg-slate-850 border-b border-slate-700/80">
        <div className="flex items-center space-x-1 text-slate-400">
          <button
            type="button"
            onClick={() => setBrowserMode('portal')}
            className="p-1 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="Resources Directory"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIframeError(false);
            }}
            className="p-1 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="Reload"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center">
          <div className="relative w-full flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
            <input
              id="browser-url-input"
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL or search topic (e.g. Desmos, Wikipedia, Photosynthesis)..."
              className="w-full pl-8 pr-20 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-1 text-[11px] font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors"
            >
              Navigate
            </button>
          </div>
        </form>

        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-700 rounded transition-colors"
          title="Open in new window"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden">
        {browserMode === 'portal' ? (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
                <span>Classroom Verified Learning Portals</span>
              </h3>
              <p className="text-xs text-slate-400">
                Launch interactive tools and encyclopedias directly inside your whiteboard workspace.
              </p>
            </div>

            {/* Educational Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CLASSROOM_RESOURCES.map((res) => (
                <div
                  key={res.name}
                  className="group p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                        {res.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                        {res.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                      {res.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInput(res.url);
                        setCurrentUrl(res.url);
                        setBrowserMode('iframe');
                      }}
                      className="flex-1 py-1.5 px-3 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white rounded-lg text-xs font-medium transition-colors text-center"
                    >
                      Load Inside Whiteboard
                    </button>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Global AI & Web Search */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center space-x-2 mb-3">
                <Search className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-200">
                  Global Chrome AI Search
                </span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask anything... (e.g. quantum physics simplified, history of Rome)..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-sky-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      const u = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}&igu=1`;
                      setUrlInput(u);
                      setCurrentUrl(u);
                      setBrowserMode('iframe');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchQuery.trim()) {
                      const u = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}&igu=1`;
                      setUrlInput(u);
                      setCurrentUrl(u);
                      setBrowserMode('iframe');
                    }
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <iframe
              id="classroom-browser-iframe"
              src={currentUrl}
              title="Classroom Web Browser Content"
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onError={() => setIframeError(true)}
            />

            {iframeError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm font-semibold text-white mb-2">
                  This website restricts direct inline embedding.
                </p>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  For security reasons, some web domains require opening in a dedicated browser tab.
                </p>
                <div className="flex space-x-3">
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setBrowserMode('portal')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                  >
                    Back to Resources
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
