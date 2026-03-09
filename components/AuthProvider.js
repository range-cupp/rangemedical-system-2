// /components/AuthProvider.js
// Client-side auth context for Range Medical admin
// Provides employee info + permissions to all admin pages

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Fetch employee profile from our API
  const fetchEmployee = useCallback(async (accessToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployee(data.employee);
      } else {
        setEmployee(null);
      }
    } catch {
      setEmployee(null);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.access_token) {
        fetchEmployee(s.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.access_token) {
        fetchEmployee(s.access_token);
      } else {
        setEmployee(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, [fetchEmployee]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmployee(null);
    setSession(null);
  };

  // Helper: check if employee has a specific permission
  const hasPermission = (permission) => {
    if (!employee) return false;
    if (employee.is_admin) return true;
    return employee.permissions?.[permission] === true;
  };

  return (
    <AuthContext.Provider
      value={{
        employee,
        session,
        loading,
        signOut,
        hasPermission,
        isAdmin: employee?.is_admin || false,
        isAuthenticated: !!employee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
