/**
 * Rule-based AI bidding logic.
 * AI "personalities" determine aggression and squad-building strategy.
 */

import { MODE_CONFIGS, SLOT_LABEL } from '../data/modeConfig.js';

// ── AI identity ───────────────────────────────────────────────────────────────

export const AI_FRANCHISES = [
  'islamabad-united',
  'lahore-qalandars',
  'karachi-kings',
  'peshawar-zalmi',
  'quetta-gladiators',
  'multan-sultans',
];

// Kept for reference — default personality per franchise.
// The actual per-auction assignment is randomised by shufflePersonalities().
export const AI_PERSONALITIES = {
  'islamabad-united':  'aggressive',
  'lahore-qalandars':  'balanced',
  'karachi-kings':     'value',
  'peshawar-zalmi':    'aggressive',
  'quetta-gladiators': 'balanced',
  'multan-sultans':    'value',
};

// Fixed pool: 2 of each type so the overall auction economy stays balanced
// regardless of which team draws which personality.
const PERSONALITY_POOL = ['aggressive', 'aggressive', 'balanced', 'balanced', 'value', 'value'];

/**
 * Returns a fresh { franchiseId → personality } map with personalities
 * randomly shuffled across all six franchises every auction.
 * The pool is always 2 aggressive / 2 balanced / 2 value.
 *
 * @param {string[]} franchiseIds — all six franchise IDs (AI_FRANCHISES)
 * @returns {{ [franchiseId: string]: string }}
 */
export function shufflePersonalities(franchiseIds) {
  const shuffled = [...PERSONALITY_POOL].sort(() => Math.random() - 0.5);
  return Object.fromEntries(franchiseIds.map((id, i) => [id, shuffled[i]]));
}

// ── Bid increment ─────────────────────────────────────────────────────────────

/**
 * PSL Season 11 dynamic bid increment: rises with the current bid tier.
 */
export function getDynamicIncrement(currentBid, tiers) {
  for (const tier of tiers) {
    if (tier.upTo === null || currentBid < tier.upTo) return tier.increment;
  }
  return tiers[tiers.length - 1].increment;
}

// ── Player scoring (for AI target generation) ────────────────────────────────

const STAT_WEIGHTS = {
  battingAvg: 0.30,
  strikeRate: 0.20,
  wickets:    0.25,
  economy:    0.15,
  pslMatches: 0.10,
};

const RANGES = {
  battingAvg: { min: 5,   max: 50  },
  strikeRate: { min: 90,  max: 180 },
  wickets:    { min: 0,   max: 130 },
  economy:    { min: 6,   max: 12  }, // inverted — lower is better
  pslMatches: { min: 5,   max: 100 },
};

function normalise(value, min, max) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function scorePlayer(player) {
  const s = player.stats;
  let score = 0;
  score += STAT_WEIGHTS.battingAvg * normalise(s.battingAvg || 0, RANGES.battingAvg.min, RANGES.battingAvg.max);
  score += STAT_WEIGHTS.strikeRate * normalise(s.strikeRate || 0, RANGES.strikeRate.min, RANGES.strikeRate.max);
  score += STAT_WEIGHTS.wickets    * normalise(s.wickets    || 0, RANGES.wickets.min,    RANGES.wickets.max);
  score += STAT_WEIGHTS.economy    * (1 - normalise(s.economy || 10, RANGES.economy.min, RANGES.economy.max));
  score += STAT_WEIGHTS.pslMatches * normalise(s.pslMatches || 0, RANGES.pslMatches.min, RANGES.pslMatches.max);
  return score;
}

// ── Slot helpers (exported for use in UI components) ─────────────────────────

/**
 * Map a player role to the required-slot key for the current mode.
 * In bullet/blitz (wkCountsAsBatsman=true): WK fills 'bat'.
 * In rapid (wkCountsAsBatsman=false):       WK fills 'wk'.
 */
export function getPlayerSlot(role, wkCountsAsBatsman) {
  if (role === 'wicket-keeper') return wkCountsAsBatsman ? 'bat' : 'wk';
  if (role === 'batsman')       return 'bat';
  if (role === 'bowler')        return 'bowl';
  if (role === 'all-rounder')   return 'ar';
  return 'bat'; // fallback
}

/**
 * Count filled slots in a squad, keyed by slot name.
 * Returns e.g. { bat: 1, bowl: 0, ar: 1 }
 */
