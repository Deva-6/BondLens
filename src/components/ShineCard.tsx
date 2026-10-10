import React from 'react';

interface ShineCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const ShineCard: React.FC<ShineCardProps> = ({
  children,
  className = '',
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`relative p-6 bg-[#0a0a0a] hover:bg-[#F5E6A8]/[0.035] border border-stone-800 hover:border-[var(--accent)]/60 rounded-xl transition-all duration-300 ${
        glow ? 'border-[var(--accent)]/40 shadow-sm shadow-[var(--accent-glow)]/20' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
