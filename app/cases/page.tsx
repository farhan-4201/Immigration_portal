'use client';

import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/fetcher';
import {
  HiOutlineBriefcase,
  HiOutlinePlus,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import { FiLoader } from 'react-icons/fi';

export default function CasesPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: authData } = useSWR('/api/auth/me', fetcher);
  const currentUser = authData?.user;

  const { data: casesData, mutate: mutateCases, isLoading: casesLoading } = useSWR<any[]>('/api/cases', fetcher);
  const cases = Array.isArray(casesData) ? casesData : [];

  const { data: workerData } = useSWR<any[]>('/api/users/caseworkers', fetcher);
  const caseWorkers = Array.isArray(workerData) ? workerData : [];

  const loading = casesLoading;

  // Selected worker per case (single assignment)
  const [selectedWorkers, setSelectedWorkers] = useState<Record<string, string>>(
    {}
  );

  // Data fetching handled by SWR hooks above

  /* ---------------- Assign Case ---------------- */
  const assignCase = async (caseId: string) => {
    const workerId = selectedWorkers[caseId];

    if (!workerId) {
      alert('Please select a case worker.');
      return;
    }

    try {
      const res = await fetch('/api/cases/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, caseWorkerId: workerId }),
      });

      if (!res.ok) throw new Error();

      mutateCases(); // Revalidate SWR cache
      mutate('/api/notifications');
      alert('Case assigned successfully!');
    } catch {
      alert('Failed to assign case.');
    }
  };

  const handleActionClick = (caseId: string) => {
    if (currentUser?.role === 'Manager') {
      router.push(`/?caseId=${caseId}`);
      return;
    }

    assignCase(caseId);
  };

  return (
    <div className="space-y-8 animate-cardAppear bg-background transition-colors duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-text-primary tracking-tight">
            Case Files
          </h1>
          <p className="text-text-tertiary mt-1 font-semibold uppercase tracking-widest text-[9px] md:text-[10px]">
            Manage and track client applications
          </p>
        </div>
        <button className="w-full md:w-auto px-6 py-3.5 bg-primary text-background rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg">
          <HiOutlinePlus className="w-5 h-5" />
          Create New Case
        </button>
      </header>

      {/* Search / Filter */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="bg-surface-primary border border-border-primary rounded-xl md:rounded-2xl flex-1 flex items-center px-4 md:px-5 py-3 md:py-3.5 gap-3 md:gap-4 group focus-within:border-primary/50 transition-all">
          <HiOutlineMagnifyingGlass className="w-4 h-4 md:w-5 md:h-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
          <input
            className="bg-transparent flex-1 outline-none text-text-primary placeholder:text-text-tertiary font-medium text-xs md:text-sm"
            placeholder="Search by client or case ID..."
          />
        </div>
        <button className="bg-surface-primary border border-border-primary px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-bold text-text-secondary hover:bg-surface-hover transition-all text-sm md:text-base">
          <HiOutlineFunnel className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-primary border border-border-primary rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-primary bg-surface-secondary/30">
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
                  Client Name
                </th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
                  Type
                </th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
                  Status
                </th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
                  Assigned To
                </th>
                <th className="p-6 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <FiLoader className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center font-bold text-text-tertiary">
                    <HiOutlineBriefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No cases found.
                  </td>
                </tr>
              ) : (
                cases.map(c => (
                  <tr key={c.id} className="border-b border-border-primary hover:bg-surface-hover transition-colors group">
                    <td className="p-6">
                      <div className="font-bold text-text-primary text-base mb-1">{c.client?.name || c.clientName}</div>
                      <div className="text-[10px] font-mono font-bold text-primary/80 uppercase tracking-wider">
                        ID: {c.id.slice(-8).toUpperCase()}
                      </div>
                    </td>

                    <td className="p-6 text-sm font-bold text-text-secondary">
                      {c.caseType || c.immigration?.status || 'Unknown'}
                    </td>

                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${c.status?.toLowerCase() === 'accepted' || c.status?.toLowerCase() === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : c.status?.toLowerCase() === 'rejected'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : c.status?.toLowerCase() === 'waiting for decision'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : c.status?.toLowerCase() === 'initial query'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-surface-secondary border border-border-primary flex items-center justify-center text-xs font-black text-text-tertiary shadow-inner group-hover:border-primary/30 transition-all">
                          {c.assignedTo?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-bold text-text-primary">
                          {c.assignedTo?.name || 'Unassigned'}
                        </span>
                      </div>

                      <select
                        className="text-[10px] font-bold uppercase tracking-wider bg-surface-secondary border border-border-primary rounded-xl p-2.5 w-full text-text-secondary focus:text-text-primary focus:border-primary/50 outline-none transition-all"
                        value={selectedWorkers[c.id] || c.assignedTo?.id || ''}
                        onChange={e =>
                          setSelectedWorkers({
                            ...selectedWorkers,
                            [c.id]: e.target.value,
                          })
                        }
                      >
                        <option value="">-- Reassign Case --</option>
                        {caseWorkers.map(worker => (
                          <option key={worker.id} value={worker.id}>
                            {worker.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-6 text-right">
                      <div className="flex flex-col items-end gap-4">
                        <button
                          onClick={() => handleActionClick(c.id)}
                          className="px-6 py-2 bg-primary hover:opacity-90 text-background rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
                        >
                          {currentUser?.role === 'Manager' ? 'Monitor & Advise' : 'Choose Staff'}
                        </button>
                        <HiOutlineChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-text-primary transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