export function countFilledSlots(squad, wkCountsAsBatsman) {
  const counts = {};
  for (const p of squad) {
    const slot = getPlayerSlot(p.role, wkCountsAsBatsman);
    counts[slot] = (counts[slot] ?? 0) + 1;
  }
  return counts;
}

// ── Composition enforcement ───────────────────────────────────────────────────

/**
 * Returns true if a player can be legally bought given the current squad state.
 *
 * Two conditions must both hold:
 *   1. An open required slot exists for this player's role.
 *   2. Buying this player still leaves enough remaining slots to fill every
 *      other required role (prevents locking yourself out of a needed role).
 *
 * Full auction (requiredSlots = null): only enforces the squad cap.
 *
 * @param {Array}        squad            — current squad array
 * @param {object}       player           — player to potentially buy
 * @param {object|null}  requiredSlots    — { bat:N, bowl:M, ar:P, wk:Q } or null
 * @param {number}       squadCap         — max (and exact, for blitz) squad size
 * @param {boolean}      wkCountsAsBatsman
 */
export function canBuyPlayer(squad, player, requiredSlots, squadCap, wkCountsAsBatsman) {
  if (!requiredSlots) return squad.length < squadCap;

  const slot   = getPlayerSlot(player.role, wkCountsAsBatsman);
  const filled = countFilledSlots(squad, wkCountsAsBatsman);

  // Condition 1: open slot for this role
  if ((filled[slot] ?? 0) >= (requiredSlots[slot] ?? 0)) return false;

  // Condition 2: remaining capacity (after this buy) covers all still-required slots
  const totalStillRequired = Object.entries(requiredSlots)
    .reduce((sum, [s, req]) => sum + Math.max(0, req - (filled[s] ?? 0)), 0);
  const remainingAfterBuy  = squadCap - squad.length - 1;
  const stillNeededAfterBuy = totalStillRequired - 1;

  return remainingAfterBuy >= stillNeededAfterBuy;
}

/**
 * Human-readable reason why a player cannot be bought.
 * Returns null if the buy is legal.
 */
export function getBidBlockReason(squad, player, requiredSlots, squadCap, wkCountsAsBatsman) {
  if (!requiredSlots || canBuyPlayer(squad, player, requiredSlots, squadCap, wkCountsAsBatsman)) {
    return null;
  }
  const slot   = getPlayerSlot(player.role, wkCountsAsBatsman);
  const filled = countFilledSlots(squad, wkCountsAsBatsman);

  if ((filled[slot] ?? 0) >= (requiredSlots[slot] ?? 0)) {
    return `${SLOT_LABEL[slot]} slot already filled`;
  }

  // Find which roles still need slots
  const stillNeeded = Object.entries(requiredSlots)
    .filter(([s, req]) => (filled[s] ?? 0) < req && s !== slot)
    .map(([s]) => SLOT_LABEL[s]);

  return `Last slot${stillNeeded.length > 1 ? 's' : ''} reserved for ${stillNeeded.join(' & ')}`;
}

// ── AI target generation ──────────────────────────────────────────────────────

/**
 * Pre-calculate max bid targets for every player before auction starts.
 * Returns { [playerId]: maxBidInCrore }
 *
 * @param {number} maxFraction — max fraction of budget allowed on a single player
 */
export function generateAITargets(players, franchiseBudget, personality = 'balanced', maxFraction = 0.20) {
  const multiplierRange = {
    aggressive: { min: 1.3, max: 2.8 },
    balanced:   { min: 1.0, max: 2.0 },
    value:      { min: 0.8, max: 1.6 },
  }[personality] ?? { min: 1.0, max: 2.0 };

  const targets = {};
  for (const player of players) {
    const quality    = scorePlayer(player);          // 0–1
    const t          = 0.5 + quality * 0.5;          // remap to 0.5–1.0
    const multiplier = multiplierRange.min + t * (multiplierRange.max - multiplierRange.min);
    const maxAllowed = franchiseBudget * maxFraction;
    targets[player.id] = Math.round(Math.min(player.basePrice * multiplier, maxAllowed) * 40) / 40;
  }
  return targets;
}

// ── AI bid decision ───────────────────────────────────────────────────────────

// Full-mode ideal squad targets — used only when requiredSlots is null
const IDEAL_SQUAD_FULL = {
  batsman:         6,
  'wicket-keeper': 2,
  'all-rounder':   5,
  bowler:          6,
};

