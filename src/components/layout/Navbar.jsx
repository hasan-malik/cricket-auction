import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const isLight = theme === 'light';

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: isLight
          ? 'rgba(240,242,248,0.8)'
          : 'rgba(10,10,15,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: isLight
          ? '1px solid rgba(0,0,0,0.06)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: isLight ? '#111' : '#fff',
        }}>
          PSL<span style={{ color: '#3b82f6' }}>.</span>
        </span>
      </Link>

      {/* Right: nav links + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {pathname === '/auction' && (
          <Link to="/" style={{
            fontSize: '13px',
            fontWeight: 500,
            color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            padding: '6px 14px',
            borderRadius: '9999px',
            transition: 'color 0.2s',
          }}>
            ← Home
          </Link>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: isLight
              ? '1px solid rgba(0,0,0,0.1)'
              : '1px solid rgba(255,255,255,0.1)',
            background: isLight
              ? 'rgba(0,0,0,0.04)'
              : 'rgba(255,255,255,0.06)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            transition: 'all 0.2s',
            color: isLight ? '#333' : '#fff',
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </motion.nav>
  );
}
