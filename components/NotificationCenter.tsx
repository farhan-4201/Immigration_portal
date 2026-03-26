'use client';

import { useState, useEffect, useRef } from 'react';
import { HiOutlineBell, HiOutlineClock, HiOutlineChatBubbleLeftEllipsis, HiOutlineBriefcase, HiOutlineCheck, HiOutlineDocumentText } from 'react-icons/hi2';
import Link from 'next/link';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const toastQueueRef = useRef<any[]>([]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (notification: any) => {
    setLatestNotification(notification);
    setShowToast(true);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (err) {}

    setTimeout(() => {
      setShowToast(false);
      setLatestNotification(null);
      const next = toastQueueRef.current.shift();
      if (next) setTimeout(() => triggerToast(next), 300);
    }, 5000);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const rawData = await res.json();
        const data = Array.isArray(rawData) ? rawData : [];
        const unread = data.filter((n: any) => !n.isRead);
        const newUnread = unread.filter((n: any) => !seenIdsRef.current.has(n.id));
        if (newUnread.length > 0) {
          newUnread.forEach((n: any) => {
            seenIdsRef.current.add(n.id);
            toastQueueRef.current.push(n);
          });
          if (!showToast && !latestNotification) {
            const next = toastQueueRef.current.shift();
            if (next) triggerToast(next);
          }
        }
        setNotifications(data);
      }
    } catch (err) {}
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'Deadline': return { icon: HiOutlineClock, color: '#c0566a', bg: 'rgba(192,86,106,0.1)' };
      case 'Advice': return { icon: HiOutlineChatBubbleLeftEllipsis, color: 'var(--primary)', bg: 'var(--gold-dim)' };
      case 'Assignment': return { icon: HiOutlineBriefcase, color: '#4a7fa5', bg: 'rgba(74,127,165,0.1)' };
      case 'Followup': return { icon: HiOutlineDocumentText, color: '#5a9e7e', bg: 'rgba(90,158,126,0.1)' };
      default: return { icon: HiOutlineBell, color: 'var(--text-tertiary)', bg: 'var(--surface-secondary)' };
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          background: isOpen ? 'var(--gold-dim)' : 'var(--surface-secondary)',
          border: isOpen ? '1px solid var(--border-accent)' : '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
          color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--gold-dim)';
            e.currentTarget.style.borderColor = 'var(--border-accent)';
            e.currentTarget.style.color = 'var(--primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--surface-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-primary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
      >
        <HiOutlineBell style={{ width: 16, height: 16 }} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 6,
            height: 6,
            background: 'var(--primary)',
            borderRadius: '50%',
            boxShadow: '0 0 0 2px var(--background)',
            animation: 'pulseGold 2s ease-in-out infinite',
          }} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-[-10px] md:right-0 top-[calc(100%+10px)] w-[360px] max-w-[calc(100vw-32px)] z-50 overflow-hidden" style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border-secondary)',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'cardAppear 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px 14px',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--primary)',
                background: 'var(--gold-dim)',
                border: '1px solid var(--border-accent)',
                padding: '2px 8px',
                borderRadius: 100,
              }}>{unreadCount} New</span>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '48px 20px',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
              }}>
                <HiOutlineBell style={{ width: 28, height: 28, margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: 13, fontWeight: 500 }}>All caught up</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = getTypeConfig(n.type);
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border-primary)',
                      display: 'flex',
                      gap: '12px',
                      background: !n.isRead ? 'var(--gold-dim)' : 'transparent',
                      transition: 'background 0.15s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      if (!(!n.isRead)) e.currentTarget.style.background = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!(!n.isRead)) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      background: config.bg,
                      border: '1px solid var(--border-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon style={{ width: 15, height: 15, color: config.color }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{n.title}</p>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--text-tertiary)',
                          whiteSpace: 'nowrap',
                          marginLeft: 8,
                          letterSpacing: '0.05em',
                        }}>{new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{n.message}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {n.link ? (
                          <Link
                            href={n.link}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              fontWeight: 600,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              color: 'var(--primary)',
                              textDecoration: 'none',
                              transition: 'opacity 0.15s ease',
                            }}
                            onClick={() => { setIsOpen(false); if (!n.isRead) markAsRead(n.id); }}
                          >View →</Link>
                        ) : <div />}
                        {!n.isRead && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              fontWeight: 600,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'var(--text-tertiary)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'color 0.15s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                          >
                            <HiOutlineCheck style={{ width: 11, height: 11 }} /> Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-primary)',
            background: 'var(--surface-secondary)',
            textAlign: 'center',
          }}>
            <Link href="/notifications" style={{ textDecoration: 'none' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                transition: 'color 0.15s ease',
                cursor: 'pointer',
              }}>View All Notifications</span>
            </Link>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && latestNotification && (
        <div style={{
          position: 'fixed',
          top: '84px',
          right: '40px',
          zIndex: 70,
          width: '340px',
          animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{
            background: 'var(--card-bg)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid var(--border-accent)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'var(--gold-dim)',
              border: '1px solid var(--border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <HiOutlineBell style={{ width: 15, height: 15, color: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{latestNotification.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{latestNotification.message}</p>
              {latestNotification.link && (
                <Link
                  href={latestNotification.link}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    marginTop: 8,
                    display: 'inline-block',
                  }}
                  onClick={() => setShowToast(false)}
                >View Details →</Link>
              )}
            </div>
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 2,
                lineHeight: 1,
                flexShrink: 0,
                fontSize: 16,
              }}
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
}
