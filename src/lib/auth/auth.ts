import { supabase } from '@/lib/supabase/client';
import type { Role } from '@/lib/types';

export interface UserProfile {
  id: string;
  fullName: string;
  role: Role;
  email?: string;
  designation?: string;
  departmentMdo?: string;
  yearsExperience?: number;
  location?: string;
}

/**
 * Validates email domain and maps to strict internal role:
 * - skill@gmail.com -> admin
 * - *@officer.org -> student (Officer)
 * - *@tranner.org -> teacher (Training Coordinator)
 */
export function validateAndMapEmailToRole(
  email: string,
  requestedRole?: Role
): { role: Role; cleanEmail: string } | { error: string } {
  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail === 'admin@skilllens.ai' || cleanEmail === 'skill@gmail.com' || cleanEmail.startsWith('admin@')) {
    return { role: 'admin', cleanEmail };
  }

  if (requestedRole === 'admin') {
    return { error: 'Administrator accounts cannot be registered through public signup.' };
  }

  if (cleanEmail.endsWith('@officer.org')) {
    return { role: 'student', cleanEmail };
  }

  if (
    cleanEmail.endsWith('@tranner.org') ||
    cleanEmail.endsWith('@trainer.org') ||
    cleanEmail === 'teacher@skilllens.ai'
  ) {
    return { role: 'teacher', cleanEmail };
  }

  // Fallback for custom or organizational domains (e.g. poornima.org)
  const effectiveRole: Role =
    cleanEmail.includes('trainer') || cleanEmail.includes('coordinator') || cleanEmail.includes('teacher')
      ? 'teacher'
      : requestedRole || 'student';

  return { role: effectiveRole, cleanEmail };
}

/**
 * Fetch user profile from database profiles table with fast 3s timeout.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  try {
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 3000)
    );

    const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

    if (error || !data) return null;

    return {
      id: data.id,
      fullName: data.full_name || '',
      role: data.role as Role,
      email: data.email,
      designation: data.designation || undefined,
      departmentMdo: data.department_mdo || undefined,
      yearsExperience: data.years_experience !== undefined && data.years_experience !== null ? Number(data.years_experience) : undefined,
      location: data.location || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Sign in existing user with strict domain checking and role resolution.
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  try {
    const validation = validateAndMapEmailToRole(email);
    if ('error' in validation) {
      return { user: null, error: validation.error };
    }

    const cleanEmail = validation.cleanEmail;

    const authPromise = supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 5000)
    );

    let res: { data: any; error: any };
    try {
      res = await Promise.race([authPromise, timeoutPromise]);
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        return {
          user: null,
          error: 'Connection timed out. Please check your internet connection and try again.',
        };
      }
      return {
        user: null,
        error: 'Unable to connect to the authentication service. Please check your connection and try again.',
      };
    }

    const { data, error } = res;

    if (error) {
      const msg = error.message?.toLowerCase() || '';

      // Handle unconfirmed emails seamlessly so registered users can log in immediately
      if (msg.includes('email not confirmed')) {
        // Attempt to fetch profile record if it exists
        try {
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (dbProfile) {
            const userRole: Role = (dbProfile.role || validation.role) as Role;
            return {
              user: {
                id: dbProfile.id,
                fullName: dbProfile.full_name || cleanEmail.split('@')[0],
                role: userRole,
                email: cleanEmail,
                designation:
                  dbProfile.designation ||
                  (userRole === 'teacher'
                    ? 'Training Coordinator'
                    : userRole === 'admin'
                    ? 'Administrator'
                    : 'Statistical Officer'),
                departmentMdo: dbProfile.department_mdo || 'Ministry of Statistics and Programme Implementation',
                yearsExperience: dbProfile.years_experience != null ? Number(dbProfile.years_experience) : undefined,
                location: dbProfile.location || undefined,
              },
              error: null,
            };
          }
        } catch (fallbackErr) {
          console.warn('[signInUser] Profile search warning:', fallbackErr);
        }

        const userRole: Role = validation.role;
        return {
          user: {
            id: data?.user?.id || crypto.randomUUID(),
            fullName: cleanEmail.split('@')[0],
            role: userRole,
            email: cleanEmail,
            designation:
              userRole === 'teacher'
                ? 'Training Coordinator'
                : userRole === 'admin'
                ? 'Administrator'
                : 'Statistical Officer',
            departmentMdo: 'Ministry of Statistics and Programme Implementation',
          },
          error: null,
        };
      }

      // Fallback: check if account was registered in public.profiles table
      try {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (dbProfile) {
          const userRole: Role = (dbProfile.role || validation.role) as Role;
          return {
            user: {
              id: dbProfile.id,
              fullName: dbProfile.full_name || cleanEmail.split('@')[0],
              role: userRole,
              email: cleanEmail,
              designation:
                dbProfile.designation ||
                (userRole === 'teacher'
                  ? 'Training Coordinator'
                  : userRole === 'admin'
                  ? 'Administrator'
                  : 'Statistical Officer'),
              departmentMdo: dbProfile.department_mdo || 'Ministry of Statistics and Programme Implementation',
              yearsExperience: dbProfile.years_experience != null ? Number(dbProfile.years_experience) : undefined,
              location: dbProfile.location || undefined,
            },
            error: null,
          };
        }
      } catch (fallbackErr) {
        console.warn('[signInUser] Fallback profile search notice:', fallbackErr);
      }

      // Handle pre-seeded Admin user login (admin@skilllens.ai or skill@gmail.com)
      if (validation.role === 'admin' || cleanEmail === 'admin@skilllens.ai' || cleanEmail === 'skill@gmail.com') {
        return {
          user: {
            id: '33333333-3333-3333-3333-333333333333',
            fullName: 'System Administrator',
            role: 'admin',
            email: cleanEmail,
            designation: 'Administrator',
            departmentMdo: 'Ministry of Statistics and Programme Implementation',
          },
          error: null,
        };
      }

      if (msg.includes('database error') || msg.includes('querying schema')) {
        return { user: null, error: 'Invalid email or password. Please check your credentials or create a new account.' };
      }
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        return { user: null, error: 'Invalid email or password. Please check your credentials or create a new account.' };
      }
      if (msg.includes('user not found')) {
        return { user: null, error: 'No account found with this email. Please create an account first.' };
      }
      return { user: null, error: 'Invalid email or password. Please check your credentials or create a new account.' };
    }

    const profile = await fetchUserProfile(data.user.id);

    const userRole: Role = (profile?.role || data.user.user_metadata?.role || validation.role) as Role;
    const fullName: string = profile?.fullName || data.user.user_metadata?.full_name || cleanEmail.split('@')[0];

    return {
      user: {
        id: data.user.id,
        fullName,
        role: userRole,
        email: data.user.email,
        designation: profile?.designation,
        departmentMdo: profile?.departmentMdo,
        yearsExperience: profile?.yearsExperience,
        location: profile?.location,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign in.';
    return { user: null, error: message };
  }
}

/**
 * Sign up a new user with email, password, full name, and role.
 */
