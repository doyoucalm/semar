/**
 * Shared diary types — no 'use client' so they can be imported by both
 * client components (diary-store) and server API routes (convergence).
 */

export interface WebDiaryEntry {
  id: string;
  createdAt: string;
  localDate: string;
  kind: 'today' | 'cast' | 'note';
  question?: string;
  notes?: string;
  payload: Record<string, unknown>;
}
