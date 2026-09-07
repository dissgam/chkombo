// Step 10.2: Settings Modal Component

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameSettings, DeckType, TableStyle } from '../../hooks/useSettings';
import { assetUrl } from '../../assetUrl';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Language } from '../../i18n/LanguageContext';
import styles from './SettingsModal.module.css';

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: '🇬🇧 English' },
  { value: 'it', label: '🇮🇹 Italiano' },
];

const DECK_OPTIONS: { value: DeckType; label: string }[] = [
  { value: 'napoletane', label: 'Napoletane' },
  { value: 'siciliane', label: 'Siciliane' },
  { value: 'sarde', label: 'Sarde' },
  { value: 'piacentine', label: 'Piacentine' },
  { value: 'bergamasche', label: 'Bergamasche' },
  { value: 'romagnole', label: 'Romagnole' },
];

const TABLE_STYLE_OPTIONS: TableStyle[] = ['green', 'tablecloth'];

const PRESET_SCORES = [11, 16, 21] as const;

// Text Size slider stops (multiplier applied to the root font via
// --font-scale). 1.2 (Normal) is the default.
const FONT_SIZE_STEPS = [
  { value: 1.0, labelKey: 'sizeSmall' },
  { value: 1.2, labelKey: 'sizeNormal' },
  { value: 1.4, labelKey: 'sizeLarge' },
  { value: 1.6, labelKey: 'sizeXLarge' },
] as const;

