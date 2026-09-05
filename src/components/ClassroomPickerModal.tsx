import React, { useState } from 'react';
import { X, Dices, UserCheck, Sparkles, Plus } from 'lucide-react';

interface ClassroomPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStampResult: (text: string, title?: string) => void;
}

export const ClassroomPickerModal: React.FC<ClassroomPickerModalProps> = ({
  isOpen,
  onClose,
  onStampResult,
}) => {
  const [tab, setTab] = useState<'dice' | 'student'>('dice');

  // Dice State
  const [diceCount, setDiceCount] = useState<1 | 2>(1);
  const [diceValues, setDiceValues] = useState<number[]>([4]);
  const [isRolling, setIsRolling] = useState(false);

  // Student Picker State
  const [studentsText, setStudentsText] = useState(
    'Alex M.\nBrenda T.\nCharlie K.\nDavid L.\nEmma S.\nFiona G.\nGeorge R.\nHannah W.'
  );
  const [pickedStudent, setPickedStudent] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  if (!isOpen) return null;

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceValues(
        Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1)
      );
      count++;
      if (count >= 12) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 70);
  };

  const pickStudent = () => {
    if (isPicking) return;
    const list = studentsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) return;

    setIsPicking(true);
    let count = 0;
    const interval = setInterval(() => {
      const rand = list[Math.floor(Math.random() * list.length)];
      setPickedStudent(rand);
      count++;
      if (count >= 14) {
        clearInterval(interval);
        setIsPicking(false);
      }
    }, 80);
  };

  return (
    <div
      id="classroom-picker-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        id="classroom-picker-modal-content"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Classroom Tools
              </h2>
              <p className="text-[11px] text-slate-400">
                Samsung WAF Interactive Engagement • Dice &amp; Random Student Picker
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={() => setTab('dice')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition-all ${
              tab === 'dice'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Dice Roller</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('student')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition-all ${
              tab === 'student'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Student Picker</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {tab === 'dice' && (
            <div className="space-y-6 flex flex-col items-center">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                <span>Number of Dice:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDiceCount(1);
                    setDiceValues([Math.floor(Math.random() * 6) + 1]);
                  }}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold ${
                    diceCount === 1
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  1 Die
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiceCount(2);
                    setDiceValues([
                      Math.floor(Math.random() * 6) + 1,
                      Math.floor(Math.random() * 6) + 1,
                    ]);
                  }}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold ${
                    diceCount === 2
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  2 Dice
                </button>
              </div>

              {/* Dice Display */}
              <div className="flex items-center justify-center space-x-4 py-4">
                {diceValues.map((v, i) => (
                  <div
                    key={i}
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center text-4xl font-black shadow-xl border-2 border-amber-300 transition-transform ${
                      isRolling ? 'rotate-12 scale-110 animate-spin' : ''
                    }`}
                  >
                    {v}
                  </div>
                ))}
              </div>

              {diceCount === 2 && (
                <div className="text-sm font-bold text-amber-300">
                  Total Sum: {diceValues.reduce((a, b) => a + b, 0)}
                </div>
              )}

              <div className="w-full flex space-x-2">
                <button
                  type="button"
                  onClick={rollDice}
                  disabled={isRolling}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-98 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isRolling ? 'Rolling...' : 'Roll Dice'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = `🎲 Dice Roll: [ ${diceValues.join(' , ')} ] ${
                      diceCount === 2 ? `➔ Total: ${diceValues.reduce((a, b) => a + b, 0)}` : ''
                    }`;
                    onStampResult(text, 'Dice Result');
                    onClose();
                  }}
                  className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                  title="Stamp to Whiteboard"
                >
                  <Plus className="w-4 h-4" />
                  <span>Stamp</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'student' && (
            <div className="space-y-4">
              {/* Selected Student Display */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-500/40 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Selected Student
                </span>
                <div
                  className={`text-xl font-extrabold text-cyan-300 min-h-8 flex items-center justify-center ${
                    isPicking ? 'animate-pulse scale-105' : ''
                  }`}
                >
                  {pickedStudent || 'Ready to Pick!'}
                </div>
              </div>

              {/* Roster Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Class Roster (One name per line):
                </label>
                <textarea
                  rows={4}
                  value={studentsText}
                  onChange={(e) => setStudentsText(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>

              <div className="w-full flex space-x-2">
                <button
                  type="button"
                  onClick={pickStudent}
                  disabled={isPicking}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-98 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isPicking ? 'Picking...' : 'Pick Random Student'}</span>
                </button>

                {pickedStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      onStampResult(`🌟 Selected Student: ${pickedStudent}`, 'Student Spotlight');
                      onClose();
                    }}
                    className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                    title="Stamp to Whiteboard"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Stamp</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
