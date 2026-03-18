'use client';

import { useState, useEffect } from 'react';
import { HiOutlineUsers, HiOutlineUserPlus, HiOutlineShieldCheck, HiOutlineTrash } from 'react-icons/hi2';
import { FiLoader, FiActivity } from 'react-icons/fi';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Case Worker' });
  const [isCreating, setIsCreating] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'Case Worker' });
        fetchUsers();
      } else {
        const data = await res.json();
        console.error('User creation failed:', data.message);
      }
    } catch (err) {
      console.error('Error creating user:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: 'Deactivated' }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Deactivation error:', err);
    }
  };

  return (
    <div className="space-y-8 animate-cardAppear bg-background transition-colors duration-300">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 bg-surface-primary p-6 md:p-10 rounded-[28px] md:rounded-[40px] border border-border-primary shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-5xl font-display font-black text-text-primary tracking-tighter mb-2">Staff Members</h1>
          <p className="text-text-tertiary font-bold uppercase tracking-[0.2em] text-[9px] md:text-[10px] flex items-center gap-2">
            <HiOutlineShieldCheck className="w-4 h-4 text-primary" />
            Admin Tools
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="relative z-10 w-full md:w-auto px-8 py-4 bg-primary text-background rounded-xl md:rounded-2xl font-display font-bold text-sm transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <HiOutlineUserPlus className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Add New Person</span>
        </button>
      </header>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-border-primary rounded-[32px] md:rounded-[48px] shadow-2xl w-full max-w-md p-8 md:p-12 animate-cardAppear relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <h3 className="text-2xl md:text-3xl font-display font-black text-text-primary mb-8 relative z-10">Create Staff</h3>
            <form onSubmit={handleCreateUser} className="space-y-4 md:space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">Full Name</label>
                <input
                  required
                  className="w-full bg-surface-secondary border border-border-secondary rounded-xl md:rounded-2xl py-3 md:py-4 px-5 md:px-6 text-sm md:text-base text-text-primary focus:border-primary/50 outline-none transition-all font-bold"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full bg-surface-secondary border border-border-secondary rounded-xl md:rounded-2xl py-3 md:py-4 px-5 md:px-6 text-sm md:text-base text-text-primary focus:border-primary/50 outline-none transition-all font-bold"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">First Password</label>
                <input
                  required
                  type="password"
                  className="w-full bg-surface-secondary border border-border-secondary rounded-xl md:rounded-2xl py-3 md:py-4 px-5 md:px-6 text-sm md:text-base text-text-primary focus:border-primary/50 outline-none transition-all font-bold"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">Access Role</label>
                <select
                  className="w-full bg-surface-secondary border border-border-secondary rounded-xl md:rounded-2xl py-3 md:py-4 pl-5 md:pl-6 pr-12 text-sm md:text-base text-text-primary focus:border-primary/50 outline-none transition-all font-bold appearance-none"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="Case Worker">Case Worker</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-border-secondary text-text-secondary rounded-xl font-bold hover:bg-surface-secondary transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-primary text-background rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 text-sm"
                >
                  {isCreating ? <FiLoader className="animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-surface-primary border border-border-primary rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-primary bg-surface-secondary/30">
                <th className="p-6 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">User</th>
                <th className="p-6 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">Role</th>
                <th className="p-6 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">Status</th>
                <th className="p-6 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">Last Login</th>
                <th className="p-6 text-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-tertiary">
                    <div className="flex flex-col items-center gap-3">
                      <FiLoader className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-sm font-medium">Fetching users...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-surface-hover transition-all group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-border-primary flex items-center justify-center text-xs font-black text-text-tertiary shadow-inner group-hover:border-primary/30 transition-all">
                          {u.name?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-text-primary font-bold">{u.name}</span>
                          <span className="text-xs text-text-tertiary font-medium tracking-tight">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="flex items-center gap-2 text-text-secondary font-bold text-sm">
                        <HiOutlineShieldCheck className="w-4 h-4 text-primary" />
                        {u.role}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${u.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-6 text-xs text-text-tertiary font-bold">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button className="p-3 bg-surface-secondary border border-border-primary hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-xl transition-all shadow-lg" title="Staff History">
                          <FiActivity className="w-4 h-4" />
                        </button>
                        {u.status === 'Active' && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="p-3 bg-surface-secondary border border-border-primary hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-all text-text-secondary shadow-lg"
                            title="Deactivate"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        )}
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
