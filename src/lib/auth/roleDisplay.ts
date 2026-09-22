import type { Role } from '@/lib/types';

/**
 * Single source of truth for user-facing role display labels.
 * Internal database roles remain 'student', 'teacher', 'admin' for RLS compatibility.
 */
export function getDisplayRole(role?: Role | string | null): string {
  if (!role) return 'Officer';
  const norm = role.toString().toLowerCase();
  
  if (norm === 'teacher' || norm === 'training_coordinator') {
    return 'Training Coordinator';
  }
  if (norm === 'admin' || norm === 'administrator') {
    return 'Administrator';
  }
  return 'Officer';
}
