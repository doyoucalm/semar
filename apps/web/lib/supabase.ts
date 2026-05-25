/**
 * Supabase client singleton.
 * Returns null when env vars are absent — diary gracefully falls back to
 * localStorage-only mode. Never throws.
 */

'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : null;

export const supabaseEnabled = supabase !== null;
