import { motion } from 'framer-motion';
import auctionConfig from '../../data/auctionConfig.json';

export default function AIPanel({ aiTeams, bidder, isLight }) {
  const c = {
    text:    isLight ? '#111' : '#fff',
    muted:   isLight ? '#6b7280' : 'rgba(255,255,255,0.45)',
    surface: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
    border:  isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
  };

  const teams = Object.values(aiTeams);

  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: '16px',
      padding: '14px',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: 0,
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: c.muted,
        marginBottom: '2px',
      }}>
        AI Franchises
      </div>

      {teams.map(team => {
        const isBidding = bidder === team.id;
        const pctLeft = (team.budget / auctionConfig.franchiseBudget) * 100;
        const color = team.franchise?.primaryColor ?? '#f59e0b';

        return (
          <motion.div
            key={team.id}
            animate={isBidding ? { scale: 1.02 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: '9px 11px',
              borderRadius: '10px',
              background: isBidding ? `${color}18` : 'rgba(255,255,255,0.025)',
              border: isBidding ? `1px solid ${color}55` : '1px solid rgba(255,255,255,0.05)',
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: isBidding ? color : c.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100px',
                transition: 'color 0.2s',
              }}>
                {isBidding && <span style={{ marginRight: '4px' }}>🔨</span>}
                {team.franchise?.shortName ?? team.name}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: isBidding ? color : c.muted, flexShrink: 0 }}>
                {team.budget.toFixed(1)}CR
              </div>
            </div>

            {/* Budget bar */}
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '9999px', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${pctLeft}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: pctLeft > 50 ? color : pctLeft > 25 ? '#f59e0b' : '#ef4444',
                  borderRadius: '9999px',
                }}
              />
            </div>

            <div style={{ fontSize: '10px', color: c.muted, marginTop: '4px' }}>
              {team.squad.length} players
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
