// Step 8.6: StartScreen Component

import { useState } from 'react';
import { AI_INFO, type AIType } from '../../games/scopa/ai';
import type { GameMode } from '../../games/scopa/types';
import { LanguageToggle } from './LanguageToggle';
import { useT } from '../../i18n/LanguageContext';
import styles from './StartScreen.module.css';

type GameModeOption = 'play' | 'watch' | 'multiplayer';
type CPUType = 'random' | 'heuristic' | 'expert';

interface StartScreenProps {
  onStartGame: (targetScore: number, gameMode: GameMode) => void;
  onStartMultiplayer: () => void;
  selectedAI: AIType;
  onSelectAI: (ai: AIType) => void;
  spectatorAIs: { player1: AIType; player2: AIType };
  onSelectSpectatorAI: (player: 'player1' | 'player2', ai: AIType) => void;
  defaultTargetScore: number;
  onOpenSettings?: () => void;
  onOpenRules?: () => void;
}

const PRESET_SCORES = [11, 16, 21] as const;

export function StartScreen({
  onStartGame,
  onStartMultiplayer,
  selectedAI,
  onSelectAI,
  spectatorAIs,
  onSelectSpectatorAI,
  defaultTargetScore,
  onOpenSettings,
  onOpenRules,
}: StartScreenProps) {
  const t = useT();
  const [selectedScore, setSelectedScore] = useState<number>(defaultTargetScore);
  const [gameMode, setGameMode] = useState<GameModeOption>('play');

  const handleStartGame = () => {
    if (gameMode === 'multiplayer') {
      onStartMultiplayer();
      return;
    }
    const mode: GameMode = gameMode === 'play' ? 'pvsCPU' : 'cpuVsCPU';
    onStartGame(selectedScore, mode);
  };

  // Render CPU opponent selector (reusable for play and spectator modes)
  const renderOpponentSelector = (
    currentAI: CPUType,
    onCPUTypeChange: (type: CPUType) => void,
    label: string
  ) => {
    return (
      <div className={styles.opponentSelector}>
        <label className={styles.label}>{label}</label>
        <div className={styles.dropdownRow}>
          <select
            className={styles.dropdown}
            value={currentAI}
            onChange={(e) => onCPUTypeChange(e.target.value as CPUType)}
          >
            <option value="random">{AI_INFO.random.icon} {AI_INFO.random.name}</option>
            <option value="heuristic">{AI_INFO.heuristic.icon} {AI_INFO.heuristic.name}</option>
            <option value="expert">{AI_INFO.expert.icon} {AI_INFO.expert.name}</option>
          </select>
        </div>
        <p className={styles.aiDescription}>
          {t.aiDescriptions[currentAI] ?? AI_INFO[currentAI].description}
        </p>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <LanguageToggle />
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          title={t.settings.title}
          aria-label={t.settings.title}
          style={{
            position: 'fixed',
            top: '0.75rem',
            left: '0.75rem',
            zIndex: 50,
            padding: '6px 10px',
            fontSize: '1.2rem',
            lineHeight: 1,
            background: 'rgba(0, 0, 0, 0.3)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            backdropFilter: 'blur(2px)',
          }}
        >
          ⚙️
        </button>
      )}
      <div className={styles.content}>
        <h1 className={styles.title}>Scopa</h1>
        <p className={styles.subtitle}>{t.start.scopaSubtitle}</p>

        <div className={styles.scoreSelection}>
          <label className={styles.label}>{t.start.gameMode}</label>
          <div className={styles.scoreOptions}>
            <button
              className={`${styles.scoreOption} ${styles.modeOption} ${gameMode === 'play' ? styles.selected : ''}`}
              onClick={() => setGameMode('play')}
            >
              {t.start.play}
            </button>
            <button
              className={`${styles.scoreOption} ${styles.modeOption} ${gameMode === 'watch' ? styles.selected : ''}`}
              onClick={() => setGameMode('watch')}
            >
              {t.start.watch}
            </button>
            <button
              className={`${styles.scoreOption} ${styles.modeOption} ${gameMode === 'multiplayer' ? styles.selected : ''}`}
              onClick={() => setGameMode('multiplayer')}
            >
              {t.start.multiplayer}
            </button>
          </div>
          <p className={styles.aiDescription}>
            {gameMode === 'play'
              ? t.start.playDesc
              : gameMode === 'watch'
                ? t.start.watchDesc
                : t.start.multiplayerDesc}
          </p>
        </div>

        {gameMode !== 'multiplayer' && (
          <div className={styles.scoreSelection}>
            <label className={styles.label}>
              {t.start.targetScore}
            </label>
            <div className={styles.scoreOptions}>
              {PRESET_SCORES.map((score) => (
                <button
                  key={score}
                  className={`${styles.scoreOption} ${selectedScore === score ? styles.selected : ''}`}
                  onClick={() => setSelectedScore(score)}
                >
                  {score}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="999"
                className={`${styles.customScoreInput} ${!PRESET_SCORES.includes(selectedScore as 11 | 16 | 21) ? styles.selected : ''}`}
                value={!PRESET_SCORES.includes(selectedScore as 11 | 16 | 21) ? selectedScore : ''}
                placeholder="..."
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) {
                    setSelectedScore(val);
                  }
                }}
                title={t.lobby.customScore}
              />
            </div>
          </div>
        )}

        {gameMode === 'play' && (
          renderOpponentSelector(
            selectedAI as CPUType,
            onSelectAI,
            t.common.opponent
          )
        )}

        {gameMode === 'watch' && (
          <div className={styles.spectatorSetup}>
            <div className={styles.spectatorPlayer}>
              {renderOpponentSelector(
                spectatorAIs.player1 as CPUType,
                (type) => onSelectSpectatorAI('player1', type),
                t.start.player1
              )}
            </div>
            <div className={styles.vsLabel}>vs</div>
            <div className={styles.spectatorPlayer}>
              {renderOpponentSelector(
                spectatorAIs.player2 as CPUType,
                (type) => onSelectSpectatorAI('player2', type),
                t.start.player2
              )}
            </div>
          </div>
        )}

        <button
          className={styles.startButton}
          onClick={handleStartGame}
        >
          {gameMode === 'play'
            ? t.start.startGame
            : gameMode === 'watch'
              ? t.start.startWatching
              : t.start.findOpponent}
        </button>

        <div className={styles.rulesHint}>
          <h3>{t.start.quickRules}</h3>
          <ul>
            <li>{t.start.scopaRule1}</li>
            <li>{t.start.scopaRule2}</li>
            <li>{t.start.scopaRule3}</li>
            <li>{t.start.firstToPoints(selectedScore)}</li>
          </ul>
          {onOpenRules && (
            <a className={styles.fullRulesLink} onClick={onOpenRules}>
              {t.start.viewFullRules}
            </a>
          )}
        </div>

        <footer className={styles.footer}>
          © 2026 <a href="https://github.com/vlvovch" target="_blank" rel="noopener noreferrer">Volodymyr Vovchenko</a> | <a href="https://github.com/vlvovch/scopa-ai" target="_blank" rel="noopener noreferrer">GitHub</a>. {t.start.builtWithPrefix}<a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer">Claude Code</a>. <span title={__APP_BUILD_INFO__} style={{ opacity: 0.55, fontSize: '0.75em', whiteSpace: 'nowrap' }}>· v{__APP_VERSION__}</span>
        </footer>
      </div>
    </div>
  );
}
