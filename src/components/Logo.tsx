import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 24,
  className = '',
  glow = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
      style={glow ? { filter: 'drop-shadow(0 0 10px var(--accent-glow))' } : undefined}
      aria-label="BondLens Logo"
    >
      {/* Outer rounded shield contour */}
      <path
        d="M12 2.2L4.5 5.4V11.5C4.5 16.4 7.7 20.9 12 22C16.3 20.9 19.5 16.4 19.5 11.5V5.4L12 2.2Z"
        fill="var(--accent-soft, rgba(245, 230, 168, 0.12))"
        stroke="var(--accent, #F5E6A8)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Magnifying lens ring */}
      <circle
        cx="11.2"
        cy="11.2"
        r="3.8"
        stroke="var(--accent, #F5E6A8)"
        strokeWidth="1.5"
      />

      {/* Magnifier handle */}
      <path
        d="M13.9 13.9L16.8 16.8"
        stroke="var(--accent, #F5E6A8)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Verification checkmark inside lens */}
      <path
        d="M9.6 11.3L10.8 12.5L13 10"
        stroke="var(--accent, #F5E6A8)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
