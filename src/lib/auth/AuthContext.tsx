import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { fetchUserProfile, signInUser, signUpUser, signOutUser, type UserProfile } from './auth';
import type { Role } from '@/lib/types';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthContextValue {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: Role }>;
  signUp: (email: string, password: string, fullName: string, role: Role) => Promise<{ error: string | null; role?: Role }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);

        if (session?.user) {
          await loadUserProfile(session.user.id, session.user.user_metadata, session.user.email, false);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Initial auth session fetch error:', err);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      setSession(session);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        if (!user || user.id !== session.user.id) {
          await loadUserProfile(session.user.id, session.user.user_metadata, session.user.email, false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadUserProfile(
    userId: string,
    metadata?: Record<string, any>,
    email?: string,
    setGlobalLoading: boolean = false
  ) {
    try {
      if (setGlobalLoading) {
        setLoading(true);
      }
      const profile = await fetchUserProfile(userId);

      if (profile) {
        setUser({
          ...profile,
          email: email || profile.email,
        });
      } else {
        // Build grounded fallback from session user metadata so authenticated user is never left with null profile
        const fallbackRole: Role = (metadata?.role as Role) || 'student';
        const fallbackName: string = metadata?.full_name || metadata?.fullName || (email ? email.split('@')[0] : 'Statistical Officer');

        setUser({
          id: userId,
          fullName: fallbackName,
          role: fallbackRole,
          email: email,
          designation: metadata?.designation,
          departmentMdo: metadata?.department_mdo || metadata?.departmentMdo,
          yearsExperience: metadata?.years_experience != null ? Number(metadata.years_experience) : undefined,
          location: metadata?.location,
        });
      }
    } catch (err) {
      console.error('Error loading profile for authenticated user:', err);
      // Ensure user profile is populated from available metadata
      const fallbackRole: Role = (metadata?.role as Role) || 'student';
      setUser({
        id: userId,
        fullName: metadata?.full_name || (email ? email.split('@')[0] : 'Officer'),
        role: fallbackRole,
        email: email,
        designation: metadata?.designation,
        departmentMdo: metadata?.department_mdo || metadata?.departmentMdo,
        yearsExperience: metadata?.years_experience != null ? Number(metadata.years_experience) : undefined,
        location: metadata?.location,
      });
    } finally {
      if (setGlobalLoading) {
        setLoading(false);
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    const res = await signInUser(email, password);
    if (res.user) {
      setUser(res.user);
      return { error: null, role: res.user.role };
    }
    return { error: res.error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: Role) => {
    const res = await signUpUser(email, password, fullName, role);
    if (res.user) {
      setUser(res.user);
      return { error: null, role: res.user.role };
    }
    return { error: res.error };
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, initialized, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * Route protection wrapper.
 * Checks authentication and role access rules cleanly without circular redirects or blank screens.
 */
export function ProtectedRoute({ children, allowedRole }: { children: ReactNode; allowedRole?: Role }) {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-300">Authenticating SkillLens AI...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole) {
    const userRole = (user.role || 'student').toString().toLowerCase();
    const reqRole = allowedRole.toString().toLowerCase();

    const isOfficerUser = userRole === 'student' || userRole === 'officer';
    const isCoordinatorUser = userRole === 'teacher' || userRole === 'training_coordinator';
    const isAdminUser = userRole === 'admin';

    const reqOfficer = reqRole === 'student' || reqRole === 'officer';
    const reqCoordinator = reqRole === 'teacher' || reqRole === 'training_coordinator';
    const reqAdmin = reqRole === 'admin';

    const isMatch = (reqOfficer && isOfficerUser) || (reqCoordinator && isCoordinatorUser) || (reqAdmin && isAdminUser);

    if (!isMatch) {
      const redirectTarget = isAdminUser ? '/admin' : isCoordinatorUser ? '/teacher' : '/student';
      if (location.pathname === redirectTarget) {
        return <>{children}</>;
      }
      return <Navigate to={redirectTarget} replace />;
    }
  }

  return <>{children}</>;
}
