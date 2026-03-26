'use client';

import { FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed');
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '11px 14px',
        borderRadius: '10px',
        background: 'transparent',
        border: '1px solid transparent',
        color: 'var(--text-tertiary)',
        fontSize: '14px',
        fontFamily: 'var(--font-main)',
        fontWeight: 400,
        letterSpacing: '-0.005em',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(192, 86, 106, 0.08)';
        e.currentTarget.style.color = '#c0566a';
        e.currentTarget.style.borderColor = 'rgba(192, 86, 106, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-tertiary)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <FiLogOut style={{ width: 16, height: 16, opacity: 0.7, flexShrink: 0 }} />
      <span>Sign Out</span>
    </button>
  );
}
