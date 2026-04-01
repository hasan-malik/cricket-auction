import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuction } from '../hooks/useAuction';
import { getDynamicIncrement, scoreBlitzSquad, canBuyPlayer, getBidBlockReason } from '../utils/aiUtils';
import auctionConfig from '../data/auctionConfig.json';
import { MODE_CONFIGS } from '../data/modeConfig.js';
import franchises from '../data/franchises.json';
import PlayerCard from '../components/auction/PlayerCard';
import BidTimer from '../components/auction/BidTimer';
import TeamPanel from '../components/auction/TeamPanel';
import AIPanel from '../components/auction/AIPanel';
import { GiCricketBat, GiTennisBall, GiBaseballGlove } from 'react-icons/gi';
import { FaStar, FaGavel, FaCheck, FaBan, FaHandPointUp, FaXmark, FaPause } from 'react-icons/fa6';
import { HiEye } from 'react-icons/hi2';

function buildCapCursor(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="18" viewBox="0 0 28 18">
    <path d="M4 14 Q4 1 13 1 Q21 1 21 14 Z" fill="${color}"/>
    <path d="M4 14 Q2 14 2 15.5 Q2 17 4 16.5 Z" fill="${color}" fill-opacity="0.7"/>
    <rect x="3" y="13" width="25" height="3" rx="1.5" fill="${color}" fill-opacity="0.8"/>
    <circle cx="12" cy="2.5" r="1.5" fill="rgba(255,255,255,0.5)"/>
  </svg>`;
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}') 27 14, auto`;
}

function darkenColor(hex, factor = 0.55) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${Math.round(r * factor).toString(16).padStart(2, '0')}${Math.round(g * factor).toString(16).padStart(2, '0')}${Math.round(b * factor).toString(16).padStart(2, '0')}`;
}

function buildCapCursorHover(color) {
  const dark = darkenColor(color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="18" viewBox="0 0 28 18">
    <path d="M4 14 Q4 1 13 1 Q21 1 21 14 Z" fill="${dark}"/>
    <path d="M4 14 Q2 14 2 15.5 Q2 17 4 16.5 Z" fill="${dark}" fill-opacity="0.7"/>
    <rect x="3" y="13" width="25" height="3" rx="1.5" fill="${dark}" fill-opacity="0.8"/>
    <circle cx="12" cy="2.5" r="1.5" fill="rgba(255,255,255,0.5)"/>
  </svg>`;
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}') 27 14, pointer`;
}

const CATEGORY_COLORS = {
  platinum: '#E5E4E2',
  diamond:  '#7DD3FC',
  gold:     '#FFD700',
  silver:   '#C0C0C0',
  emerging: '#86EFAC',
};

const ROLE_ICONS = {
  'batsman':       <GiCricketBat />,
  'wicket-keeper': <GiBaseballGlove />,
  'all-rounder':   <FaStar />,
  'bowler':        <GiTennisBall />,
};

