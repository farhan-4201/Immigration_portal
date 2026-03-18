'use client';

import { HiOutlineExclamationTriangle, HiOutlineXMark } from 'react-icons/hi2';
import { FiLoader } from 'react-icons/fi';
import { useState } from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    itemName: string;
}

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName }: DeleteConfirmationModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-surface-primary border border-border-primary rounded-[32px] shadow-2xl overflow-hidden animate-cardAppear">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <HiOutlineExclamationTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <h3 className="text-xl font-display font-black text-text-primary mb-2">Confirm Deletion</h3>
                    <p className="text-text-tertiary text-sm font-medium leading-relaxed">
                        Are you sure you want to delete the record for <span className="text-text-primary font-bold">"{itemName}"</span>? This action cannot be undone.
                    </p>
                </div>

                <div className="p-6 bg-surface-secondary/50 border-t border-border-primary flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 bg-surface-primary border border-border-primary text-text-primary rounded-xl font-display font-bold text-sm hover:bg-surface-hover transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 py-3 bg-red-500 text-white rounded-xl font-display font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <FiLoader className="animate-spin" /> : null}
                        Delete Record
                    </button>
                </div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                >
                    <HiOutlineXMark className="w-5 h-5 text-text-tertiary" />
                </button>
            </div>
        </div>
    );
}