/**
 * Decide whether a specific AI franchise should bid.
 * Returns the new bid amount (CR) or null if the AI passes.
 *
 * @param {string}       franchiseId
 * @param {object}       aiTeam           — { budget, squad, targets, personality }
 * @param {object}       currentPlayer
 * @param {number}       currentBid
 * @param {string|null}  bidder           — current leading bidder
 * @param {Array}        tiers            — bid increment tiers
 * @param {number}       squadCap         — exact squad cap
 * @param {object|null}  requiredSlots    — null for full auction
 * @param {boolean}      wkCountsAsBatsman
 */
export function getAIBid(
  franchiseId, aiTeam, currentPlayer, currentBid, bidder,
  tiers, squadCap, requiredSlots = null, wkCountsAsBatsman = false,
) {
  if (!currentPlayer)          return null;
  if (bidder === franchiseId)  return null;

  // Hard role enforcement — same rules as the user
  if (!canBuyPlayer(aiTeam.squad, currentPlayer, requiredSlots, squadCap, wkCountsAsBatsman)) {
    return null;
  }

  const target = aiTeam.targets[currentPlayer.id] ?? 0;

  // Urgency bonus: if this role slot is severely under-filled, pay up to 20% over target
  let slotRequired, filledForSlot;
  if (requiredSlots) {
    const slot     = getPlayerSlot(currentPlayer.role, wkCountsAsBatsman);
    const filled   = countFilledSlots(aiTeam.squad, wkCountsAsBatsman);
    slotRequired   = requiredSlots[slot] ?? 0;
    filledForSlot  = filled[slot] ?? 0;
  } else {
    // Full mode: scale full-mode ideal by the squad cap
    slotRequired  = Math.max(1, Math.round((IDEAL_SQUAD_FULL[currentPlayer.role] ?? 4) * squadCap / 19));
    filledForSlot = aiTeam.squad.filter(p => p.role === currentPlayer.role).length;
  }

  const urgencyBonus    = filledForSlot < slotRequired * 0.5 ? 1.2 : 1.0;
  const effectiveTarget = target * urgencyBonus;

  const inc     = getDynamicIncrement(currentBid, tiers);
  const nextBid = Math.round((currentBid + inc) * 1000) / 1000;
  if (nextBid > effectiveTarget) return null;
  if (nextBid > aiTeam.budget)   return null;

  return nextBid;
}

// ── Role-balanced queue builder ───────────────────────────────────────────────

/**
 * Build a role-balanced auction queue for a blitz mode.
 *
 * For each slot type defined in poolRoles, select the top-rated eligible
 * players from the allowed categories, shuffle within each role group,
 * then shuffle the combined queue so roles are interleaved during bidding.
 *
 * This guarantees exactly the right number of each role-group is available
 * so every team can complete their required composition.
 *
 * @param {Array}  players   — full player pool
 * @param {string} blitzMode — 'bullet' | 'blitz' | 'rapid'
 */
export function buildBlitzQueue(players, blitzMode) {
  const cfg = MODE_CONFIGS[blitzMode];
  if (!cfg) return [];

  const { poolRoles, categories, wkCountsAsBatsman } = cfg;

  // Which actual player roles fill each slot type
  const slotToRoles = {
    bat:  wkCountsAsBatsman ? ['batsman', 'wicket-keeper'] : ['batsman'],
    bowl: ['bowler'],
    ar:   ['all-rounder'],
    wk:   ['wicket-keeper'],
  };

  const queue = [];
  for (const [slot, count] of Object.entries(poolRoles)) {
    if (!count) continue;
    const eligibleRoles = slotToRoles[slot];
    const group = players
      .filter(p => eligibleRoles.includes(p.role) && categories.includes(p.category))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, count)
      .sort(() => Math.random() - 0.5); // shuffle within role group
    queue.push(...group);
  }

  // Final shuffle: interleave roles so the auction isn't role-grouped
  return queue.sort(() => Math.random() - 0.5);
}

// ── Blitz squad scoring ───────────────────────────────────────────────────────

/**
 * Score a squad for blitz results.
 * Formula: rating − max(0, (soldPrice/basePrice − 1) × 10)
 * Buying at base price = full rating. Overpaying 2× base = −10 pts.
 */
export function scoreBlitzSquad(squad) {
  const players = squad.map(p => {
    const markup  = p.basePrice > 0 ? (p.soldPrice - p.basePrice) / p.basePrice : 0;
    const penalty = Math.max(0, markup * 10);
    const pts     = Math.round(((p.rating ?? 0) - penalty) * 10) / 10;
    return { ...p, pts };
  });
  const total = Math.round(players.reduce((s, p) => s + p.pts, 0) * 10) / 10;
  return { players, total };
}
