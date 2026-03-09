// /pages/login.js
// Employee login page for Range Medical admin
// Clean branded login — email + password via Supabase Auth

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already logged in, redirect to admin
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/admin');
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Verify this user has an active employee record
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (!res.ok) {
        // Sign out if no employee record
        await supabase.auth.signOut();
        setError('No active employee account found for this email');
        setLoading(false);
        return;
      }

      // Redirect to admin dashboard
      router.push('/admin');

    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sign In | Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={styles.page}>
        <div style={styles.card}>
          {/* Logo */}
          <div style={styles.logoWrap}>
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="46" stroke="#111" strokeWidth="4" />
              <path d="M50 20 L50 80 M30 50 L70 50 M35 30 L65 70 M65 30 L35 70" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div style={styles.logoText}>RANGE</div>
            <div style={styles.logoSubtext}>Medical System</div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.error}>{error}</div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@range-medical.com"
                required
                autoFocus
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>Range Medical &middot; Newport Beach, CA</p>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 800,
    letterSpacing: '4px',
    color: '#111',
    marginTop: '12px',
  },
  logoSubtext: {
    fontSize: '13px',
    color: '#888',
    marginTop: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#fafafa',
  },
  button: {
    padding: '14px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    background: '#111',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '14px',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
  },
  loadingText: {
    color: '#666',
    fontSize: '16px',
  },
};
