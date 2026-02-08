export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  description: string;
}

export const palettes: ColorPalette[] = [
  {
    name: 'Coral Sunset',
    primary: '16 90% 50%',
    secondary: '175 60% 35%',
    accent: '38 95% 55%',
    description: 'Warm coral with teal accents'
  },
  {
    name: 'Ocean Breeze',
    primary: '210 90% 50%',
    secondary: '180 70% 40%',
    accent: '45 100% 55%',
    description: 'Cool blue with cyan tones'
  },
  {
    name: 'Forest Glow',
    primary: '145 70% 40%',
    secondary: '42 100% 50%',
    accent: '280 60% 55%',
    description: 'Natural green with amber warmth'
  },
  {
    name: 'Lavender Dreams',
    primary: '270 80% 60%',
    secondary: '330 80% 60%',
    accent: '200 90% 55%',
    description: 'Soft purple with pink highlights'
  },
  {
    name: 'Midnight Gold',
    primary: '230 80% 50%',
    secondary: '45 100% 55%',
    accent: '280 70% 60%',
    description: 'Deep blue with golden accents'
  },
];

export function applyPalette(palette: ColorPalette) {
  const root = document.documentElement;
  root.style.setProperty('--primary', palette.primary);
  root.style.setProperty('--secondary', palette.secondary);
  root.style.setProperty('--accent', palette.accent);
  localStorage.setItem('koa-palette', palette.name);
}

export function getStoredPalette(): ColorPalette | null {
  const stored = localStorage.getItem('koa-palette');
  if (!stored) return null;
  return palettes.find(p => p.name === stored) || null;
}

export function initializePalette() {
  const stored = getStoredPalette();
  if (stored) {
    applyPalette(stored);
  }
}
