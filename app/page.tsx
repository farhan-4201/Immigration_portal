'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import ClientIntakeForm from '@/components/ClientIntakeForm';
import { HiOutlineUsers, HiOutlineDocumentText, HiOutlineChartBar, HiOutlineClock, HiOutlineChevronRight, HiOutlineShieldCheck, HiOutlineSquares2X2, HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineArrowTrendingUp, HiOutlinePlus, HiOutlineTrash, HiOutlineChatBubbleLeftEllipsis, HiOutlineBell, HiOutlineExclamationCircle, HiOutlineUserPlus, HiOutlineXCircle, HiOutlineCheckBadge, HiOutlinePencilSquare } from 'react-icons/hi2';
import { FiLoader } from 'react-icons/fi';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function DashboardContent() {
  // SWR Data Fetching
  const { data: authData, error: authError } = useSWR('/api/auth/me', fetcher);
  const user = authData?.user;

  const { data: casesData, error: casesError, mutate: mutateCases, isLoading: casesLoading } = useSWR<any[]>('/api/cases', fetcher, {
    refreshInterval: 10000, // Poll every 10s
    revalidateOnFocus: true,
  });
  const cases = Array.isArray(casesData) ? casesData : [];

  const { data: staffData, error: staffError, mutate: mutateStaff, isLoading: staffLoading } = useSWR<any[]>(
    (user?.role === 'Manager' || user?.role === 'Admin') ? '/api/staff' : null,
    fetcher
  );
  const staff = Array.isArray(staffData) ? staffData : [];

  const [editingCase, setEditingCase] = useState<any>(null);
  const loading = casesLoading || (!authData && !authError);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [adminAdviceText, setAdminAdviceText] = useState('');
  const [followupText, setFollowupText] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [noteEditingCase, setNoteEditingCase] = useState<any>(null);
  const searchParams = useSearchParams();
  const caseIdParam = searchParams.get('caseId');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync editingCase with fresh data from SWR
  useEffect(() => {
    if (editingCase && cases) {
      const updatedCase = cases.find((c: any) => c.id === editingCase.id);
      if (updatedCase) {
        setEditingCase(updatedCase);
      }
    }
  }, [cases]);

  // Error handling
  useEffect(() => {
    if (authError || casesError || staffError) {
      showToast('System connectivity issue. Some data may be outdated.', 'error');
    }
  }, [authError, casesError, staffError]);

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/cases/${editingCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCase),
      });
      if (res.ok) {
        const updated = await res.json();
        mutateCases(); // Revalidate SWR cache
        setEditingCase(null);
        showToast('Case details updated successfully');
      }
    } catch (err) {
      showToast('Could not update case details. Please check your connection.', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteCase = async (id: string) => {
    // Replaced generic confirm with a more fluid experience
    // In a full implementation, we'd use a custom Modal. For now, proceeding with user-friendly toast feedback.
    if (!id) return;
    try {
      const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mutateCases(); // Revalidate SWR cache
        showToast('Case removed from repository');
      }
    } catch (err) {
      showToast('Error removing case', 'error');
    }
  };

  const handlePostAdvice = async (id: string) => {
    if (!adminAdviceText.trim()) return;
    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/cases/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advice: adminAdviceText }),
      });
      if (res.ok) {
        const updated = await res.json();
        mutateCases(); // Revalidate SWR cache
        setAdminAdviceText(''); // Clear for next use
        showToast('Follow-up advice sent to caseworker.');
      }
    } catch (err) {
      showToast('Unable to send advice. Please try again later.', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAddFollowup = async (id: string) => {
    if (!followupText.trim()) return;
    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/cases/${id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: followupText }),
      });
      if (res.ok) {
        mutateCases(); // Revalidate SWR cache
        setFollowupText('');
        showToast('Followup added and notifications sent.');
      }
    } catch (err) {
      console.error('Followup error:', err);
      showToast('Failed to add followup', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteEditingCase) return;
    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/cases/${noteEditingCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseworkerNote: noteEditingCase.caseworkerNote }),
      });
      if (res.ok) {
        mutateCases(); // Revalidate SWR cache
        setNoteEditingCase(null);
        showToast('Private note updated successfully');
      }
    } catch (err) {
      showToast('Could not save note. Please check your connection.', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mutateStaff(); // Revalidate staff list
        showToast('Staff member removed successfully');
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to remove staff', 'error');
      }
    } catch (err) {
      showToast('Network error while removing staff', 'error');
    }
  };

  const handleEditClick = (c: any) => {
    setEditingCase(c);
    setAdminAdviceText(c.adminAdvice || '');
    setFollowupText('');
  };

  // Debug logging for notifications removed for production
  useEffect(() => {
    // This previously logged status for debug purposes
  }, [cases, user]);

  useEffect(() => {
    if (caseIdParam && cases.length > 0) {
      const targetCase = cases.find(c => c.id === (typeof caseIdParam === 'string' ? caseIdParam : ''));
      if (targetCase) {
        setEditingCase(targetCase);
        setAdminAdviceText(targetCase.adminAdvice || '');
      }
    }
  }, [caseIdParam, cases]);

  // Removed manual refreshCaseData interval as SWR handles this via refreshInterval

  const upcomingDeadlines = (cases || []).flatMap(c =>
    (c.deadlines || []).map((d: any) => ({
      ...d,
      caseNumber: c.caseNumber,
      clientId: c.client?.name || c.name || 'Unknown Client',
      caseId: c.id,
      caseStatus: c.status
    }))
  ).filter(d => {
    if (!d.date || d.achieved) return false; // Skip achieved deadlines
    if (user?.role === 'Case Worker' && d.caseStatus?.toLowerCase() === 'approved') return false; // Hide approved cases from load

    const deadlineDate = new Date(d.date);
    if (isNaN(deadlineDate.getTime())) return false;
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    // Strictly show deadlines within the next 48 hours
    return diffHours > 0 && diffHours <= 48;
  });

  const critical24hDeadlines = upcomingDeadlines.filter(d => {
    const deadlineDate = new Date(d.date);
    const now = new Date();
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const managerUrgentDeadlines = upcomingDeadlines.filter(d => {
    const deadlineDate = new Date(d.date);
    const now = new Date();
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const stats = {
    total: (cases || []).filter((c: any) => c.status?.toLowerCase() !== 'approved').length,
    pending: (cases || []).filter((c: any) => c.status?.toLowerCase() === 'new' || c.status?.toLowerCase() === 'in progress').length,
    completed: (cases || []).filter((c: any) => c.status?.toLowerCase() === 'approved' || c.status?.toLowerCase() === 'completed').length,
    staffCount: staff.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <FiLoader className="w-12 h-12 animate-spin text-blue-600" />
          <div className="absolute inset-0 blur-xl bg-blue-600/10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-10 animate-cardAppear relative bg-background transition-colors duration-300">
      <style jsx>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Global 24-Hour Critical Ticker Strip - Caseworker Exclusive */}
      {user?.role === 'Case Worker' && critical24hDeadlines.length > 0 && (
        <div className="fixed top-16 md:top-24 left-0 md:left-72 right-0 z-40 bg-white dark:bg-black py-2 md:py-3 overflow-hidden border-y border-border-primary/50 shadow-md transition-all duration-500">
          <div className="flex items-center">
            <div className="px-10 bg-white dark:bg-black z-40 border-r border-border-primary/30 flex items-center gap-3 whitespace-nowrap">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-900 dark:text-white font-sans">Urgent Focus</span>
            </div>
            <div className="animate-marquee whitespace-nowrap">
              {[...critical24hDeadlines, ...critical24hDeadlines].map((d, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-8 px-14 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all py-1 rounded-2xl group/ticker"
                  onClick={() => handleEditClick(cases.find(c => c.id === d.caseId))}
                >
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/5 border border-primary/20 px-2.5 py-0.5 rounded-lg group-hover/ticker:bg-primary group-hover/ticker:text-white transition-all">{d.caseNumber}</span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white tracking-tight group-hover/ticker:text-primary transition-colors font-sans">{d.title}</span>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.1em] border-l border-border-primary/30 pl-8 flex items-center gap-2 font-sans">
                    <HiOutlineClock className="w-3.5 h-3.5 text-error/70" />
                    Due {new Date(d.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification System */}
      {toast && (
        <div className={`fixed top-20 md:top-24 right-4 md:right-8 z-[9999] flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-slideInRight backdrop-blur-xl border ${toast.type === 'success' ? 'bg-success/90 text-white border-emerald-400/20' : 'bg-red-500/90 text-white border-red-400/20'
          }`}>
          {toast.type === 'success' ? <HiOutlineCheckBadge className="w-6 h-6" /> : <HiOutlineXCircle className="w-6 h-6" />}
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* Notifications for Caseworker - Top Priority */}
      <div className="space-y-4">
        {user?.role === 'Case Worker' && cases.some(c => c.hasNewAdvice === true) && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-center gap-5 shadow-sm animate-pulse">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <HiOutlineBell className="w-7 h-7 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-500 font-bold text-base">Action Required: Admin Advice</h3>
              <p className="text-amber-500/80 text-sm">An administrator has provided specific instructions for your cases. Please review the highlighted tasks below.</p>
            </div>
          </div>
        )}


        {upcomingDeadlines.length > 0 && user?.role === 'Case Worker' && (
          <div className="bg-surface-primary border border-border-primary p-8 rounded-[40px] flex flex-col gap-6 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-error/10 rounded-2xl flex items-center justify-center">
                  <HiOutlineClock className="w-6 h-6 text-error" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-text-primary tracking-tight">Active Milestone Tracker</h3>
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Next 48 Hours Priority List</p>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {upcomingDeadlines.map((d, i) => (
                <div key={i} className="bg-surface-secondary/50 border border-border-primary p-6 rounded-3xl flex flex-col justify-between hover:bg-surface-hover transition-all cursor-pointer group/card"
                  onClick={() => handleEditClick(cases.find(c => c.id === d.caseId))}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-mono font-bold text-text-secondary bg-surface-primary border border-border-primary px-3 py-1 rounded-xl group-hover/card:border-red-500/30 transition-colors uppercase">{d.caseNumber}</span>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-text-primary mb-1 uppercase tracking-tight">{d.title}</h4>
                    <p className="text-[10px] font-medium text-text-tertiary truncate lowercase">Client: {d.clientId}</p>
                  </div>
                  <div className="pt-4 border-t border-border-primary flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-error">
                    <span className="flex items-center gap-1.5">
                      <HiOutlineCalendar className="w-3.5 h-3.5" />
                      {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span>{new Date(d.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Header section with welcome */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-6xl font-display font-black text-text-primary tracking-tighter mb-2">
            Welcome, <span className="text-primary">{user?.name?.split(' ')[0] || 'Member'}</span>
          </h1>
          <div className="flex items-center gap-3 text-text-tertiary">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-lg text-primary text-xs font-bold border border-primary/20">
              <HiOutlineShieldCheck className="w-3.5 h-3.5" />
              {user?.role} Access
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-surface-primary border border-border-primary px-5 py-3 flex items-center gap-3 rounded-2xl shadow-xl">
            <HiOutlineCalendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-text-tertiary">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Admin Primary View: Global Case Monitor at the TOP */}
      {user?.role === 'Admin' && (
        <div className="space-y-8">
          <div className="bg-surface-primary border border-border-primary p-6 md:p-10 rounded-[28px] md:rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 hidden md:block">
              <HiOutlineChartBar className="w-64 h-64 text-primary" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-10 relative z-10">
              <div>
                <h3 className="text-xl md:text-3xl font-display font-bold text-text-primary mb-2 flex items-center gap-3">
                  <HiOutlineChartBar className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  All Active Cases
                </h3>
                <p className="text-text-tertiary text-xs md:text-sm max-w-xl">Comprehensive oversight of all active inquiries.</p>
              </div>
<Link href="/cases" className="px-5 py-2.5 md:px-6 md:py-3 bg-primary text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-semibold hover:opacity-90 transition-all shadow-md text-center">View All Cases</Link>
            </div>

            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-widest">Case Number</th>
                    <th className="px-4 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-widest">Client</th>
                    <th className="px-4 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-widest">Assignee</th>
                    <th className="px-4 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-widest">Status</th>
                    <th className="px-4 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-widest text-right">Management</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.slice(0, 10).map((c: any) => (
                    <tr key={c.id} className="bg-surface-secondary hover:bg-surface-hover hover:shadow-2xl transition-all group">
                      <td className="px-6 py-5 font-mono text-xs font-bold text-primary rounded-l-2xl border-l border-y border-border-primary flex items-center gap-3">
                        {c.caseNumber}
                        {c.lastUpdatedByCaseworker && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-[9px] font-bold rounded-full animate-pulse border border-primary/30">
                            UPDATED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-text-primary border-y border-border-primary">{c.client?.name}</td>
                      <td className="px-6 py-5 text-sm text-text-tertiary border-y border-border-primary">
                        {c.assignedTo?.name ? (
                          <span className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-[10px] font-bold text-text-secondary uppercase border border-border-primary">
                              {c.assignedTo.name.charAt(0)}
                            </div>
                            {c.assignedTo.name}
                          </span>
                        ) : (
                          <span className="text-text-tertiary italic font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-5 border-y border-border-primary">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${c.status?.toLowerCase() === 'accepted' || c.status?.toLowerCase() === 'approved' ? 'bg-success/10 text-success border-success/20' :
                          c.status?.toLowerCase() === 'rejected' ? 'bg-error/10 text-error border-error/20' :
                            c.status?.toLowerCase() === 'waiting for decision' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              c.status?.toLowerCase() === 'initial query' ? 'bg-primary/10 text-primary border-border-accent' :
                                'bg-surface-secondary text-text-secondary border-border-primary'
                          }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right rounded-r-2xl border-r border-y border-border-primary space-x-3">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="px-4 py-2 bg-primary text-white hover:opacity-90 rounded-xl text-[10px] font-semibold transition-all shadow-sm"
                        >
                          MONITOR & ADVISE
                        </button>
                        <button
                          onClick={() => handleDeleteCase(c.id)}
                          className="p-2 text-text-tertiary hover:text-error transition-colors"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-text-tertiary italic text-sm">No cases found in the repository.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Client Intake Form for Manager only */}
      {user?.role === 'Manager' && (
        <div className="w-full">
          <ClientIntakeForm />
        </div>
      )}

      {/* Role-Specific Content for Manager */}
      {user?.role === 'Manager' && (
        <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
          <div className="lg:col-span-8 space-y-8 md:space-y-10">
            <div className="bg-surface-primary border border-border-primary p-6 md:p-10 rounded-[28px] md:rounded-[40px] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-bold text-text-primary">Case Distribution</h3>
                <Link href="/cases" className="text-primary text-xs font-bold hover:underline">Full Overview</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-text-tertiary text-[10px] font-bold uppercase tracking-widest border-b border-border-primary">
                      <th className="pb-4">Case ID</th>
                      <th className="pb-4">Client</th>
                      <th className="pb-4">Staff</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.slice(0, 5).map((c: any) => (
                      <tr key={c.id} className="border-b border-border-primary last:border-0 hover:bg-surface-secondary/50 transition-colors">
                        <td className="py-5 font-mono text-[11px] font-bold text-primary flex items-center gap-2">
                          {c.caseNumber}
                          {c.lastUpdatedByCaseworker && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" title="Updated by Caseworker" />
                          )}
                        </td>
                        <td className="py-5 text-xs font-bold text-text-primary">{c.client?.name}</td>
                        <td className="py-5 text-xs text-text-tertiary">{c.assignedTo?.name || 'Waiting'}</td>
                        <td className="py-5 text-right">
                          <button onClick={() => handleEditClick(c)} className="text-primary text-xs font-bold hover:underline">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-surface-primary border border-border-primary p-8 rounded-[32px] overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
              <h3 className="text-xl font-display font-bold text-text-primary mb-8 flex items-center gap-2 relative z-10">
                <HiOutlineArrowTrendingUp className="w-5 h-5 text-primary" />
                Office Stats
              </h3>
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1">Active Cases</p>
                    <p className="text-4xl font-display font-bold text-text-primary">{stats.total}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(user?.role === 'Manager' || user?.role === 'Admin') && (
        <div className="space-y-8 md:space-y-10 pt-10 border-t border-border-primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Active Cases', val: stats.total.toString(), icon: HiOutlineChartBar, color: 'primary' },
              { label: 'Case Workers', val: staff?.filter((s: any) => s.role === 'Case Worker').length.toString() || '0', icon: HiOutlineUsers, color: 'indigo' },
              { label: 'Support Staff', val: staff?.filter((s: any) => s.role === 'Admin').length.toString() || '0', icon: HiOutlineSquares2X2, color: 'purple' },
              { label: 'System Healthy', val: '100%', icon: HiOutlineShieldCheck, color: 'emerald' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface-primary border border-border-primary p-5 md:p-6 rounded-[24px] md:rounded-[28px] shadow-2xl transition-all hover:bg-surface-hover">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-surface-secondary flex items-center justify-center mb-4 md:mb-6 border border-border-primary`}>
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 text-primary`} />
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-1 tracking-tight">{stat.val}</div>
                <div className="text-text-tertiary text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-surface-primary border border-border-primary p-6 md:p-10 rounded-[28px] md:rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-surface-secondary rounded-full translate-x-32 -translate-y-32 opacity-10" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-12 relative z-10">
              <div>
                <h3 className="text-xl md:text-3xl font-display font-bold text-text-primary mb-2 flex items-center gap-3">
                  <HiOutlineUsers className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  Staff Assignments
                </h3>
                <p className="text-text-tertiary text-xs md:text-sm">Real-time workload distribution tracking.</p>
              </div>
              <div className="px-4 py-1.5 md:px-5 md:py-2 bg-primary/10 text-primary rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest border border-primary/20 w-fit">
                Admin Panel
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 relative z-10">
              {staff?.filter((s: any) => s.role === 'Case Worker').map((person: any) => {
                const assignedCases = cases.filter(c =>
                  (c.assignedTo?.id === person.id ||
                    c.assignedTo === person.id ||
                    (typeof c.assignedTo === 'string' && c.assignedTo === person.id)) &&
                  c.status?.toLowerCase() !== 'approved'
                );
                const isExpanded = expandedStaffId === person.id;

                return (
                  <div key={person.id} className={`flex flex-col bg-surface-secondary rounded-[24px] md:rounded-[32px] border border-border-primary hover:border-primary/30 transition-all group relative overflow-hidden ${isExpanded ? 'shadow-2xl ring-1 ring-primary/20' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 md:p-8 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors gap-4">
                      <div
                        className="flex items-center gap-6 cursor-pointer group/name"
                        onClick={() => setExpandedStaffId(isExpanded ? null : person.id)}
                      >
                        <div className="w-20 h-20 rounded-3xl bg-background flex items-center justify-center text-2xl font-bold text-text-tertiary border border-border-primary shadow-inner group-hover/name:scale-105 transition-transform duration-500">
                          {person.name?.charAt(0)}
                        </div>
                        <div>
                          <span className="text-text-primary font-bold block text-xl mb-1 group-hover/name:text-primary transition-colors flex items-center gap-2">
                            {person.name}
                            <HiOutlineChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''} opacity-0 group-hover/name:opacity-100`} />
                          </span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${person.status === 'Active' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-text-tertiary'}`} />
                            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest">{person.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Active Load</div>
                          <div className="text-2xl font-display font-bold text-text-primary flex items-center justify-end gap-2">
                            {assignedCases.length}
                            <span className="text-xs text-text-tertiary font-medium">Files</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteStaff(person.id)}
                          className="w-12 h-12 rounded-2xl bg-surface-primary border border-border-primary text-text-tertiary hover:text-error hover:border-error/20 hover:bg-error/10 transition-all flex items-center justify-center shadow-sm group-hover:translate-x-0 opacity-0 group-hover:opacity-100 translate-x-4 duration-300"
                          title="Remove Person"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                        <div className="pt-6 border-t border-border-primary/50">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-5">Currently Handling ({assignedCases.length} cases)</p>
                          <div className="grid gap-3">
                            {assignedCases.length > 0 ? (
                              assignedCases.map((c: any) => (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between bg-surface-primary border border-border-primary/50 rounded-2xl px-5 py-4 hover:border-primary/30 hover:bg-surface-hover transition-all cursor-pointer group/task"
                                  onClick={() => handleEditClick(c)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="relative">
                                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-lg">{c.caseNumber}</span>
                                      {c.lastUpdatedByCaseworker && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary border-2 border-surface-primary rounded-full animate-pulse" />
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-text-primary group-hover/task:text-primary transition-colors">{c.client?.name}</span>
                                      <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-tight">{c.caseType || 'Immigration'}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider border ${c.status?.toLowerCase() === 'accepted' || c.status?.toLowerCase() === 'approved' ? 'bg-success/10 text-success border-success/20' :
                                      c.status?.toLowerCase() === 'rejected' ? 'bg-error/10 text-error border-error/20' :
                                        c.status?.toLowerCase() === 'waiting for decision' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                          c.status?.toLowerCase() === 'initial query' ? 'bg-primary/10 text-primary border-border-accent' :
                                            'bg-primary/10 text-primary border-primary/20'
                                      }`}>
                                      {c.status}
                                    </span>

                                    <HiOutlineChevronRight className="w-4 h-4 text-text-tertiary group-hover/task:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-10 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl border border-dashed border-border-primary flex flex-col items-center justify-center text-text-tertiary">
                                <HiOutlineClock className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-medium italic text-center">No active cases are currently<br />assigned to this worker.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-hover overflow-hidden">
                      <div
                        className="h-full bg-primary/20 transition-all duration-1000"
                        style={{ width: `${Math.min((assignedCases.length || 0) * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {staff?.filter((s: any) => s.role === 'Case Worker').length === 0 && (
                <div className="col-span-full py-20 bg-surface-secondary/50 rounded-[40px] border border-dashed border-border-primary flex flex-col items-center justify-center text-text-tertiary">
                  <HiOutlineUsers className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium">No registered caseworkers found in system.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
      }

      {user?.role === 'Case Worker' && (
        <div className="bg-surface-primary border border-border-primary p-6 md:p-10 rounded-[28px] md:rounded-[40px] shadow-2xl transition-colors duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-10">
            <div>
              <h2 className="text-xl md:text-3xl font-display font-bold text-text-primary mb-2">Your Assigned Cases</h2>
              <p className="text-text-tertiary text-xs md:text-sm">Process your active inquiries prioritized by urgency.</p>
            </div>
            <div className="px-5 py-2 md:px-6 md:py-3 bg-primary/10 border border-primary/20 rounded-xl md:rounded-2xl text-primary text-[10px] md:text-xs font-bold tracking-widest uppercase shadow-sm w-fit">
              {cases.filter((c: any) => c.status?.toLowerCase() !== 'approved').length} Cases Pending
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr>
                  <th className="px-6 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">File Identifier</th>
                  <th className="px-6 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">Primary Applicant</th>
                  <th className="px-6 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">Type</th>
                  <th className="px-6 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-2 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em] text-right pr-10">Operations</th>
                </tr>
              </thead>
              <tbody>
                {cases.filter((c: any) => c.status?.toLowerCase() !== 'approved').map((c: any) => (
                  <tr key={c.id} className="bg-surface-secondary hover:bg-surface-hover hover:shadow-2xl transition-all group">
                    <td className="px-6 py-6 font-mono text-primary font-bold rounded-l-[24px] border-l border-y border-border-primary flex items-center gap-3">
                      {c.caseNumber || c.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-6 text-text-primary font-bold border-y border-border-primary">{c.client?.name || c.clientName}</td>
                    <td className="px-6 py-6 text-text-tertiary border-y border-border-primary">{c.caseType || 'Immigration'}</td>
                    <td className="px-6 py-6 border-y border-border-primary">
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border inline-flex items-center gap-2 ${c.status?.toLowerCase() === 'accepted' || c.status?.toLowerCase() === 'approved' ? 'bg-success/10 text-success border-success/20' :
                          c.status?.toLowerCase() === 'rejected' ? 'bg-error/10 text-error border-error/20' :
                            c.status?.toLowerCase() === 'waiting for decision' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              c.status?.toLowerCase() === 'initial query' ? 'bg-primary/10 text-primary border-border-accent' :
                                'bg-primary/10 text-primary border-primary/20'
                          }`}>
                          {c.status}
                          {c.hasNewAdvice && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="New Admin advice" />}
                        </span>
                        <button
                          onClick={() => setNoteEditingCase(c)}
                          className={`p-1.5 rounded-lg border transition-all hover:scale-110 active:scale-95 ${c.caseworkerNote ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-surface-secondary border-border-primary text-text-tertiary hover:text-primary hover:border-primary/30'}`}
                          title={c.caseworkerNote ? "Edit Private Note" : "Add Private Note"}
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right pr-6 rounded-r-[24px] border-r border-y border-border-primary">
                      <button
                        onClick={() => handleEditClick(c)}
                        className="px-8 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl text-xs font-semibold transition-all shadow-lg"
                      >
                        Check File
                      </button>
                    </td>
                  </tr>
                ))}
                {cases.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-zinc-500 italic font-medium bg-white/[0.02] rounded-[32px] border border-dashed border-white/10">
                      No cases assigned to you at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal - Universal for all roles */}
      </div>

      {editingCase && (
        <div className="fixed inset-0 bg-background/80 z-[100] flex items-center justify-center p-2 md:p-4">
          <div className="bg-surface-primary border border-border-primary rounded-3xl shadow-gold-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 animate-cardAppear relative scrollbar-hide">
            

            <div className="flex justify-between items-center mb-8 md:mb-12 relative z-10">
              <div>
                <h3 className="text-xl md:text-3xl font-display font-black text-text-primary tracking-tight">Case: {editingCase.caseNumber}</h3>
                <p className="text-text-tertiary text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1">Check Details</p>
              </div>
              <button
                onClick={() => setEditingCase(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-secondary border border-border-primary text-text-tertiary hover:bg-gold-dim hover:text-primary transition-all"
              >
                <HiOutlinePlus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleUpdateCase} className="space-y-10 relative z-10">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-primary/80 mb-1.5 ml-0.5">Client Name</label>
                  <input
                    className="w-full bg-surface-primary border border-border-primary rounded-xl py-3 px-4 text-[13px] text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all font-medium shadow-sm hover:border-border-accent/50"
                    value={editingCase.client?.name || editingCase.name || ''}
                    onChange={(e) => setEditingCase({ ...editingCase, client: { ...(editingCase.client || {}), name: e.target.value } })}
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-primary/80 mb-1.5 ml-0.5">Status</label>
                  <select
                    className="w-full bg-surface-primary border border-border-primary rounded-xl py-3 px-4 text-[13px] text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all font-medium shadow-sm hover:border-border-accent/50 appearance-none"
                    value={editingCase.status}
                    onChange={(e) => setEditingCase({ ...editingCase, status: e.target.value })}
                  >
                    <option value="Initial Query">Initial Query</option>
                    <option value="Waiting for client instructions">Waiting for client instructions</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Documents pending">Documents pending</option>
                    <option value="Application Submitted">Application Submitted</option>
                    <option value="Biometrics Booked">Biometrics Booked</option>
                    <option value="Documents Uploaded">Documents Uploaded</option>
                    <option value="Documents Not Uploaded">Documents Not Uploaded</option>
                    <option value="Waiting for Decision">Waiting for Decision</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Client Details Section */}
              <div className="space-y-6 pt-8 border-t border-border-primary">
                <h4 className="text-sm font-bold text-text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                    <HiOutlineUsers className="w-4 h-4" />
                  </div>
                  Personal Details
                </h4>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Email</label>
                    <input
                      className="w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50"
                      value={editingCase.client?.email || editingCase.email || ''}
                      onChange={(e) => setEditingCase({ ...editingCase, client: { ...(editingCase.client || {}), email: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Phone</label>
                    <input
                      className="w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50"
                      value={editingCase.client?.phoneNumber || editingCase.phoneNumber || ''}
                      onChange={(e) => setEditingCase({ ...editingCase, client: { ...(editingCase.client || {}), phoneNumber: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50 [color-scheme:dark]"
                      value={editingCase.client?.dob ? new Date(editingCase.client.dob).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingCase({ ...editingCase, client: { ...(editingCase.client || {}), dob: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Nationality</label>
                    <input
                      className="w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50"
                      value={editingCase.client?.nationality || editingCase.nationality || ''}
                      onChange={(e) => setEditingCase({ ...editingCase, client: { ...(editingCase.client || {}), nationality: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Relationship Status</label>
                    <select
                      className="w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50 appearance-none outline-none"
                      value={editingCase.client?.relationshipStatus || editingCase.relationshipStatus || ''}
                      onChange={(e) => setEditingCase({ ...editingCase, client: { ...(editingCase.client || {}), relationshipStatus: e.target.value } })}
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Unmarried Partner">Unmarried Partner</option>
                      <option value="Civil Partnership">Civil Partnership</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Separated">Separated</option>
                      <option value="De Facto">De Facto</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Residential Address</label>
                    <input
                      className="w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50"
                      value={editingCase.client?.address || editingCase.address || ''}
                      onChange={(e) => setEditingCase({ ...editingCase, client: { ...(editingCase.client || {}), address: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              {/* Immigration Details Section */}
              <div className="space-y-6 pt-8 border-t border-border-primary">
                <h4 className="text-sm font-bold text-text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                    <HiOutlineDocumentText className="w-4 h-4" />
                  </div>
                  Case Information
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Current Status</label>
                    <input
                      className="w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50"
                      value={editingCase.immigration?.status || ''}
                      onChange={(e) => setEditingCase({ ...editingCase, immigration: { ...(editingCase.immigration || {}), status: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Immigration History</label>
                    <textarea
                      rows={3}
                      className="w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50 resize-none"
                      value={editingCase.immigration?.history || ''}
                      onChange={(e) => setEditingCase({ ...editingCase, immigration: { ...(editingCase.immigration || {}), history: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Milestones Section */}
              <div className="space-y-6 pt-8 border-t border-border-primary">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-error/10 flex items-center justify-center border border-error/20 text-error">
                      <HiOutlineClock className="w-4 h-4" />
                    </div>
                    Case Deadlines
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newDeadlines = [...(editingCase.deadlines || []), { date: '', title: '' }];
                      setEditingCase({ ...editingCase, deadlines: newDeadlines });
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all"
                  >
                    + Add Deadline
                  </button>
                </div>
                <div className="grid gap-4">
                  {(editingCase.deadlines || []).map((d: any, idx: number) => (
                    <div key={idx} className={`flex flex-col md:flex-row gap-5 p-6 border rounded-3xl transition-all ${d.achieved ? 'bg-success/5 border-success/20 opacity-70' : 'bg-surface-secondary/30 border-border-primary'}`}>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Deadline Expiry</label>
                          {d.achieved && <span className="text-[10px] bg-success text-white px-2 py-0.5 rounded-md font-bold flex items-center gap-1.5"><HiOutlineCheckBadge className="w-3.5 h-3.5" /> ACHIEVED</span>}
                        </div>
                        <input
                          type="datetime-local"
                          className="w-full bg-surface-primary border border-border-primary rounded-xl py-3 px-4 text-xs font-bold text-text-primary focus:border-primary/50 outline-none"
                          value={d.date ? new Date(new Date(d.date).getTime() - new Date(d.date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                          onChange={(e) => {
                            const newDeadlines = [...editingCase.deadlines];
                            newDeadlines[idx].date = e.target.value;
                            setEditingCase({ ...editingCase, deadlines: newDeadlines });
                          }}
                        />
                      </div>
                      <div className="flex-[2] space-y-2">
                        <label className="block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5">Observation / Task Name</label>
                        <div className="flex gap-4">
                          <input
                            className="w-full bg-surface-primary border border-border-primary rounded-xl py-3 px-4 text-xs font-bold text-text-primary focus:border-primary/50 outline-none placeholder:text-text-tertiary"
                            placeholder="e.g., Final Submission Protocol"
                            value={d.title || ''}
                            onChange={(e) => {
                              const newDeadlines = [...editingCase.deadlines];
                              newDeadlines[idx].title = e.target.value;
                              setEditingCase({ ...editingCase, deadlines: newDeadlines });
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newDeadlines = [...editingCase.deadlines];
                                newDeadlines[idx].achieved = !newDeadlines[idx].achieved;
                                setEditingCase({ ...editingCase, deadlines: newDeadlines });
                              }}
                              className={`p-3 rounded-xl transition-all shadow-lg border ${d.achieved
                                ? 'bg-success text-white border-emerald-400'
                                : 'bg-surface-primary text-text-tertiary border-border-primary hover:border-success/50 hover:text-success'
                                }`}
                              title={d.achieved ? "Mark as Pending" : "Mark as Achieved"}
                            >
                              <HiOutlineCheckBadge className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newDeadlines = editingCase.deadlines.filter((_: any, i: number) => i !== idx);
                                setEditingCase({ ...editingCase, deadlines: newDeadlines });
                              }}
                              className="p-3 rounded-xl bg-error/10 text-error hover:bg-red-500 hover:text-white transition-all shadow-lg border border-error/20"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin/Manager Assignment Control */}
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <div className="space-y-8 pt-10 border-t border-border-primary">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-3">
                      <HiOutlineUserPlus className="w-4 h-4" />
                      Assign Tasks
                    </label>
                    <select
                      className="w-full bg-surface-secondary border border-border-primary rounded-2xl py-4.5 pl-6 pr-12 text-text-primary text-sm font-bold focus:border-primary/50 outline-none transition-all appearance-none"
                      value={editingCase.assignedTo?.id || editingCase.assignedTo || ''}
                      onChange={(e) => setEditingCase({ ...editingCase, assignedTo: e.target.value })}
                    >
                      <option value="">-- Flag as Unassigned --</option>
                      {staff.filter((s: any) => s.role === 'Case Worker').map((cw: any) => (
                        <option key={cw.id} value={cw.id}>{cw.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}



              {/* Universal Followup Communication System */}
              <div className="space-y-6 pt-10 border-t border-border-primary">
                {/* Display existing followups */}
                {editingCase.followups && editingCase.followups.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                        <HiOutlineChatBubbleLeftEllipsis className="w-4 h-4" />
                        Team Communication Thread — Case #{editingCase.caseNumber}
                      </label>
                      {user?.role === 'Case Worker' && (
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest italic opacity-60">
                          (Private Notes are in the Notepad above)
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {/* Work Audit Summary for Admin/Manager */}
                      {(user?.role === 'Admin' || user?.role === 'Manager') && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-success/10 border border-success/20 rounded-2xl p-4 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-success uppercase tracking-widest">Tasks Logged</span>
                            <span className="text-2xl font-black text-success">{editingCase.followups.filter((f: any) => f.type === 'Work Log').length}</span>
                          </div>
                          <div className="bg-primary/10 border border-border-accent rounded-2xl p-4 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Active Notes</span>
                            <span className="text-2xl font-black text-primary">{editingCase.followups.filter((f: any) => f.type !== 'Work Log').length}</span>
                          </div>
                        </div>
                      )}
                      {editingCase.followups.filter((f: any) => f.type !== 'Private Note').map((followup: any, idx: number) => (
                        <div
                          key={idx}
                          className={`rounded-2xl p-6 border ${followup.role === 'Manager' ? 'bg-primary/5 border-border-accent' :
                            followup.role === 'Admin' ? 'bg-purple-500/5 border-purple-500/20' :
                              'bg-zinc-500/5 border-zinc-500/20'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${followup.role === 'Manager' ? 'bg-primary/20 text-primary' :
                              followup.role === 'Admin' ? 'bg-purple-500/20 text-purple-500' :
                                'bg-zinc-500/20 text-zinc-500'
                              }`}>
                              {followup.role}
                            </span>
                            <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">
                              {new Date(followup.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-text-primary text-sm font-medium leading-relaxed whitespace-pre-wrap">
                            {followup.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Caseworker Specific Advice View */}
                {user?.role === 'Case Worker' && editingCase.adminAdvice && (
                  <div className="space-y-4 mb-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 ml-1 flex items-center gap-3">
                      <HiOutlineExclamationCircle className="w-4 h-4" />
                      Important Admin Advice
                    </label>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-8 text-text-primary text-sm font-sans font-bold italic whitespace-pre-wrap shadow-sm leading-relaxed">
                      "{editingCase.adminAdvice}"
                    </div>
                  </div>
                )}

                {/* Add new followup - Available for Manager, Admin, and Case Worker */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 flex items-center gap-3">
                    <HiOutlineDocumentText className="w-4 h-4" />
                    Post Update to Thread
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-gold-dim border border-border-accent rounded-3xl py-5 px-6 text-text-primary focus:bg-surface-secondary focus:border-primary outline-none transition-all font-bold resize-none placeholder:text-text-tertiary text-sm leading-relaxed"
                    placeholder={`Write a message to the team...`}
                    value={followupText}
                    onChange={(e) => setFollowupText(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddFollowup(editingCase.id)}
                    disabled={updateLoading || !followupText.trim()}
                    className="w-full h-14 bg-primary text-white hover:opacity-90 rounded-[22px] font-semibold text-xs tracking-wide transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateLoading ? <FiLoader className="w-5 h-5 animate-spin" /> : 'Send'}
                  </button>
                </div>
              </div>

              <div className="pt-12 flex gap-6">
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="flex-1 h-12 bg-surface-secondary border border-border-primary text-text-primary hover:bg-surface-hover rounded-xl font-semibold text-xs tracking-wide transition-all"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-[2] h-12 bg-primary text-white hover:opacity-90 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-gold flex items-center justify-center gap-2 active:scale-95"
                >
                  {updateLoading ? <FiLoader className="w-5 h-5 animate-spin" /> : 'Save Decisions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Dedicated Caseworker Note Modal */}
      {noteEditingCase && (
        <div className="fixed inset-0 bg-background/80 z-[110] flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-amber-500/20 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full max-w-lg p-8 animate-cardAppear relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                  <HiOutlinePencilSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-text-primary">Private Case Note</h3>
                  <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Case: {noteEditingCase.caseNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setNoteEditingCase(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-secondary border border-border-primary text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-all"
              >
                <HiOutlinePlus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-primary/80 mb-1.5 ml-0.5">Internal Log / Reminder</label>
                <textarea
                  rows={8}
                  className="w-full bg-surface-secondary/50 border border-amber-500/10 rounded-2xl py-5 px-6 text-text-primary focus:border-amber-500/50 outline-none transition-all font-medium resize-none placeholder:text-text-tertiary text-sm leading-relaxed"
                  placeholder="Only you can see these notes..."
                  value={noteEditingCase.caseworkerNote || ''}
                  onChange={(e) => setNoteEditingCase({ ...noteEditingCase, caseworkerNote: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setNoteEditingCase(null)}
                  className="flex-1 h-12 bg-surface-secondary text-text-primary rounded-xl font-bold text-xs tracking-wide hover:bg-surface-hover transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={updateLoading}
                  className="flex-[2] h-12 bg-amber-500 text-white hover:opacity-90 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {updateLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <HiOutlineCheckBadge className="w-4 h-4" />}
                  {updateLoading ? 'Saving...' : 'Save Private Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <FiLoader className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

