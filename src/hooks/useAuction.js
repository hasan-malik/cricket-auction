import { useReducer, useEffect, useRef, useCallback } from 'react';
import allPlayers from '../data/players.json';
import franchises from '../data/franchises.json';
import auctionConfig from '../data/auctionConfig.json';
import { generateAITargets, getAIBid, getDynamicIncrement, AI_FRANCHISES, AI_PERSONALITIES } from '../utils/aiUtils';

const TIMER_START    = auctionConfig.bidTimerSeconds ?? 15;
const BID_TIERS      = auctionConfig.bidIncrementTiers;
const CATEGORY_ORDER = auctionConfig.auctionOrder ?? ['platinum','diamond','gold','silver','emerging'];

function buildQueue(players) {
  return CATEGORY_ORDER.flatMap(cat =>
    players
      .filter(p => p.category === cat)
      .sort(() => Math.random() - 0.5)
  );
}

function makeAITeam(franchiseId, players) {
  const franchise = franchises.find(f => f.id === franchiseId);
  const personality = AI_PERSONALITIES[franchiseId] ?? 'balanced';
  return {
    id: franchiseId,
    name: franchise?.name ?? franchiseId,
    franchise,
    budget: auctionConfig.franchiseBudget,
    squad: [],
    targets: generateAITargets(players, auctionConfig.franchiseBudget, personality),
    personality,
  };
}

function makeInitialState({ franchiseId, teamName }) {
  const queue = buildQueue(allPlayers);
  const [currentPlayer, ...rest] = queue;
  const userFranchise = franchises.find(f => f.id === franchiseId);

  const aiTeams = {};
  for (const id of AI_FRANCHISES) {
    if (id !== franchiseId) {
      aiTeams[id] = makeAITeam(id, allPlayers);
    }
  }

  return {
    phase: 'bidding',
    currentPlayer,
    queue: rest,
    currentBid: currentPlayer.basePrice,
    bidder: null,          // null | 'user' | franchiseId string
    timer: TIMER_START,
    timerKey: 0,
    soldPlayers: [],

    user: {
      id: 'user',
      name: teamName,
      franchise: userFranchise,
      budget: auctionConfig.franchiseBudget,
      squad: [],
    },
    aiTeams,  // { [franchiseId]: aiTeam }
  };
}

function resolveHammer(state) {
  if (state.bidder === null) {
    return { ...state, phase: 'unsold' };
  }
  const winner = state.bidder; // 'user' | franchiseId
  const soldPlayer = { ...state.currentPlayer, soldPrice: state.currentBid, soldTo: winner };

  if (winner === 'user') {
    return {
      ...state,
      phase: 'sold',
      user: {
        ...state.user,
        budget: Math.round((state.user.budget - state.currentBid) * 1000) / 1000,
        squad: [...state.user.squad, soldPlayer],
      },
      soldPlayers: [...state.soldPlayers, soldPlayer],
    };
  }

  return {
    ...state,
    phase: 'sold',
    aiTeams: {
      ...state.aiTeams,
      [winner]: {
        ...state.aiTeams[winner],
        budget: Math.round((state.aiTeams[winner].budget - state.currentBid) * 1000) / 1000,
        squad: [...state.aiTeams[winner].squad, soldPlayer],
      },
    },
    soldPlayers: [...state.soldPlayers, soldPlayer],
  };
}

