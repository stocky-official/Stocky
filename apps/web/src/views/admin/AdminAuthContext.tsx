'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export const ALLOWED_ADMIN_EMAIL = 'abdelrahman.m.abualola@gmail.com';

export interface AdminAuthContextValue {
  user: User | null;
  adminEmail: string;
  loading: boolean;
  isAuthorized: boolean;
  requiresSignIn: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [requiresSignIn, setRequiresSignIn] = useState(false);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setUser(null);
        setIsAuthorized(false);
        setRequiresSignIn(true);
        return;
      }

      setUser(currentUser);
      setRequiresSignIn(false);

      const userEmail = (currentUser.email || '').toLowerCase().trim();

      // Enforce strict single-email whitelist
      if (userEmail !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        setIsAuthorized(false);
        return;
      }

      // Verify active status in database platform_admins
      const { data: adminRecord } = await supabase
        .from('platform_admins')
        .select('auth_user_id, is_active')
        .eq('auth_user_id', currentUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!adminRecord) {
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    } catch (err) {
      console.error('Error verifying admin authorization:', err);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setIsAuthorized(false);
        setRequiresSignIn(true);
        setLoading(false);
      } else {
        checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthorized(false);
    setRequiresSignIn(true);
    router.push('/admin/login');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        adminEmail: ALLOWED_ADMIN_EMAIL,
        loading,
        isAuthorized,
        requiresSignIn,
        signOut,
        refresh: checkAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
