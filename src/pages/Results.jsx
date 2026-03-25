import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import auctionConfig from '../data/auctionConfig.json';

const ROLE_ICONS = {
  'batsman':       '🏏',
  'wicket-keeper': '🧤',
  'all-rounder':   '⭐',
  'bowler':        '🎳',
};

const ROLE_ORDER = ['wicket-keeper', 'batsman', 'all-rounder', 'bowler'];

function sortSquad(squad) {
  return [...squad].sort((a, b) => {
    const ri = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    return ri !== 0 ? ri : b.soldPrice - a.soldPrice;
  });
}

function StatChip({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 16px',
      background: accent ? 'rgba(59,130,246,0.10)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '12px',
      minWidth: '90px',
    }}>
      <span style={{ fontSize: '20px', fontWeight: 800, color: accent ? '#60a5fa' : '#fff', letterSpacing: '-0.03em' }}>
        {value}
      </span>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
        {label}
      </span>
    </div>
  );
}

function PlayerRow({ player, rank, isLight }) {
  const c = { text: isLight ? '#111' : '#fff', muted: isLight ? '#6b7280' : 'rgba(255,255,255,0.45)' };
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.03, ease: [0.22,1,0.36,1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{ROLE_ICONS[player.role]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}
        </div>
        <div style={{ fontSize: '11px', color: c.muted, textTransform: 'capitalize' }}>
          {player.role.replace('-', ' ')} · {player.nationality}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.02em' }}>
          {player.soldPrice?.toFixed(2)} CR
        </div>
        <div style={{ fontSize: '10px', color: c.muted }}>
          base {player.basePrice?.toFixed(2)}
        </div>
      </div>
    </motion.div>
  );
}

function SquadCard({ team, isUser, isLight }) {
  const sorted = sortSquad(team.squad);
  const spent = Math.round((auctionConfig.franchiseBudget - team.budget) * 1000) / 1000;
  const accentColor = isUser ? '#3b82f6' : (team.franchise?.primaryColor ?? '#f59e0b');
  const c = { text: isLight ? '#111' : '#fff', muted: isLight ? '#6b7280' : 'rgba(255,255,255,0.45)', border: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' };

  const roleCounts = ROLE_ORDER.reduce((acc, role) => {
    acc[role] = sorted.filter(p => p.role === role).length;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: isUser ? 0.1 : 0.2 }}
      style={{
        background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${c.border}`,
        borderRadius: '20px',
        padding: '24px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentColor, marginBottom: '4px' }}>
          {isUser ? 'Your Squad' : `AI · ${team.franchise?.shortName ?? 'AI'}`}
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: c.text, letterSpacing: '-0.03em', marginBottom: '16px' }}>
          {team.name}
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatChip label="Players" value={sorted.length} accent />
          <StatChip label="Spent" value={`${spent}CR`} />
          <StatChip label="Remaining" value={`${team.budget.toFixed(2)}CR`} />
        </div>
      </div>

      {/* Role breakdown chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {ROLE_ORDER.map(role => (
          roleCounts[role] > 0 && (
            <span key={role} style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
            }}>
              {ROLE_ICONS[role]} {roleCounts[role]} {role.replace('-', ' ')}
            </span>
          )
        ))}
      </div>

      {/* Player list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {sorted.map((player, i) => (
          <PlayerRow key={player.id} player={player} rank={i} isLight={isLight} />
        ))}
        {sorted.length === 0 && (
          <div style={{ fontSize: '13px', color: c.muted, textAlign: 'center', padding: '24px 0' }}>
            No players acquired
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Results() {
  const { state: routeState } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // If navigated here without state (e.g., direct URL), redirect home
  if (!routeState?.user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No auction data found.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Start an Auction</button>
      </div>
    );
  }

  const { user, aiTeams } = routeState;
  const aiTeamList = Object.values(aiTeams ?? {});
  const bestAI = aiTeamList.reduce((best, t) => (!best || t.squad.length > best.squad.length ? t : best), null);
  const userWon = !bestAI || user.squad.length >= bestAI.squad.length;

  const c = { text: isLight ? '#111' : '#fff', muted: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)' };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="container">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: '56px' }}
        >
          <p className="overline" style={{ marginBottom: '16px' }}>Auction Complete</p>
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: c.text,
            margin: '0 0 16px',
          }}>
            {userWon ? (
              <>You <span className="gradient-text-blue">dominated</span> the auction.</>
            ) : (
              <>The AI <span style={{ color: '#f59e0b' }}>outbid</span> you.</>
            )}
          </h1>
          <p style={{ fontSize: '17px', color: c.muted, maxWidth: '520px', margin: '0 auto 32px' }}>
            You spent <strong style={{ color: '#60a5fa' }}>{Math.round((auctionConfig.franchiseBudget - user.budget) * 1000) / 1000} CR</strong> on{' '}
            <strong style={{ color: c.text }}>{user.squad.length} players</strong>.{' '}
            {bestAI && <>Best AI ({bestAI.name}) got <strong style={{ color: c.text }}>{bestAI.squad.length} players</strong>.</>}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Play Again
            </button>
            <button className="btn-ghost" onClick={() => navigate('/auction', { state: { franchiseId: user.franchise?.id, teamName: user.name } })}>
              Rematch
            </button>
          </div>
        </motion.div>

        {/* Squad comparison — user + all AI teams */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          <SquadCard team={user} isUser isLight={isLight} />
          {aiTeamList.map(team => (
            <SquadCard key={team.id} team={team} isUser={false} isLight={isLight} />
          ))}
        </div>
      </div>
    </div>
  );
}
