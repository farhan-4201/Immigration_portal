'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiOutlineLockClosed, HiOutlineEnvelope } from 'react-icons/hi2';
import { FiLoader } from 'react-icons/fi';
import BackgroundArt from '@/components/BackgroundArt';
import { Suspense } from 'react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPath = '/';
  const callbackUrl = searchParams.get('callbackUrl') || defaultPath;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (callbackUrl.startsWith('/')) {
          window.location.href = callbackUrl;
        } else {
          router.push(callbackUrl);
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <BackgroundArt />

      {/* Subtle background vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      <div className="auth-card" style={{ zIndex: 10 }}>
        {/* Logo mark */}
        <div className="auth-logo" style={{ margin: '0 auto 32px' }}>
          <div className="auth-logo-inner" />
        </div>

        {/* Header */}
        <div className="auth-header">
          <h1 style={{ fontFamily: 'var(--font-display)' }}>Welcome Back</h1>
          <p style={{ fontFamily: 'var(--font-main)', color: 'var(--text-secondary)', fontSize: 14 }}>
            Sign in to your legal portal
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'rgba(192, 86, 106, 0.1)',
            border: '1px solid rgba(192, 86, 106, 0.2)',
            borderRadius: '10px',
            color: 'var(--error)',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeInUp 0.3s ease',
          }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="field-label">Email Address</label>
            <div className="input-container">
              <HiOutlineEnvelope className="input-icon" />
              <input
                type="email"
                required
                className="auth-input"
                placeholder="you@westburylaw.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="field-label">Password</label>
            <div className="input-container">
              <HiOutlineLockClosed className="input-icon" />
              <input
                type="password"
                required
                className="auth-input"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading ? (
              <FiLoader className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer note */}
        <p style={{
          marginTop: '28px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          opacity: 0.6,
        }}>
           Secure Access
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="auth-container">
        <div className="auth-card flex items-center justify-center">
          <FiLoader className="w-7 h-7 animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
