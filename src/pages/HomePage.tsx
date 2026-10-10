import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ShineButton } from '../components/ShineButton';
import { Logo } from '../components/Logo';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-[#f3f3f1] flex flex-col items-center justify-center px-4 relative overflow-hidden select-none">
      {/* Background luxury ambient glow using dynamic accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[var(--accent-soft)] rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle radial geometric ring */}
      <div className="absolute w-[700px] h-[700px] rounded-full border border-[var(--accent)]/5 pointer-events-none animate-[spin_120s_linear_infinite]" />

      <main className="relative z-10 flex flex-col items-center text-center max-w-2xl px-4">
        {/* Large Logo above the name */}
        <div className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-b from-[var(--accent-soft)] to-black/80 border border-[var(--accent)]/40 flex items-center justify-center shadow-[0_0_35px_var(--accent-glow)]">
          <Logo size={46} glow />
        </div>

        {/* Large Name */}
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-white font-display mb-4">
          BondLens
        </h1>

        {/* Tagline */}
        <p className="text-xl sm:text-2xl text-stone-300 font-light tracking-wide mb-12 max-w-lg">
          Understand every clause before you sign.
        </p>

        {/* One shiny-border Get Started button */}
        <ShineButton
          size="lg"
          onClick={() => navigate('/dashboard')}
          className="group text-base px-10 py-4"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5 text-[var(--accent)] group-hover:translate-x-1 transition-transform" />
        </ShineButton>
      </main>
    </div>
  );
};