/** Closest slider index for a stored fontScale (robust to legacy values). */
function fontSizeIndex(scale: number | undefined): number {
  const s = scale ?? 1.2;
  let best = 0;
  let bestDelta = Infinity;
  FONT_SIZE_STEPS.forEach((step, i) => {
    const d = Math.abs(step.value - s);
    if (d < bestDelta) {
      bestDelta = d;
      best = i;
    }
  });
  return best;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  onResetSettings: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onResetSettings,
}: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  // Track if deck selector modal should be shown
  const [showDeckSelector, setShowDeckSelector] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings"
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.title}>{t.settings.title}</h2>

            <div className={styles.setting}>
              <label className={styles.label}>{t.settings.defaultTargetScore}</label>
              <div className={styles.options}>
                {PRESET_SCORES.map((score) => (
                  <button
                    key={score}
                    className={`${styles.option} ${settings.defaultTargetScore === score ? styles.selected : ''}`}
                    onClick={() => onUpdateSetting('defaultTargetScore', score)}
                  >
                    {score}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="999"
                  className={`${styles.customInput} ${!PRESET_SCORES.includes(settings.defaultTargetScore as 11 | 16 | 21) ? styles.selected : ''}`}
                  value={settings.defaultTargetScore}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) {
                      onUpdateSetting('defaultTargetScore', val);
                    }
                  }}
                  title={t.settings.customTargetScore}
                />
              </div>
            </div>

            <div className={styles.setting}>
              <label className={styles.label}>{t.settings.animationSpeed}</label>
              <div className={styles.options}>
                {(['instant', 'fast', 'normal', 'slow'] as const).map((speed) => (
                  <button
                    key={speed}
                    className={`${styles.option} ${settings.animationSpeed === speed ? styles.selected : ''}`}
                    onClick={() => onUpdateSetting('animationSpeed', speed)}
                    title={speed === 'instant' ? t.settings.instantHint : undefined}
                  >
                    {speed === 'instant'
                      ? '⚡'
                      : speed === 'fast'
                        ? t.settings.speedFast
                        : speed === 'normal'
                          ? t.settings.speedNormal
                          : t.settings.speedSlow}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.setting}>
              <label className={styles.label}>{t.settings.textSize}</label>
              <div className={styles.fontSizeRow}>
                <input
                  type="range"
                  min={0}
                  max={FONT_SIZE_STEPS.length - 1}
                  step={1}
                  value={fontSizeIndex(settings.fontScale)}
                  onChange={(e) =>
                    onUpdateSetting(
                      'fontScale',
                      FONT_SIZE_STEPS[Number(e.target.value)].value
                    )
                  }
                  className={styles.fontSlider}
                  aria-label={t.settings.textSize}
                />
                <div className={styles.sliderTicks}>
                  {FONT_SIZE_STEPS.map((s, i) => (
                    <span
                      key={s.value}
                      className={
                        i === fontSizeIndex(settings.fontScale)
                          ? styles.sliderTickActive
                          : ''
                      }
                    >
                      {t.settings[s.labelKey]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.setting}>
              <label className={styles.label}>{t.settings.language}</label>
              <div className={styles.options}>
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.option} ${language === option.value ? styles.selected : ''}`}
                    onClick={() => setLanguage(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.setting}>
              <label className={styles.label}>{t.settings.cardDeck}</label>
              <button
                className={styles.deckSelectorButton}
                onClick={() => setShowDeckSelector(true)}
              >
                <img
                  src={assetUrl(`/cards/${settings.deck}/coins-1.webp`)}
                  alt={settings.deck}
                  className={styles.deckPreviewThumb}
                />
                <span>{DECK_OPTIONS.find(d => d.value === settings.deck)?.label}</span>
              </button>
            </div>

            <div className={styles.setting}>
              <label className={styles.label}>{t.settings.tableStyle}</label>
              <div className={styles.tableStyleOptions}>
                {TABLE_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    className={`${styles.tableStyleOption} ${settings.tableStyle === option ? styles.tableStyleSelected : ''}`}
                    onClick={() => onUpdateSetting('tableStyle', option)}
                  >
                    <div className={`${styles.tableStylePreview} ${styles[`tablePreview${option.charAt(0).toUpperCase() + option.slice(1)}`]}`} />
                    <span>{option === 'green' ? t.settings.tableGreen : t.settings.tableTablecloth}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Watch Mode: auto-advance rounds when both players are bots. */}
            <div className={styles.setting}>
              <label className={styles.label}>{t.settings.watchMode}</label>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{t.settings.autoAdvance}</span>
                <button
                  className={`${styles.toggle} ${settings.autoAdvanceSpectator ? styles.on : ''}`}
                  onClick={() => onUpdateSetting('autoAdvanceSpectator', !settings.autoAdvanceSpectator)}
                  title={settings.autoAdvanceSpectator ? t.settings.autoAdvanceOn : t.settings.autoAdvanceOff}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
              <p className={styles.settingHint}>
                {settings.autoAdvanceSpectator
                  ? t.settings.autoAdvanceOnHint
                  : t.settings.autoAdvanceOffHint}
              </p>
            </div>

            <div className={styles.setting}>
              <label className={styles.label}>{t.settings.sound}</label>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{t.settings.soundEffects}</span>
                <button
                  className={`${styles.toggle} ${settings.soundEnabled ? styles.on : ''}`}
                  onClick={() => onUpdateSetting('soundEnabled', !settings.soundEnabled)}
                  title={settings.soundEnabled ? t.settings.soundOn : t.settings.soundOff}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            </div>

            <div className={styles.setting}>
              <label className={styles.label}>{t.settings.display}</label>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{t.settings.showPileStats}</span>
                <button
                  className={`${styles.toggle} ${settings.showPileStats ? styles.on : ''}`}
                  onClick={() => onUpdateSetting('showPileStats', !settings.showPileStats)}
                  title={settings.showPileStats ? t.settings.pileStatsOn : t.settings.pileStatsOff}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
              <p className={styles.settingHint}>
                {settings.showPileStats
                  ? t.settings.pileStatsHintScopa
                  : t.settings.pileStatsHintOff}
              </p>

              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{t.settings.winOdds}</span>
                <button
                  className={`${styles.toggle} ${settings.showWinOdds ? styles.on : ''}`}
                  onClick={() => onUpdateSetting('showWinOdds', !settings.showWinOdds)}
                  title={settings.showWinOdds ? t.settings.winOddsOn : t.settings.winOddsOff}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
              <p className={styles.settingHint}>
                {settings.showWinOdds
                  ? t.settings.winOddsOnHint('Expert')
                  : t.settings.winOddsOffHint}
              </p>

              {settings.showWinOdds && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    paddingLeft: '0.85rem',
                    borderLeft: '2px solid var(--color-accent)',
                    opacity: 0.95,
                  }}
                >
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>
                      {t.settings.perCardOdds}
                    </span>
                    <button
                      className={`${styles.toggle} ${settings.showWinOddsPerCard ? styles.on : ''}`}
                      onClick={() =>
                        onUpdateSetting(
                          'showWinOddsPerCard',
                          !settings.showWinOddsPerCard
                        )
                      }
                      title={
                        settings.showWinOddsPerCard
                          ? t.settings.perCardOddsOn
                          : t.settings.perCardOddsOff
                      }
                    >
                      <span className={styles.toggleKnob} />
                    </button>
                  </div>
                  <p className={styles.settingHint}>
                    {settings.showWinOddsPerCard
                      ? t.settings.perCardOddsHintScopa
                      : t.settings.perCardOddsHintOff}
                  </p>

                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>
                      {t.settings.deepSearch}
                    </span>
                    <button
                      className={`${styles.toggle} ${settings.winOddsDeep ? styles.on : ''}`}
                      onClick={() =>
                        onUpdateSetting(
                          'winOddsDeep',
                          !settings.winOddsDeep
                        )
                      }
                      title={
                        settings.winOddsDeep
                          ? t.settings.deepSearchOn
                          : t.settings.deepSearchOff
                      }
                    >
                      <span className={styles.toggleKnob} />
                    </button>
                  </div>
                  <p className={styles.settingHint}>
                    {settings.winOddsDeep
                      ? t.settings.deepSearchOnHint
                      : t.settings.deepSearchOffHint}
                  </p>

                  {/* NOTE: deliberately NOT styles.setting / styles.options.
                      The stylesheet has `.setting:has(.options)
                      { flex-direction: row }` and :has() matches ANY
                      ancestor — using .options here would flip the whole
                      parent Display setting into a row (broken columnar
                      layout). Plain elements + inline flex keep it scoped. */}
                  <div style={{ marginTop: '0.6rem' }}>
                    <label className={styles.label}>{t.settings.simulations}</label>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        alignItems: 'center',
                        marginTop: '0.35rem',
                      }}
                    >
                      {[100, 300, 600, 1000].map((n) => (
                        <button
                          key={n}
                          className={`${styles.option} ${settings.winOddsSamples === n ? styles.selected : ''}`}
                          onClick={() => onUpdateSetting('winOddsSamples', n)}
                        >
                          {n}
                        </button>
                      ))}
                      <input
                        type="number"
                        min="20"
                        max="5000"
                        step="50"
                        className={`${styles.customInput} ${![100, 300, 600, 1000].includes(settings.winOddsSamples) ? styles.selected : ''}`}
                        value={settings.winOddsSamples}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            onUpdateSetting(
                              'winOddsSamples',
                              Math.max(20, Math.min(5000, val))
                            );
                          }
                        }}
                        title={t.settings.simulationsTitle}
                      />
                    </div>
                    <p className={styles.settingHint}>
                      {t.settings.simulationsHint}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button className={styles.resetButton} onClick={onResetSettings}>
                {t.settings.resetDefaults}
              </button>
              <button className={styles.closeButton} onClick={onClose}>
                {t.common.close}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showDeckSelector && (
        <motion.div
          key="deck-selector"
          className={styles.deckSelectorOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDeckSelector(false)}
        >
          <motion.div
            className={styles.deckSelectorModal}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.deckSelectorTitle}>{t.settings.selectCardDeck}</h3>
            <div className={styles.deckGrid}>
              {DECK_OPTIONS.map((deck) => (
                <button
                  key={deck.value}
                  className={`${styles.deckOption} ${settings.deck === deck.value ? styles.deckSelected : ''}`}
                  onClick={() => {
                    onUpdateSetting('deck', deck.value);
                    setShowDeckSelector(false);
                  }}
                >
                  <img
                    src={assetUrl(`/cards/${deck.value}/coins-1.webp`)}
                    alt={deck.label}
                    className={styles.deckPreview}
                  />
                  <span className={styles.deckLabel}>{deck.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