function reducer(state, action) {
  switch (action.type) {

    case 'TICK': {
      if (state.phase !== 'bidding') return state;
      const next = state.timer - 1;
      if (next <= 0) return resolveHammer(state);
      return { ...state, timer: next };
    }

    case 'QUICK_HAMMER': {
      if (state.phase !== 'bidding') return state;
      if (state.bidder === null) return state;
      return resolveHammer(state);
    }

    case 'USER_BID': {
      if (state.phase !== 'bidding') return state;
      const newBid = Math.round((state.currentBid + action.increment) * 1000) / 1000;
      if (newBid > state.user.budget) return state;
      return {
        ...state,
        currentBid: newBid,
        bidder: 'user',
        timer: TIMER_START,
        timerKey: state.timerKey + 1,
      };
    }

    case 'USER_PASS': {
      if (state.phase !== 'bidding') return state;
      if (state.bidder === null) return state;
      // Immediately hammer — user concedes
      return resolveHammer(state);
    }

    case 'AI_BID': {
      if (state.phase !== 'bidding') return state;
      const { franchiseId, amount } = action;
      // Don't let the current leader re-bid
      if (state.bidder === franchiseId) return state;
      if (amount > (state.aiTeams[franchiseId]?.budget ?? 0)) return state;
      return {
        ...state,
        currentBid: amount,
        bidder: franchiseId,
        timer: TIMER_START,
        timerKey: state.timerKey + 1,
      };
    }

    case 'NEXT_PLAYER': {
      if (state.queue.length === 0) return { ...state, phase: 'done' };
      const [currentPlayer, ...rest] = state.queue;
      return {
        ...state,
        phase: 'bidding',
        currentPlayer,
        queue: rest,
        currentBid: currentPlayer.basePrice,
        bidder: null,
        timer: TIMER_START,
        timerKey: state.timerKey + 1,
      };
    }

    default:
      return state;
  }
}

export function useAuction({ franchiseId, teamName }) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    makeInitialState({ franchiseId, teamName })
  );

  // Always-fresh ref so async callbacks don't close over stale state
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  // ── Timer ────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);
  useEffect(() => {
    if (state.phase !== 'bidding') {
      clearInterval(timerRef.current);
      return;
    }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(timerRef.current);
  }, [state.phase, state.timerKey]);

  // ── 5-AI bidding ─────────────────────────────────────────────────────────
  const aiTimeouts = useRef({});  // { [franchiseId]: timeoutId }

  useEffect(() => {
    if (state.phase !== 'bidding') return;

    const currentState = state;
    const aiIds = Object.keys(currentState.aiTeams);

    // Clear existing timeouts
    for (const id of aiIds) {
      clearTimeout(aiTimeouts.current[id]);
    }

    // Schedule each AI with a unique random delay (staggered 1–4s)
    for (const id of aiIds) {
      // Skip if this AI is the current leader
      if (currentState.bidder === id) continue;

      const delay = 1000 + Math.random() * 3000;

      aiTimeouts.current[id] = setTimeout(() => {
        const s = stateRef.current;
        if (s.phase !== 'bidding') return;
        if (s.bidder === id) return;

        const aiTeam = s.aiTeams[id];
        if (!aiTeam) return;

        const bidAmount = getAIBid(
          id,
          aiTeam,
          s.currentPlayer,
          s.currentBid,
          s.bidder,
          BID_TIERS,
        );

        if (bidAmount !== null) {
          dispatch({ type: 'AI_BID', franchiseId: id, amount: bidAmount });
        }
      }, delay);
    }

    // Quick hammer: if someone is already bidding, drop hammer at ~5s
    // (gives other AIs a chance to counterbid first)
    const quickHammerTimeout = setTimeout(() => {
      const s = stateRef.current;
      if (s.phase === 'bidding' && s.bidder !== null) {
        dispatch({ type: 'QUICK_HAMMER' });
      }
    }, 5000);

    return () => {
      for (const id of aiIds) clearTimeout(aiTimeouts.current[id]);
      clearTimeout(quickHammerTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentBid, state.bidder, state.phase, state.currentPlayer?.id]);

  // ── Public actions ────────────────────────────────────────────────────────
  const userBid = useCallback((increment) => {
    dispatch({ type: 'USER_BID', increment });
  }, []);

  const userPass = useCallback(() => {
    dispatch({ type: 'USER_PASS' });
  }, []);

  const nextPlayer = useCallback(() => {
    dispatch({ type: 'NEXT_PLAYER' });
  }, []);

  return { state, userBid, userPass, nextPlayer };
}
