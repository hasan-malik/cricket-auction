import { motion } from 'framer-motion';

const ROLE_ICONS = {
  'batsman':       '🏏',
  'wicket-keeper': '🧤',
  'all-rounder':   '⭐',
  'bowler':        '🎳',
};

const c = {
  text:       '#fff',
  muted:      'rgba(255,255,255,0.45)',
  surface:    'rgba(255,255,255,0.04)',
  border:     'rgba(255,255,255,0.08)',
  dropBg:     '#1a1a2e',
  dropBorder: 'rgba(255,255,255,0.12)',
};

// Gold palette for #1 team
const GOLD = {
  border:  'rgba(251,191,36,0.55)',
  bg:      'rgba(251,191,36,0.07)',
  glow:    '0 0 18px rgba(251,191,36,0.18)',
  text:    '#fbbf24',
};

export default function AIPanel({ sortedTeams, rankings, bidder, aiScores, aiRatings, isBlitz, totalBudget }) {
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
        Standings
      </div>

      {sortedTeams.map(team => {
        const isBidding = bidder === team.id;
        const rank      = rankings?.[team.id] ?? null;
        const isFirst   = rank === 1;
        const pctLeft   = (team.budget / totalBudget) * 100;
        const color     = team.franchise?.primaryColor ?? '#f59e0b';

        const headerBg = isFirst
          ? GOLD.bg
          : isBidding
            ? `${color}18`
            : 'rgba(255,255,255,0.07)';
        const headerBorder = isFirst
          ? GOLD.border
          : isBidding
            ? `${color}55`
            : c.dropBorder;

        return (
          // layout prop animates the card smoothly as standings reorder
          <motion.div
            key={team.id}
            layout
            transition={{ layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
            style={isFirst ? { boxShadow: GOLD.glow, borderRadius: '10px' } : undefined}
          >
            {/* Team header */}
            <motion.div
              animate={isBidding ? { scale: 1.02 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                padding: '9px 11px',
                borderRadius: '10px 10px 0 0',
                background: headerBg,
                border: `1px solid ${headerBorder}`,
                borderBottom: 'none',
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              {/* Name row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                  {/* Rank badge */}
                  {rank != null && (
                    <motion.span
                      key={rank}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: isFirst ? GOLD.text : c.muted,
                        background: isFirst ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${isFirst ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '9999px',
                        padding: '1px 6px',
                        flexShrink: 0,
                      }}
                    >
                      #{rank}
                    </motion.span>
                  )}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isFirst ? GOLD.text : isBidding ? color : c.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '90px',
                    transition: 'color 0.2s',
                  }}>
                    {isBidding && <span style={{ marginRight: '4px' }}>🔨</span>}
                    {team.franchise?.shortName ?? team.name}
                  </div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: isFirst ? GOLD.text : isBidding ? color : c.muted, flexShrink: 0 }}>
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
                    background: isFirst ? GOLD.text : pctLeft > 50 ? color : pctLeft > 25 ? '#f59e0b' : '#ef4444',
                    borderRadius: '9999px',
                  }}
                />
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ fontSize: '10px', color: c.muted }}>
                  {team.squad.length} players
                </div>
                {aiScores && (
                  <div style={{ fontSize: '10px', fontWeight: 700, color: isFirst ? GOLD.text : isBidding ? color : c.muted }}>
                    {isBlitz
                      ? <>★ {aiRatings?.[team.id] ?? 0} · ⚡ <motion.span key={aiScores[team.id]} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>{aiScores[team.id] ?? 0}</motion.span> pts</>
                      : <>★ <motion.span key={aiScores[team.id]} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>{aiScores[team.id] ?? 0}</motion.span></>
                    }
                  </div>
                )}
              </div>
            </motion.div>

            {/* Squad list — always visible */}
            <div style={{
              background: c.dropBg,
              border: `1px solid ${isFirst ? GOLD.border : c.dropBorder}`,
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}>
              {team.squad.length === 0 ? (
                <div style={{ fontSize: '11px', color: c.muted, textAlign: 'center', padding: '10px 0' }}>
                  No players yet
                </div>
              ) : (
                [...team.squad].reverse().map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '5px 8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${c.dropBorder}`,
                    borderRadius: '7px',
                  }}>
                    <span style={{ fontSize: '13px', flexShrink: 0 }}>{ROLE_ICONS[p.role]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '10px', color: c.muted }}>
                        {p.role} · ★ {p.rating ?? '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color, flexShrink: 0 }}>
                      {p.soldPrice?.toFixed(2)} CR
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
