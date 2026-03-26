'use client';

import { HiOutlineBars3 } from 'react-icons/hi2';
import { useSidebar } from '@/components/SidebarContext';

export default function MobileMenuButton() {
  const { setIsOpen } = useSidebar();
  
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="lg:hidden"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        marginRight: '12px',
        padding: '8px',
        marginLeft: '-8px',
        borderRadius: '6px',
        background: 'transparent',
      }}
    >
      <HiOutlineBars3 style={{ width: '22px', height: '22px' }} />
    </button>
  );
}
