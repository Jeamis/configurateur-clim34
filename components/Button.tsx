import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  // Updated: rounded-full, uppercase, bold tracking-wide to match clim34.fr style
  const baseStyles = "px-8 py-3 rounded-full transition-all duration-200 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-blue hover:bg-[#008cc9] text-white shadow-md hover:shadow-lg",
    outline: "border-2 border-brand-blue text-brand-blue hover:bg-brand-light",
    ghost: "text-slate-500 hover:text-brand-blue hover:bg-gray-100 bg-transparent"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};