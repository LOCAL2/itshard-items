const THEME_KEY = 'itshard_theme';

export type ThemeMode = 'light' | 'dark';

export function getPreferredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function setTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {}
  applyTheme(mode);
  try {
    window.dispatchEvent(new Event('theme-changed'));
  } catch {}
}

export function initTheme() {
  const mode = getPreferredTheme();
  applyTheme(mode);
}

