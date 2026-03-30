import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { scoreBlitzSquad } from '../utils/aiUtils';

const ROLE_ICONS = {
  'batsman':       '🏏',
  'wicket-keeper': '🧤',
  'all-rounder':   '⭐',
  'bowler':        '🎳',
};

const MEDALS = ['🥇', '🥈', '🥉'];

function allTeamScores(user, aiTeams) {
  const teams = [
    { ...user, isUser: true },
    ...Object.values(aiTeams ?? {}),
  ];
  return teams
    .map(t => ({ ...t, score: scoreBlitzSquad(t.squad).total }))
    .sort((a, b) => b.score - a.score);
}

export default function BlitzResults() {
  const { state: routeState } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!routeState?.user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No blitz data found.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const { user, aiTeams, blitzSize } = routeState;
  const ranked = allTeamScores(user, aiTeams);
  const userRank = ranked.findIndex(t => t.isUser) + 1;
  const { players: scoredPlayers, total: userScore } = scoreBlitzSquad(user.squad);
  const bestSteal  = [...scoredPlayers].sort((a, b) => b.pts - a.pts)[0];
  const biggestOP  = [...scoredPlayers].sort((a, b) => a.pts - b.pts)[0];

  const c = {
    text:   isLight ? '#111' : '#fff',
    muted:  isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
    border: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    surface: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.04)',
  };

  const userWon = userRank === 1;

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="container">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: '56px' }}
        >
          <p className="overline" style={{ marginBottom: '16px', color: '#f59e0b' }}>
            {blitzSize === 15 ? 'Bullet' : blitzSize === 30 ? 'Blitz' : 'Rapid'} Complete
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
              onClick={() => navigate('/auction', { state: { franchiseId: user.franchise?.id, teamName: user.name, mode: 'blitz', blitzSize: blitzSize ?? 30 } })}
            >
              {blitzSize === 15 ? 'Bullet Again' : blitzSize === 30 ? 'Blitz Again' : 'Rapid Again'}
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate('/auction', { state: { franchiseId: user.franchise?.id, teamName: user.name, mode: 'full' } })}
            >
              Full Auction
            </button>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '24px', alignItems: 'start' }}>

          {/* ── Leaderboard ── */}
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
              {ranked.map((team, i) => {
                const accentColor = team.isUser ? '#3b82f6' : (team.franchise?.primaryColor ?? '#888');
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: team.isUser
                        ? 'rgba(59,130,246,0.10)'
                        : i === 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${team.isUser ? 'rgba(59,130,246,0.25)' : i === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
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

            {/* Scoring note */}
            <p style={{ fontSize: '11px', color: c.muted, marginTop: '16px', lineHeight: 1.5 }}>
              Score = Σ (player rating − overpay penalty).
              Buying at base price = full rating. Each 100% markup = −10 pts.
            </p>
          </motion.div>

          {/* ── Your squad breakdown ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Fun stats */}
            {(bestSteal || biggestOP) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {bestSteal && (
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Best Steal
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>{bestSteal.name}</div>
                    <div style={{ fontSize: '12px', color: c.muted }}>{bestSteal.soldPrice?.toFixed(2)} CR · +{bestSteal.pts} pts</div>
                  </div>
                )}
                {biggestOP && scoredPlayers.length > 1 && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Biggest Overpay
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>{biggestOP.name}</div>
                    <div style={{ fontSize: '12px', color: c.muted }}>{biggestOP.soldPrice?.toFixed(2)} CR · {biggestOP.pts} pts</div>
                  </div>
                )}
              </div>
            )}

            {/* Player score list */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '20px', padding: '24px', backdropFilter: 'blur(20px)' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: '16px' }}>
                Your Squad · Score Breakdown
              </p>
              {scoredPlayers.length === 0 ? (
                <p style={{ fontSize: '13px', color: c.muted, textAlign: 'center', padding: '24px 0' }}>No players acquired</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[...scoredPlayers].sort((a, b) => b.pts - a.pts).map((p, i) => {
                    const isTop = i === 0;
                    const isBad = p.pts === Math.min(...scoredPlayers.map(x => x.pts));
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: isTop ? 'rgba(34,197,94,0.06)' : isBad && scoredPlayers.length > 1 ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)',
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
                        <div style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: p.pts >= 0 ? '#60a5fa' : '#f87171',
                          letterSpacing: '-0.02em',
                          flexShrink: 0,
                        }}>
                          {p.pts > 0 ? `+${p.pts}` : p.pts}
                        </div>
                      </motion.div>
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
                    Total: {userScore}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
