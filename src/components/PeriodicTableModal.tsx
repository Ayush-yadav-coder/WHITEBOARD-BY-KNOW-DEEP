import React, { useState } from 'react';
import { X, Plus, Search, Atom } from 'lucide-react';

interface ElementData {
  number: number;
  symbol: string;
  name: string;
  mass: string;
  category: string;
  group: number;
  period: number;
}

interface PeriodicTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStampElement: (element: ElementData) => void;
}

// Key curated classroom elements across main groups
const SAMPLE_ELEMENTS: ElementData[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', mass: '1.008', category: 'nonmetal', period: 1, group: 1 },
  { number: 2, symbol: 'He', name: 'Helium', mass: '4.0026', category: 'noble-gas', period: 1, group: 18 },
  { number: 3, symbol: 'Li', name: 'Lithium', mass: '6.94', category: 'alkali', period: 2, group: 1 },
  { number: 4, symbol: 'Be', name: 'Beryllium', mass: '9.0122', category: 'alkaline-earth', period: 2, group: 2 },
  { number: 5, symbol: 'B', name: 'Boron', mass: '10.81', category: 'metalloid', period: 2, group: 13 },
  { number: 6, symbol: 'C', name: 'Carbon', mass: '12.011', category: 'nonmetal', period: 2, group: 14 },
  { number: 7, symbol: 'N', name: 'Nitrogen', mass: '14.007', category: 'nonmetal', period: 2, group: 15 },
  { number: 8, symbol: 'O', name: 'Oxygen', mass: '15.999', category: 'nonmetal', period: 2, group: 16 },
  { number: 9, symbol: 'F', name: 'Fluorine', mass: '18.998', category: 'halogen', period: 2, group: 17 },
  { number: 10, symbol: 'Ne', name: 'Neon', mass: '20.180', category: 'noble-gas', period: 2, group: 18 },
  { number: 11, symbol: 'Na', name: 'Sodium', mass: '22.990', category: 'alkali', period: 3, group: 1 },
  { number: 12, symbol: 'Mg', name: 'Magnesium', mass: '24.305', category: 'alkaline-earth', period: 3, group: 2 },
  { number: 13, symbol: 'Al', name: 'Aluminum', mass: '26.982', category: 'post-transition', period: 3, group: 13 },
  { number: 14, symbol: 'Si', name: 'Silicon', mass: '28.085', category: 'metalloid', period: 3, group: 14 },
  { number: 15, symbol: 'P', name: 'Phosphorus', mass: '30.974', category: 'nonmetal', period: 3, group: 15 },
  { number: 16, symbol: 'S', name: 'Sulfur', mass: '32.06', category: 'nonmetal', period: 3, group: 16 },
  { number: 17, symbol: 'Cl', name: 'Chlorine', mass: '35.45', category: 'halogen', period: 3, group: 17 },
  { number: 18, symbol: 'Ar', name: 'Argon', mass: '39.948', category: 'noble-gas', period: 3, group: 18 },
  { number: 19, symbol: 'K', name: 'Potassium', mass: '39.098', category: 'alkali', period: 4, group: 1 },
  { number: 20, symbol: 'Ca', name: 'Calcium', mass: '40.078', category: 'alkaline-earth', period: 4, group: 2 },
  { number: 26, symbol: 'Fe', name: 'Iron', mass: '55.845', category: 'transition', period: 4, group: 8 },
  { number: 29, symbol: 'Cu', name: 'Copper', mass: '63.546', category: 'transition', period: 4, group: 11 },
  { number: 30, symbol: 'Zn', name: 'Zinc', mass: '65.38', category: 'transition', period: 4, group: 12 },
  { number: 35, symbol: 'Br', name: 'Bromine', mass: '79.904', category: 'halogen', period: 4, group: 17 },
  { number: 47, symbol: 'Ag', name: 'Silver', mass: '107.87', category: 'transition', period: 5, group: 11 },
  { number: 53, symbol: 'I', name: 'Iodine', mass: '126.90', category: 'halogen', period: 5, group: 17 },
  { number: 79, symbol: 'Au', name: 'Gold', mass: '196.97', category: 'transition', period: 6, group: 11 },
  { number: 80, symbol: 'Hg', name: 'Mercury', mass: '200.59', category: 'transition', period: 6, group: 12 },
  { number: 92, symbol: 'U', name: 'Uranium', mass: '238.03', category: 'actinide', period: 7, group: 3 },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  nonmetal: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  'noble-gas': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  alkali: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
  'alkaline-earth': { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  metalloid: { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/40' },
  halogen: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/40' },
  transition: { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/40' },
  'post-transition': { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' },
  actinide: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/40' },
};

export const PeriodicTableModal: React.FC<PeriodicTableModalProps> = ({
  isOpen,
  onClose,
  onStampElement,
}) => {
  const [search, setSearch] = useState('');
  const [selectedElement, setSelectedElement] = useState<ElementData>(SAMPLE_ELEMENTS[0]);

  if (!isOpen) return null;

  const filtered = SAMPLE_ELEMENTS.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.symbol.toLowerCase().includes(search.toLowerCase()) ||
      e.number.toString().includes(search)
  );

  return (
    <div
      id="periodic-table-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="periodic-table-content"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Interactive Periodic Table
              </h2>
              <p className="text-[11px] text-slate-400">
                Samsung WAF Educational Science Tool • Select and stamp element cards to the whiteboard
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

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by element name, symbol (e.g., Fe, O, Gold) or atomic number..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Body Split: Elements Grid + Selected Element Inspector */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Elements Grid */}
          <div className="md:col-span-2 grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {filtered.map((elem) => {
              const colors = CATEGORY_COLORS[elem.category] || CATEGORY_COLORS.nonmetal;
              const isSelected = selectedElement.number === elem.number;
              return (
                <button
                  key={elem.number}
                  type="button"
                  onClick={() => setSelectedElement(elem)}
                  className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between h-18 ${
                    colors.bg
                  } ${colors.border} ${
                    isSelected ? 'ring-2 ring-cyan-400 shadow-lg scale-105' : 'hover:scale-102 opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-start text-[9px] text-slate-400">
                    <span>{elem.number}</span>
                    <span className="text-[8px] uppercase">{elem.category.slice(0, 4)}</span>
                  </div>
                  <div className={`text-base font-bold ${colors.text} leading-none my-0.5`}>
                    {elem.symbol}
                  </div>
                  <div className="text-[9px] text-slate-300 truncate">{elem.name}</div>
                </button>
              );
            })}
          </div>

          {/* Inspector Card */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-cyan-400">
                    Atomic #{selectedElement.number}
                  </span>
                  <h3 className="text-2xl font-black text-white">{selectedElement.name}</h3>
                  <span className="text-xs text-slate-400 capitalize">
                    {selectedElement.category.replace('-', ' ')}
                  </span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-2xl font-black text-cyan-300 shadow-inner">
                  {selectedElement.symbol}
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-800 pt-3 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Atomic Mass:</span>
                  <span className="font-mono font-semibold">{selectedElement.mass} u</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Period:</span>
                  <span className="font-semibold">{selectedElement.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Group:</span>
                  <span className="font-semibold">{selectedElement.group}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onStampElement(selectedElement);
                onClose();
              }}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Stamp Element to Whiteboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
