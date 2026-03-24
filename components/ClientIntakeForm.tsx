'use client';

import { useState, useEffect } from 'react';
import {
  HiOutlineUser,
  HiOutlineGlobeAlt,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineHeart,
  HiOutlineCheckCircle,
  HiOutlinePlusCircle,
  HiOutlineBookmark,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { FiLoader } from 'react-icons/fi';

type InputProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
};

type TextareaProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type Deadline = {
  date: string;
  title: string;
};

export default function ClientIntakeForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    nationality: '',
    email: '',
    phoneNumber: '',
    dob: '',
    immigrationStatus: '',
    immigrationHistory: '',
    relationshipStatus: 'Single',
    residentialAddress: '',
    idDocuments: '',
    domain: '',
    deadlines: [{ date: '', title: '' }] as Deadline[],
    assignedTo: '',
  });

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch('/api/staff');
        if (res.ok) {
          const data = await res.json();
          setStaff(data.filter((s: any) => s.role === 'Case Worker'));
        }
      } catch (err) {
        setError('Failed to connect to staff directory. Please reload.');
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Auto-populate domain if we are on a custom tenant domain
      if (
        hostname !== 'localhost' &&
        hostname !== 'admin.westburylaw.co.uk' &&
        hostname !== 'portal.westburylaw.co.uk'
      ) {
        setFormData(prev => ({ ...prev, domain: hostname }));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/clients/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          idDocuments: formData.idDocuments
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(data.caseNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setFormData({
          name: '',
          nationality: '',
          email: '',
          phoneNumber: '',
          dob: '',
          immigrationStatus: '',
          immigrationHistory: '',
          relationshipStatus: 'Single',
          residentialAddress: '',
          idDocuments: '',
          domain: '',
          deadlines: [{ date: '', title: '' }],
          assignedTo: '',
        });
      } else {
        const data = await res.json();
        setError(data.message || 'There was an issue registering the inquiry. Please try again.');
      }
    } catch (err) {
      setError('System connectivity issue. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-surface-primary border border-border-primary p-6 md:p-12 text-center rounded-[28px] md:rounded-[40px] shadow-sm">
        <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
          <HiOutlineCheckCircle className="w-8 h-8 md:w-12 md:h-12 text-emerald-500" />
        </div>
        <h3 className="text-xl md:text-3xl font-display font-black mb-3 text-text-primary">Inquiry Registered</h3>
        <p className="text-text-tertiary mb-6 font-medium text-sm md:text-base">
          A case profile has been created with reference:
        </p>
        <div className="text-3xl md:text-5xl font-mono font-bold text-primary mb-8 tracking-tighter">
          {success}
        </div>
        <button
          onClick={() => setSuccess(null)}
          className="w-full md:w-auto px-10 py-4 md:py-5 bg-primary text-background font-black rounded-xl md:rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          Add Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-primary border border-border-primary p-6 md:p-12 rounded-[28px] md:rounded-[48px] shadow-2xl relative overflow-hidden group transition-colors duration-300">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/15 transition-all duration-700" />

      <div className="absolute top-0 right-0 p-8 md:p-12 opacity-[0.05] pointer-events-none hidden md:block">
        <HiOutlineBookmark className="w-32 h-32 text-text-primary" />
      </div>

      <div className="flex items-center gap-4 md:gap-5 mb-8 md:mb-12 relative z-10">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-primary rounded-xl md:rounded-[20px] flex items-center justify-center shadow-lg shadow-primary/30 border border-primary/20">
          <HiOutlinePlusCircle className="w-6 h-6 md:w-7 md:h-7 text-background" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-display font-black text-text-primary tracking-tighter uppercase md:normal-case">New Client Inquiry</h2>
          <p className="text-text-tertiary font-bold text-[8px] md:text-[9px] mt-0.5 uppercase tracking-[0.2em] md:tracking-[0.3em]">Global Registration System</p>
        </div>
      </div>

      {error && (
        <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-500 animate-slideInRight">
          <HiOutlineCheckCircle className="w-6 h-6 rotate-45" />
          <p className="text-sm font-bold tracking-tight">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 md:space-y-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 md:gap-x-12 gap-y-6 md:gap-y-10">
          <Input
            icon={HiOutlineUser}
            label="Legal Full Name"
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
          />
          <Input
            icon={HiOutlineGlobeAlt}
            label="Nationality"
            value={formData.nationality}
            onChange={(v) => setFormData({ ...formData, nationality: v })}
          />
          <Input
            icon={HiOutlineEnvelope}
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(v) => setFormData({ ...formData, email: v })}
          />
          <Input
            icon={HiOutlinePhone}
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(v) => setFormData({ ...formData, phoneNumber: v })}
          />
          <Input
            icon={HiOutlineCalendar}
            label="Date of Birth"
            type="date"
            value={formData.dob}
            onChange={(v) => setFormData({ ...formData, dob: v })}
          />
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Relationship Status</label>
            <div className="relative">
              <HiOutlineHeart className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <select
                className="w-full bg-surface-secondary border border-border-primary rounded-2xl py-5 pl-14 pr-12 outline-none focus:bg-surface-hover focus:border-primary/50 appearance-none transition-all font-bold text-text-primary shadow-inner"
                value={formData.relationshipStatus}
                onChange={(e) =>
                  setFormData({ ...formData, relationshipStatus: e.target.value })
                }
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
          </div>
          <Input
            icon={HiOutlineDocumentText}
            label="Current Immigration Status"
            value={formData.immigrationStatus}
            onChange={(v) => setFormData({ ...formData, immigrationStatus: v })}
          />
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Assign Caseworker</label>
            <div className="relative">
              <HiOutlineUser className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <select
                className="w-full bg-surface-secondary border border-border-primary rounded-2xl py-5 pl-14 pr-12 outline-none focus:bg-surface-hover focus:border-primary/50 appearance-none transition-all font-bold text-text-primary shadow-inner"
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
              >
                <option value="">Auto-Assign / Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.workload} active files)</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Provided Documents</label>
            <div className="relative">
              <HiOutlineBookmark className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                className="w-full bg-surface-secondary border border-border-primary rounded-2xl py-5 pl-14 pr-4 outline-none focus:bg-surface-hover focus:border-primary/50 transition-all font-bold text-text-primary shadow-inner placeholder:text-text-tertiary"
                placeholder="Passport, Visa, BRP..."
                value={formData.idDocuments}
                onChange={(e) =>
                  setFormData({ ...formData, idDocuments: e.target.value })
                }
              />
            </div>
          </div>
          <Input
            icon={HiOutlineGlobeAlt}
            label="Source Domain (Tenant)"
            value={formData.domain}
            onChange={(v) => setFormData({ ...formData, domain: v })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-8 md:pt-16 border-t border-border-primary">
          <Textarea
            icon={HiOutlineClock}
            label="Case Details"
            value={formData.immigrationHistory}
            onChange={(v) =>
              setFormData({ ...formData, immigrationHistory: v })
            }
          />
          <Textarea
            icon={HiOutlineHome}
            label="Residential Address"
            value={formData.residentialAddress}
            onChange={(v) =>
              setFormData({ ...formData, residentialAddress: v })
            }
          />
        </div>

        <div className="space-y-6 md:space-y-8 pt-8 md:pt-16 border-t border-border-primary">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <HiOutlineClock className="w-5 h-5 text-primary" />
              <span className="text-base md:text-lg font-display font-black text-text-primary uppercase tracking-[0.2em]">Case Deadlines</span>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  deadlines: [...formData.deadlines, { date: '', title: '' }],
                })
              }
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
            >
              <HiOutlinePlusCircle className="w-4 h-4" />
              Add Deadline
            </button>
          </div>

          <div className="grid gap-4">
            {formData.deadlines.map((d, i) => (
              <div key={i} className="flex flex-col lg:flex-row gap-4 md:gap-6 p-6 md:p-8 bg-surface-secondary/50 border border-border-primary rounded-2xl md:rounded-3xl group/item hover:bg-surface-secondary transition-all">
                <div className="flex-1 space-y-2 md:space-y-3">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest ml-1">Task / Obligation</label>
                  <input
                    className="w-full bg-surface-primary border border-border-primary rounded-xl md:rounded-2xl p-4 text-sm font-bold text-text-primary focus:border-primary/50 outline-none"
                    placeholder="e.g. Submission Deadline"
                    value={d.title}
                    onChange={(e) => {
                      const copy = [...formData.deadlines];
                      copy[i].title = e.target.value;
                      setFormData({ ...formData, deadlines: copy });
                    }}
                  />
                </div>
                <div className="flex-[0.8] space-y-3">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest ml-1">Deadline Date & Time</label>
                  <div className="flex gap-4">
                    <input
                      type="datetime-local"
                      className="flex-1 bg-surface-primary border border-border-primary rounded-2xl p-4 text-sm font-bold text-text-primary focus:border-primary/50 outline-none"
                      value={d.date}
                      onChange={(e) => {
                        const copy = [...formData.deadlines];
                        copy[i].date = e.target.value;
                        setFormData({ ...formData, deadlines: copy });
                      }}
                    />
                    {formData.deadlines.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            deadlines: formData.deadlines.filter(
                              (_, idx) => idx !== i
                            ),
                          })
                        }
                        className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-background transition-all"
                      >
                        <HiOutlineTrash className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-10 h-14 md:h-16 bg-primary text-white rounded-xl md:rounded-2xl font-semibold text-base md:text-lg tracking-tight flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-primary/20 group/btn"
          >
            {loading ? <FiLoader className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : (
              <>
                <HiOutlineCheckCircle className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-6 transition-transform" />
                Submit Inquiry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({
  icon: Icon,
  label,
  value,
  onChange,
  type = 'text',
}: InputProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
        <input
          type={type}
          className="w-full bg-surface-secondary border border-border-primary rounded-2xl py-5 pl-14 pr-4 outline-none focus:bg-surface-hover focus:border-primary/50 transition-all font-bold text-text-primary shadow-inner placeholder:text-text-tertiary"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}

function Textarea({
  icon: Icon,
  label,
  value,
  onChange,
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-5 top-6 w-5 h-5 text-text-tertiary" />
        <textarea
          rows={3}
          className="w-full bg-surface-secondary border border-border-primary rounded-2xl py-5 pl-14 pr-4 resize-none outline-none focus:bg-surface-hover focus:border-primary/50 transition-all font-bold text-text-primary shadow-inner placeholder:text-text-tertiary"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}
