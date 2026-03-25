import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const CATEGORIES = ['all', 'platinum', 'diamond', 'gold', 'silver', 'emerging'];
const ROLES      = ['all', 'batsman', 'bowler', 'all-rounder', 'wicket-keeper'];
const ORIGINS    = ['all', 'Pakistani', 'Overseas'];

const CAT_COLORS = {
  platinum: '#c8c5c0',
  diamond:  '#7dd3fc',
  gold:     '#fbbf24',
  silver:   '#9ca3af',
  emerging: '#86efac',
};

const ROLE_ICONS = {
  batsman:        '🏏',
  bowler:         '🎳',
  'all-rounder':  '⭐',
  'wicket-keeper':'🧤',
};

function pillLabel(opt) {
  if (opt === 'all') return 'All';
  return opt.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('-');
}

function PillGroup({ options, selected, onChange, colorMap, iconMap }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {options.map(opt => {
        const active = selected === opt;
        const color  = colorMap?.[opt];
        return (
          <motion.button
            key={opt}
            onClick={() => onChange(opt)}
            whileTap={{ scale: 0.93 }}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: `1px solid ${active
                ? (color ? color + '80' : 'rgba(255,255,255,0.4)')
                : 'rgba(255,255,255,0.10)'}`,
              background: active
                ? (color ? color + '18' : 'rgba(255,255,255,0.11)')
                : 'transparent',
              color: active
                ? (color ?? 'rgba(255,255,255,0.95)')
                : 'rgba(255,255,255,0.42)',
              fontSize: '12px',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.16s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              letterSpacing: '-0.01em',
            }}
          >
            {iconMap?.[opt] && <span style={{ fontSize: '11px' }}>{iconMap[opt]}</span>}
            {pillLabel(opt)}
          </motion.button>
        );
      })}
    </div>
  );
}

export default function FilterBar({ filters, onChange, total, shown }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const hasActive = filters.category !== 'all'
    || filters.role !== 'all'
    || filters.origin !== 'all'
    || filters.search.trim().length > 0;

  const clearAll = () => onChange({ search: '', category: 'all', role: 'all', origin: 'all' });

  const inputBorder = `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.032)',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '20px',
        padding: '22px 24px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        marginBottom: '28px',
      }}
    >
      {/* ── Search ── */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <span style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.28)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search players…"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          style={{
            width: '100%',
            padding: '11px 16px 11px 44px',
            background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
            border: inputBorder,
            borderRadius: '12px',
            fontSize: '14px',
            color: isLight ? '#111' : '#fff',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={e  => { e.target.style.borderColor = 'rgba(79,142,247,0.55)'; }}
          onBlur={e   => { e.target.style.borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'; }}
        />
      </div>

      {/* ── Category ── */}
      <div style={{ marginBottom: '14px' }}>
        <span style={sectionLabel}>Category</span>
        <PillGroup
          options={CATEGORIES}
          selected={filters.category}
          onChange={v => onChange({ ...filters, category: v })}
          colorMap={CAT_COLORS}
        />
      </div>

      {/* ── Role ── */}
      <div style={{ marginBottom: '14px' }}>
        <span style={sectionLabel}>Role</span>
        <PillGroup
          options={ROLES}
          selected={filters.role}
          onChange={v => onChange({ ...filters, role: v })}
          iconMap={ROLE_ICONS}
        />
      </div>

      {/* ── Origin ── */}
      <div style={{ marginBottom: '20px' }}>
        <span style={sectionLabel}>Origin</span>
        <PillGroup
          options={ORIGINS}
          selected={filters.origin}
          onChange={v => onChange({ ...filters, origin: v })}
        />
      </div>

      {/* ── Footer: count + clear ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)' }}>
          Showing{' '}
          <strong style={{ color: '#fff', fontWeight: 600 }}>{shown}</strong>
          {' '}of{' '}
          <strong style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{total}</strong>
          {' '}players
        </span>

        <AnimatePresence>
          {hasActive && (
            <motion.button
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.15 }}
              onClick={clearAll}
              whileTap={{ scale: 0.93 }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '9999px',
                padding: '5px 13px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              Clear ×
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const sectionLabel = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.28)',
  marginBottom: '9px',
};
