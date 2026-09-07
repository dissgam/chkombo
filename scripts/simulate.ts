#!/usr/bin/env node
/**
 * Scopa AI Simulation CLI
 *
 * Run CPU-vs-CPU simulations from the command line for balance testing
 * and regression checks.
 *
 * Usage:
 *   npx tsx scripts/simulate.ts --player1=heuristic --player2=expert --games=100
 */

// Import game logic and AI from src/
import type { GameState, Move, PlayerId } from '../src/games/scopa/types.js';
import { dealCards } from '../src/games/scopa/deck.js';
import { getValidMoves, isValidMove, executeMove } from '../src/games/scopa/rules.js';
import { calculateRoundScore } from '../src/games/scopa/scoring.js';
import { DEFAULT_TARGET_SCORE, CARDS_PER_HAND } from '../src/games/scopa/constants.js';
import { createInitialState, dealInitialCards } from '../src/games/scopa/reducer.js';
import { randomAI as randomAIBase } from '../src/games/scopa/ai/random.js';
import { heuristicAI as heuristicAIBase } from '../src/games/scopa/ai/heuristic.js';
import { selectExpertMoveWithState } from '../src/games/scopa/ai/expert.js';
import type { AIPlayer, AIContext } from '../src/games/scopa/ai/types.js';

// ============================================================================
// Wrap imported AIs with game character names
// ============================================================================

const randomAI: AIPlayer = { ...randomAIBase, name: '🐒 Scimmietta' };
const heuristicAI: AIPlayer = { ...heuristicAIBase, name: '🦊 Furbo' };

// ============================================================================
// Expert AI Wrapper (uses selectExpertMoveWithState from src/games/scopa/ai/expert.ts)
// ============================================================================

interface ExpertAIPlayer {
  name: string;
  selectMoveWithState(state: GameState): Move;
}

const expertAI: ExpertAIPlayer = {
  name: '🧠 Esperto',
  selectMoveWithState(state: GameState): Move {
    return selectExpertMoveWithState(state, { timeBudgetMs: 100 });
  },
};

function isExpertAI(ai: AnyGameAIPlayer): ai is ExpertAIPlayer {
  return 'selectMoveWithState' in ai;
}

// ============================================================================
// AI Factory
// ============================================================================

type AIType = 'random' | 'heuristic' | 'expert';

interface AIConfig {
  type: AIType;
}

type AnyGameAIPlayer = AIPlayer | ExpertAIPlayer;

function createAI(config: AIConfig): AnyGameAIPlayer {
  switch (config.type) {
    case 'random':
      return randomAI;
    case 'heuristic':
      return heuristicAI;
    case 'expert':
      return expertAI;
    default:
      throw new Error(`Unknown AI type: ${config.type}`);
  }
}

// ============================================================================
// Simulation Engine
// ============================================================================

interface CategoryStats {
  cards: number;
  coins: number;
  setteBello: number;
  prime: number;
  scopas: number;
}

interface GameResult {
  game: number;
  player1Score: number;
  player2Score: number;
  rounds: number;
  winner: 'player1' | 'player2' | 'tie';
  player1Categories: CategoryStats;
  player2Categories: CategoryStats;
}

interface SimulationStats {
  gamesPlayed: number;
  player1Wins: number;
  player2Wins: number;
  ties: number;
  player1TotalScore: number;
  player2TotalScore: number;
  totalRounds: number;
  player1Categories: CategoryStats;
  player2Categories: CategoryStats;
  gameResults: GameResult[];
}

interface RoundEndInfo {
  round: number;
  player1Score: number;
  player2Score: number;
  gameOver: boolean;
}

interface GameResultInternal {
  winner: 'player1' | 'player2' | 'tie';
  scores: { player1: number; player2: number };
  rounds: number;
  player1Categories: CategoryStats;
  player2Categories: CategoryStats;
}

