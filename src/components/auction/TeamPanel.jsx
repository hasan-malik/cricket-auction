import { motion, AnimatePresence } from 'framer-motion';
import auctionConfig from '../../data/auctionConfig.json';

const ROLE_ICONS = {
  'batsman':       '🏏',
  'wicket-keeper': '🧤',
  'all-rounder':   '⭐',
  'bowler':        '🎳',
};

export default function TeamPanel({ team, isUser, isLight, score, isBlitz, onViewSquad }) {
  const pctLeft = (team.budget / auctionConfig.franchiseBudget) * 100;
  const c = {
    text:    isLight ? '#111' : '#fff',
    muted:   isLight ? '#6b7280' : 'rgba(255,255,255,0.45)',
    surface: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
    border:  isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
  };
  const accentColor = isUser ? '#3b82f6' : '#f59e0b';

  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: '16px',
      padding: '16px',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      minWidth: 0,
      maxHeight: '560px',
      cursor: onViewSquad ? 'pointer' : 'default',
    }}
    onClick={onViewSquad}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: accentColor,
              marginBottom: '2px',
            }}>
              {isUser ? 'Your Squad' : 'AI Squad'}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: c.text,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '140px',
            }}>
              {team.name}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: accentColor, letterSpacing: '-0.03em' }}>
              {team.budget.toFixed(2)}
              <span style={{ fontSize: '10px', fontWeight: 600, color: c.muted, marginLeft: '2px' }}>CR</span>
            </div>
            <div style={{ fontSize: '10px', color: c.muted }}>{team.squad.length} players</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: accentColor, marginTop: '2px' }}>
              {isBlitz
                ? <>⚡ {score ?? 0} pts</>
                : <>★ {score ?? team.squad.reduce((sum, p) => sum + (p.rating ?? 0), 0)}</>
              }
            </div>
          </div>
        </div>

        {/* Budget bar */}
        <div style={{
          height: '3px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '9999px',
          marginTop: '10px',
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${pctLeft}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: pctLeft > 50 ? accentColor : pctLeft > 25 ? '#f59e0b' : '#ef4444',
              borderRadius: '9999px',
            }}
          />
        </div>
      </div>

      {/* Squad list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingRight: '2px',
      }}>
        <AnimatePresence initial={false}>
          {team.squad.length === 0 ? (
            <div style={{ fontSize: '12px', color: c.muted, textAlign: 'center', padding: '16px 0' }}>
              No players yet
            </div>
          ) : (
            [...team.squad].reverse().map(player => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: isUser ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '13px', flexShrink: 0 }}>{ROLE_ICONS[player.role]}</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: c.text,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {player.name}
                </span>
                <span style={{ fontSize: '11px', color: accentColor, fontWeight: 700, flexShrink: 0 }}>
                  {player.soldPrice?.toFixed(2)}CR
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
