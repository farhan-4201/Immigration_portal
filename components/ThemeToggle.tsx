'use client';

import { useTheme } from './ThemeProvider';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border-primary" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 rounded-xl bg-surface-secondary border border-border-primary flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer shadow-sm group"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <HiOutlineSun className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
      ) : (
        <HiOutlineMoon className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
      )}
    </button>
  );
}
