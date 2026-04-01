import { motion } from 'framer-motion';
import { GiCricketBat, GiTennisBall, GiBaseballGlove } from 'react-icons/gi';
import { FaStar } from 'react-icons/fa6';

const ROLE_ICONS = {
  'batsman':       <GiCricketBat />,
  'wicket-keeper': <GiBaseballGlove />,
  'all-rounder':   <FaStar />,
  'bowler':        <GiTennisBall />,
};

const CATEGORY_COLORS = {
  platinum: { glow: '#E5E4E2', text: '#c8c5c0', bg: 'rgba(229,228,226,0.08)', price: '#e2e0dd' },
  diamond:  { glow: '#7DD3FC', text: '#7dd3fc', bg: 'rgba(125,211,252,0.08)', price: '#7dd3fc' },
  gold:     { glow: '#FFD700', text: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  price: '#fbbf24' },
  silver:   { glow: '#C0C0C0', text: '#9ca3af', bg: 'rgba(156,163,175,0.08)', price: '#9ca3af' },
  emerging: { glow: '#86EFAC', text: '#86efac', bg: 'rgba(134,239,172,0.08)', price: '#86efac' },
};

function MiniStat({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      flex: 1,
    }}>
      <span style={{
        fontSize: '15px',
        fontWeight: 700,
        color: highlight ? '#60a5fa' : 'rgba(255,255,255,0.88)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        {value ?? '—'}
      </span>
      <span style={{
        fontSize: '9px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
      }}>
        {label}
      </span>
    </div>
  );
}

export default function PlayerBrowserCard({ player, index = 0, isStarred, onToggleStar }) {
  if (!player) return null;

  const cat = CATEGORY_COLORS[player.category] ?? CATEGORY_COLORS.silver;
  const s   = player.stats;
  const isAllRounder = player.role === 'all-rounder';
  const isBatter     = player.role === 'batsman' || player.role === 'wicket-keeper';
  const isBowler     = player.role === 'bowler';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{
        delay: Math.min(index * 0.028, 0.38),
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      }}
      whileHover={{
        y: -5,
        boxShadow: `0 16px 48px ${cat.glow}28, 0 0 0 1px ${cat.glow}22`,
        transition: { duration: 0.22 },
      }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${cat.glow}28`,
        borderRadius: '18px',
        padding: '20px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 0 28px ${cat.glow}0e`,
        position: 'relative',
        cursor: 'default',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: cat.text,
            background: cat.bg,
            padding: '3px 9px',
            borderRadius: '9999px',
            border: `1px solid ${cat.glow}44`,
          }}>
            {player.category}
          </span>
          <span style={{
            fontSize: '10px',
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', opacity: 0.55 }}>
            {player.nationality === 'Overseas' ? '🌍' : '🇵🇰'}
          </span>
          {onToggleStar && (
            <motion.button
              onClick={() => onToggleStar(player.id)}
              whileTap={{ scale: 0.75 }}
              title={isStarred ? 'Remove from watchlist' : 'Add to watchlist'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                fontSize: '15px',
                color: isStarred ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                transition: 'color 0.18s, transform 0.18s',
                lineHeight: 1,
              }}
            >
              {isStarred ? '★' : '☆'}
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Name ── */}
      <h3 style={{
        fontSize: '17px',
        fontWeight: 800,
        color: '#fff',
        letterSpacing: '-0.03em',
        margin: '0 0 5px',
        lineHeight: 1.15,
      }}>
        {player.name}
      </h3>

      {/* ── Role ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        marginBottom: '18px',
      }}>
        <span style={{ fontSize: '12px' }}>{ROLE_ICONS[player.role]}</span>
        <span style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.42)',
          textTransform: 'capitalize',
        }}>
          {player.role.replace('-', ' ')}
          {player.bowlingStyle ? ` · ${player.bowlingStyle}` : ''}
        </span>
      </div>

      {/* ── Divider ── */}
      <div style={{
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${cat.glow}20, transparent)`,
        marginBottom: '16px',
      }} />

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: '2px' }}>
        <MiniStat label="Matches" value={s.pslMatches} />
        {(isBatter || isAllRounder) && (
          <>
            <MiniStat label="Runs"  value={s.runs?.toLocaleString()} highlight />
            <MiniStat label="Avg"   value={s.battingAvg} />
            <MiniStat label="SR"    value={s.strikeRate} />
          </>
        )}
        {(isBowler || isAllRounder) && (
          <>
            <MiniStat label="Wkts" value={s.wickets} highlight />
            <MiniStat label="Econ" value={s.economy} />
          </>
        )}
        {player.role === 'wicket-keeper' && (
          <MiniStat label="HS" value={s.highScore} />
        )}
      </div>

      {/* ── Base price ── */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.055)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
        }}>
          Base Price
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: 700,
          color: cat.price,
          letterSpacing: '-0.02em',
        }}>
          {player.basePrice} CR
        </span>
      </div>
    </motion.div>
  );
}
