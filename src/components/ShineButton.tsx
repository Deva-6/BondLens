import React from 'react';

interface ShineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const ShineButton: React.FC<ShineButtonProps> = ({
  variant = 'gold',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-8 py-3.5 text-base font-medium rounded-xl',
  }[size];

  let variantClasses = '';
  if (variant === 'gold') {
    variantClasses = 'shine-btn-accent font-medium tracking-wide';
  } else if (variant === 'outline') {
    variantClasses =
      'border border-stone-800 hover:border-[var(--accent)] text-stone-300 hover:text-[var(--accent)] bg-[#0c0c0c] hover:bg-[#141414] transition-all';
  } else if (variant === 'subtle') {
    variantClasses =
      'text-stone-400 hover:text-[var(--accent)] hover:bg-white/5 transition-all';
  } else if (variant === 'danger') {
    variantClasses =
      'border border-red-900/50 hover:border-red-600 bg-red-950/20 text-red-300 hover:text-red-200 transition-all';
  }

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
