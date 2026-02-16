import React from 'react';

interface StepLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const StepLayout: React.FC<StepLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Updated: uppercase and text-brand-dark */}
      <h2 className="text-2xl md:text-3xl font-bold uppercase text-center text-brand-dark mb-4 mt-4 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-center text-slate-500 mb-8 max-w-2xl px-4 text-base">
          {subtitle}
        </p>
      )}
      <div className="w-full mt-2">
        {children}
      </div>
    </div>
  );
};