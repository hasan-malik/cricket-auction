import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import players from '../data/players.json';
import FilterBar from '../components/players/FilterBar';
import PlayerBrowserCard from '../components/players/PlayerBrowserCard';
import { useWatchlist } from '../hooks/useWatchlist';

const PAGE_SIZE = 24;

const CATEGORY_ORDER = ['platinum', 'diamond', 'gold', 'silver', 'emerging'];

const SORTED_PLAYERS = [...players].sort((a, b) => {
  const ci = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  if (ci !== 0) return ci;
  return (b.stats.pslMatches ?? 0) - (a.stats.pslMatches ?? 0);
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.07 } },
};

export default function Players() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { watchlist, toggle, isStarred } = useWatchlist();

  const [filters, setFilters] = useState({
    search:   '',
    category: 'all',
    role:     'all',
    origin:   'all',
  });
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    return SORTED_PLAYERS.filter(p => {
      if (q && !p.name.toLowerCase().includes(q))              return false;
      if (filters.category !== 'all' && p.category !== filters.category) return false;
      if (filters.role     !== 'all' && p.role     !== filters.role)     return false;
      if (filters.origin   !== 'all' && p.nationality !== filters.origin) return false;
      if (watchlistOnly && !watchlist.has(p.id))               return false;
      return true;
    });
  }, [filters, watchlistOnly, watchlist]);

  const handleFiltersChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const visible  = filtered.slice(0, page * PAGE_SIZE);
  const hasMore  = visible.length < filtered.length;

  const c = {
    text:  isLight ? '#111827' : '#ffffff',
    muted: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '100px' }}>

      {/* ── Hero ── */}
      <section className="section container" style={{ paddingTop: '64px', paddingBottom: '52px' }}>
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ maxWidth: '680px' }}>

          <motion.p variants={fadeUp} className="overline" style={{ marginBottom: '18px' }}>
            PSL S11 · Auction Pool
          </motion.p>

          <motion.h1
            variants={fadeUp}
            style={{
              fontSize: 'clamp(44px, 7vw, 80px)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: '-0.04em',
              margin: '0 0 20px',
              color: c.text,
            }}
          >
            Scout the{' '}
            <span className="gradient-text">Field.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            style={{
              fontSize: '17px',
              lineHeight: 1.65,
              color: c.muted,
              maxWidth: '460px',
              margin: '0 0 32px',
            }}
          >
            {players.length} players across 5 categories. Study the stats, plan
            your squad, then go dominate the auction.
          </motion.p>

          {/* Stats badges */}
          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
          >
            {[
              { label: `${players.length} Players` },
              { label: '5 Categories' },
              { label: '🇵🇰 Pakistani' },
              { label: '🌍 Overseas' },
              ...(watchlist.size > 0 ? [{ label: `★ ${watchlist.size} Starred` }] : []),
            ].map(({ label }) => (
              <span key={label} className="badge">{label}</span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Filters + Grid ── */}
      <section className="section container">

        <FilterBar
          filters={filters}
          onChange={handleFiltersChange}
          total={players.length}
          shown={filtered.length}
        />

        {/* Watchlist toggle — only shown when watchlist has items */}
        <AnimatePresence>
          {watchlist.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '20px' }}
            >
              <motion.button
                onClick={() => { setWatchlistOnly(v => !v); setPage(1); }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  border: `1px solid ${watchlistOnly ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  background: watchlistOnly ? 'rgba(245,158,11,0.12)' : 'transparent',
                  color: watchlistOnly ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                <span>★</span>
                Watchlist ({watchlist.size})
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid ── */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                padding: '100px 24px',
                color: 'rgba(255,255,255,0.28)',
              }}
            >
              <div style={{ fontSize: '52px', marginBottom: '20px' }}>🔍</div>
              <p style={{ fontSize: '17px', fontWeight: 500, margin: '0 0 8px' }}>
                No players match these filters.
              </p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
                Try clearing some filters.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              layout
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(252px, 1fr))',
                gap: '14px',
              }}
            >
              {visible.map((player, i) => (
                <PlayerBrowserCard
                  key={player.id}
                  player={player}
                  index={i}
                  isStarred={isStarred(player.id)}
                  onToggleStar={toggle}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Load more ── */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', justifyContent: 'center', marginTop: '44px' }}
          >
            <motion.button
              className="btn-ghost"
              onClick={() => setPage(p => p + 1)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Load {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
              <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: '4px' }}>
                · {filtered.length - visible.length} remaining
              </span>
            </motion.button>
          </motion.div>
        )}

      </section>
    </div>
  );
}
