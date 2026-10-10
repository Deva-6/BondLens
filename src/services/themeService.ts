export interface ThemeOption {
  id: string;
  name: string;
  hex: string;
  glowHex: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'gold', name: 'Gold (Default)', hex: '#F5E6A8', glowHex: 'rgba(245, 230, 168, 0.4)' },
  { id: 'emerald', name: 'Emerald', hex: '#34D399', glowHex: 'rgba(52, 211, 153, 0.4)' },
  { id: 'violet', name: 'Violet', hex: '#A78BFA', glowHex: 'rgba(167, 139, 250, 0.4)' },
  { id: 'cyan', name: 'Cyan', hex: '#38BDF8', glowHex: 'rgba(56, 189, 248, 0.4)' },
  { id: 'rose', name: 'Rose', hex: '#FB7185', glowHex: 'rgba(251, 113, 133, 0.4)' },
  { id: 'orange', name: 'Orange', hex: '#FB923C', glowHex: 'rgba(251, 146, 60, 0.4)' },
  { id: 'blue', name: 'Blue', hex: '#60A5FA', glowHex: 'rgba(96, 165, 250, 0.4)' },
  { id: 'lime', name: 'Lime', hex: '#A3E635', glowHex: 'rgba(163, 230, 53, 0.4)' },
  { id: 'pink', name: 'Pink', hex: '#F472B6', glowHex: 'rgba(244, 114, 182, 0.4)' },
  { id: 'silver', name: 'Silver/White', hex: '#E2E8F0', glowHex: 'rgba(226, 232, 240, 0.4)' },
];

const THEME_STORAGE_KEY = 'bondlens_theme';

export const ThemeService = {
  getCurrentTheme(): string {
    if (typeof window === 'undefined') return 'gold';
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
      return saved;
    }
    return 'gold';
  },

  setTheme(themeId: string): void {
    if (typeof window === 'undefined') return;
    const validTheme = THEME_OPTIONS.some((t) => t.id === themeId) ? themeId : 'gold';
    localStorage.setItem(THEME_STORAGE_KEY, validTheme);
    document.documentElement.setAttribute('data-theme', validTheme);
    window.dispatchEvent(new CustomEvent('bondlens-theme-changed', { detail: validTheme }));
  },

  initTheme(): void {
    const current = this.getCurrentTheme();
    document.documentElement.setAttribute('data-theme', current);
  },

  resetTheme(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_STORAGE_KEY, 'gold');
    document.documentElement.setAttribute('data-theme', 'gold');
    window.dispatchEvent(new CustomEvent('bondlens-theme-changed', { detail: 'gold' }));
  },
};
