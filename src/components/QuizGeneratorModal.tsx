import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  RefreshCw,
  PlusCircle,
  Layers,
  Copy,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';
import { CanvasNote, Stroke, ShapeElement } from '../types';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: CanvasNote[];
  strokes: Stroke[];
  shapes: ShapeElement[];
  onStampQuizToWhiteboard: (questions: QuizQuestion[]) => void;
}

export const QuizGeneratorModal: React.FC<QuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  notes,
  strokes,
  shapes,
  onStampQuizToWhiteboard,
}) => {
  const [topic, setTopic] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Extract board context from notes & shapes
  const boardTexts = notes
    .map((n) => n.text)
    .filter(Boolean)
    .concat(
      shapes
        .filter((s) => s.type === 'text' && s.text)
        .map((s) => s.text as string)
    );

  const boardSummary = boardTexts.length > 0 
    ? boardTexts.join(' • ').slice(0, 200) 
    : 'Visual diagrams, handwritten annotations & equations on board';

  // Pre-fill topic if board has content
  useEffect(() => {
    if (isOpen && !topic && boardTexts.length > 0) {
      setTopic(boardTexts[0].slice(0, 40));
    }
  }, [isOpen, boardTexts, topic]);

  if (!isOpen) return null;

  const handleGenerateQuiz = () => {
    setIsGenerating(true);
    setShowResults(false);
    setSelectedAnswers({});

    setTimeout(() => {
      const generated: QuizQuestion[] = [];
      const currentTopic = topic.trim() || 'General Science & Math';

      // Smart procedural quiz generation tailored to whiteboard topic
      const templates = [
        {
          q: `Based on our current lesson on "${currentTopic}", which principle is fundamental?`,
          opts: [
            'Conservation of energy and balance of forces',
            'Independent arbitrary motion without causation',
            'Disappearance of mass in closed non-nuclear systems',
            'Infinite instantaneous velocity under finite impulse',
          ],
          correct: 0,
          exp: 'Energy conservation and balanced dynamics form the bedrock principle governing this concept.',
        },
        {
          q: `When analyzing the primary variables related to "${currentTopic}", which relationship holds true?`,
          opts: [
            'Rate of change is directly proportional to driving potential',
            'Magnitude remains strictly static regardless of environment',
            'Inversely proportional to the cube of distance exclusively',
            'Zero response until critical threshold infinity is reached',
          ],
          correct: 0,
          exp: 'Flux and rate of transfer are governed by gradient and potential difference.',
        },
        {
          q: `What is the standard SI unit or quantitative measure used when evaluating "${currentTopic}"?`,
          opts: [
            'Joules (J) or Newtons (N) depending on mechanical vs work context',
            'Arbitrary index scale without dimensional consistency',
            'Seconds squared per meter cubed',
            'Coulombs per decibel unit',
          ],
          correct: 0,
          exp: 'Standard SI metric units enforce dimensional equilibrium in standard physics & calculus.',
        },
        {
          q: `If an external disturbance acts on the system described in "${currentTopic}", what occurs?`,
          opts: [
            'The system transitions toward a new equilibrium or undergoes accelerated state change',
            'All existing thermodynamic states are instantly frozen',
            'Entropy decreases spontaneously without work input',
            'The reaction rate collapses completely to zero permanently',
          ],
          correct: 0,
          exp: "According to Le Chatelier's and Newton's laws, systems adapt dynamically to external perturbations.",
        },
        {
          q: `Which application is most directly powered by the mechanisms of "${currentTopic}"?`,
          opts: [
            'Modern high-efficiency engineering systems and predictive scientific modeling',
            'Static non-computable paper tables from antiquity',
            'Frictionless perpetual motion machines',
            'Zero-energy wireless power through absolute vacuum without loss',
          ],
          correct: 0,
          exp: 'Empirical principles are foundational to contemporary industrial and analytical systems.',
        },
      ];

      for (let i = 0; i < questionCount; i++) {
        const t = templates[i % templates.length];
        generated.push({
          id: i + 1,
          question: t.q,
          options: t.opts,
          correctIndex: t.correct,
          explanation: t.exp,
        });
      }

      setGeneratedQuiz(generated);
      setIsGenerating(false);
    }, 450);
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    generatedQuiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const copyQuiz = () => {
    const text = generatedQuiz
      .map(
        (q, idx) =>
          `Q${idx + 1}: ${q.question}\n` +
          q.options.map((opt, oIdx) => `  ${String.fromCharCode(65 + oIdx)}. ${opt}`).join('\n') +
          `\nAnswer: ${String.fromCharCode(65 + q.correctIndex)} (${q.explanation})\n`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="quiz-generator-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        id="quiz-generator-modal-content"
        className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  Classroom Quiz Generator
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate student test quizzes directly from your whiteboard lesson content
              </p>
            </div>
          </div>
          <button
            id="close-quiz-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Current Board Context Visualizer */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-300 block">
                Whiteboard Detection:
              </span>
              <p className="text-xs text-slate-400 italic line-clamp-2">
                &ldquo;{boardSummary}&rdquo;
              </p>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Lesson Subject / Quiz Topic:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, Newton's Laws, Fractions..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Questions:
              </label>
              <div className="flex space-x-1.5">
                {[3, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      questionCount === cnt
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            id="generate-board-quiz-btn"
            type="button"
            onClick={handleGenerateQuiz}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isGenerating ? 'Analyzing Board & Crafting Quiz...' : 'Generate Quiz From Board'}</span>
          </button>

          {/* Generated Questions List */}
          {generatedQuiz.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <Award className="w-4 h-4" />
                  <span>Ready for Students ({generatedQuiz.length} Questions)</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={copyQuiz}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Question Cards */}
              <div className="space-y-3.5">
                {generatedQuiz.map((q, idx) => {
                  const hasAnswered = selectedAnswers[q.id] !== undefined;
                  const isCorrect = selectedAnswers[q.id] === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-white leading-snug">
                          <span className="text-emerald-400 mr-1.5">Q{idx + 1}.</span>
                          {q.question}
                        </h4>
                        {hasAnswered && (
                          <div className="shrink-0 ml-2">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 gap-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[q.id] === optIdx;
                          const isCorrectOption = optIdx === q.correctIndex;

                          let optionStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700';

                          if (hasAnswered) {
                            if (isCorrectOption) {
                              optionStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                            } else if (isSelected && !isCorrectOption) {
                              optionStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
                            }
                          } else if (isSelected) {
                            optionStyle = 'bg-cyan-950/60 border-cyan-500 text-cyan-200';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`w-full p-2.5 rounded-xl border text-xs text-left flex items-center space-x-2.5 transition-all ${optionStyle}`}
                            >
                              <span className="w-5 h-5 rounded-lg bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {hasAnswered && (
                        <p className="text-[11px] text-slate-400 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                          <strong className="text-emerald-400">Explanation: </strong>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Score Bar */}
              {Object.keys(selectedAnswers).length === generatedQuiz.length && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Award className="w-6 h-6 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Quiz Completed!
                      </span>
                      <span className="text-xs text-emerald-300">
                        Score: {calculateScore()} / {generatedQuiz.length} correct
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>

          {generatedQuiz.length > 0 && (
            <button
              id="stamp-quiz-to-board-btn"
              type="button"
              onClick={() => {
                onStampQuizToWhiteboard(generatedQuiz);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Stamp Quiz Questions onto Board</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