function runGame(
  player1: AnyGameAIPlayer,
  player2: AnyGameAIPlayer,
  targetScore: number,
  verbose: boolean,
  onRoundEnd?: (info: RoundEndInfo) => void
): GameResultInternal {
  let state = createInitialState(targetScore);

  // Randomly select first dealer
  state.round.dealer = Math.random() < 0.5 ? 'human' : 'cpu';
  state = dealInitialCards(state);

  // Track category stats across all rounds
  const player1Categories: CategoryStats = { cards: 0, coins: 0, setteBello: 0, prime: 0, scopas: 0 };
  const player2Categories: CategoryStats = { cards: 0, coins: 0, setteBello: 0, prime: 0, scopas: 0 };

  while (state.status !== 'gameEnd') {
    // Play until round ends
    while (state.status === 'playing') {
      const currentPlayer = state.round.currentPlayer;
      const ai = currentPlayer === 'human' ? player1 : player2;
      const hand = state.players[currentPlayer].hand;
      const table = state.round.table;

      const validMoves: Move[] = [];
      for (const card of hand) {
        validMoves.push(...getValidMoves(card, table, currentPlayer));
      }

      // Get move based on AI type
      let move: Move;
      if (isExpertAI(ai)) {
        // Expert AI needs full game state
        move = ai.selectMoveWithState(state);
      } else {
        const context: AIContext = { hand, table, player: currentPlayer };
        move = (ai as AIPlayer).selectMove(context);
      }

      // Validate and execute
      if (!isValidMove(move, hand, table)) {
        // Fallback to first valid move
        move = validMoves[0];
      }

      state = executeMove(state, move);

      // Check for re-deal or round end
      const humanHandEmpty = state.players.human.hand.length === 0;
      const cpuHandEmpty = state.players.cpu.hand.length === 0;

      if (humanHandEmpty && cpuHandEmpty) {
        if (state.round.deck.length > 0) {
          // Re-deal
          const humanDeal = dealCards(state.round.deck, CARDS_PER_HAND);
          const cpuDeal = dealCards(humanDeal.remaining, CARDS_PER_HAND);
          state = {
            ...state,
            round: { ...state.round, deck: cpuDeal.remaining },
            players: {
              human: { ...state.players.human, hand: humanDeal.dealt },
              cpu: { ...state.players.cpu, hand: cpuDeal.dealt },
            },
          };
        } else {
          // Round end - undo scopa on last hand
          if (move.isScopa) {
            const playerState = state.players[move.player];
            state = {
              ...state,
              players: {
                ...state.players,
                [move.player]: {
                  ...playerState,
                  scopaCount: playerState.scopaCount - 1,
                  scopaCaptures: playerState.scopaCaptures.slice(0, -1),
                },
              },
            };
          }
          state = { ...state, status: 'roundEnd' };
        }
      }
    }

    // Process round end
    if (state.status === 'roundEnd') {
      // Award remaining table cards to last capture player
      if (state.round.table.length > 0 && state.round.lastCapture) {
        const lastPlayer = state.round.lastCapture;
        state = {
          ...state,
          round: { ...state.round, table: [] },
          players: {
            ...state.players,
            [lastPlayer]: {
              ...state.players[lastPlayer],
              captured: [...state.players[lastPlayer].captured, ...state.round.table],
            },
          },
        };
      }

      // Calculate scores
      const roundScores = calculateRoundScore(state);
      const newHumanScore = state.scores.human + roundScores.human.total;
      const newCpuScore = state.scores.cpu + roundScores.cpu.total;

      // Accumulate category stats
      player1Categories.cards += roundScores.human.cards;
      player1Categories.coins += roundScores.human.coins;
      player1Categories.setteBello += roundScores.human.setteBello;
      player1Categories.prime += roundScores.human.prime;
      player1Categories.scopas += roundScores.human.scopas;
      player2Categories.cards += roundScores.cpu.cards;
      player2Categories.coins += roundScores.cpu.coins;
      player2Categories.setteBello += roundScores.cpu.setteBello;
      player2Categories.prime += roundScores.cpu.prime;
      player2Categories.scopas += roundScores.cpu.scopas;

      if (verbose) {
        console.log(`  Round ${state.roundNumber}: P1=${roundScores.human.total} (${newHumanScore}) P2=${roundScores.cpu.total} (${newCpuScore})`);
      }

      // Update scores
      state = {
        ...state,
        scores: { human: newHumanScore, cpu: newCpuScore },
        lastRoundScores: roundScores,
      };

      // Check for game end
      const isGameOver = newHumanScore >= targetScore || newCpuScore >= targetScore;

      // Notify round end
      if (onRoundEnd) {
        onRoundEnd({
          round: state.roundNumber,
          player1Score: newHumanScore,
          player2Score: newCpuScore,
          gameOver: isGameOver,
        });
      }

      // Check for game end
      if (isGameOver) {
        state = { ...state, status: 'gameEnd' };
      } else {
        // Next round
        const newDealer: PlayerId = state.round.dealer === 'human' ? 'cpu' : 'human';
        state = {
          ...state,
          status: 'playing',
          round: {
            deck: [],
            table: [],
            currentPlayer: newDealer === 'human' ? 'cpu' : 'human',
            dealer: newDealer,
            lastCapture: null,
          },
          players: {
            human: { hand: [], captured: [], scopaCount: 0, scopaCaptures: [] },
            cpu: { hand: [], captured: [], scopaCount: 0, scopaCaptures: [] },
          },
          roundNumber: state.roundNumber + 1,
          lastRoundScores: undefined,
        };
        state = dealInitialCards(state);
      }
    }
  }

  // Determine winner
  let winner: 'player1' | 'player2' | 'tie';
  if (state.scores.human > state.scores.cpu) {
    winner = 'player1';
  } else if (state.scores.cpu > state.scores.human) {
    winner = 'player2';
  } else {
    winner = 'tie';
  }

  return {
    winner,
    scores: { player1: state.scores.human, player2: state.scores.cpu },
    rounds: state.roundNumber,
    player1Categories,
    player2Categories,
  };
}

