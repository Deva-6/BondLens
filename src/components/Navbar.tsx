import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  ShieldAlert,
  BookOpen,
  Calendar,
  CheckSquare,
  GitCompare,
  Settings,
  PlusCircle,
  Menu,
  X,
  Scale,
  FolderOpen,
} from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  activeDocTitle?: string;
  activeDocId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeDocTitle, activeDocId }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Scale },
    { to: '/analyze', label: 'Analyze', icon: PlusCircle },
    { to: '/documents', label: 'Documents', icon: FolderOpen },
    { to: '/risks', label: 'Risks', icon: ShieldAlert },
    { to: '/clauses', label: 'Key Clauses', icon: BookOpen },
    { to: '/deadlines', label: 'Deadlines', icon: Calendar },
    { to: '/obligations', label: 'Obligations', icon: CheckSquare },
    { to: '/compare', label: 'Compare', icon: GitCompare },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur-md border-b border-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand with New Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <Logo size={24} className="group-hover:scale-105 transition-transform" />
          <div>
            <span className="text-lg font-bold tracking-tight text-white font-display group-hover:text-[var(--accent)] transition-colors">
              BondLens
            </span>
          </div>
        </Link>

        {/* Active Document Indicator (if any) */}
        {activeDocTitle && activeDocId && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-[#121212] border border-stone-800 rounded-full text-xs text-stone-300">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-stone-400">Active:</span>
            <Link
              to={`/report/${activeDocId}`}
              className="text-[var(--accent)] hover:underline font-medium truncate max-w-[180px]"
              title={activeDocTitle}
            >
              {activeDocTitle}
            </Link>
          </div>
        )}

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--accent)]/30'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0d0d0d] border-b border-stone-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--accent)]/30'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};
