'use client';

import { useTheme } from './ThemeProvider';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '10px',
        background: 'var(--surface-secondary)',
        border: '1px solid var(--border-primary)',
      }} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: 36,
        height: 36,
        borderRadius: '10px',
        background: 'var(--surface-secondary)',
        border: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--gold-dim)';
        e.currentTarget.style.borderColor = 'var(--border-accent)';
        e.currentTarget.style.color = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface-secondary)';
        e.currentTarget.style.borderColor = 'var(--border-primary)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <HiOutlineSun style={{ width: 16, height: 16 }} />
      ) : (
        <HiOutlineMoon style={{ width: 16, height: 16 }} />
      )}
    </button>
  );
}
