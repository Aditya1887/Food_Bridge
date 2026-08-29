import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const ADMIN_EMAILS = ['adsharma1887@gmail.com'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch or safely auto-populate profile from Supabase
  const fetchProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      setRole(null);
      return null;
    }

    const isMasterAdmin = ADMIN_EMAILS.includes((authUser.email || '').toLowerCase().trim());

    try {
      // 1. Try to fetch existing profile from public.profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && !error) {
        if (isMasterAdmin && data.role !== 'admin') {
          try {
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', authUser.id);
            data.role = 'admin';
          } catch (e) {
            console.warn('Auto admin elevation notice:', e.message);
          }
        }
        const effectiveRole = isMasterAdmin ? 'admin' : (data.role || authUser.user_metadata?.role || 'donor');
        setProfile({ ...data, role: effectiveRole });
        setRole(effectiveRole);
        return { ...data, role: effectiveRole };
      }

      // 2. Self-healing fallback: If profiles row does not exist yet, create it from auth metadata
      const defaultRole = isMasterAdmin ? 'admin' : (authUser.user_metadata?.role || 'donor');
      const defaultName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
      const defaultPhone = authUser.user_metadata?.phone || '';

      const newProfile = {
        id: authUser.id,
        full_name: defaultName,
        email: authUser.email,
        phone: defaultPhone,
        role: defaultRole,
        avatar_url: authUser.user_metadata?.avatar_url || '',
      };

      const { data: createdProfile } = await supabase
        .from('profiles')
        .upsert([newProfile])
        .select()
        .maybeSingle();

      const resolved = createdProfile || newProfile;
      const effectiveRole = isMasterAdmin ? 'admin' : (resolved.role || defaultRole);
      setProfile({ ...resolved, role: effectiveRole });
      setRole(effectiveRole);
      return { ...resolved, role: effectiveRole };
    } catch (err) {
      console.warn('AuthContext profile fetch notice:', err.message);
      const fallbackRole = isMasterAdmin ? 'admin' : (authUser.user_metadata?.role || 'donor');
      setRole(fallbackRole);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user);
          }
        }
      } catch (err) {
        console.warn('AuthContext initialization notice:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      const authUser = newSession?.user || null;
      setUser(authUser);

      if (authUser) {
        await fetchProfile(authUser);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // ── Real-time subscription for live user profile changes (verification, organization, avatar) ──
  useEffect(() => {
    if (!user?.id) return;

    const profileChannel = supabase
      .channel(`auth_profile_live_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new);
            if (payload.new.role) {
              setRole(payload.new.role);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user?.id]);

  // Login method
  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data?.user) {
      await fetchProfile(data.user);
    }
    return data;
  };

  // Signup method
  const signup = async ({ email, password, fullName, phone, role: selectedRole, avatarUrl }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
          role: selectedRole || 'donor',
          avatar_url: avatarUrl || '',
        },
      },
    });
    if (error) throw error;
    if (data?.user && data?.session) {
      await fetchProfile(data.user);
    }
    return data;
  };

  // Logout method
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout notice:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
    }
  };

  // Refresh profile data on demand
  const refreshProfile = async () => {
    if (user) {
      return await fetchProfile(user);
    }
    return null;
  };

  // Update avatar and refresh profile
  // Update avatar and refresh profile
  const updateAvatar = async (avatarUrl) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        return data;
      }

      // Update local profile state regardless
      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      return data;
    } catch (err) {
      console.warn('updateAvatar notice:', err.message);
      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      return null;
    }
  };

  // Update complete user profile information
  const updateUserProfile = async (updates) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        if (data.role) setRole(data.role);
        return data;
      }

      setProfile((prev) => prev ? { ...prev, ...updates } : prev);
      return data;
    } catch (err) {
      console.warn('updateUserProfile notice:', err.message);
      setProfile((prev) => prev ? { ...prev, ...updates } : prev);
      return null;
    }
  };

  const value = {
    user,
    session,
    profile,
    role: role || profile?.role || user?.user_metadata?.role || 'donor',
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshProfile,
    updateAvatar,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