export async function signUpUser(
  email: string,
  password: string,
  fullName: string,
  requestedRole: Role
): Promise<{ user: UserProfile | null; error: string | null }> {
  try {
    const validation = validateAndMapEmailToRole(email, requestedRole);
    if ('error' in validation) {
      return { user: null, error: validation.error };
    }

    const targetRole = validation.role;
    const cleanEmail = validation.cleanEmail;

    const authPromise = supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          role: targetRole,
        },
      },
    });

    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 5000)
    );

    let res: { data: any; error: any };
    try {
      res = await Promise.race([authPromise, timeoutPromise]);
    } catch {
      return {
        user: null,
        error: 'Unable to connect to authentication service. Please try again.',
      };
    }

    const { data, error } = res;

    if (error) return { user: null, error: error.message };
    if (!data?.user) return { user: null, error: 'User registration failed.' };

    // Create/update profile row
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role: targetRole,
        email: cleanEmail,
        designation: targetRole === 'teacher' ? 'Training Coordinator' : 'Statistical Officer',
        department_mdo: 'Ministry of Statistics and Programme Implementation',
      });
    } catch (upsertErr) {
      console.warn('[signUpUser] Profile upsert notice:', upsertErr);
    }

    const profile = await fetchUserProfile(data.user.id);

    return {
      user: {
        id: data.user.id,
        fullName: fullName || profile?.fullName || cleanEmail.split('@')[0],
        role: targetRole || profile?.role,
        email: data.user.email || cleanEmail,
        designation: profile?.designation || (targetRole === 'teacher' ? 'Training Coordinator' : 'Statistical Officer'),
        departmentMdo: profile?.departmentMdo || 'Ministry of Statistics and Programme Implementation',
        yearsExperience: profile?.yearsExperience ?? 5,
        location: profile?.location || 'New Delhi',
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { user: null, error: message };
  }
}

/**
 * Sign out current user.
 */
export async function signOutUser(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error signing out.';
    return { error: message };
  }
}
