"use client";

import { useState, useEffect, useRef } from 'react';
import { HiOutlineBell, HiOutlineClock, HiOutlineChatBubbleLeftEllipsis, HiOutlineBriefcase, HiOutlineCheck, HiOutlineDocumentText } from 'react-icons/hi2';
import Link from 'next/link';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef<number>(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const toastQueueRef = useRef<any[]>([]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Refresh every 10 seconds for real-time updates
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (notification: any) => {
    setLatestNotification(notification);
    setShowToast(true);

    // Play role-specific notification sound
    let soundFrequency = 800; // Default

    if (notification.title?.includes('Manager')) {
      soundFrequency = 1000;
    } else if (notification.title?.includes('Admin')) {
      soundFrequency = 900;
    } else if (notification.title?.includes('Case Worker')) {
      soundFrequency = 700;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = soundFrequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      // Ignore audio errors (e.g., autoplay restrictions)
    }

    // Auto-hide toast and process next in queue
    setTimeout(() => {
      setShowToast(false);
      setLatestNotification(null);

      const next = toastQueueRef.current.shift();
      if (next) {
        // Slight delay between toasts
        setTimeout(() => triggerToast(next), 300);
      }
    }, 5000);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const rawData = await res.json();
        const data = Array.isArray(rawData) ? rawData : [];

        // Check for newly arrived unread notifications by ID
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

        previousCountRef.current = unread.length;
        setNotifications(data);
      }
    } catch (err) {
      // Background fetch failure handled silently to avoid console flooding
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ));
      }
    } catch (err) {
      // Fail silently
    }
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'Deadline': return <HiOutlineClock className="w-4 h-4 text-red-500" />;
      case 'Advice': return <HiOutlineChatBubbleLeftEllipsis className="w-4 h-4 text-amber-500" />;
      case 'Assignment': return <HiOutlineBriefcase className="w-4 h-4 text-primary" />;
      case 'Followup': return <HiOutlineDocumentText className="w-4 h-4 text-blue-500" />;
      default: return <HiOutlineBell className="w-4 h-4 text-text-tertiary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center border border-border-secondary hover:bg-surface-hover transition-all cursor-pointer relative shadow-sm"
      >
        <HiOutlineBell className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
        {unreadCount > 0 && (
          <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--primary)]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 bg-surface-primary backdrop-blur-xl border border-border-secondary rounded-[32px] shadow-2xl z-[60] overflow-hidden animate-cardAppear transition-colors duration-300">
          <div className="p-6 border-b border-border-primary flex items-center justify-between bg-surface-secondary">
            <h3 className="font-bold text-text-primary text-sm uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg border border-primary/20">
                {unreadCount} UNREAD
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-text-tertiary">
                <HiOutlineBell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-5 border-b border-border-primary hover:bg-surface-hover transition-all flex gap-4 ${!n.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border border-border-primary ${n.type === 'Deadline' ? 'bg-red-500/10' :
                    n.type === 'Advice' ? 'bg-amber-500/10' : 'bg-primary/10'
                    }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <p className="text-[13px] font-bold text-text-primary truncate">{n.title}</p>
                      <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-tighter">
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{n.message}</p>
                    <div className="flex items-center justify-between">
                      {n.link ? (
                        <Link
                          href={n.link}
                          className="text-[10px] font-bold text-primary hover:opacity-80 transition-opacity uppercase tracking-widest"
                          onClick={() => {
                            setIsOpen(false);
                            if (!n.isRead) markAsRead(n.id);
                          }}
                        >
                          Check
                        </Link>
                      ) : <div />}
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[10px] font-bold text-text-tertiary hover:text-text-primary flex items-center gap-1 transition-colors uppercase tracking-widest"
                        >
                          <HiOutlineCheck className="w-3 h-3" /> Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-surface-secondary text-center border-t border-border-primary">
            <button className="text-[9px] font-black text-text-tertiary hover:text-text-primary transition-colors tracking-[0.2em] uppercase">
              View All Notifications
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && latestNotification && (
        <div className="fixed top-24 right-10 z-[70] animate-slideInRight">
          <div className="bg-surface-primary border-2 border-primary rounded-2xl shadow-2xl p-5 w-96 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border border-border-primary ${latestNotification.type === 'Deadline' ? 'bg-red-500/10' :
                latestNotification.type === 'Advice' ? 'bg-amber-500/10' :
                  latestNotification.type === 'Followup' ? 'bg-blue-500/10' : 'bg-primary/10'
                }`}>
                {getIcon(latestNotification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-text-primary">{latestNotification.title}</p>
                  <button
                    onClick={() => setShowToast(false)}
                    className="text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <HiOutlineCheck className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-3">{latestNotification.message}</p>
                {latestNotification.link && (
                  <Link
                    href={latestNotification.link}
                    className="text-xs font-bold text-primary hover:opacity-80 transition-opacity uppercase tracking-wider"
                    onClick={() => setShowToast(false)}
                  >
                    View Details →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
