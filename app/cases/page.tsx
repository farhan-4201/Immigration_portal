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

const getStatusConfig = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s === 'accepted' || s === 'approved') return { color: '#5a9e7e', bg: 'rgba(90,158,126,0.1)', border: 'rgba(90,158,126,0.2)' };
  if (s === 'rejected') return { color: '#c0566a', bg: 'rgba(192,86,106,0.1)', border: 'rgba(192,86,106,0.2)' };
  if (s === 'waiting for decision') return { color: '#c8a96e', bg: 'rgba(200,169,110,0.1)', border: 'rgba(200,169,110,0.2)' };
  if (s === 'initial query') return { color: '#4a7fa5', bg: 'rgba(74,127,165,0.1)', border: 'rgba(74,127,165,0.2)' };
  return { color: 'var(--text-secondary)', bg: 'var(--surface-secondary)', border: 'var(--border-primary)' };
};

export default function CasesPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: authData } = useSWR('/api/auth/me', fetcher);
  const currentUser = authData?.user;

  const { data: casesData, mutate: mutateCases, isLoading: casesLoading } = useSWR<any[]>('/api/cases', fetcher);
  const cases = Array.isArray(casesData) ? casesData : [];

  const { data: workerData } = useSWR<any[]>('/api/users/caseworkers', fetcher);
  const caseWorkers = Array.isArray(workerData) ? workerData : [];

  const [selectedWorkers, setSelectedWorkers] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const filteredCases = cases.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.client?.name || c.clientName || '').toLowerCase().includes(q) || (c.caseNumber || '').toLowerCase().includes(q);
  });

  const assignCase = async (caseId: string) => {
    const workerId = selectedWorkers[caseId];
    if (!workerId) { alert('Please select a case worker.'); return; }
    try {
      const res = await fetch('/api/cases/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, caseWorkerId: workerId }),
      });
      if (!res.ok) throw new Error();
      mutateCases();
      mutate('/api/notifications');
      alert('Case assigned successfully!');
    } catch { alert('Failed to assign case.'); }
  };

  const handleActionClick = (caseId: string) => {
    if (currentUser?.role === 'Manager') { router.push(`/?caseId=${caseId}`); return; }
    assignCase(caseId);
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
        marginBottom: 36,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            marginBottom: 8,
            opacity: 0.7,
          }}>Case Management</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>Case Files</h1>
          <p style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginTop: 8,
            letterSpacing: '-0.005em',
          }}>Manage and track client applications</p>
        </div>

        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 22px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'var(--font-main)',
          letterSpacing: '0.01em',
          cursor: 'pointer',
          boxShadow: '0 8px 24px -4px rgba(200,169,110,0.4)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(200,169,110,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(200,169,110,0.4)';
        }}>
          <HiOutlinePlus style={{ width: 16, height: 16 }} />
          New Case
        </button>
      </div>

      {/* Search & filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{
          flex: 1,
          position: 'relative',
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 10,
          transition: 'all 0.2s ease',
        }}>
          <HiOutlineMagnifyingGlass style={{ width: 16, height: 16, color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name or case ID..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              padding: '12px 0',
              fontSize: 13.5,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-main)',
              letterSpacing: '-0.005em',
            }}
          />
        </div>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 20px',
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-main)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--surface-primary)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}>
          <HiOutlineFunnel style={{ width: 15, height: 15 }} />
          Filter
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--surface-secondary)' }}>
                {['Client', 'Type', 'Status', 'Assigned To', 'Action'].map((h, i) => (
                  <th key={h} style={{
                    padding: '14px 20px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    textAlign: i === 4 ? 'right' : 'left',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {casesLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center' }}>
                    <FiLoader style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto', color: 'var(--primary)' }} />
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <HiOutlineBriefcase style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.2 }} />
                    <p style={{ fontSize: 13, fontWeight: 500 }}>No cases found</p>
                  </td>
                </tr>
              ) : filteredCases.map((c, idx) => {
                const sc = getStatusConfig(c.status);
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid var(--border-primary)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Client */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>
                        {c.client?.name || c.clientName}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--primary)',
                        opacity: 0.7,
                      }}>{(c.caseNumber || c.id?.slice(-8) || '').toUpperCase()}</div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {c.caseType || c.immigration?.status || 'Immigration'}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        borderRadius: 100,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: sc.color,
                        background: sc.bg,
                        border: `1px solid ${sc.border}`,
                      }}>{c.status}</span>
                    </td>

                    {/* Assigned To */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: 'var(--gold-dim)',
                          border: '1px solid var(--border-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--primary)',
                          fontFamily: 'var(--font-display)',
                          flexShrink: 0,
                        }}>
                          {c.assignedTo?.name?.[0] || '?'}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {c.assignedTo?.name || 'Unassigned'}
                        </span>
                      </div>
                      <select
                        style={{
                          width: '100%',
                          background: 'var(--surface-secondary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '8px',
                          padding: '7px 32px 7px 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-main)',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        value={selectedWorkers[c.id] || c.assignedTo?.id || ''}
                        onChange={e => setSelectedWorkers({ ...selectedWorkers, [c.id]: e.target.value })}
                      >
                        <option value="">— Reassign Case —</option>
                        {caseWorkers.map(worker => (
                          <option key={worker.id} value={worker.id}>{worker.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                          onClick={() => handleActionClick(c.id)}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(200,169,110,0.25)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(200,169,110,0.35)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(200,169,110,0.25)';
                          }}
                        >
                          {currentUser?.role === 'Manager' ? 'Monitor' : 'Assign'}
                        </button>
                        <HiOutlineChevronRight style={{ width: 16, height: 16, color: 'var(--text-tertiary)' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
