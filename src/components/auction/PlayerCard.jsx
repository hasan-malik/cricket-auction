import { motion } from 'framer-motion';

const ROLE_ICONS = {
  'batsman':        '🏏',
  'wicket-keeper':  '🧤',
  'all-rounder':    '⭐',
  'bowler':         '🎳',
};

const CATEGORY_COLORS = {
  platinum: { glow: '#E5E4E2', text: '#c8c5c0', bg: 'rgba(229,228,226,0.08)' },
  diamond:  { glow: '#7DD3FC', text: '#7dd3fc', bg: 'rgba(125,211,252,0.08)' },
  gold:     { glow: '#FFD700', text: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
  silver:   { glow: '#C0C0C0', text: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
  emerging: { glow: '#86EFAC', text: '#86efac', bg: 'rgba(134,239,172,0.08)' },
};

function StatBox({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      padding: '10px 14px',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.06)',
      minWidth: '72px',
    }}>
      <span style={{
        fontSize: '18px',
        fontWeight: 700,
        color: highlight ? '#60a5fa' : '#fff',
        letterSpacing: '-0.02em',
      }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
  );
}

export default function PlayerCard({ player, isNew }) {
  if (!player) return null;
  const cat = CATEGORY_COLORS[player.category] ?? CATEGORY_COLORS.silver;
  const s = player.stats;
  const isBatter = player.role === 'batsman' || player.role === 'wicket-keeper';
  const isBowler = player.role === 'bowler';

  return (
    <motion.div
      key={player.id}
      initial={isNew ? { opacity: 0, scale: 0.94, y: 20 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${cat.glow}33`,
        borderRadius: '20px',
        padding: '28px 24px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 0 40px ${cat.glow}18`,
        width: '100%',
        maxWidth: '380px',
        margin: '0 auto',
      }}
    >
      {/* Category badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: cat.text,
          background: cat.bg,
          padding: '4px 10px',
          borderRadius: '9999px',
          border: `1px solid ${cat.glow}44`,
        }}>
          {player.category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {player.rating != null && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: cat.text,
              background: cat.bg,
              padding: '3px 8px',
              borderRadius: '9999px',
              border: `1px solid ${cat.glow}44`,
              letterSpacing: '0.04em',
            }}>
              ★ {player.rating}
            </span>
          )}
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {player.nationality === 'Overseas' ? '🌍 Overseas' : '🇵🇰 Pakistani'}
          </span>
        </div>
      </div>

      {/* Player name */}
      <div style={{ marginBottom: '6px' }}>
        <h2 style={{
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.03em',
          margin: 0,
          lineHeight: 1.1,
        }}>
          {player.name}
        </h2>
      </div>

      {/* Role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        <span style={{ fontSize: '14px' }}>{ROLE_ICONS[player.role]}</span>
        <span style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'capitalize',
        }}>
          {player.role.replace('-', ' ')}
          {player.bowlingStyle ? ` · ${player.bowlingStyle}` : ''}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <StatBox label="Matches" value={s.pslMatches} />
        {(isBatter || player.role === 'all-rounder') && (
          <>
            <StatBox label="Runs" value={s.runs?.toLocaleString()} highlight />
            <StatBox label="Avg" value={s.battingAvg} />
            <StatBox label="SR" value={s.strikeRate} />
          </>
        )}
        {(isBowler || player.role === 'all-rounder') && (
          <>
            <StatBox label="Wkts" value={s.wickets} highlight />
            <StatBox label="Econ" value={s.economy} />
          </>
        )}
        {isBowler && !s.runs && null}
        {player.role === 'wicket-keeper' && (
          <StatBox label="HS" value={s.highScore} />
        )}
      </div>
    </motion.div>
  );
}
