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

  // Determine if we are on the main management domain
  const isMainDomain = typeof window !== 'undefined' && (
    window.location.hostname === 'hrservices.me' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'admin.westburylaw.co.uk' ||
    window.location.hostname === 'portal.westburylaw.co.uk'
  );

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
        router.push(callbackUrl);
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

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-inner" />
        </div>

        <div className="auth-header">
          <h1>Welcome Back</h1>
        </div>

        {error && <div className="text-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-container">
              <HiOutlineEnvelope className="input-icon" />
              <input
                type="email"
                required
                className="auth-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <HiOutlineLockClosed className="input-icon" />
              <input
                type="password"
                required
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading ? <FiLoader className="w-5 h-5 animate-spin mx-auto" /> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="auth-container">
        <div className="auth-card flex items-center justify-center">
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

