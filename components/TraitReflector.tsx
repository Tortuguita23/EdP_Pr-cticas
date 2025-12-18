import React from 'react';
import { Trait, UserReflection } from '../types';
import { Info, HelpCircle } from 'lucide-react';

interface TraitReflectorProps {
  trait: Trait;
  currentReflection: UserReflection;
  onChange: (updated: UserReflection) => void;
}

export const TraitReflector: React.FC<TraitReflectorProps> = ({ trait, currentReflection, onChange }) => {
  const handleSelect = (version: 'A' | 'B' | null) => {
    onChange({ ...currentReflection, selectedVersion: version });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...currentReflection, notes: e.target.value });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm mb-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Info size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">{trait.name}</h4>
          <p className="text-sm text-slate-500">{trait.description}</p>
        </div>
      </div>

      <div className="space-y-4 pl-0 md:pl-11">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span className="text-sm font-medium text-slate-700">¿Qué versión refleja mejor este rasgo?</span>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => handleSelect('A')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentReflection.selectedVersion === 'A'
                  ? 'bg-emerald-100 text-emerald-800 shadow-sm border border-emerald-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white'
              }`}
            >
              Versión A
            </button>
            <button
              onClick={() => handleSelect('B')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentReflection.selectedVersion === 'B'
                  ? 'bg-blue-100 text-blue-800 shadow-sm border border-blue-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white'
              }`}
            >
              Versión B
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Tus observaciones
          </label>
          <textarea
            value={currentReflection.notes}
            onChange={handleNotesChange}
            placeholder={`¿Por qué elegiste la versión ${currentReflection.selectedVersion || '...'}? ¿Qué acciones específicas observaste?`}
            className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none h-24 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>
    </div>
  );
};