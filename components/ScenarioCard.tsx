import React from 'react';

interface ScenarioCardProps {
  label: string;
  text: string;
  approach: string;
  colorClass: string;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ label, text, approach, colorClass }) => {
  return (
    <div className={`flex flex-col h-full rounded-xl border-2 shadow-sm overflow-hidden ${colorClass} transition-all duration-300`}>
      <div className="bg-white/50 px-4 py-3 border-b border-black/5 flex justify-between items-center">
        <h3 className="font-bold text-lg uppercase tracking-wider">{label}</h3>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/60 border border-black/5">
          {approach}
        </span>
      </div>
      <div className="p-5 flex-grow">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
};