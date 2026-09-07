// AI Player Label component with proper icons for each AI type

import type { ReactNode } from 'react';
import type { AIType } from '../../games/scopa/ai';

interface AIPlayerLabelProps {
  /** The AI type */
  aiType: AIType;
  /** Additional class name */
  className?: string;
}

/**
 * Get the icon for an AI type
 */
function AIIcon({ aiType }: { aiType: AIType; className?: string }): ReactNode {
  switch (aiType) {
    case 'random':
      return <span style={{ fontSize: '1em' }}>🐒</span>;
    case 'heuristic':
      return <span style={{ fontSize: '1em' }}>🦊</span>;
    case 'expert':
      return <span style={{ fontSize: '1em' }}>🐍</span>;
    case 'multiplayer':
      return <span style={{ fontSize: '1em' }}>👤</span>;
    default:
      return null;
  }
}

/**
 * Format model name for display
 */
function formatModelName(aiType: AIType, model?: string): string {
  if (aiType === 'random') return 'Scimmietta';
  if (aiType === 'heuristic') return 'Furbo';
  if (aiType === 'expert') return 'Esperto';
  if (aiType === 'multiplayer') return model || 'Player';

  return aiType;
}

/**
 * Component that renders an AI player label with proper icon
 */
export function AIPlayerLabel({ aiType, className }: AIPlayerLabelProps) {
  const icon = <AIIcon aiType={aiType} />;
  const name = formatModelName(aiType);

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3em' }}>
      {icon}
      <span>{name}</span>
    </span>
  );
}

/**
 * Get a plain text version for contexts where ReactNode can't be used
 * Falls back to text approximations of icons
 */
export function getAIDisplayNameText(aiType: AIType, model?: string): string {
  const textIcons: Record<AIType, string> = {
    random: '🐒',
    heuristic: '🦊',
    expert: '🐍',
    multiplayer: '👤',
  };

  const icon = textIcons[aiType] || '';
  const name = formatModelName(aiType, model);

  return `${icon} ${name}`;
}

// Re-export for use in App.tsx
export { AIIcon, formatModelName };
