// Step 10.1: Settings Hook with localStorage persistence

import { useState, useEffect, useCallback } from 'react';
import type { AIType } from '../games/scopa/ai';

export type DeckType = 'napoletane' | 'siciliane' | 'sarde' | 'piacentine' | 'bergamasche' | 'romagnole';
export type TableStyle = 'green' | 'tablecloth';
export type AnimationSpeed = 'instant' | 'fast' | 'normal' | 'slow';

/** Multiplier applied to all timer-driven animation durations.
 *  'instant' collapses everything to a tiny delay; 'normal' is baseline. */
export const SPEED_MULTIPLIER: Record<AnimationSpeed, number> = {
  instant: 0.02,
  fast: 0.5,
  normal: 1,
  slow: 1.6,
};

export interface GameSettings {
  /** Default target score for new Scopa games (minimum 1) */
  defaultTargetScore: number;
  /** Animation speed: 'instant' | 'fast' | 'normal' | 'slow' */
  animationSpeed: AnimationSpeed;
  /** Whether to show card values in corners */
  showCardValues: boolean;
  /** CPU AI type */
  cpuAI: AIType;
  /** Card deck style */
  deck: DeckType;
  /** Table background style */
  tableStyle: TableStyle;
  /** Auto-advance rounds in spectator mode (show summary for 2 seconds then continue) */
  autoAdvanceSpectator: boolean;
  /** Enable sound effects */
  soundEnabled: boolean;
  /** Whether to show pile stats (coins count, sette bello, scopas) */
  showPileStats: boolean;
  /** Accessibility: multiplier applied to the root font size so all
   *  rem-based UI text scales up/down. Slider stops: 1.0 Small /
   *  1.2 Normal (default) / 1.4 Large / 1.6 XLarge. Cards (vw/vh based)
   *  are intentionally unaffected. */
  fontScale: number;
  /** Analysis: show live win-odds (Expert/Esperto self-play estimate).
   *  Off by default; single-player Play mode only (never multiplayer /
   *  spectator). */
  showWinOdds: boolean;
  /** Analysis: also show per-card odds (the best move's % under each
   *  card + every option in the capture chooser). Only meaningful when
   *  showWinOdds is on. */
  showWinOddsPerCard: boolean;
  /** Analysis: number of determinizations the win-odds engine
   *  simulates. Higher = tighter confidence interval but slower to
   *  settle. Default 300. */
  winOddsSamples: number;
  /** Use the deeper (1-ply alpha-beta) playout policy mid-round
   *  (~3-5× slower per ply, materially stronger). The perfect-
   *  information endgame is always exact regardless. */
  winOddsDeep: boolean;
}

const STORAGE_KEY = 'scopa-settings';

const DEFAULT_SETTINGS: GameSettings = {
  defaultTargetScore: 11,
  animationSpeed: 'normal',
  showCardValues: true,
  cpuAI: 'heuristic',
  deck: 'napoletane',
  tableStyle: 'green',
  autoAdvanceSpectator: true,
  soundEnabled: true,
  showPileStats: true,
  fontScale: 1.2,
  showWinOdds: false,
  showWinOddsPerCard: true,
  winOddsSamples: 300,
  winOddsDeep: false,
};

function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage:', e);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  // Save to localStorage whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Apply the accessibility font scale to the document root so all
  // rem-based text resizes. (index.html sets it pre-paint from the same
  // stored value to avoid a flash; this keeps it live on change.)
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-scale',
      String(settings.fontScale ?? 1)
    );
  }, [settings.fontScale]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}
