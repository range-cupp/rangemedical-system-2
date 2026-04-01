// pages/shop/index.js — Patient login for the vial shop
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ShopLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('shop_token');
    if (token) router.replace('/shop/catalog');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/shop/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('shop_token', data.token);
      localStorage.setItem('shop_patient', JSON.stringify(data.patient));
      router.push('/shop/catalog');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Range Medical</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 400, padding: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '40px 32px' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, margin: '0 0 4px', textAlign: 'center' }}>RANGE MEDICAL</h1>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 32px', textAlign: 'center' }}>Patient Login</p>

            <form onSubmit={handleLogin}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d1d1', borderRadius: 0, fontSize: 15, marginBottom: 16, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />

              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d1d1', borderRadius: 0, fontSize: 15, marginBottom: 24, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />

              {error && <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 16px' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: 14, background: '#171717', color: '#fff', border: 'none', borderRadius: 0, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20 }}>
            Need access? Contact us at (949) 997-3988
          </p>
        </div>
      </div>
    </>
  );
}
