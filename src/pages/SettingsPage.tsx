import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Download,
  Trash2,
  Shield,
  Palette,
  AlertTriangle,
  Check,
  HardDrive,
  Eye,
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { StorageService } from '../services/storageService';
import { ThemeService, THEME_OPTIONS, ThemeOption } from '../services/themeService';
import { ShineCard } from '../components/ShineCard';
import { ShineButton } from '../components/ShineButton';
import { CircularRiskGauge } from '../components/CircularRiskGauge';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => ThemeService.getCurrentTheme());

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setCurrentTheme(e.detail);
    };
    window.addEventListener('bondlens-theme-changed', handleThemeChange);
    return () => window.removeEventListener('bondlens-theme-changed', handleThemeChange);
  }, []);

  const handleSelectTheme = (themeId: string) => {
    ThemeService.setTheme(themeId);
    setCurrentTheme(themeId);
  };

  const handleExportJSON = async () => {
    try {
      const jsonStr = await StorageService.exportAllDataJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BondLens_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleClearAllData = async () => {
    if (typedConfirmation.trim() !== 'DELETE' || clearing) return;
    setClearing(true);
    try {
      await StorageService.clearAllData();
      ThemeService.resetTheme();
      setCurrentTheme('gold');
      setClearedSuccess(true);
      setTypedConfirmation('');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      alert(`Failed to clear data: ${err.message}`);
      setClearing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <BackButton
        fallbackTo="/dashboard"
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Settings & Theme' }]}
      />

      {/* Header */}
      <div className="border-b border-stone-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[var(--accent)]" />
          <span>Settings & Theme</span>
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Customize accent shine palette, on-device data vault, and backup exports.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 bg-[#0a0a0a] border border-[var(--border-shine)]/30 rounded-xl space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          <Shield className="w-3.5 h-3.5" />
          <span>Local On-Device Privacy</span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          BondLens operates with zero accounts and zero remote tracking. All documents, annotations, and chat records reside entirely on your device in IndexedDB.
        </p>
      </div>

      {/* SECTION: Theme Swatches + Live Preview Strip */}
      <div className="p-6 bg-[#0a0a0a] border border-stone-800 rounded-2xl space-y-5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Theme & Accent Color
          </h2>
        </div>

        <p className="text-xs text-stone-400">
          Select an accent color. Cards, shine borders, focus rings, buttons, and headers dynamically re-tint while severity colors (green, amber, orange, red) remain standard.
        </p>

        {/* 2-Column Layout: Swatches Grid (Left) + Live Preview Strip (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
          {/* Swatches Grid (8 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-2 gap-2.5">
            {THEME_OPTIONS.map((theme: ThemeOption) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)] shadow-md shadow-[var(--accent-glow)]'
                      : 'bg-[#111] hover:bg-[#161616] border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full border border-black/40 shrink-0 shadow-sm"
                      style={{ backgroundColor: theme.hex }}
                    />
                    <span className="text-xs font-medium text-stone-200 truncate">
                      {theme.name}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-black flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Live Preview Strip (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-[#121212] border border-stone-800/90 rounded-2xl space-y-4">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-800">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
                Live Preview
              </span>
              <span className="text-[10px] font-mono text-[var(--accent)] uppercase font-bold">
                {currentTheme} active
              </span>
            </div>

            {/* Shine card preview */}
            <ShineCard className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--accent)] font-semibold">Contract Card</span>
                <span className="text-[10px] text-stone-400">Shine Sweep</span>
              </div>
              <p className="text-xs text-stone-300">
                Light streak travels dynamically around this card border.
              </p>
            </ShineCard>

            {/* Mini Gauge preview */}
            <div className="p-3 bg-[#0a0a0a] border border-stone-800/80 rounded-xl flex items-center justify-between">
              <CircularRiskGauge compact score={74} level="High" />
            </div>

            {/* Buttons preview */}
            <div className="flex items-center gap-2 pt-1">
              <ShineButton size="sm" className="flex-1">
                Primary Button
              </ShineButton>
              <ShineButton variant="outline" size="sm" className="flex-1">
                Outline
              </ShineButton>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Backup & Export */}
      <div className="p-6 bg-[#0a0a0a] border border-stone-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Export Local Vault
          </h2>
        </div>

        <p className="text-xs text-stone-400 leading-relaxed">
          Download a complete portable JSON archive containing all analyzed agreements, risk scores, personal clause annotations, and chat records.
        </p>

        <div>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] hover:bg-[#1f1f1f] border border-stone-800 hover:border-[var(--accent)] text-xs font-semibold text-[var(--accent)] rounded-xl transition-all cursor-pointer"
          >
            {exportSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
            <span>{exportSuccess ? 'Backup Downloaded!' : 'Export All Data (JSON)'}</span>
          </button>
        </div>
      </div>

      {/* SECTION: Reset / Clear All Data */}
      <div className="p-6 bg-[#0a0a0a] border border-rose-900/40 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-4 h-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Clear All Data
          </h2>
        </div>

        <p className="text-xs text-stone-400 leading-relaxed">
          Permanently wipes all agreements, annotations, and chat histories stored in this browser's IndexedDB and resets the theme to Gold. This action is irreversible.
        </p>

        {clearedSuccess ? (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>All local data wiped. Reset to Gold default. Redirecting...</span>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <label className="block text-xs text-stone-300">
              Type <span className="font-mono font-bold text-rose-400">DELETE</span> to confirm:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder="DELETE"
                className="bg-[#141414] border border-stone-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-stone-600 focus:outline-none w-48"
              />
              <button
                onClick={handleClearAllData}
                disabled={typedConfirmation.trim() !== 'DELETE' || clearing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {clearing ? 'Clearing...' : 'Permanently Wipe Data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
