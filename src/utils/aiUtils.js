/**
 * Rule-based AI bidding logic.
 * AI "personalities" determine aggression and squad-building strategy.
 */

/**
 * PSL Season 11 dynamic bid increment: amount rises with the current bid tier.
 * @param {number} currentBid
 * @param {Array<{upTo: number|null, increment: number}>} tiers
 */
export function getDynamicIncrement(currentBid, tiers) {
  for (const tier of tiers) {
    if (tier.upTo === null || currentBid < tier.upTo) return tier.increment;
  }
  return tiers[tiers.length - 1].increment;
}

export const AI_FRANCHISES = [
  'islamabad-united',
  'lahore-qalandars',
  'karachi-kings',
  'peshawar-zalmi',
  'quetta-gladiators',
  'multan-sultans',
];

export const AI_PERSONALITIES = {
  'islamabad-united':  'aggressive',
  'lahore-qalandars':  'balanced',
  'karachi-kings':     'value',
  'peshawar-zalmi':    'aggressive',
  'quetta-gladiators': 'balanced',
  'multan-sultans':    'value',
};

// How many of each role the AI wants in its final squad (targeting 18 of 20 max)
const IDEAL_SQUAD = {
  batsman:         6,
  'wicket-keeper': 2,
  'all-rounder':   5,
  bowler:          6,
};

// Stat weights for player valuation (higher = more important to AI)
const STAT_WEIGHTS = {
  battingAvg:  0.30,
  strikeRate:  0.20,
  wickets:     0.25,
  economy:     0.15,
  pslMatches:  0.10,
};

function normalise(value, min, max) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Normalisation ranges for PSL-level stats
const RANGES = {
  battingAvg:  { min: 5,  max: 50 },
  strikeRate:  { min: 90, max: 180 },
  wickets:     { min: 0,  max: 130 },
  economy:     { min: 6,  max: 12 },  // inverted — lower is better
  pslMatches:  { min: 5,  max: 100 },
};

/** Score a player 0–1 based on raw stats */
function scorePlayer(player) {
  const s = player.stats;
  let score = 0;

  score += STAT_WEIGHTS.battingAvg * normalise(s.battingAvg || 0, RANGES.battingAvg.min, RANGES.battingAvg.max);
  score += STAT_WEIGHTS.strikeRate * normalise(s.strikeRate || 0, RANGES.strikeRate.min, RANGES.strikeRate.max);
  score += STAT_WEIGHTS.wickets    * normalise(s.wickets    || 0, RANGES.wickets.min,    RANGES.wickets.max);
  // Economy: lower is better — invert the normalisation
  score += STAT_WEIGHTS.economy    * (1 - normalise(s.economy || 10, RANGES.economy.min, RANGES.economy.max));
  score += STAT_WEIGHTS.pslMatches * normalise(s.pslMatches || 0, RANGES.pslMatches.min, RANGES.pslMatches.max);

  return score;
}

/**
 * Generate AI target prices for every player before auction starts.
 * Returns a map: { [playerId]: maxBidInCrore }
 * @param {number} maxFraction - max fraction of budget to spend on one player (default 0.20)
 */
export function generateAITargets(players, franchiseBudget, personality = 'balanced', maxFraction = 0.20) {
  const targets = {};
  const multiplierRange = {
    aggressive:   { min: 1.3, max: 2.8 },
    balanced:     { min: 1.0, max: 2.0 },
    value:        { min: 0.8, max: 1.6 },
  }[personality] ?? { min: 1.0, max: 2.0 };

  for (const player of players) {
    const quality = scorePlayer(player); // 0–1
    const t = 0.5 + quality * 0.5; // remap to 0.5–1.0
    const multiplier = multiplierRange.min + t * (multiplierRange.max - multiplierRange.min);
    const maxAllowed = franchiseBudget * maxFraction;
    const raw = player.basePrice * multiplier;
    targets[player.id] = Math.round(Math.min(raw, maxAllowed) * 40) / 40;
  }

  return targets;
}

/**
 * Decide whether a specific AI franchise should bid.
 * @param {string} franchiseId - the AI franchise making the decision
 * @param {object} aiTeam - { budget, squad, targets }
 * @param {object} currentPlayer
 * @param {number} currentBid
 * @param {string|null} bidder - current leading bidder
 * @param {Array} tiers - bid increment tiers
 * Returns the new bid amount (in CR) or null if AI passes.
 */
export function getAIBid(franchiseId, aiTeam, currentPlayer, currentBid, bidder, tiers, maxSquadSize = 20) {
  if (!currentPlayer) return null;

  // Hard pass: this AI is already winning
  if (bidder === franchiseId) return null;

  const target = aiTeam.targets[currentPlayer.id] ?? 0;
  const squadSize = aiTeam.squad.length;
  const roleCount = aiTeam.squad.filter(p => p.role === currentPlayer.role).length;
  const baseRolesNeeded = IDEAL_SQUAD[currentPlayer.role] ?? 4;
  const rolesNeeded = Math.max(1, Math.round(baseRolesNeeded * maxSquadSize / 19));

  if (squadSize >= maxSquadSize) return null;

  // Desperately needs this role → willing to go 20% over target
  const urgencyBonus = roleCount < rolesNeeded * 0.5 ? 1.2 : 1.0;
  const effectiveTarget = target * urgencyBonus;

  const inc = getDynamicIncrement(currentBid, tiers);
  const nextBid = Math.round((currentBid + inc) * 1000) / 1000;
  if (nextBid > effectiveTarget) return null;
  if (nextBid > aiTeam.budget) return null;

  return nextBid;
}

/**
 * Build a blitz auction queue: top-N players by rating per category, shuffled within each.
 * @param {Array} players - full player pool
 * @param {number} count - 30 or 50
 */
export function buildBlitzQueue(players, count) {
  const dist = count === 15
    ? { platinum: 3, diamond: 5, gold: 5, silver: 2, emerging: 0 }
    : count === 30
    ? { platinum: 5, diamond: 10, gold: 10, silver: 5, emerging: 0 }
    : { platinum: 5, diamond: 15, gold: 15, silver: 10, emerging: 5 };

  const queue = [];
  for (const cat of ['platinum', 'diamond', 'gold', 'silver', 'emerging']) {
    const n = dist[cat];
    if (!n) continue;
    const top = players
      .filter(p => p.category === cat)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, n)
      .sort(() => Math.random() - 0.5);
    queue.push(...top);
  }
  return queue;
}

/**
 * Score a squad for blitz results.
 * Formula: rating - max(0, (soldPrice/basePrice - 1) * 10)
 * Buying at base = full rating points. Overpaying 2× base = −10 pts.
 * Returns { players: [{...player, pts}], total }
 */
export function scoreBlitzSquad(squad) {
  const players = squad.map(p => {
    const markup = p.basePrice > 0 ? (p.soldPrice - p.basePrice) / p.basePrice : 0;
    const penalty = Math.max(0, markup * 10);
    const pts = Math.round(((p.rating ?? 0) - penalty) * 10) / 10;
    return { ...p, pts };
  });
  const total = Math.round(players.reduce((s, p) => s + p.pts, 0) * 10) / 10;
  return { players, total };
}
