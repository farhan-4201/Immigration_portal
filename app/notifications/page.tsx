'use client';

import { useState, useEffect } from 'react';
import { HiOutlineBell, HiOutlineClock, HiOutlineChatBubbleLeftEllipsis, HiOutlineBriefcase, HiOutlineCheck, HiOutlineDocumentText } from 'react-icons/hi2';
import { FiLoader } from 'react-icons/fi';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
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
      console.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      await Promise.all(unreadIds.map(id =>
        fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      ));
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Deadline': return <HiOutlineClock className="w-5 h-5 text-red-500" />;
      case 'Advice': return <HiOutlineChatBubbleLeftEllipsis className="w-5 h-5 text-amber-500" />;
      case 'Assignment': return <HiOutlineBriefcase className="w-5 h-5 text-primary" />;
      case 'Followup': return <HiOutlineDocumentText className="w-5 h-5 text-blue-500" />;
      default: return <HiOutlineBell className="w-5 h-5 text-text-tertiary" />;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-8 animate-cardAppear bg-background transition-colors duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">
            Notifications
          </h1>
          <p className="text-text-tertiary mt-1 font-semibold uppercase tracking-widest text-[10px]">
            Stay updated with all your case activities
          </p>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-6 py-3 bg-primary text-background rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-lg uppercase tracking-wider"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-border-primary">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${filter === 'all'
            ? 'text-primary'
            : 'text-text-tertiary hover:text-text-primary'
            }`}
        >
          All Notifications
          {filter === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${filter === 'unread'
            ? 'text-primary'
            : 'text-text-tertiary hover:text-text-primary'
            }`}
        >
          Unread ({unreadCount})
          {filter === 'unread' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-surface-primary border border-border-primary rounded-[32px] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-20 text-center">
            <FiLoader className="w-8 h-8 animate-spin mx-auto text-primary" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-20 text-center text-text-tertiary">
            <HiOutlineBell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-bold">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-6 hover:bg-surface-hover transition-all flex gap-5 ${!n.isRead ? 'bg-primary/5' : ''
                  }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border border-border-primary ${n.type === 'Deadline' ? 'bg-red-500/10' :
                  n.type === 'Advice' ? 'bg-amber-500/10' :
                    n.type === 'Followup' ? 'bg-blue-500/10' : 'bg-primary/10'
                  }`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-text-primary mb-1">{n.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{n.message}</p>
                    </div>
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-4 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    {n.link && (
                      <Link
                        href={n.link}
                        className="text-xs font-bold text-primary hover:opacity-80 transition-opacity uppercase tracking-wider"
                      >
                        View Details →
                      </Link>
                    )}
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-xs font-bold text-text-tertiary hover:text-text-primary flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                      >
                        <HiOutlineCheck className="w-4 h-4" />
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
