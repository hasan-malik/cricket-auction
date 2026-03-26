import { useReducer, useEffect, useRef, useCallback } from 'react';
import allPlayers from '../data/players.json';
import franchises from '../data/franchises.json';
import auctionConfig from '../data/auctionConfig.json';
import blitzConfig from '../data/blitzConfig.json';
import { generateAITargets, getAIBid, getDynamicIncrement, buildBlitzQueue, AI_FRANCHISES, AI_PERSONALITIES } from '../utils/aiUtils';

const BID_TIERS      = auctionConfig.bidIncrementTiers;
const CATEGORY_ORDER = auctionConfig.auctionOrder ?? ['platinum','diamond','gold','silver','emerging'];

function buildQueue(players) {
  return CATEGORY_ORDER.flatMap(cat =>
    players
      .filter(p => p.category === cat)
      .sort(() => Math.random() - 0.5)
  );
}

function makeAITeam(franchiseId, players, budget, maxFraction) {
  const franchise = franchises.find(f => f.id === franchiseId);
  const personality = AI_PERSONALITIES[franchiseId] ?? 'balanced';
  return {
    id: franchiseId,
    name: franchise?.name ?? franchiseId,
    franchise,
    budget,
    squad: [],
    targets: generateAITargets(players, budget, personality, maxFraction),
    personality,
  };
}

function makeInitialState({ franchiseId, teamName, mode, blitzSize }) {
  const isBlitz = mode === 'blitz';
  const sizeKey  = String(blitzSize ?? 30);

  const budget       = isBlitz ? blitzConfig.budgets[sizeKey]      : auctionConfig.franchiseBudget;
  const timerSeconds = isBlitz ? blitzConfig.timerSeconds           : (auctionConfig.bidTimerSeconds ?? 15);
  const maxSquadSize = isBlitz ? blitzConfig.maxSquadSize[sizeKey]  : auctionConfig.maxSquadSize;
  const maxFraction  = isBlitz ? 0.30 : 0.20;

  const queue = isBlitz ? buildBlitzQueue(allPlayers, blitzSize ?? 30) : buildQueue(allPlayers);
  const [currentPlayer, ...rest] = queue;
  const userFranchise = franchises.find(f => f.id === franchiseId);

  const aiTeams = {};
  for (const id of AI_FRANCHISES) {
    if (id !== franchiseId) {
      aiTeams[id] = makeAITeam(id, allPlayers, budget, maxFraction);
    }
  }

  return {
    mode: mode ?? 'full',
    blitzSize: blitzSize ?? 30,
    config: { timerSeconds, maxSquadSize, budget },
    phase: 'bidding',
    currentPlayer,
    queue: rest,
    currentBid: currentPlayer.basePrice,
    bidder: null,
    userPassed: false,
    timer: timerSeconds,
    timerKey: 0,
    paused: false,
    soldPlayers: [],
    user: {
      id: 'user',
      name: teamName,
      franchise: userFranchise,
      budget,
      squad: [],
    },
    aiTeams,
  };
}

function resolveHammer(state) {
  if (state.bidder === null) {
    return { ...state, phase: 'unsold' };
  }
  const winner = state.bidder;
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
  const { timerSeconds, maxSquadSize } = state.config;

  switch (action.type) {

    case 'PAUSE':
      return { ...state, paused: true };

    case 'RESUME':
      return { ...state, paused: false };

    case 'TICK': {
      if (state.phase !== 'bidding' || state.paused) return state;
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
      if (state.userPassed) return state;
      const newBid = Math.round((state.currentBid + action.increment) * 1000) / 1000;
      if (newBid > state.user.budget) return state;
      return {
        ...state,
        currentBid: newBid,
        bidder: 'user',
        timer: timerSeconds,
        timerKey: state.timerKey + 1,
      };
    }

    case 'USER_PASS': {
      if (state.phase !== 'bidding') return state;
      if (state.userPassed) return state;
      return { ...state, userPassed: true };
    }

    case 'AI_BID': {
      if (state.phase !== 'bidding') return state;
      const { franchiseId, amount } = action;
      if (state.bidder === franchiseId) return state;
      if (amount > (state.aiTeams[franchiseId]?.budget ?? 0)) return state;
      // In blitz mode, also enforce AI squad cap
      if ((state.aiTeams[franchiseId]?.squad.length ?? 0) >= maxSquadSize) return state;
      return {
        ...state,
        currentBid: amount,
        bidder: franchiseId,
        timer: timerSeconds,
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
        userPassed: false,
        timer: timerSeconds,
        timerKey: state.timerKey + 1,
      };
    }

    default:
      return state;
  }
}

export function useAuction({ franchiseId, teamName, mode = 'full', blitzSize = 30 }) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    makeInitialState({ franchiseId, teamName, mode, blitzSize })
  );

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  // ── Timer ────────────────────────────────────────────────────────────────
  const timerRef = useRef(null);
  useEffect(() => {
    if (state.phase !== 'bidding' || state.paused) {
      clearInterval(timerRef.current);
      return;
    }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(timerRef.current);
  }, [state.phase, state.timerKey, state.paused]);

  // ── 5-AI bidding ─────────────────────────────────────────────────────────
  const aiTimeouts = useRef({});

  useEffect(() => {
    if (state.phase !== 'bidding' || state.paused) return;

    const currentState = state;
    const aiIds = Object.keys(currentState.aiTeams);

    for (const id of aiIds) clearTimeout(aiTimeouts.current[id]);

    for (const id of aiIds) {
      if (currentState.bidder === id) continue;

      const delay = 1000 + Math.random() * 3000;

      aiTimeouts.current[id] = setTimeout(() => {
        const s = stateRef.current;
        if (s.phase !== 'bidding') return;
        if (s.bidder === id) return;

        const aiTeam = s.aiTeams[id];
        if (!aiTeam) return;

        if (s.paused) return;

        const bidAmount = getAIBid(
          id,
          aiTeam,
          s.currentPlayer,
          s.currentBid,
          s.bidder,
          BID_TIERS,
          s.config.maxSquadSize,
        );

        if (bidAmount !== null) {
          dispatch({ type: 'AI_BID', franchiseId: id, amount: bidAmount });
        }
      }, delay);
    }

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
  }, [state.currentBid, state.bidder, state.phase, state.currentPlayer?.id, state.paused]);

  const userBid = useCallback((increment) => {
    dispatch({ type: 'USER_BID', increment });
  }, []);

  const userPass = useCallback(() => {
    dispatch({ type: 'USER_PASS' });
  }, []);

  const nextPlayer = useCallback(() => {
    dispatch({ type: 'NEXT_PLAYER' });
  }, []);

  const togglePause = useCallback(() => {
    dispatch({ type: stateRef.current.paused ? 'RESUME' : 'PAUSE' });
  }, []);

  return { state, userBid, userPass, nextPlayer, togglePause };
}
