import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuction } from '../hooks/useAuction';
import { getDynamicIncrement, scoreBlitzSquad } from '../utils/aiUtils';
import auctionConfig from '../data/auctionConfig.json';
import blitzConfig from '../data/blitzConfig.json';
import franchises from '../data/franchises.json';
import PlayerCard from '../components/auction/PlayerCard';
import BidTimer from '../components/auction/BidTimer';
import TeamPanel from '../components/auction/TeamPanel';
import AIPanel from '../components/auction/AIPanel';

function buildCapCursor(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="18" viewBox="0 0 28 18">
    <path d="M4 14 Q4 1 13 1 Q21 1 21 14 Z" fill="${color}"/>
    <path d="M4 14 Q2 14 2 15.5 Q2 17 4 16.5 Z" fill="${color}" fill-opacity="0.7"/>
    <rect x="3" y="13" width="25" height="3" rx="1.5" fill="${color}" fill-opacity="0.8"/>
    <circle cx="12" cy="2.5" r="1.5" fill="rgba(255,255,255,0.5)"/>
  </svg>`;
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}') 27 14, auto`;
}

export default function Auction() {
  const { state: routeState } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const franchiseId = routeState?.franchiseId ?? 'lahore-qalandars';
  const teamName    = routeState?.teamName    ?? 'My Team';
  const mode        = routeState?.mode        ?? 'full';
  const blitzSize   = routeState?.blitzSize   ?? 30;
  const isBlitz     = mode === 'blitz';

  // Apply team-colored cap cursor for the entire auction page
  useEffect(() => {
    const f = franchises.find(fr => fr.id === franchiseId);
    if (f) document.body.style.cursor = buildCapCursor(f.primaryColor);
    return () => { document.body.style.cursor = ''; };
  }, [franchiseId]);

  const { state, userBid, userPass, nextPlayer } = useAuction({ franchiseId, teamName, mode, blitzSize });
  const { phase, currentPlayer, currentBid, bidder, timer, user, aiTeams, queue } = state;

  // PSL S11 dynamic increment — changes with the current bid tier
  const inc = getDynamicIncrement(currentBid, auctionConfig.bidIncrementTiers);
  const bidOptions = [1, 2, 5, 10].map(m => Math.round(inc * m * 1000) / 1000);

  const c = {
    text:   isLight ? '#111' : '#fff',
    muted:  isLight ? '#6b7280' : 'rgba(255,255,255,0.45)',
    border: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    surface: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
  };

  const bidderTeam = bidder && bidder !== 'user' ? aiTeams[bidder] : null;
  const bidderLabel = bidder === 'user' ? user.name : bidderTeam?.name ?? null;
  const bidderColor = bidder === 'user' ? '#3b82f6' : bidderTeam?.franchise?.primaryColor ?? c.muted;

  // Blitz live score
  const blitzScore = isBlitz ? scoreBlitzSquad(user.squad).total : null;

  // Blitz: auto-advance overlay after autoAdvanceMs
  const autoAdvanceRef = useRef(null);
  useEffect(() => {
    if (!isBlitz) return;
    if (phase === 'sold' || phase === 'unsold') {
      autoAdvanceRef.current = setTimeout(nextPlayer, blitzConfig.autoAdvanceMs);
    }
    return () => clearTimeout(autoAdvanceRef.current);
  }, [phase, isBlitz, nextPlayer]);

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
                ? navigate('/blitz-results', { state: { user, aiTeams, blitzSize } })
                : navigate('/results', { state: { user, aiTeams } })
              }
            >
              {isBlitz ? '⚡ See Scores →' : 'See Full Results →'}
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
                background: isBlitz ? '#f59e0b' : '#22c55e',
                boxShadow: isBlitz ? '0 0 8px #f59e0b' : '0 0 8px #22c55e',
                display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isBlitz ? `⚡ Blitz ${blitzSize}` : 'Live Auction'}
              </span>
            </div>
            {isBlitz && blitzScore !== null && (
              <div style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.3)',
                fontSize: '12px',
                fontWeight: 700,
                color: '#fbbf24',
              }}>
                Score: {blitzScore}
              </div>
            )}
          </div>
          <span style={{ fontSize: '13px', color: c.muted }}>
            {queue.length + 1} players remaining
          </span>
        </div>

        {/* ── 3-column layout ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)',
          gap: '16px',
          alignItems: 'start',
        }}>
          {/* Left: user team */}
          <TeamPanel team={user} isUser isLight={isLight} />

          {/* Centre: player + bid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Player card */}
            <PlayerCard player={currentPlayer} isNew key={currentPlayer?.id} />

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

              <BidTimer timer={timer} />
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
                  const canBid = newBid <= user.budget && bidder !== 'user';
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
                <span>
                  {bidder === 'user'
                    ? '✅ You are winning — wait for the hammer'
                    : bidder !== null
                    ? '🔨 AI is leading — raise to outbid'
                    : '👆 Place the first bid'}
                </span>
                {bidder !== null && bidder !== 'user' && (
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

          {/* Right: all AI franchises */}
          <AIPanel aiTeams={aiTeams} bidder={bidder} isLight={isLight} />
        </div>
      </div>

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
                  <div style={{ fontSize: '72px', marginBottom: '8px' }}>🔨</div>
                  <h2 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px', color: '#fff' }}>
                    SOLD!
                  </h2>
                  <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px' }}>
                    <strong style={{ color: bidderColor }}>
                      {bidderLabel}
                    </strong>{' '}
                    won{' '}
                    <strong style={{ color: '#fff' }}>{currentPlayer?.name}</strong>
                  </p>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: bidderColor, letterSpacing: '-0.03em' }}>
                    {currentBid.toFixed(2)} CR
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '72px', marginBottom: '8px' }}>❌</div>
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