// ── Squad Modal ──────────────────────────────────────────────────────────────
function SquadModal({ team, onClose }) {
  if (!team) return null;
  const c = {
    text:    '#fff',
    muted:   'rgba(255,255,255,0.5)',
    surface: '#1a1a2e',
    border:  'rgba(255,255,255,0.1)',
  };
  const accentColor = team.franchise?.primaryColor ?? '#3b82f6';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: '20px',
          padding: '24px',
          width: '380px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
              Squad
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>
              {team.name}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: accentColor }}>
              {team.budget.toFixed(2)} CR left
            </div>
            <div style={{ fontSize: '12px', color: c.muted }}>
              {team.squad.length} players · ★ {team.squad.reduce((s, p) => s + (p.rating ?? 0), 0)}
            </div>
          </div>
        </div>

        {/* Player list */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {team.squad.length === 0 ? (
            <div style={{ textAlign: 'center', color: c.muted, padding: '24px 0', fontSize: '13px' }}>
              No players acquired yet
            </div>
          ) : (
            [...team.squad].reverse().map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${c.border}`,
                borderRadius: '10px',
              }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{ROLE_ICONS[p.role]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '11px', color: c.muted }}>
                    {p.role} · ★ {p.rating ?? '—'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: accentColor, flexShrink: 0 }}>
                  {p.soldPrice?.toFixed(2)} CR
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '10px', borderRadius: '10px', border: `1px solid ${c.border}`,
            background: 'transparent', color: c.muted, cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Upcoming Players Modal ───────────────────────────────────────────────────
function UpcomingModal({ currentPlayer, queue, onClose }) {
  const c = {
    text:    '#fff',
    muted:   'rgba(255,255,255,0.5)',
    surface: '#1a1a2e',
    border:  'rgba(255,255,255,0.1)',
  };
  const allRemaining = currentPlayer ? [currentPlayer, ...queue] : queue;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: '20px',
          padding: '24px',
          width: '480px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
              Auction Queue
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>
              {allRemaining.length} Players Remaining
            </div>
          </div>
        </div>

        {/* Player list */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {allRemaining.map((p, i) => {
            const catColor = CATEGORY_COLORS[p.category] ?? '#888';
            const isCurrent = i === 0;
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px',
                background: isCurrent ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                border: isCurrent ? '1px solid rgba(59,130,246,0.35)' : `1px solid ${c.border}`,
                borderRadius: '10px',
              }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: c.muted, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: '15px', flexShrink: 0 }}>{ROLE_ICONS[p.role]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isCurrent ? '#60a5fa' : c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.2)', padding: '1px 6px', borderRadius: '9999px' }}>
                        NOW
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: c.muted }}>
                    {p.role} · ★ {p.rating ?? '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    color: catColor,
                    background: `${catColor}22`,
                    border: `1px solid ${catColor}44`,
                    padding: '1px 7px', borderRadius: '9999px',
                  }}>
                    {p.category}
                  </span>
                  <span style={{ fontSize: '11px', color: c.muted }}>
                    Base: {p.basePrice.toFixed(2)} CR
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '10px', borderRadius: '10px', border: `1px solid ${c.border}`,
            background: 'transparent', color: c.muted, cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Player Detail Modal (Up Next) ────────────────────────────────────────────
const STAT_ROLES = {
  batsman: ['pslMatches', 'runs', 'battingAvg', 'strikeRate'],
  'wicket-keeper': ['pslMatches', 'runs', 'battingAvg', 'strikeRate', 'highScore'],
  bowler: ['pslMatches', 'wickets', 'economy', 'bowlingAvg'],
  'all-rounder': ['pslMatches', 'runs', 'battingAvg', 'wickets', 'economy'],
};
const STAT_LABELS = {
  pslMatches: 'Matches', runs: 'Runs', battingAvg: 'Avg', strikeRate: 'SR',
  wickets: 'Wkts', economy: 'Econ', bowlingAvg: 'Avg', highScore: 'HS',
};

function PlayerDetailModal({ player, onClose }) {
  if (!player) return null;
  const c = {
    text:    '#fff',
    muted:   'rgba(255,255,255,0.5)',
    surface: '#1a1a2e',
    border:  'rgba(255,255,255,0.1)',
  };
  const catColor = CATEGORY_COLORS[player.category] ?? '#888';
  const statKeys = STAT_ROLES[player.role] ?? ['pslMatches'];
  const s = player.stats ?? {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: c.surface,
          border: `1px solid ${catColor}44`,
          borderRadius: '20px',
          padding: '24px',
          width: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: `0 0 40px ${catColor}22`,
        }}
      >
        {/* Category + rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            color: catColor, background: `${catColor}22`, border: `1px solid ${catColor}44`,
            padding: '3px 10px', borderRadius: '9999px',
          }}>
            {player.category}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {player.rating != null && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: catColor }}>★ {player.rating}</span>
            )}
            <span style={{ fontSize: '12px', color: c.muted }}>
              {player.nationality === 'Overseas' ? '🌍' : '🇵🇰'}
            </span>
          </div>
        </div>

        {/* Name + role */}
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: c.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {player.name}
          </div>
          <div style={{ fontSize: '13px', color: c.muted, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{ROLE_ICONS[player.role]}</span>
            <span style={{ textTransform: 'capitalize' }}>
              {player.role.replace('-', ' ')}
              {player.bowlingStyle ? ` · ${player.bowlingStyle}` : ''}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {statKeys.map(key => (
            <div key={key} style={{
              flex: '1 1 60px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '10px 8px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${c.border}`,
              borderRadius: '10px',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: c.text }}>
                {s[key] != null ? (typeof s[key] === 'number' && s[key] > 999 ? s[key].toLocaleString() : s[key]) : '—'}
              </span>
              <span style={{ fontSize: '9px', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {STAT_LABELS[key]}
              </span>
            </div>
          ))}
        </div>

        {/* Base price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: c.muted, borderTop: `1px solid ${c.border}`, paddingTop: '12px' }}>
          <span>Base Price</span>
          <span style={{ fontWeight: 700, color: c.text }}>{player.basePrice?.toFixed(2)} CR</span>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '10px', borderRadius: '10px', border: `1px solid ${c.border}`,
            background: 'transparent', color: c.muted, cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Auction() {
  const { state: routeState } = useLocation();
  const navigate = useNavigate();
  const franchiseId = routeState?.franchiseId ?? 'lahore-qalandars';
  const teamName    = routeState?.teamName    ?? 'My Team';
  const mode        = routeState?.mode        ?? 'full';
  const blitzMode   = routeState?.blitzMode   ?? null;
  const isBlitz     = mode === 'blitz';

  // Apply team-colored cap cursor for the entire auction page.
  // A dynamic <style> tag bakes the hover variant (glowing cap) into CSS so that
  // clickable elements show the lit-up cursor while everything else shows the plain cap.
  useEffect(() => {
    const f = franchises.find(fr => fr.id === franchiseId);
    if (f) {
      document.body.style.cursor = buildCapCursor(f.primaryColor);
      document.body.classList.add('custom-cursor');

      const style = document.createElement('style');
      style.id = 'cap-cursor-hover-style';
      style.textContent = `
        body.custom-cursor button:hover,
        body.custom-cursor a:hover,
        body.custom-cursor [role="button"]:hover,
        body.custom-cursor label:hover,
        body.custom-cursor select:hover { cursor: ${buildCapCursorHover(f.primaryColor)} !important; }
      `;
      document.head.appendChild(style);
    }
    return () => {
      document.body.style.cursor = '';
      document.body.classList.remove('custom-cursor');
      document.getElementById('cap-cursor-hover-style')?.remove();
    };
  }, [franchiseId]);

  const { state, userBid, userPass, nextPlayer, togglePause } = useAuction({ franchiseId, teamName, mode, blitzMode });
  const { phase, currentPlayer, currentBid, bidder, userPassed, timer, user, aiTeams, queue, paused, config } = state;

  // Modal state
  const [squadModal, setSquadModal] = useState(null); // team object or null
  const [upcomingModal, setUpcomingModal] = useState(false);
  const [upNextPlayer, setUpNextPlayer] = useState(null);

  // PSL S11 dynamic increment — changes with the current bid tier
  const inc = getDynamicIncrement(currentBid, auctionConfig.bidIncrementTiers);
  const bidOptions = [1, 2, 5, 10].map(m => Math.round(inc * m * 1000) / 1000);

  const c = {
    text:    '#fff',
    muted:   'rgba(255,255,255,0.45)',
    border:  'rgba(255,255,255,0.08)',
    surface: 'rgba(255,255,255,0.04)',
  };

  const bidderTeam = bidder && bidder !== 'user' ? aiTeams[bidder] : null;
  const bidderLabel = bidder === 'user' ? user.name : bidderTeam?.name ?? null;
  const bidderColor = bidder === 'user' ? '#3b82f6' : bidderTeam?.franchise?.primaryColor ?? c.muted;

  // Live scores
  const userScore = isBlitz
    ? scoreBlitzSquad(user.squad).total
    : user.squad.reduce((s, p) => s + (p.rating ?? 0), 0);

  const aiScores = {};
  for (const [id, team] of Object.entries(aiTeams)) {
    aiScores[id] = isBlitz
      ? scoreBlitzSquad(team.squad).total
      : team.squad.reduce((s, p) => s + (p.rating ?? 0), 0);
  }

  // Blitz: auto-advance overlay after autoAdvanceMs
  const autoAdvanceRef = useRef(null);
  useEffect(() => {
    if (!isBlitz) return;
    if (phase === 'sold' || phase === 'unsold') {
      autoAdvanceRef.current = setTimeout(nextPlayer, config.autoAdvanceMs ?? 1500);
    }
    return () => clearTimeout(autoAdvanceRef.current);
  }, [phase, isBlitz, nextPlayer]);

  // Role enforcement: can the user legally bid on the current player?
  const userCanBidOnCurrent = !isBlitz || !currentPlayer
    ? true
    : canBuyPlayer(user.squad, currentPlayer, config.requiredSlots, config.squadCap, config.wkCountsAsBatsman);

  const bidBlockReason = !userCanBidOnCurrent && currentPlayer
    ? getBidBlockReason(user.squad, currentPlayer, config.requiredSlots, config.squadCap, config.wkCountsAsBatsman)
    : null;

  // Auto-pass when the current player's slot is already filled — no action needed from the user.
  useEffect(() => {
    if (!userCanBidOnCurrent && phase === 'bidding' && !userPassed) {
      userPass();
    }
  }, [currentPlayer?.id, userCanBidOnCurrent]);

  // Rating totals (used for blitz dual-display)
  const userRatingTotal = user.squad.reduce((s, p) => s + (p.rating ?? 0), 0);
  const aiRatingTotals = {};
  for (const [id, team] of Object.entries(aiTeams)) {
    aiRatingTotals[id] = team.squad.reduce((s, p) => s + (p.rating ?? 0), 0);
  }

  // Live rankings — all 6 teams sorted by score desc, tie-broken by id (stable at 0-0-0)
  const allScoreEntries = [['user', userScore], ...Object.entries(aiScores)];
  const sortedByScore   = [...allScoreEntries].sort(([aId, aScore], [bId, bScore]) =>
    bScore !== aScore ? bScore - aScore : aId.localeCompare(bId)
  );
  const rankings  = Object.fromEntries(sortedByScore.map(([id], i) => [id, i + 1]));
  const userRank  = rankings['user'];

  // AI teams sorted by score for the right-panel standings
  const sortedAITeams = Object.values(aiTeams).sort((a, b) => {
    const sa = aiScores[a.id] ?? 0;
    const sb = aiScores[b.id] ?? 0;
    return sb !== sa ? sb - sa : a.id.localeCompare(b.id);
  });

  // All upcoming players (for scrollable strip)
  const upNextQueue = queue;

  // ── Done screen ──────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '60px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', padding: '0 24px' }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: c.text, letterSpacing: '-0.04em', margin: '0 0 12px' }}>
            Auction Complete
          </h1>
          <p style={{ color: c.muted, marginBottom: '32px', fontSize: '16px' }}>
            You acquired <strong style={{ color: c.text }}>{user.squad.length} players</strong> for{' '}
            <strong style={{ color: '#3b82f6' }}>
              {(auctionConfig.franchiseBudget - user.budget).toFixed(2)} CR
            </strong>
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              style={isBlitz ? { background: '#d97706' } : {}}
              onClick={() => isBlitz
                ? navigate('/blitz-results', { state: { user, aiTeams, blitzMode } })
                : navigate('/results', { state: { user, aiTeams } })
              }
            >
              {isBlitz ? 'See Scores →' : 'See Full Results →'}
            </button>
            <button className="btn-ghost" onClick={() => navigate('/')}>
              Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main auction room ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', paddingTop: '76px', paddingBottom: '40px' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Top bar: progress ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: paused ? '#f59e0b' : isBlitz ? '#f59e0b' : '#22c55e',
                boxShadow: paused ? '0 0 8px #f59e0b' : isBlitz ? '0 0 8px #f59e0b' : '0 0 8px #22c55e',
                display: 'inline-block',
                animation: paused ? 'none' : 'pulse 1.5s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {paused ? 'Paused' : !isBlitz ? 'Live Auction' : (MODE_CONFIGS[blitzMode]?.label ?? 'Blitz')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Pause / Resume button */}
            {phase === 'bidding' && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={togglePause}
                style={{
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  border: paused ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  background: paused ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.05)',
                  color: paused ? '#fbbf24' : c.muted,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {paused ? '▶ Resume' : '⏸ Pause'}
              </motion.button>
            )}
          </div>
        </div>

        {/* ── 3-column layout ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)',
          gap: '16px',
          alignItems: 'start',
        }}>
          {/* Left: user team + score formula */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <TeamPanel
              team={user}
              isUser
              rank={userRank}
              score={userScore}
              ratingTotal={userRatingTotal}
              isBlitz={isBlitz}
              totalBudget={config.budget}
              requiredSlots={config.requiredSlots}
              wkCountsAsBatsman={config.wkCountsAsBatsman}
              onViewSquad={() => setSquadModal(user)}
            />
            {/* Score formula — bottom-left */}
            <div style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '10px',
              padding: '8px 12px',
              backdropFilter: 'blur(16px)',
              fontSize: '10px',
              color: c.muted,
              lineHeight: 1.5,
            }}>
              {isBlitz
                ? <>Score = <strong style={{ color: c.text }}>Σ (rating − max(0, overpay × 10))</strong><br />overpay = (soldPrice − base) / base</>
                : <>Win: <strong style={{ color: c.text }}>highest total rating</strong><br />rating = weighted batting + bowling (0–100)</>
              }
            </div>
          </div>

          {/* Centre: player + bid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Player card — AnimatePresence lets outgoing card exit before new one enters */}
            <AnimatePresence mode="wait">
              <PlayerCard player={currentPlayer} isNew key={currentPlayer?.id} />
            </AnimatePresence>

            {/* Up Next — all remaining players, horizontally scrollable */}
            {upNextQueue.length > 0 && (
              <div style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: '12px',
                padding: '10px 14px',
                backdropFilter: 'blur(16px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Up Next
                  </div>
                  <div style={{ fontSize: '10px', color: c.muted }}>
                    {upNextQueue.length} remaining
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {upNextQueue.map((p) => {
                    const catColor = CATEGORY_COLORS[p.category] ?? '#888';
                    return (
                      <div
                        key={p.id}
                        onClick={() => setUpNextPlayer(p)}
                        style={{
                          flexShrink: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid rgba(255,255,255,0.06)`,
                          minWidth: '64px',
                          cursor: 'pointer',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.borderColor = `${catColor}55`;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{ROLE_ICONS[p.role]}</span>
                        <span style={{
                          fontSize: '9px', fontWeight: 700,
                          color: catColor, textTransform: 'capitalize',
                        }}>
                          {p.category}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: 600, color: c.text,
                          textAlign: 'center', lineHeight: 1.2,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', maxWidth: '60px',
                        }}>
                          {p.name.split(' ').slice(-1)[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current bid display */}
            <div style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '16px',
              padding: '20px 24px',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}>
              <div>
                <div style={{ fontSize: '11px', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  Current Bid
                </div>
                <motion.div
                  key={currentBid}
                  initial={{ scale: 1.15, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: bidderColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {currentBid.toFixed(2)}<span style={{ fontSize: '16px', fontWeight: 600, marginLeft: '4px', opacity: 0.7 }}>CR</span>
                </motion.div>
                <div style={{ fontSize: '12px', color: bidderColor, marginTop: '2px', fontWeight: 600 }}>
                  {bidderLabel ? `Leading: ${bidderLabel}` : 'No bids yet'}
                </div>
              </div>

              <BidTimer timer={timer} timerMax={config.timerSeconds} />
            </div>

            {/* Bid controls */}
            <div style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '16px',
              padding: '16px',
              backdropFilter: 'blur(16px)',
            }}>
              {/* Dynamic bid raise buttons — increment tier updates automatically */}
              <div style={{ marginBottom: '6px', fontSize: '10px', color: c.muted, textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Increment tier: +{inc} CR
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                {bidOptions.map((amount, i) => {
                  const newBid = Math.round((currentBid + amount) * 1000) / 1000;
                  const canBid = userCanBidOnCurrent && newBid <= user.budget && bidder !== 'user' && !userPassed && !paused;
                  const isStandard = i === 0;
                  return (
                    <motion.button
                      key={amount}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => userBid(amount)}
                      disabled={!canBid}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '10px',
                        border: canBid
                          ? isStandard ? '1px solid rgba(59,130,246,0.6)' : '1px solid rgba(59,130,246,0.3)'
                          : '1px solid rgba(255,255,255,0.06)',
                        background: canBid
                          ? isStandard ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.08)'
                          : 'rgba(255,255,255,0.03)',
                        color: canBid ? '#60a5fa' : c.muted,
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: canBid ? 'pointer' : 'not-allowed',
                        transition: 'all 0.15s',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      +{amount.toFixed(3).replace(/\.?0+$/, '')} CR
                    </motion.button>
                  );
                })}
              </div>

              {/* Status hint + Pass button */}
              <div style={{ textAlign: 'center', fontSize: '12px', color: c.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  {paused ? (
                    <><FaPause style={{ fontSize: '11px' }} /> Auction paused</>
                  ) : bidBlockReason ? (
                    <><FaBan style={{ fontSize: '11px' }} /> {bidBlockReason}</>
                  ) : userPassed ? (
                    <><HiEye style={{ fontSize: '13px' }} /> You passed</>
                  ) : bidder === 'user' ? (
                    <><FaCheck style={{ fontSize: '11px', color: '#4ade80' }} /> You are winning — wait for the hammer</>
                  ) : bidder !== null ? (
                    <><FaGavel style={{ fontSize: '11px' }} /> AI is leading — raise to outbid</>
                  ) : (
                    <><FaHandPointUp style={{ fontSize: '11px' }} /> Place the first bid</>
                  )}
                </span>
                {!userPassed && !paused && bidder !== null && bidder !== 'user' && (
                  <button
                    onClick={userPass}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.45)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    Pass →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: AI standings — sorted live by score */}
          <AIPanel
            sortedTeams={sortedAITeams}
            rankings={rankings}
            bidder={bidder}
            aiScores={aiScores}
            aiRatings={aiRatingTotals}
            isBlitz={isBlitz}
            totalBudget={config.budget}
          />
        </div>
      </div>

      {/* ── Screen-edge flash on sold/unsold (fades out on its own, never blocks) ── */}
      <AnimatePresence>
        {(phase === 'sold' || phase === 'unsold') && (
          <motion.div
            key={`flash-${currentPlayer?.id}-${phase}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99, pointerEvents: 'none',
              boxShadow: phase === 'sold'
                ? 'inset 0 0 80px 20px rgba(34,197,94,0.25)'
                : 'inset 0 0 80px 20px rgba(239,68,68,0.18)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Sold / Unsold overlay ── */}
      <AnimatePresence>
        {(phase === 'sold' || phase === 'unsold') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={isBlitz ? undefined : nextPlayer}
          >
            <motion.div
              initial={{ scale: 0.8, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: 'center', padding: '24px' }}
            >
              {phase === 'sold' ? (
                <>
                  <div style={{ fontSize: '72px', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><FaGavel /></div>
                  <motion.h2
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px', color: '#fff' }}
                  >
                    SOLD!
                  </motion.h2>
                  <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px' }}>
                    <strong style={{ color: bidderColor }}>{bidderLabel}</strong>
                    {' '}won{' '}
                    <strong style={{ color: '#fff' }}>{currentPlayer?.name}</strong>
                  </p>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    style={{ fontSize: '32px', fontWeight: 800, color: bidderColor, letterSpacing: '-0.03em' }}
                  >
                    {currentBid.toFixed(2)} CR
                  </motion.p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '72px', marginBottom: '8px', display: 'flex', justifyContent: 'center', color: '#ef4444' }}><FaXmark /></div>
                  <h2 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px', color: '#fff' }}>
                    UNSOLD
                  </h2>
                  <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    {currentPlayer?.name} goes unsold
                  </p>
                </>
              )}
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '24px' }}>
                {isBlitz ? 'Next player incoming…' : 'Tap anywhere to continue'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Squad modal ── */}
      <AnimatePresence>
        {squadModal && (
          <SquadModal
            team={squadModal}
            onClose={() => setSquadModal(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Upcoming players modal ── */}
      <AnimatePresence>
        {upcomingModal && (
          <UpcomingModal
            currentPlayer={currentPlayer}
            queue={queue}
            onClose={() => setUpcomingModal(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Up Next player detail modal ── */}
      <AnimatePresence>
        {upNextPlayer && (
          <PlayerDetailModal
            player={upNextPlayer}
            onClose={() => setUpNextPlayer(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