function runSimulation(
  player1Config: AIConfig,
  player2Config: AIConfig,
  numGames: number,
  targetScore: number,
  verbose: boolean,
  progressInterval: number
): SimulationStats {
  const player1 = createAI(player1Config);
  const player2 = createAI(player2Config);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scopa AI Simulation`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Player 1: ${player1.name}`);
  console.log(`Player 2: ${player2.name}`);
  console.log(`Games: ${numGames} | Target Score: ${targetScore}`);
  if (progressInterval > 0) {
    console.log(`Progress: every ${progressInterval} games`);
  }
  console.log(`${'='.repeat(60)}\n`);

  const stats: SimulationStats = {
    gamesPlayed: 0,
    player1Wins: 0,
    player2Wins: 0,
    ties: 0,
    player1TotalScore: 0,
    player2TotalScore: 0,
    totalRounds: 0,
    player1Categories: { cards: 0, coins: 0, setteBello: 0, prime: 0, scopas: 0 },
    player2Categories: { cards: 0, coins: 0, setteBello: 0, prime: 0, scopas: 0 },
    gameResults: [],
  };

  const startTime = Date.now();
  let lastOutputTime = 0;
  const OUTPUT_THROTTLE_MS = 500;
  let lastPrintedGame = 0;
  let currentProvisionalScore = '';
  const isTTY = process.stdout.isTTY;

  // Helper to output progress (throttled)
  const outputProgress = (force = false) => {
    if (!isTTY) return;
    const now = Date.now();
    if (!force && now - lastOutputTime < OUTPUT_THROTTLE_MS) {
      return;
    }
    lastOutputTime = now;
    if (currentProvisionalScore) {
      process.stdout.write(`\r${currentProvisionalScore}                    `);
    }
  };

  // Helper to finalize game output (moves to next line)
  const finalizeGameOutput = (game: number, p1Score: number, p2Score: number) => {
    if (isTTY) {
      process.stdout.write(`\r\x1b[K`);
    }
    console.log(`Game ${game}: ${p1Score}-${p2Score}`);
    lastPrintedGame = game;
    currentProvisionalScore = '';
  };

  for (let game = 1; game <= numGames; game++) {
    if (verbose) {
      console.log(`\nGame ${game}/${numGames}:`);
    }

    // Callback for round updates
    const onRoundEnd = verbose ? undefined : (info: RoundEndInfo) => {
      if (info.gameOver) {
        finalizeGameOutput(game, info.player1Score, info.player2Score);
      } else {
        currentProvisionalScore = `Game ${game}: ${info.player1Score}-${info.player2Score} (round ${info.round})`;
        outputProgress();
      }
    };

    const result = runGame(player1, player2, targetScore, verbose, onRoundEnd);

    // Ensure final score is output even if callback wasn't called
    if (!verbose && lastPrintedGame < game) {
      finalizeGameOutput(game, result.scores.player1, result.scores.player2);
    }

    stats.gamesPlayed++;
    stats.player1TotalScore += result.scores.player1;
    stats.player2TotalScore += result.scores.player2;
    stats.totalRounds += result.rounds;

    // Accumulate category stats
    stats.player1Categories.cards += result.player1Categories.cards;
    stats.player1Categories.coins += result.player1Categories.coins;
    stats.player1Categories.setteBello += result.player1Categories.setteBello;
    stats.player1Categories.prime += result.player1Categories.prime;
    stats.player1Categories.scopas += result.player1Categories.scopas;
    stats.player2Categories.cards += result.player2Categories.cards;
    stats.player2Categories.coins += result.player2Categories.coins;
    stats.player2Categories.setteBello += result.player2Categories.setteBello;
    stats.player2Categories.prime += result.player2Categories.prime;
    stats.player2Categories.scopas += result.player2Categories.scopas;

    // Store individual game result
    stats.gameResults.push({
      game,
      player1Score: result.scores.player1,
      player2Score: result.scores.player2,
      rounds: result.rounds,
      winner: result.winner,
      player1Categories: result.player1Categories,
      player2Categories: result.player2Categories,
    });

    if (result.winner === 'player1') {
      stats.player1Wins++;
    } else if (result.winner === 'player2') {
      stats.player2Wins++;
    } else {
      stats.ties++;
    }

    // Print intermediate summary at specified intervals
    if (progressInterval > 0 && game % progressInterval === 0 && game < numGames) {
      printIntermediateProgress(game, numGames, stats, player1.name, player2.name, startTime);
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;

  // Print results
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`RESULTS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total time: ${formatTime(totalTime)}`);
  console.log(`Games played: ${stats.gamesPlayed}`);
  console.log(`Avg rounds/game: ${(stats.totalRounds / stats.gamesPlayed).toFixed(1)}`);
  console.log();
  console.log(`${player1.name}:`);
  console.log(`  Wins: ${stats.player1Wins} (${(stats.player1Wins / stats.gamesPlayed * 100).toFixed(1)}%)`);
  console.log(`  Avg score: ${(stats.player1TotalScore / stats.gamesPlayed).toFixed(1)}`);
  console.log();
  console.log(`${player2.name}:`);
  console.log(`  Wins: ${stats.player2Wins} (${(stats.player2Wins / stats.gamesPlayed * 100).toFixed(1)}%)`);
  console.log(`  Avg score: ${(stats.player2TotalScore / stats.gamesPlayed).toFixed(1)}`);
  console.log();
  console.log(`Ties: ${stats.ties} (${(stats.ties / stats.gamesPlayed * 100).toFixed(1)}%)`);

  // Print category stats
  console.log();
  console.log(`Category Breakdown (total points across all games):`);
  const col1Width = Math.max(player1.name.length, 8) + 2;
  const col2Width = Math.max(player2.name.length, 8) + 2;
  console.log(`${''.padEnd(15)}${player1.name.padEnd(col1Width)}${player2.name}`);
  console.log(`  Cards:       ${String(stats.player1Categories.cards).padEnd(col1Width)}${stats.player2Categories.cards}`);
  console.log(`  Coins:       ${String(stats.player1Categories.coins).padEnd(col1Width)}${stats.player2Categories.coins}`);
  console.log(`  Sette Bello: ${String(stats.player1Categories.setteBello).padEnd(col1Width)}${stats.player2Categories.setteBello}`);
  console.log(`  Prime:       ${String(stats.player1Categories.prime).padEnd(col1Width)}${stats.player2Categories.prime}`);
  console.log(`  Scopas:      ${String(stats.player1Categories.scopas).padEnd(col1Width)}${stats.player2Categories.scopas}`);
  const p1CatTotal = stats.player1Categories.cards + stats.player1Categories.coins + stats.player1Categories.setteBello + stats.player1Categories.prime + stats.player1Categories.scopas;
  const p2CatTotal = stats.player2Categories.cards + stats.player2Categories.coins + stats.player2Categories.setteBello + stats.player2Categories.prime + stats.player2Categories.scopas;
  console.log(`  ${'─'.repeat(12 + col1Width + col2Width)}`);
  console.log(`  Total:       ${String(p1CatTotal).padEnd(col1Width)}${p2CatTotal}`);

  console.log(`${'='.repeat(60)}\n`);

  return stats;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function printIntermediateProgress(
  game: number,
  numGames: number,
  stats: SimulationStats,
  player1Name: string,
  player2Name: string,
  startTime: number
): void {
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = game / elapsed;
  const eta = (numGames - game) / rate;
  const p1WinPct = (stats.player1Wins / game * 100).toFixed(1);
  const p2WinPct = (stats.player2Wins / game * 100).toFixed(1);

  console.log(`\n--- Progress: Game ${game}/${numGames} (${formatTime(elapsed)} elapsed, ETA: ${formatTime(eta)}) ---`);
  console.log(`${player1Name}: ${stats.player1Wins} wins (${p1WinPct}%), avg score ${(stats.player1TotalScore / game).toFixed(1)}`);
  console.log(`${player2Name}: ${stats.player2Wins} wins (${p2WinPct}%), avg score ${(stats.player2TotalScore / game).toFixed(1)}`);
  if (stats.ties > 0) {
    console.log(`Ties: ${stats.ties}`);
  }
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): {
  player1: AIConfig;
  player2: AIConfig;
  games: number;
  target: number;
  verbose: boolean;
  interval: number;
  output?: string;
} {
  const args = process.argv.slice(2);

  let player1Type: AIType = 'heuristic';
  let player2Type: AIType = 'random';
  let games = 10;
  let target = DEFAULT_TARGET_SCORE;
  let verbose = false;
  let interval = 10; // Print progress every N games (0 = only at end)
  let output: string | undefined;

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    const [key, value] = arg.split('=');
    switch (key) {
      case '--player1':
      case '-p1':
        player1Type = value as AIType;
        break;
      case '--player2':
      case '-p2':
        player2Type = value as AIType;
        break;
      case '--games':
      case '-g':
        games = parseInt(value, 10);
        break;
      case '--target':
      case '-t':
        target = parseInt(value, 10);
        break;
      case '--verbose':
      case '-v':
        verbose = true;
        break;
      case '--output':
      case '-o':
        output = value;
        break;
      case '--interval':
      case '-i':
        interval = parseInt(value, 10);
        break;
    }
  }

  return {
    player1: { type: player1Type },
    player2: { type: player2Type },
    games,
    target,
    verbose,
    interval,
    output,
  };
}

