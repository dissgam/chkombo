// Game statistics tracking with localStorage persistence

import { useState, useEffect, useCallback } from 'react';
import type { AIType } from '../games/scopa/ai';

/** Record of a single game played */
export interface GameRecord {
  /** Unique ID for this game */
  id: string;
  /** Opponent AI type */
  opponentType: AIType;
  /** Player's final score */
  playerScore: number;
  /** Opponent's final score */
  opponentScore: number;
  /** Whether player won */
  playerWon: boolean;
  /** Number of rounds played */
  roundsPlayed: number;
  /** Target score for the game */
  targetScore: number;
  /** Timestamp when game ended */
  timestamp: number;
}

/** Summary stats for an opponent */
export interface OpponentStats {
  /** Opponent AI type */
  opponentType: AIType;
  /** Total games played */
  gamesPlayed: number;
  /** Games won by player */
  wins: number;
  /** Games lost by player */
  losses: number;
  /** Win rate (0-1) */
  winRate: number;
  /** Total points scored by player */
  totalPlayerScore: number;
  /** Total points scored by opponent */
  totalOpponentScore: number;
}

/** All stored statistics */
export interface GameStats {
  /** All game records */
  games: GameRecord[];
  /** Last updated timestamp */
  lastUpdated: number;
}

const STORAGE_KEY = 'scopa-game-stats';

/** Generate unique ID for a game */
function generateGameId(): string {
  return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Load stats from localStorage */
function loadStats(): GameStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        games: parsed.games || [],
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
    }
  } catch (e) {
    console.warn('Failed to load game stats from localStorage:', e);
  }
  return { games: [], lastUpdated: Date.now() };
}

/** Save stats to localStorage */
function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save game stats to localStorage:', e);
  }
}

/** CPU AI types that should always be shown */
const CPU_AI_TYPES: AIType[] = ['random', 'heuristic', 'expert'];

/** Check if an AI type is a CPU (non-multiplayer) type */
export function isCpuAIType(aiType: AIType): boolean {
  return CPU_AI_TYPES.includes(aiType);
}

/** Check if an AI type is multiplayer */
export function isMultiplayerType(aiType: AIType): boolean {
  return aiType === 'multiplayer';
}

/**
 * Hook for managing game statistics
 */
export function useStats() {
  const [stats, setStats] = useState<GameStats>(loadStats);

  // Save to localStorage whenever stats change
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  /** Record a completed game */
  const recordGame = useCallback((
    opponentType: AIType,
    playerScore: number,
    opponentScore: number,
    roundsPlayed: number,
    targetScore: number
  ) => {
    const record: GameRecord = {
      id: generateGameId(),
      opponentType,
      playerScore,
      opponentScore,
      playerWon: playerScore > opponentScore,
      roundsPlayed,
      targetScore,
      timestamp: Date.now(),
    };

    setStats(prev => ({
      games: [...prev.games, record],
      lastUpdated: Date.now(),
    }));

    return record;
  }, []);

  /** Get all games against a specific opponent type */
  const getGamesAgainst = useCallback((
    opponentType: AIType
  ): GameRecord[] => {
    return stats.games.filter(g => g.opponentType === opponentType)
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }, [stats.games]);

  /** Get summary stats for an opponent type */
  const getOpponentStats = useCallback((
    opponentType: AIType
  ): OpponentStats => {
    const games = getGamesAgainst(opponentType);
    const wins = games.filter(g => g.playerWon).length;
    const losses = games.length - wins;

    return {
      opponentType,
      gamesPlayed: games.length,
      wins,
      losses,
      winRate: games.length > 0 ? wins / games.length : 0,
      totalPlayerScore: games.reduce((sum, g) => sum + g.playerScore, 0),
      totalOpponentScore: games.reduce((sum, g) => sum + g.opponentScore, 0),
    };
  }, [getGamesAgainst]);

  /** Get all opponent types that have been played against */
  const getPlayedOpponents = useCallback((): Array<{ type: AIType }> => {
    const opponents = new Map<string, { type: AIType }>();

    for (const game of stats.games) {
      if (!opponents.has(game.opponentType)) {
        opponents.set(game.opponentType, { type: game.opponentType });
      }
    }

    return Array.from(opponents.values());
  }, [stats.games]);

  /** Get all opponents to display (CPU types are always shown) */
  const getAllDisplayOpponents = useCallback((): Array<{ type: AIType }> => {
    return CPU_AI_TYPES.map(type => ({ type }));
  }, []);

  /** Clear all statistics */
  const clearStats = useCallback(() => {
    setStats({ games: [], lastUpdated: Date.now() });
  }, []);

  /** Delete a specific game record */
  const deleteGame = useCallback((gameId: string) => {
    setStats(prev => ({
      games: prev.games.filter(g => g.id !== gameId),
      lastUpdated: Date.now(),
    }));
  }, []);

  return {
    stats,
    recordGame,
    getGamesAgainst,
    getOpponentStats,
    getPlayedOpponents,
    getAllDisplayOpponents,
    clearStats,
    deleteGame,
  };
}
