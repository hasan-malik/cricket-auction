import { useReducer, useEffect, useRef, useCallback } from 'react';
import allPlayers from '../data/players.json';
import franchises from '../data/franchises.json';
import auctionConfig from '../data/auctionConfig.json';
import { generateAITargets, getAIBid, AI_FRANCHISES } from '../utils/aiUtils';
import { getGeminiBid } from '../services/geminiService';

const TIMER_START = auctionConfig.bidTimerSeconds ?? 15;
const BID_INCREMENTS = auctionConfig.bidIncrements ?? [0.05, 0.1, 0.25, 0.5];
const CATEGORY_ORDER = auctionConfig.auctionOrder ?? ['platinum','diamond','gold','silver','emerging'];

function buildQueue(players) {
  return CATEGORY_ORDER.flatMap(cat =>
    players
      .filter(p => p.category === cat)
      .sort(() => Math.random() - 0.5) // shuffle within category
  );
}

function pickAIFranchise(userFranchiseId) {
  const others = AI_FRANCHISES.filter(id => id !== userFranchiseId);
  return others[Math.floor(Math.random() * others.length)];
}

function makeInitialState({ franchiseId, teamName }) {
  const queue = buildQueue(allPlayers);
  const [currentPlayer, ...rest] = queue;
  const userFranchise = franchises.find(f => f.id === franchiseId);
  const aiFranchiseId = pickAIFranchise(franchiseId);
  const aiFranchise  = franchises.find(f => f.id === aiFranchiseId);
  const aiTargets = generateAITargets(allPlayers, auctionConfig.franchiseBudget, 'balanced');

  return {
    phase: 'bidding',           // 'bidding' | 'sold' | 'unsold' | 'done'
    currentPlayer,
    queue: rest,
    currentBid: currentPlayer.basePrice,
    bidder: null,               // null | 'user' | 'ai'
    timer: TIMER_START,
    timerKey: 0,                // increment to reset timer effects
    bidIncrements: BID_INCREMENTS,
    soldPlayers: [],            // history

    user: {
      id: 'user',
      name: teamName,
      franchise: userFranchise,
      budget: auctionConfig.franchiseBudget,
      squad: [],
    },
    ai: {
      id: 'ai',
      name: aiFranchise?.name ?? 'AI Team',
      franchise: aiFranchise,
      budget: auctionConfig.franchiseBudget,
      squad: [],
      targets: aiTargets,
    },
  };
}

function reducer(state, action) {
  switch (action.type) {

    case 'TICK': {
      if (state.phase !== 'bidding') return state;
      const next = state.timer - 1;
      if (next <= 0) {
        // Hammer falls
        return resolveHammer(state);
      }
      return { ...state, timer: next };
    }

    case 'USER_BID': {
      if (state.phase !== 'bidding') return state;
      const newBid = Math.round((state.currentBid + action.increment) * 100) / 100;
      if (newBid > state.user.budget) return state;
      return {
        ...state,
        currentBid: newBid,
        bidder: 'user',
        timer: TIMER_START,
        timerKey: state.timerKey + 1,
      };
    }

    case 'AI_BID': {
      if (state.phase !== 'bidding') return state;
      if (state.bidder === 'ai') return state;
      const newBid = action.amount;
      if (newBid > state.ai.budget) return state;
      return {
        ...state,
        currentBid: newBid,
        bidder: 'ai',
        timer: TIMER_START,
        timerKey: state.timerKey + 1,
      };
    }

    case 'NEXT_PLAYER': {
      if (state.queue.length === 0) {
        return { ...state, phase: 'done' };
      }
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

function resolveHammer(state) {
  if (state.bidder === null) {
    return { ...state, phase: 'unsold' };
  }
  const winner = state.bidder; // 'user' | 'ai'
  const soldPlayer = { ...state.currentPlayer, soldPrice: state.currentBid, soldTo: winner };
  const updatedTeam = {
    ...state[winner],
    budget: Math.round((state[winner].budget - state.currentBid) * 100) / 100,
    squad: [...state[winner].squad, soldPlayer],
  };
  return {
    ...state,
    phase: 'sold',
    [winner]: updatedTeam,
    soldPlayers: [...state.soldPlayers, soldPlayer],
  };
}

export function useAuction({ franchiseId, teamName }) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    makeInitialState({ franchiseId, teamName })
  );

  // ── Timer ──────────────────────────────────────────────────────────────────
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

  // ── AI bidding (Gemini → rule-based fallback) ──────────────────────────────
  const aiTimeoutRef = useRef(null);

  useEffect(() => {
    if (state.phase !== 'bidding') return;
    if (state.bidder === 'ai') return;

    const delay = 1200 + Math.random() * 2000;
    clearTimeout(aiTimeoutRef.current);

    aiTimeoutRef.current = setTimeout(async () => {
      // Build squad role counts for Gemini context
      const aiSquad = state.ai.squad.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] ?? 0) + 1;
        return acc;
      }, {});

      // Try Gemini first
      const geminiDecision = await getGeminiBid({
        player:      state.currentPlayer,
        aiBudget:    state.ai.budget,
        currentBid:  state.currentBid,
        bidder:      state.bidder,
        aiSquad,
        personality: 'balanced',
      });

      if (geminiDecision?.action === 'bid' && geminiDecision.amount) {
        dispatch({ type: 'AI_BID', amount: geminiDecision.amount });
        return;
      }
      if (geminiDecision?.action === 'pass') return;

      // Fallback: rule-based
      const bidAmount = getAIBid(state);
      if (bidAmount !== null) dispatch({ type: 'AI_BID', amount: bidAmount });
    }, delay);

    return () => clearTimeout(aiTimeoutRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentBid, state.bidder, state.phase, state.currentPlayer?.id]);

  // ── Public actions ─────────────────────────────────────────────────────────
  const userBid = useCallback((increment) => {
    dispatch({ type: 'USER_BID', increment });
  }, []);

  const nextPlayer = useCallback(() => {
    dispatch({ type: 'NEXT_PLAYER' });
  }, []);

  return { state, userBid, nextPlayer };
}
