// AI Module - Export all AI implementations

import { randomAI, createRandomAI } from './random';
import { heuristicAI, createHeuristicAI } from './heuristic';
import { expertAI, createExpertAI, selectExpertMoveWithState, type ExpertOptions } from './expert';

// Re-export types
export type { AIPlayer, AIContext, AIPlayerFactory } from './types';

// Re-export AI implementations
export { randomAI, createRandomAI };
export { heuristicAI, createHeuristicAI };
export { expertAI, createExpertAI, selectExpertMoveWithState };
export type { ExpertOptions };

// Available AI players for selection
export const AI_PLAYERS = {
  random: randomAI,
  heuristic: heuristicAI,
  expert: expertAI,
} as const;

// All AI types, plus 'multiplayer' for an online human opponent
export type CpuAIType = keyof typeof AI_PLAYERS;
export type AIType = CpuAIType | 'multiplayer';

// Display info for each AI (including multiplayer)
export const AI_INFO: Record<AIType, { name: string; description: string; icon: string }> = {
  random: { name: 'Scimmietta', description: 'Plays randomly like a little monkey', icon: '🐒' },
  heuristic: { name: 'Furbo', description: 'Greedy strategy, prioritizes valuable captures', icon: '🦊' },
  expert: { name: 'Esperto', description: 'Advanced CPU using Monte Carlo tree search', icon: '🐍' },
  multiplayer: { name: 'Human', description: 'Online multiplayer opponent', icon: '👤' },
};

/**
 * Get list of available AI types.
 */
export function getAvailableAITypes(): AIType[] {
  return ['random', 'heuristic', 'expert'];
}
