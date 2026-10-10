import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeService } from './services/themeService';

if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

ThemeService.initTheme();

createRoot(document.getElementById('root')!).render(<App />);
