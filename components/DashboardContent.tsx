'use client';

import { HiOutlineMagnifyingGlass, HiOutlineBell } from 'react-icons/hi2';

export default function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
      {/* Top Bar */}
      <header className="h-20 flex items-center justify-between px-10 z-10 relative bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="relative w-96">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search cases, documents..." 
            className="w-full bg-zinc-100 border border-zinc-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-zinc-900 placeholder:text-zinc-500 focus:bg-white focus:border-blue-500/30 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200 hover:bg-zinc-200 transition-colors cursor-pointer relative shadow-sm">
            <HiOutlineBell className="w-5 h-5 text-zinc-500" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-10 z-10 relative">
        {children}
      </main>
    </div>
  );
}
