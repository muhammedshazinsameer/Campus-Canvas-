import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { syncGoogleUser, getStudentMe } from '../api/client';
import { supabase, isSupabaseConfigured } from '../api/supabaseClient';

const StudentAuthContext = createContext(null);

export function StudentAuthProvider({ children }) {
  const [studentUser, setStudentUser] = useState(null);
  const [studentToken, setStudentToken] = useState(localStorage.getItem('cc_student_token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState('student');
  const [oauthError, setOauthError] = useState(null);
  const isLoggingOut = useRef(false);

  // Helper to sync Supabase user with User table & manage session
  const handleSupabaseSession = async (session) => {
    if (!session?.user?.email) return;

    const email = session.user.email.toLowerCase().trim();

    // Fetch user row from public."User" table matching auth.users.id
    let userProfile = null;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('User')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!error && data) {
          userProfile = data;
        }
      } catch (profileErr) {
        console.warn('Error querying User profile from Supabase:', profileErr);
      }
    }

    const role = userProfile?.role || 'student';

    // 1. If not an editor, strictly enforce Yenepoya college email domain
    if (role !== 'editor' && !email.endsWith('@yenepoya.edu.in')) {
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      logout();
      setOauthError('Please sign in with your official Yenepoya college email (@yenepoya.edu.in).');
      setIsAuthModalOpen(true);
      return;
    }

    // 2. Extract profile metadata
    const userMeta = session.user.user_metadata || {};
    const name = userProfile?.name || userMeta.full_name || userMeta.name || email.split('@')[0];
    const avatarUrl = userProfile?.avatarUrl || userMeta.avatar_url || userMeta.picture || null;
    const campusId = userProfile?.campusId || (email.includes('@') ? email.split('@')[0] : null);

    // 3. Sync profile with backend (auto-provisions & issues unified JWT token for students and editors)
    try {
      const res = await syncGoogleUser({
        id: session.user.id, // Supabase auth.users UUID
        email,
        name,
        avatarUrl
      });

      if (res.token && res.user) {
        const syncedUser = {
          ...res.user,
          role: role === 'editor' ? 'editor' : (userProfile?.role || res.user.role || 'student')
        };
        localStorage.setItem('cc_student_token', res.token);
        localStorage.setItem('cc_student_user', JSON.stringify(syncedUser));
        setStudentToken(res.token);
        setStudentUser(syncedUser);
        setIsAuthModalOpen(false);
        setOauthError(null);
      }
    } catch (err) {
      console.error('Failed to sync profile with database:', err);
      if (role === 'editor') {
        const fallbackEditor = {
          id: session.user.id,
          email,
          name,
          role: 'editor',
          avatarUrl,
          campusId,
          createdAt: userProfile?.createdAt || session.user.created_at
        };
        localStorage.setItem('cc_student_token', session.access_token);
        localStorage.setItem('cc_student_user', JSON.stringify(fallbackEditor));
        setStudentToken(session.access_token);
        setStudentUser(fallbackEditor);
        setIsAuthModalOpen(false);
        setOauthError(null);
        return;
      }
      setOauthError(
        err.response?.data?.error ||
        err.message ||
        'Failed to sync student profile with database.'
      );
      setIsAuthModalOpen(true);
    }
  };

  useEffect(() => {
    let authListener = null;

    // Listen for 401 session expiration from API calls
    const handleAuthExpired = () => {
      logout();
      setOauthError('Your session has expired. Please sign in again.');
      setIsAuthModalOpen(true);
    };
    window.addEventListener('cc_auth_expired', handleAuthExpired);

    async function initAuth() {
      // 1. Restore local session if token & user exist
      const storedToken = localStorage.getItem('cc_student_token');
      const storedUser = localStorage.getItem('cc_student_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setStudentUser(parsed);
        } catch (_) {}
      }

      if (storedToken) {
        try {
          const data = await getStudentMe();
          if (data?.user) {
            setStudentUser((prev) => ({ ...prev, ...data.user }));
          }
        } catch (err) {
          // If token verification fails and no active supabase session, logout
          const { data: activeSession } = supabase ? await supabase.auth.getSession() : { data: {} };
          if (!activeSession?.session) {
            console.warn('Session verification failed, logging out:', err.message);
            logout();
          }
        }
      }

      // 2. Listen to Supabase Auth state changes (catches OAuth redirect, password login & token refresh)
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
              if (session?.user) {
                await handleSupabaseSession(session);
              }
            } else if (event === 'SIGNED_OUT') {
              localStorage.removeItem('cc_student_token');
              localStorage.removeItem('cc_student_user');
              setStudentToken(null);
              setStudentUser(null);
            }
          });
          authListener = data?.subscription;

          // Also check active session on initial load
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            await handleSupabaseSession(sessionData.session);
          }
        } catch (err) {
          console.error('Supabase auth listener initialization error:', err);
        }
      }

      setLoading(false);
    }

    initAuth();

    return () => {
      window.removeEventListener('cc_auth_expired', handleAuthExpired);
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  // Sign in with email and password via Supabase Auth & fetch User table role
  const signInWithPassword = async (email, password) => {
    setOauthError(null);
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase client is not fully configured. Please ensure VITE_SUPABASE_ANON_KEY is set in frontend/.env'
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      throw error;
    }

    if (data?.session && data?.user) {
      // 1. Fetch user's row from User table matching auth.users.id
      const { data: userProfile, error: profileError } = await supabase
        .from('User')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Could not fetch user profile from User table:', profileError.message);
      }

      const role = userProfile?.role || 'student';
      const emailLower = data.user.email.toLowerCase().trim();

      // 2. If student, enforce institutional email; editors are permitted
      if (role !== 'editor' && !emailLower.endsWith('@yenepoya.edu.in')) {
        await supabase.auth.signOut().catch(() => {});
        logout();
        throw new Error('Please sign in with your official Yenepoya college email (@yenepoya.edu.in).');
      }

      let userObject = {
        id: data.user.id,
        name: userProfile?.name || data.user.user_metadata?.name || emailLower.split('@')[0],
        email: emailLower,
        role: role,
        campusId: userProfile?.campusId || (emailLower.includes('@') ? emailLower.split('@')[0] : null),
        avatarUrl: userProfile?.avatarUrl || data.user.user_metadata?.avatar_url || null,
        createdAt: userProfile?.createdAt || data.user.created_at
      };

      // 3. Sync with backend to issue unified backend JWT and store state
      let activeToken = data.session.access_token;
      try {
        const syncRes = await syncGoogleUser({
          id: data.user.id,
          email: emailLower,
          name: userObject.name,
          avatarUrl: userObject.avatarUrl
        });
        if (syncRes?.token) {
          activeToken = syncRes.token;
          if (syncRes.user) {
            userObject = { ...userObject, ...syncRes.user, role: role === 'editor' ? 'editor' : (userProfile?.role || 'student') };
          }
        }
      } catch (syncErr) {
        console.warn('Backend sync warning on password login:', syncErr.message);
      }

      localStorage.setItem('cc_student_token', activeToken);
      localStorage.setItem('cc_student_user', JSON.stringify(userObject));
      setStudentToken(activeToken);
      setStudentUser(userObject);
      setIsAuthModalOpen(false);
      setOauthError(null);

      return userObject;
    }
  };

  // Trigger Supabase Google OAuth with Yenepoya hosted domain restriction
  const signInWithSupabaseGoogle = async () => {
    setOauthError(null);
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase client is not fully configured. Please ensure VITE_SUPABASE_ANON_KEY is set in frontend/.env'
      );
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: 'yenepoya.edu.in', // Instructs Google account picker to filter by college domain
          prompt: 'select_account'
        },
        redirectTo: window.location.origin
      }
    });

    if (error) {
      throw error;
    }
    return true;
  };

  const logout = async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    try {
      localStorage.removeItem('cc_student_token');
      localStorage.removeItem('cc_student_user');
      setStudentToken(null);
      setStudentUser(null);
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }
    } finally {
      isLoggingOut.current = false;
    }
  };

  const openAuthModal = (initialTab = 'student') => {
    setAuthModalInitialTab(initialTab);
    setOauthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setOauthError(null);
    setIsAuthModalOpen(false);
  };

  return (
    <StudentAuthContext.Provider
      value={{
        studentUser,
        studentToken,
        isAuthenticated: Boolean(studentToken && studentUser),
        loading,
        isAuthModalOpen,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal,
        oauthError,
        setOauthError,
        signInWithSupabaseGoogle,
        signInWithPassword,
        logout
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  return useContext(StudentAuthContext);
}
