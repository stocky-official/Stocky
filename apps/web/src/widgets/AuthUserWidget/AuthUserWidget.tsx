'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SettingsIcon, CheckCircleIcon, ArrowUpDownIcon } from '@stocky/icons';
import type { User } from '@supabase/supabase-js';

export function AuthUserWidget() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-stocky-bg-subtle animate-pulse" />
    );
  }

  if (user) {
    const avatar = user.user_metadata?.avatar_url;
    const name = user.user_metadata?.full_name || user.email?.split('@')[0];

    return (
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-8 h-8 rounded-full border border-stocky-border-default object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-stocky-brand-primary text-white flex items-center justify-center text-xs font-bold">
              {name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-stocky-text-primary leading-tight">
              {name}
            </div>
            <div className="text-[10px] text-stocky-text-muted leading-tight truncate max-w-[120px]">
              {user.email}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-xs text-stocky-text-muted hover:text-red-400 px-2 py-1"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGoogleSignIn}
      className="text-xs gap-2 border-stocky-border-default hover:border-stocky-brand-primary"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      Sign in with Google
    </Button>
  );
}
