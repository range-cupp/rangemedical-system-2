// /pages/reset-password.js
// Public password reset page — employee sets new password after clicking email link
// Same styling as login page (centered card, Range logo, #f5f5f5 background)
// Range Medical System

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [success, setSuccess] = useState(false);

  // Verify the token on mount
  useEffect(() => {
    const { token, type } = router.query;
    if (!token || !type) {
      // Wait for query params to populate
      if (router.isReady) {
        setVerifying(false);
        setError('Invalid or missing reset link. Please request a new password reset.');
      }
      return;
    }

    async function verifyToken() {
      try {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        });

        if (verifyError) {
          console.error('Token verification error:', verifyError);
          setError('This reset link has expired or is invalid. Please request a new password reset.');
          setVerifying(false);
          return;
        }

        if (data?.session) {
          setVerified(true);
        } else {
          setError('Unable to verify reset link. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Something went wrong. Please try again.');
      }
      setVerifying(false);
    }

    verifyToken();
  }, [router.isReady, router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        setError('Failed to update password. Please try again.');
        setLoading(false);
        return;
      }

      // Sign out so they can log in fresh
      await supabase.auth.signOut();
      setSuccess(true);

      // Redirect to login after a moment
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      console.error('Reset error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password | Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={styles.page}>
        <div style={styles.card}>
          {/* Logo */}
          <div style={styles.logoWrap}>
            <img
              src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png"
              alt="Range Medical"
              style={styles.logoImg}
            />
            <div style={styles.logoSubtext}>Password Reset</div>
          </div>

          {/* Loading state */}
          {verifying && (
            <div style={styles.statusMessage}>
              <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>Verifying reset link...</p>
            </div>
          )}

          {/* Error state (invalid/expired token) */}
          {!verifying && !verified && !success && (
            <div>
              <div style={styles.error}>{error}</div>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <a href="/login" style={styles.link}>Back to Sign In</a>
              </div>
            </div>
          )}

          {/* Success state */}
          {success && (
            <div style={styles.statusMessage}>
              <div style={styles.successIcon}>&#10003;</div>
              <p style={{ color: '#16a34a', fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>
                Password updated successfully!
              </p>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                Redirecting to sign in...
              </p>
            </div>
          )}

          {/* Reset form */}
          {!verifying && verified && !success && (
            <form onSubmit={handleSubmit} style={styles.form}>
              {error && (
                <div style={styles.error}>{error}</div>
              )}

              <div style={styles.field}>
                <label style={styles.label}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoFocus
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
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
                {loading ? 'Updating...' : 'Set New Password'}
              </button>
            </form>
          )}

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
    borderRadius: '0',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoImg: {
    height: '110px',
    width: 'auto',
    marginBottom: '8px',
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
    borderRadius: '0',
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
    borderRadius: '0',
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
    borderRadius: '0',
    fontSize: '14px',
    textAlign: 'center',
  },
  statusMessage: {
    textAlign: 'center',
    padding: '20px 0',
  },
  successIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#dcfce7',
    color: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 auto 16px',
  },
  link: {
    color: '#111',
    fontSize: '14px',
    textDecoration: 'underline',
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
};
