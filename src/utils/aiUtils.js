/**
 * Rule-based AI bidding logic (placeholder until Gemini integration).
 * AI "personalities" determine aggression and squad-building strategy.
 */

export const AI_FRANCHISES = [
  'islamabad-united',
  'karachi-kings',
  'quetta-gladiators',
];

// How many of each role the AI wants in its final squad
const IDEAL_SQUAD = {
  batsman:        5,
  'wicket-keeper': 2,
  'all-rounder':  4,
  bowler:         5,
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
 */
export function generateAITargets(players, franchiseBudget, personality = 'balanced') {
  const targets = {};
  const multiplierRange = {
    aggressive:   { min: 1.3, max: 2.8 },
    balanced:     { min: 1.0, max: 2.0 },
    value:        { min: 0.8, max: 1.6 },
  }[personality] ?? { min: 1.0, max: 2.0 };

  for (const player of players) {
    const quality = scorePlayer(player); // 0–1
    // Better players get a higher multiplier (up to max)
    const t = 0.5 + quality * 0.5; // remap to 0.5–1.0
    const multiplier = multiplierRange.min + t * (multiplierRange.max - multiplierRange.min);
    // Cap: don't bid more than 20% of budget on a single player
    const maxAllowed = franchiseBudget * 0.20;
    const raw = player.basePrice * multiplier;
    // Round to nearest 0.05 CR
    targets[player.id] = Math.round(Math.min(raw, maxAllowed) * 20) / 20;
  }

  return targets;
}

/**
 * Decide whether AI should bid on the current state.
 * Returns the new bid amount (in CR) or null if AI passes.
 */
export function getAIBid(state) {
  const { currentPlayer, currentBid, ai, bidIncrements } = state;
  if (!currentPlayer) return null;

  const target = ai.targets[currentPlayer.id] ?? 0;
  const squadSize = ai.squad.length;
  const roleCount = ai.squad.filter(p => p.role === currentPlayer.role).length;
  const rolesNeeded = IDEAL_SQUAD[currentPlayer.role] ?? 3;

  // Hard pass: AI already winning, squad full, out of budget, or past target
  if (state.bidder === 'ai') return null;
  if (squadSize >= 18) return null;

  // Desperately needs this role → willing to go 20% over target
  const urgencyBonus = roleCount < rolesNeeded * 0.5 ? 1.2 : 1.0;
  const effectiveTarget = target * urgencyBonus;

  const nextBid = currentBid + (bidIncrements[0] ?? 0.05);
  if (nextBid > effectiveTarget) return null;
  if (nextBid > ai.budget) return null;

  // Choose smallest increment that keeps AI above user
  const increment = bidIncrements.find(inc => currentBid + inc <= effectiveTarget) ?? bidIncrements[0];
  const bid = Math.round((currentBid + increment) * 20) / 20;
  if (bid > ai.budget) return null;

  return bid;
}
