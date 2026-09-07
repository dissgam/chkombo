// Rules modal: overlay chrome (title, close button, scroll behavior)
// plus the Scopa rules content, branched by active language.
//
// i18n note: the rules are long-form content with inline markup, so instead
// of fragmenting them into dozens of dictionary keys, there's one rules
// component per language and we branch on the active language here. Only
// the title and close button go through the shared dictionary.

import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './RulesModal.module.css';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const { language, t } = useLanguage();
  const italian = language === 'it';
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
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
            <h2 className={styles.title}>
              {t.rules.scopaTitle}
            </h2>

            <div className={styles.content}>
              {italian ? <ScopaRulesIt /> : <ScopaRulesEn />}
            </div>

            <button className={styles.closeButton} onClick={onClose}>
              {t.rules.gotIt}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScopaRulesEn() {
  return (
    <>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Overview</h3>
        <p>
          Scopa (Italian for "broom") is a classic Italian card game. The name refers to
          "sweeping" all cards from the table, which awards bonus points.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>The Deck</h3>
        <p>
          40 cards in 4 suits: <strong>Coins</strong> (Denari), <strong>Cups</strong> (Coppe),
          <strong> Swords</strong> (Spade), <strong>Clubs</strong> (Bastoni).
        </p>
        <p>
          Each suit has Ace-7 plus three face cards: Fante (8), Cavallo (9), Re (10).
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Setup</h3>
        <ul>
          <li>Each player receives 3 cards</li>
          <li>4 cards are placed face-up on the table</li>
          <li>Players take turns playing one card</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Gameplay</h3>
        <p>On your turn, play one card to either:</p>
        <ul>
          <li><strong>Capture:</strong> Match a single table card OR sum of multiple cards</li>
          <li><strong>Place:</strong> If no capture is possible, add card to table</li>
        </ul>
        <p className={styles.rule}>
          <strong>Mandatory Capture:</strong> If you can capture, you must!
        </p>
        <p className={styles.rule}>
          <strong>Single Card Priority:</strong> A single match takes precedence over sums.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Scopa (Sweep)</h3>
        <p>
          Clearing ALL cards from the table scores a <strong>Scopa</strong> (+1 point).
          Exception: No scopa on the last play of a round.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Scoring</h3>
        <table className={styles.scoreTable}>
          <tbody>
            <tr>
              <td><strong>Carte</strong></td>
              <td>1 pt</td>
              <td>Most cards captured</td>
            </tr>
            <tr>
              <td><strong>Denari</strong></td>
              <td>1 pt</td>
              <td>Most Coins suit cards</td>
            </tr>
            <tr>
              <td><strong>Sette Bello</strong></td>
              <td>1 pt</td>
              <td>7 of Coins</td>
            </tr>
            <tr>
              <td><strong>Primiera</strong></td>
              <td>1 pt</td>
              <td>Best prime score</td>
            </tr>
            <tr>
              <td><strong>Scopa</strong></td>
              <td>1 pt each</td>
              <td>Each sweep</td>
            </tr>
          </tbody>
        </table>
        <p className={styles.note}>Ties award no points for that category.</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Primiera (Prime)</h3>
        <p>Sum the best card from each suit using prime values:</p>
        <div className={styles.primeValues}>
          <span>7=21</span>
          <span>6=18</span>
          <span>A=16</span>
          <span>5=15</span>
          <span>4=14</span>
          <span>3=13</span>
          <span>2=12</span>
          <span>8-10=10</span>
        </div>
        <p className={styles.note}>Must have at least one card from each suit to compete.</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Winning</h3>
        <p>
          First player to reach the target score (default: 11) wins!
        </p>
      </section>
    </>
  );
}

function ScopaRulesIt() {
  return (
    <>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Panoramica</h3>
        <p>
          La Scopa è un classico gioco di carte italiano. Il nome si riferisce allo
          "spazzare" tutte le carte dal tavolo, che vale un punto bonus.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Il mazzo</h3>
        <p>
          40 carte in 4 semi: <strong>Denari</strong>, <strong>Coppe</strong>,
          <strong> Spade</strong>, <strong>Bastoni</strong>.
        </p>
        <p>
          Ogni seme ha le carte dall'Asso al 7 più tre figure: Fante (8), Cavallo (9), Re (10).
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Preparazione</h3>
        <ul>
          <li>Ogni giocatore riceve 3 carte</li>
          <li>4 carte vengono poste scoperte sul tavolo</li>
          <li>I giocatori giocano una carta a turno</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Svolgimento</h3>
        <p>Nel tuo turno, gioca una carta per:</p>
        <ul>
          <li><strong>Prendere:</strong> una carta dello stesso valore OPPURE più carte la cui somma corrisponde</li>
          <li><strong>Scartare:</strong> se non puoi prendere, la carta resta sul tavolo</li>
        </ul>
        <p className={styles.rule}>
          <strong>Presa obbligatoria:</strong> se puoi prendere, devi farlo!
        </p>
        <p className={styles.rule}>
          <strong>Priorità alla carta singola:</strong> la presa di una carta singola ha la precedenza sulle somme.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Scopa</h3>
        <p>
          Ripulire TUTTE le carte dal tavolo vale una <strong>Scopa</strong> (+1 punto).
          Eccezione: niente scopa sull'ultima giocata della mano.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Punteggio</h3>
        <table className={styles.scoreTable}>
          <tbody>
            <tr>
              <td><strong>Carte</strong></td>
              <td>1 pt</td>
              <td>Più carte prese</td>
            </tr>
            <tr>
              <td><strong>Denari</strong></td>
              <td>1 pt</td>
              <td>Più carte di denari</td>
            </tr>
            <tr>
              <td><strong>Sette Bello</strong></td>
              <td>1 pt</td>
              <td>Il 7 di denari</td>
            </tr>
            <tr>
              <td><strong>Primiera</strong></td>
              <td>1 pt</td>
              <td>Miglior primiera</td>
            </tr>
            <tr>
              <td><strong>Scopa</strong></td>
              <td>1 pt l'una</td>
              <td>Ogni scopa</td>
            </tr>
          </tbody>
        </table>
        <p className={styles.note}>In caso di parità il punto non viene assegnato.</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Primiera</h3>
        <p>Somma la carta migliore di ogni seme usando i valori di primiera:</p>
        <div className={styles.primeValues}>
          <span>7=21</span>
          <span>6=18</span>
          <span>A=16</span>
          <span>5=15</span>
          <span>4=14</span>
          <span>3=13</span>
          <span>2=12</span>
          <span>8-10=10</span>
        </div>
        <p className={styles.note}>Serve almeno una carta per seme per concorrere.</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Vittoria</h3>
        <p>
          Vince chi raggiunge per primo il punteggio obiettivo (11 di default)!
        </p>
      </section>
    </>
  );
}
