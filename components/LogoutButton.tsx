'use client';

import { FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3.5 p-3.5 rounded-xl w-full text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all group font-semibold"
    >
      <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
      <span className="font-semibold">Sign Out</span>
    </button>
  );
}

