'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { signInWithGoogle, signOutUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GoogleIcon } from '@stocky/icons';
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
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOutUser();
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
          <UserAvatar
            src={avatar}
            name={name}
            email={user.email}
            size="md"
            className="border border-stocky-border-default"
          />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-stocky-primary leading-tight">
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
          className="text-xs text-stocky-text-muted hover:text-stocky-status-critical-fg px-2 py-1"
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
      className="text-xs gap-2 border-stocky-border-default hover:border-stocky-primary"
    >
      <GoogleIcon size={14} />
      Sign in with Google
    </Button>
  );
}
