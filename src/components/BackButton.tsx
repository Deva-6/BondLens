import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BackButtonProps {
  fallbackTo?: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallbackTo = '/dashboard',
  breadcrumbs = [],
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there is history to go back to within the SPA session
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2.5 text-xs ${className}`}>
      {/* Visible back-arrow button */}
      <button
        onClick={handleBack}
        aria-label="Go back to previous page"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111] hover:bg-[#181818] border border-stone-800 hover:border-[var(--accent)] text-stone-300 hover:text-[var(--accent)] transition-all cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Breadcrumb path */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-stone-400 pl-1">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label + idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-stone-600 shrink-0" />}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-[var(--accent)] transition-colors truncate max-w-[150px] sm:max-w-[200px]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={`truncate max-w-[180px] sm:max-w-[260px] ${
                      isLast ? 'text-stone-200 font-medium' : ''
                    }`}
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}
    </div>
  );
};
