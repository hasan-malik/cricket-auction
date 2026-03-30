import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { scoreBlitzSquad } from '../utils/aiUtils';
import { MODE_CONFIGS } from '../data/modeConfig.js';

const ROLE_ICONS = {
  'batsman':       '🏏',
  'wicket-keeper': '🧤',
  'all-rounder':   '⭐',
  'bowler':        '🎳',
};

const MEDALS = ['🥇', '🥈', '🥉'];

const c = {
  text:    '#fff',
  muted:   'rgba(255,255,255,0.5)',
  border:  'rgba(255,255,255,0.08)',
  surface: 'rgba(255,255,255,0.04)',
};

/**
 * Score all teams at once, attach `scoredPlayers` and `score`, sort by score desc.
 * Single call-site prevents duplicate scoreBlitzSquad invocations.
 */
function buildScoredTeams(user, aiTeams) {
  return [
    { ...user, isUser: true },
    ...Object.values(aiTeams ?? {}),
  ]
    .map(t => {
      const { players, total } = scoreBlitzSquad(t.squad);
      return { ...t, scoredPlayers: players, score: total };
    })
    .sort((a, b) => b.score - a.score);
}

/** Right-panel breakdown for any team's scored squad. */
function ScoredSquadPanel({ team }) {
  const sorted      = [...team.scoredPlayers].sort((a, b) => b.pts - a.pts);
  const maxPts      = sorted[0]?.pts;
  const minPts      = sorted[sorted.length - 1]?.pts;
  const accentColor = team.isUser ? '#3b82f6' : (team.franchise?.primaryColor ?? '#888');
  const label       = team.isUser ? 'Your Squad' : (team.franchise?.shortName ?? team.name);

  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: '20px',
      padding: '24px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <p style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: accentColor,
        marginBottom: '16px',
      }}>
        {label} · Score Breakdown
      </p>

      {sorted.length === 0 ? (
        <p style={{ fontSize: '13px', color: c.muted, textAlign: 'center', padding: '24px 0' }}>
          No players acquired
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sorted.map(p => {
            const isTop = p.pts === maxPts;
            const isBad = p.pts === minPts && sorted.length > 1 && p.pts < (p.rating ?? 0);
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: isTop ? 'rgba(34,197,94,0.06)' : isBad ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isTop ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <span style={{ fontSize: '15px', flexShrink: 0 }}>{ROLE_ICONS[p.role]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '11px', color: c.muted }}>
                    {p.soldPrice?.toFixed(2)} CR · base {p.basePrice?.toFixed(2)} CR · rating {p.rating ?? '—'}
                  </div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: p.pts >= 0 ? '#60a5fa' : '#f87171', flexShrink: 0 }}>
                  {p.pts > 0 ? `+${p.pts}` : p.pts}
                </div>
              </div>
            );
          })}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '10px 12px 0',
            borderTop: `1px solid ${c.border}`,
            marginTop: '4px',
            fontSize: '14px',
            fontWeight: 800,
            color: '#fbbf24',
          }}>
            Total: {team.score}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlitzResults() {
  const { state: routeState } = useLocation();
  const navigate = useNavigate();

  if (!routeState?.user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No blitz data found.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const { user, aiTeams, blitzMode } = routeState;

  // Score all 6 teams once — drives leaderboard, right panel, and global stats
  const scoredTeams = buildScoredTeams(user, aiTeams);
  const userEntry   = scoredTeams.find(t => t.isUser);
  const userRank    = scoredTeams.indexOf(userEntry) + 1;
  const userScore   = userEntry?.score ?? 0;
  const userWon     = userRank === 1;

  // Auction-wide best steal & biggest overpay across ALL teams
  const allScoredPlayers = scoredTeams.flatMap(t =>
    t.scoredPlayers.map(p => ({
      ...p,
      teamName: t.isUser
        ? `${t.name} (You)`
        : (t.franchise?.shortName ?? t.name),
    }))
  );
  const bestSteal = allScoredPlayers.length > 0
    ? [...allScoredPlayers].sort((a, b) => b.pts - a.pts)[0]
    : null;
  // Only meaningful if someone actually overpaid (paid above base price)
  const biggestOP = allScoredPlayers.filter(p => p.pts < (p.rating ?? 0))
    .sort((a, b) => a.pts - b.pts)[0] ?? null;

  // Right-panel: selected team defaults to the user's team
  const [selectedTeamId, setSelectedTeamId] = useState(user.id);
  const selectedTeam = scoredTeams.find(t => t.id === selectedTeamId) ?? userEntry;

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="container">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <p className="overline" style={{ marginBottom: '16px', color: '#f59e0b' }}>
            {MODE_CONFIGS[blitzMode]?.label ?? 'Blitz'} Complete
          </p>
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: c.text,
            margin: '0 0 12px',
          }}>
            {userWon
              ? <>You <span style={{ color: '#f59e0b' }}>topped</span> the leaderboard.</>
              : <>You finished <span style={{ color: '#f59e0b' }}>#{userRank}</span> of 6.</>
            }
          </h1>
          <p style={{ fontSize: '18px', color: c.muted, margin: '0 0 32px' }}>
            Your score: <strong style={{ color: '#fbbf24', fontSize: '22px' }}>{userScore}</strong>
            {' · '}{user.squad.length} players acquired
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ background: '#d97706' }} onClick={() => navigate('/')}>
              Play Again
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate('/auction', { state: { franchiseId: user.franchise?.id, teamName: user.name, mode: 'blitz', blitzMode: blitzMode ?? 'blitz' } })}
            >
              {(MODE_CONFIGS[blitzMode]?.label ?? 'Blitz')} Again
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate('/auction', { state: { franchiseId: user.franchise?.id, teamName: user.name, mode: 'full' } })}
            >
              Full Auction
            </button>
          </div>
        </motion.div>

        {/* ── Auction-wide highlights ── */}
        {(bestSteal || biggestOP) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              maxWidth: '560px',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '32px',
            }}
          >
            {bestSteal && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Best Steal
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>{bestSteal.name}</div>
                <div style={{ fontSize: '12px', color: c.muted }}>{bestSteal.soldPrice?.toFixed(2)} CR · +{bestSteal.pts} pts</div>
                <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '3px' }}>{bestSteal.teamName}</div>
              </div>
            )}
            {biggestOP && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Biggest Overpay
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>{biggestOP.name}</div>
                <div style={{ fontSize: '12px', color: c.muted }}>{biggestOP.soldPrice?.toFixed(2)} CR · {biggestOP.pts} pts</div>
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px' }}>{biggestOP.teamName}</div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Main grid: leaderboard + squad inspector ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '24px', alignItems: 'start' }}>

          {/* Leaderboard — click a row to inspect that team */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '20px', padding: '24px', backdropFilter: 'blur(20px)' }}
          >
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '16px' }}>
              Leaderboard
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scoredTeams.map((team, i) => {
                const accentColor = team.isUser ? '#3b82f6' : (team.franchise?.primaryColor ?? '#888');
                const isSelected  = team.id === selectedTeamId;
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                    onClick={() => setSelectedTeamId(team.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected
                        ? `${accentColor}18`
                        : (team.isUser ? 'rgba(59,130,246,0.08)' : i === 0 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)'),
                      border: `1px solid ${isSelected
                        ? `${accentColor}55`
                        : (team.isUser ? 'rgba(59,130,246,0.2)' : i === 0 ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.06)')}`,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 }}>
                      {i < 3 ? MEDALS[i] : `#${i + 1}`}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: accentColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {team.isUser ? `${team.name} (You)` : team.name}
                      </div>
                      <div style={{ fontSize: '11px', color: c.muted }}>{team.squad.length} players</div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: i === 0 ? '#fbbf24' : c.text, letterSpacing: '-0.02em', flexShrink: 0 }}>
                      {team.score}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <p style={{ fontSize: '11px', color: c.muted, marginTop: '16px', lineHeight: 1.5 }}>
              Score = Σ (player rating − overpay penalty).<br />
              Buying at base price = full rating. Each 100% markup = −10 pts.
            </p>
            <p style={{ fontSize: '11px', color: c.muted, marginTop: '6px', fontStyle: 'italic' }}>
              Click any team to inspect their squad →
            </p>
          </motion.div>

          {/* Right panel — selected team's scored squad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              {selectedTeam && (
                <motion.div
                  key={selectedTeamId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ScoredSquadPanel team={selectedTeam} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
