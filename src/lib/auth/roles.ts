import type { Role } from '@/lib/types';

export type DBRole = 'student' | 'teacher' | 'admin';
export type DisplayRole = 'Officer' | 'Training Coordinator' | 'Administrator';

/**
 * Centralized role conversion helper mapping database legacy role strings
 * to user-facing SIH26101 terminology without breaking Supabase RLS.
 */
export function getDisplayRoleLabel(role?: Role | DBRole | string): DisplayRole {
  if (!role) return 'Officer';
  const norm = role.toLowerCase();
  if (norm === 'teacher' || norm === 'training_coordinator') return 'Training Coordinator';
  if (norm === 'admin' || norm === 'administrator') return 'Administrator';
  return 'Officer';
}

export function mapDisplayRoleToDBRole(displayRole: string): DBRole {
  const norm = displayRole.toLowerCase();
  if (norm.includes('coordinator') || norm === 'teacher') return 'teacher';
  if (norm.includes('admin')) return 'admin';
  return 'student';
}

