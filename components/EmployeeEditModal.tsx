'use client';

import { useState, useEffect } from 'react';
import {
    HiOutlineShieldCheck,
    HiOutlineUser,
    HiOutlineEnvelope,
    HiOutlineIdentification,
    HiOutlineCalendarDays,
    HiOutlineCheckCircle,
    HiOutlineBriefcase,
    HiOutlineCurrencyPound,
    HiOutlineGlobeAlt,
    HiOutlinePhone,
    HiOutlineMapPin,
    HiOutlineClock,
    HiOutlineXMark
} from 'react-icons/hi2';
import { FiLoader } from 'react-icons/fi';

interface EmployeeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: any;
    onUpdate: () => void;
}

export default function EmployeeEditModal({ isOpen, onClose, employee, onUpdate }: EmployeeEditModalProps) {
    const [formData, setFormData] = useState<any>(null);
    const [companies, setCompanies] = useState([]);
    const [status, setStatus] = useState({ loading: false, success: false, error: '' });

    useEffect(() => {
        if (employee) {
            setFormData({
                employeeName: employee.employeeName || '',
                companyId: employee.companyId?.id || employee.companyId || '',
                nationality: employee.nationality || '',
                dob: employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
                jobRole: employee.jobRole || '',
                salary: employee.salary || '',
                niNumber: employee.niNumber || '',
                jobStartDate: employee.jobStartDate ? new Date(employee.jobStartDate).toISOString().split('T')[0] : '',
                permit: employee.permit || '',
                expiryDate: employee.expiryDate ? new Date(employee.expiryDate).toISOString().split('T')[0] : '',
                immigrationStatus: employee.immigrationStatus || '',
                passportNumber: employee.passportNumber || '',
                contactNumber: employee.contactNumber || '',
                email: employee.email || '',
                paidLeaveSickDays: employee.paidLeaveSickDays || '',
                upcomingAnnualLeave: employee.upcomingAnnualLeave || '',
            });
        }
    }, [employee]);

    useEffect(() => {
        async function fetchCompanies() {
            try {
                const res = await fetch('/api/companies', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setCompanies(data);
                }
            } catch (err) {
                console.error('Failed to fetch companies');
            }
        }
        if (isOpen) fetchCompanies();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ loading: true, success: false, error: '' });

        try {
            const res = await fetch(`/api/employees/${employee.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus({ loading: false, success: true, error: '' });
                setTimeout(() => {
                    onUpdate();
                    onClose();
                }, 1500);
            } else {
                const data = await res.json();
                setStatus({ loading: false, success: false, error: data.message || 'Update failed' });
            }
        } catch (err) {
            setStatus({ loading: false, success: false, error: 'Network error occurred' });
        }
    };

    if (!isOpen || !formData) return null;

    const inputClasses = "w-full bg-surface-secondary border border-border-secondary rounded-2xl py-3 pl-12 pr-4 text-text-primary focus:border-primary transition-all outline-none font-medium text-sm";
    const labelClasses = "text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1 mb-1.5 block";
    const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-surface-primary border border-border-primary rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-cardAppear">
                <header className="p-6 border-b border-border-primary flex items-center justify-between sticky top-0 bg-surface-primary z-10">
                    <div>
                        <h2 className="text-xl font-display font-black text-text-primary">Edit Employee Record</h2>
                        <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Update employee information</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-secondary rounded-xl transition-colors"
                    >
                        <HiOutlineXMark className="w-6 h-6 text-text-tertiary" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {status.success ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-cardAppear">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                                <HiOutlineCheckCircle className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-display font-black text-text-primary mb-2">Update Successful!</h3>
                            <p className="text-text-secondary">The record has been updated and monitoring is being recalibrated.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Section 1: Personal Information */}
                            <div>
                                <h3 className="text-sm font-display font-black text-text-primary mb-6 flex items-center gap-3">
                                    <span className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-[10px]">01</span>
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Full Name</label>
                                        <div className="relative">
                                            <HiOutlineUser className={iconClasses} />
                                            <input type="text" required placeholder="John Doe" className={inputClasses} value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Assigned Company</label>
                                        <div className="relative">
                                            <HiOutlineBriefcase className={iconClasses} />
                                            <select
                                                required
                                                className={inputClasses}
                                                value={formData.companyId}
                                                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                            >
                                                <option value="">Select Company</option>
                                                {companies.map((c: any) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Nationality</label>
                                        <div className="relative">
                                            <HiOutlineGlobeAlt className={iconClasses} />
                                            <input type="text" placeholder="Nationality" className={inputClasses} value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Date of Birth</label>
                                        <div className="relative">
                                            <HiOutlineCalendarDays className={iconClasses} />
                                            <input type="date" className={inputClasses} value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Email Address</label>
                                        <div className="relative">
                                            <HiOutlineEnvelope className={iconClasses} />
                                            <input type="email" required placeholder="email@company.com" className={inputClasses} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Contact Number</label>
                                        <div className="relative">
                                            <HiOutlinePhone className={iconClasses} />
                                            <input type="text" placeholder="Contact number" className={inputClasses} value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Passport Number</label>
                                        <div className="relative">
                                            <HiOutlineIdentification className={iconClasses} />
                                            <input type="text" required placeholder="Passport number" className={inputClasses} value={formData.passportNumber} onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Employment Details */}
                            <div>
                                <h3 className="text-sm font-display font-black text-text-primary mb-6 flex items-center gap-3">
                                    <span className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-[10px]">02</span>
                                    Employment Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Job Role</label>
                                        <div className="relative">
                                            <HiOutlineBriefcase className={iconClasses} />
                                            <input type="text" placeholder="Job Role" className={inputClasses} value={formData.jobRole} onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Salary (Gross Pay)</label>
                                        <div className="relative">
                                            <HiOutlineCurrencyPound className={iconClasses} />
                                            <input type="text" placeholder="Salary" className={inputClasses} value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>NI Number</label>
                                        <div className="relative">
                                            <HiOutlineIdentification className={iconClasses} />
                                            <input type="text" placeholder="NI Number" className={inputClasses} value={formData.niNumber} onChange={(e) => setFormData({ ...formData, niNumber: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Job Start Date</label>
                                        <div className="relative">
                                            <HiOutlineCalendarDays className={iconClasses} />
                                            <input type="date" className={inputClasses} value={formData.jobStartDate} onChange={(e) => setFormData({ ...formData, jobStartDate: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Paid Leave/ Sick Days</label>
                                        <div className="relative">
                                            <HiOutlineClock className={iconClasses} />
                                            <input type="text" placeholder="Leave/Sick Days" className={inputClasses} value={formData.paidLeaveSickDays} onChange={(e) => setFormData({ ...formData, paidLeaveSickDays: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Upcoming Annual Leave</label>
                                        <div className="relative">
                                            <HiOutlineCalendarDays className={iconClasses} />
                                            <input type="text" placeholder="Annual Leave" className={inputClasses} value={formData.upcomingAnnualLeave} onChange={(e) => setFormData({ ...formData, upcomingAnnualLeave: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Immigration Status */}
                            <div>
                                <h3 className="text-sm font-display font-black text-text-primary mb-6 flex items-center gap-3">
                                    <span className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-[10px]">03</span>
                                    Immigration & Permits
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Permit Type</label>
                                        <div className="relative">
                                            <HiOutlineShieldCheck className={iconClasses} />
                                            <input type="text" placeholder="Permit type" className={inputClasses} value={formData.permit} onChange={(e) => setFormData({ ...formData, permit: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Permit Valid Until</label>
                                        <div className="relative">
                                            <HiOutlineCalendarDays className={iconClasses} />
                                            <input type="date" required className={inputClasses} value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1 group relative">
                                        <label className={labelClasses}>Immigration Status</label>
                                        <div className="relative">
                                            <HiOutlineMapPin className={iconClasses} />
                                            <input type="text" placeholder="Status" className={inputClasses} value={formData.immigrationStatus} onChange={(e) => setFormData({ ...formData, immigrationStatus: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {status.error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">
                                    {status.error}
                                </div>
                            )}

                            <div className="pt-8 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={status.loading}
                                    className="flex-1 py-4 bg-primary text-background rounded-2xl font-display font-black text-sm transition-all shadow-xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {status.loading ? <FiLoader className="animate-spin text-xl" /> : <HiOutlineShieldCheck className="w-5 h-5" />}
                                    <span>Update Record</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-8 py-4 bg-surface-secondary text-text-primary rounded-2xl font-display font-bold text-sm hover:bg-surface-hover transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

