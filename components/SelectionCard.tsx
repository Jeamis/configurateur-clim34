import React from 'react';

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({ selected, onClick, icon, label, description }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-6 md:p-8 rounded-xl transition-all duration-300 w-full h-full min-h-[200px]
        border-2 group
        ${selected 
          ? 'border-brand-blue bg-brand-light/40 shadow-lg scale-[1.02]' 
          : 'border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-blue/30'
        }
      `}
    >
      <div className={`mb-5 transition-colors duration-300 ${selected ? 'text-brand-blue' : 'text-slate-400 group-hover:text-brand-blue'}`}>
        {icon}
      </div>
      <h3 className={`text-lg font-bold uppercase mb-2 transition-colors duration-300 ${selected ? 'text-brand-dark' : 'text-slate-700 group-hover:text-brand-dark'}`}>
        {label}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 text-center leading-relaxed">
          {description}
        </p>
      )}
      
      {/* Checkmark indicator for selected state */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center shadow-sm">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
};