function printHelp(): void {
  console.log(`
Scopa AI Simulation CLI

Usage:
  npx tsx scripts/simulate.ts [options]

Options:
  --player1, -p1   AI type for player 1 (default: heuristic)
  --player2, -p2   AI type for player 2 (default: random)
  --games, -g      Number of games to run (default: 10)
  --target, -t     Target score per game (default: 11)
  --interval, -i   Print progress every N games (default: 10, 0=off)
  --verbose, -v    Show detailed output (per-round scores)
  --output, -o     Save results to JSON file
  --help, -h       Show this help

AI Types:
  random       Random move selection
  heuristic    Greedy strategy prioritizing valuable captures
  expert       ISMCTS with alpha-beta and determinization (from src/games/scopa/ai/expert.ts)

Examples:
  # Heuristic vs Random, 100 games
  npx tsx scripts/simulate.ts -p1=heuristic -p2=random -g=100

  # Expert vs Heuristic, 50 games
  npx tsx scripts/simulate.ts -p1=expert -p2=heuristic -g=50
`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const config = parseArgs();

  try {
    const stats = runSimulation(
      config.player1,
      config.player2,
      config.games,
      config.target,
      config.verbose,
      config.interval
    );

    if (config.output) {
      const fs = await import('fs');
      const output = {
        config: {
          player1: config.player1,
          player2: config.player2,
          games: config.games,
          targetScore: config.target,
        },
        stats,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync(config.output, JSON.stringify(output, null, 2));
      console.log(`Results saved to ${config.output}`);
    }
  } catch (error) {
    console.error('Simulation failed:', error);
    process.exit(1);
  }
}

main();
