import React, { useState, useEffect, useRef } from 'react';
import { Watch, Play, Pause, RotateCcw, X, Bell, Clock, Flag, Volume2, Minus, Plus } from 'lucide-react';

interface TimerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'timer' | 'stopwatch' | 'alarm';

export const TimerWidget: React.FC<TimerWidgetProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('timer');
  const [position, setPosition] = useState({ x: 40, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Countdown Timer state
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(180); // default 3 min
  const [timerTotalDuration, setTimerTotalDuration] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isAlarmSounding, setIsAlarmSounding] = useState(false);

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0); // in ms
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Alarm state
  const [alarmTime, setAlarmTime] = useState('10:00');
  const [isAlarmActive, setIsAlarmActive] = useState(false);

  // Web Audio chime
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.12);
        gain.gain.setValueAtTime(0.3, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.5);
      });
    } catch {
      // Audio not supported or blocked
    }
  };

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsAlarmSounding(true);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsLeft]);

  // Stopwatch interval
  useEffect(() => {
    let animFrame: number;
    let lastTick = performance.now();

    const loop = (now: number) => {
      if (isStopwatchRunning) {
        const delta = now - lastTick;
        setStopwatchTime((prev) => prev + delta);
        lastTick = now;
        animFrame = requestAnimationFrame(loop);
      }
    };

    if (isStopwatchRunning) {
      lastTick = performance.now();
      animFrame = requestAnimationFrame(loop);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isStopwatchRunning]);

  // Alarm checker
  useEffect(() => {
    if (!isAlarmActive) return;
    const interval = setInterval(() => {
      const d = new Date();
      const current = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      if (current === alarmTime && d.getSeconds() === 0) {
        setIsAlarmSounding(true);
        playChime();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAlarmActive, alarmTime]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 320, dragStartRef.current.posX + dx)),
      y: Math.max(10, Math.min(window.innerHeight - 380, dragStartRef.current.posY + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  if (!isOpen) return null;

  // Formatting helpers
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatStopwatch = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  const setPreset = (seconds: number) => {
    setIsTimerRunning(false);
    setIsAlarmSounding(false);
    setTimerTotalDuration(seconds);
    setTimerSecondsLeft(seconds);
  };

  return (
    <div
      id="smartwatch-timer-widget"
      className="fixed z-40 w-72 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl select-none overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Header / Drag Bar */}
      <div
        id="timer-drag-header"
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/80 border-b border-slate-700 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center space-x-2 text-sky-400">
          <Watch className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold tracking-wide uppercase text-slate-200">
            Classroom Clock
          </span>
        </div>
        <button
          id="timer-widget-close"
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
        <button
          id="tab-timer-btn"
          type="button"
          onClick={() => setActiveTab('timer')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center space-x-1 transition-all ${
            activeTab === 'timer'
              ? 'bg-sky-500 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timer</span>
        </button>
        <button
          id="tab-stopwatch-btn"
          type="button"
          onClick={() => setActiveTab('stopwatch')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center space-x-1 transition-all ${
            activeTab === 'stopwatch'
              ? 'bg-sky-500 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Stopwatch</span>
        </button>
        <button
          id="tab-alarm-btn"
          type="button"
          onClick={() => setActiveTab('alarm')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center space-x-1 transition-all ${
            activeTab === 'alarm'
              ? 'bg-sky-500 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alarm</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="p-4">
        {/* TAB 1: TIMER */}
        {activeTab === 'timer' && (
          <div className="flex flex-col items-center">
            {isAlarmSounding && (
              <div className="mb-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs animate-pulse flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Time&apos;s Up!</span>
              </div>
            )}

            {/* Display */}
            <div className="text-4xl font-mono font-bold tracking-tight text-white mb-2 py-2 px-4 rounded-xl bg-slate-950/70 border border-slate-800 shadow-inner">
              {formatTimer(timerSecondsLeft)}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full transition-all duration-500 ${
                  timerSecondsLeft <= 10 ? 'bg-rose-500' : 'bg-sky-400'
                }`}
                style={{
                  width: `${timerTotalDuration > 0 ? (timerSecondsLeft / timerTotalDuration) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1.5 w-full mb-3">
              {[60, 180, 300, 600].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setPreset(sec)}
                  className={`py-1 text-[11px] font-medium rounded-md border transition-all ${
                    timerTotalDuration === sec && !isTimerRunning
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  {sec / 60}m
                </button>
              ))}
            </div>

            {/* Manual Adjust & Controls */}
            <div className="flex items-center space-x-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  const n = Math.max(10, timerSecondsLeft - 30);
                  setTimerSecondsLeft(n);
                  setTimerTotalDuration(n);
                }}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="-30s"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-400">+/- 30s</span>
              <button
                type="button"
                onClick={() => {
                  const n = timerSecondsLeft + 30;
                  setTimerSecondsLeft(n);
                  setTimerTotalDuration(n);
                }}
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="+30s"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3 w-full">
              <button
                id="timer-start-pause-btn"
                type="button"
                onClick={() => {
                  setIsAlarmSounding(false);
                  setIsTimerRunning(!isTimerRunning);
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 font-semibold text-xs shadow-md transition-all ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-sky-500 hover:bg-sky-400 text-white'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
                  </>
                )}
              </button>
              <button
                id="timer-reset-btn"
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setIsAlarmSounding(false);
                  setTimerSecondsLeft(timerTotalDuration);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: STOPWATCH */}
        {activeTab === 'stopwatch' && (
          <div className="flex flex-col items-center">
            {/* Display */}
            <div className="text-3xl font-mono font-bold tracking-tight text-white mb-3 py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800 shadow-inner">
              {formatStopwatch(stopwatchTime)}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2 w-full mb-3">
              <button
                id="stopwatch-start-pause-btn"
                type="button"
                onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 font-semibold text-xs shadow-md transition-all ${
                  isStopwatchRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                }`}
              >
                {isStopwatchRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
                  </>
                )}
              </button>

              <button
                id="stopwatch-lap-btn"
                type="button"
                disabled={!isStopwatchRunning}
                onClick={() => setLaps([stopwatchTime, ...laps])}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                Lap
              </button>

              <button
                id="stopwatch-reset-btn"
                type="button"
                onClick={() => {
                  setIsStopwatchRunning(false);
                  setStopwatchTime(0);
                  setLaps([]);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Reset stopwatch"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Laps view */}
            {laps.length > 0 && (
              <div className="w-full max-h-28 overflow-y-auto pr-1 space-y-1 text-xs font-mono">
                {laps.map((lap, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center px-2 py-1 bg-slate-850 rounded border border-slate-800/80 text-slate-300 text-[11px]"
                  >
                    <span className="text-slate-400">Lap {laps.length - idx}</span>
                    <span>{formatStopwatch(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALARM */}
        {activeTab === 'alarm' && (
          <div className="flex flex-col items-center">
            <div className="mb-3 w-full">
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Class Alarm Time (24h)
              </label>
              <input
                id="alarm-time-input"
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xl text-center focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between w-full p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 mb-3">
              <div className="flex items-center space-x-2">
                <Bell className={`w-4 h-4 ${isAlarmActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="text-xs text-slate-200">Enable Alert</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAlarmActive(!isAlarmActive)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isAlarmActive ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isAlarmActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={playChime}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center space-x-1.5 transition-colors border border-slate-700/60"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Test Audio Chime</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
