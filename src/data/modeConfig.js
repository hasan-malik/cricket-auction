/**
 * Single source of truth for Bullet / Blitz / Rapid mode configuration.
 *
 * To tweak a mode (squad size, budget, timer, composition) edit the
 * MODE_CONFIGS object below — nothing else in the codebase needs to change.
 *
 * Slot keys (bat / bowl / ar / wk) are used consistently throughout the app.
 * In bullet/blitz, wicket-keepers fill the 'bat' slot (wkCountsAsBatsman:true).
 * In rapid, wicket-keepers have their own dedicated 'wk' slot.
 *
 * poolRoles = requiredSlots × NUM_TEAMS.  It defines exactly how many players
 * of each role-group are selected for the auction pool so that 100% sell-through
 * is achievable (every team can complete their required composition).
 */

export const NUM_TEAMS = 6; // 1 user + 5 AI franchises

// Canonical slot key constants — use these instead of bare strings
export const SLOTS = {
  BAT:  'bat',
  BOWL: 'bowl',
  AR:   'ar',
  WK:   'wk',
};

// Human-readable labels and icons per slot
export const SLOT_LABEL = {
  bat:  'Batsman',
  bowl: 'Bowler',
  ar:   'All-rounder',
  wk:   'Wicket-keeper',
};

export const SLOT_ICON = {
  bat:  '🏏',
  bowl: '🎳',
  ar:   '⭐',
  wk:   '🧤',
};

/**
 * Per-blitz-mode configuration.
 *
 * exactSquadSize    — both the minimum and maximum squad size (every team
 *                     must buy exactly this many players)
 * budget            — starting budget in CR
 * timerSeconds      — per-bid countdown timer
 * autoAdvanceMs     — delay after sold/unsold before next player loads
 * wkCountsAsBatsman — if true, WK fills the 'bat' slot (no 'wk' slot)
 * categories        — player tiers to draw the pool from
 * requiredSlots     — exact number of each slot every team must complete
 * poolRoles         — total players per slot in the pool = requiredSlots × NUM_TEAMS
 */
export const MODE_CONFIGS = {
  bullet: {
    label:             'Bullet',
    exactSquadSize:    3,
    budget:            8.0,
    timerSeconds:      5,
    autoAdvanceMs:     1500,
    wkCountsAsBatsman: true,
    categories:        ['platinum', 'diamond', 'gold'],
    requiredSlots:     { bat: 1, bowl: 1, ar: 1 },
    poolRoles:         { bat: 6,  bowl: 6,  ar: 6  },  // 1 × 6 teams
  },

  blitz: {
    label:             'Blitz',
    exactSquadSize:    5,
    budget:            15.0,
    timerSeconds:      6,
    autoAdvanceMs:     1500,
    wkCountsAsBatsman: true,
    categories:        ['platinum', 'diamond', 'gold'],
    requiredSlots:     { bat: 2, bowl: 2, ar: 1 },
    poolRoles:         { bat: 12, bowl: 12, ar: 6  },  // requiredSlots × 6 teams
  },

  rapid: {
    label:             'Rapid',
    exactSquadSize:    8,
    budget:            18.0,
    timerSeconds:      7,
    autoAdvanceMs:     1500,
    wkCountsAsBatsman: false,
    categories:        ['platinum', 'diamond', 'gold', 'silver'],
    requiredSlots:     { bat: 2, bowl: 3, ar: 2, wk: 1 },
    poolRoles:         { bat: 12, bowl: 18, ar: 12, wk: 6 },  // requiredSlots × 6 teams
  },
};
