import React from 'react';
import { RiskSeverity, CategoryScoreBreakdown } from '../types/analysis';

interface CircularRiskGaugeProps {
  score: number;
  level: RiskSeverity;
  breakdown?: CategoryScoreBreakdown[];
  compact?: boolean;
}

export const CircularRiskGauge: React.FC<CircularRiskGaugeProps> = ({
  score,
  level,
  breakdown = [],
  compact = false,
}) => {
  // Clamped score 0 to 100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  // SVG dimensions
  const radius = compact ? 38 : 70;
  const strokeWidth = compact ? 6 : 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Severity colors must NOT change with theme
  const getScoreColor = (s: number) => {
    if (s <= 25) return '#48bb78'; // Low green
    if (s <= 55) return '#ecc94b'; // Med amber
    if (s <= 80) return '#ed8936'; // High orange
    return '#f56565'; // Critical red
  };

  const getLevelBadgeClass = (lvl: RiskSeverity) => {
    switch (lvl) {
      case 'Low':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
      case 'Medium':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'High':
        return 'bg-orange-950/60 text-orange-300 border-orange-800/60';
      case 'Critical':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/60';
      default:
        return 'bg-stone-900 text-stone-300 border-stone-700';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
            <circle
              cx="45"
              cy="45"
              r={radius}
              fill="transparent"
              stroke="#1a1a1a"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="45"
              cy="45"
              r={radius}
              fill="transparent"
              stroke={getScoreColor(normalizedScore)}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 6px ${getScoreColor(normalizedScore)}60)`,
              }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-base font-bold font-mono text-white leading-none">
              {normalizedScore}
            </span>
          </div>
        </div>
        <div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getLevelBadgeClass(
              level
            )}`}
          >
            {level} Risk
          </span>
          <p className="text-[11px] text-stone-400 mt-1">/ 100-pt scale</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-between p-6 bg-[#0a0a0a] border border-[var(--border-shine)]/30 rounded-2xl relative overflow-hidden">
      {/* Background soft glow using theme variable */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-[var(--accent-soft)] rounded-full blur-3xl pointer-events-none" />

      {/* Main Circular Gauge */}
      <div className="flex items-center gap-6">
        <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 170 170">
            {/* Outer subtle decorative ring */}
            <circle
              cx="85"
              cy="85"
              r="78"
              fill="transparent"
              stroke="var(--accent-soft)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Background track */}
            <circle
              cx="85"
              cy="85"
              r={radius}
              fill="transparent"
              stroke="#1a1a1a"
              strokeWidth={strokeWidth}
            />
            {/* Animated Progress Arc */}
            <circle
              cx="85"
              cy="85"
              r={radius}
              fill="transparent"
              stroke={getScoreColor(normalizedScore)}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${getScoreColor(normalizedScore)}60)`,
              }}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold tracking-tight text-white font-mono leading-none">
              {normalizedScore}
            </span>
            <span className="text-[10px] font-medium tracking-widest uppercase text-stone-400 mt-1">
              Risk Score
            </span>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-stone-400 mb-1">
            Overall Assessment
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${getLevelBadgeClass(
                level
              )}`}
            >
              {level} Risk
            </span>
            <span className="text-xs text-stone-400">/ 100-pt scale</span>
          </div>
          <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
            {normalizedScore >= 70
              ? 'Significant exposure identified. Prioritize negotiating high-liability terms.'
              : normalizedScore >= 45
              ? 'Moderate contractual friction. Several one-sided clauses warrant amendments.'
              : 'Relatively well-balanced baseline terms with manageable operational duties.'}
          </p>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      {breakdown && breakdown.length > 0 && (
        <div className="w-full sm:max-w-xs lg:max-w-sm flex flex-col gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-stone-800/80 sm:pl-6">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--accent)] flex justify-between items-center pb-1">
            <span>Risk by Category</span>
            <span className="text-[10px] text-stone-400 font-normal">Score</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {breakdown.map((item) => (
              <div
                key={item.category}
                className="bg-[#121212] border border-stone-800/80 p-2 rounded-lg"
              >
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-medium text-stone-300 truncate mr-1">{item.category}</span>
                  <span
                    className="font-mono text-[11px] font-bold shrink-0"
                    style={{ color: getScoreColor(item.score) }}
                  >
                    {item.score}
                  </span>
                </div>
                <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(5, item.score))}%`,
                      backgroundColor: getScoreColor(item.score),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
