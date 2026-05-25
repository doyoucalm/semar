/**
 * DiarySync — invisible component mounted at root layout.
 *
 * On first render:
 * 1. Pulls Supabase entries missing from localStorage (cross-device sync).
 * 2. On first-ever load with Supabase configured, also pushes any existing
 *    localStorage entries upstream (one-time migration).
 *
 * Silent — no UI. Fails gracefully if Supabase is unconfigured or offline.
 */

'use client';

import { useEffect } from 'react';
import { supabaseEnabled } from '@/lib/supabase';
import { syncFromSupabase, pushLocalToSupabase } from '@/lib/diary-store';

const MIGRATED_KEY = 'semar-diary-migrated-v1';

export function DiarySync() {
  useEffect(() => {
    if (!supabaseEnabled) return;

    void (async () => {
      // One-time migration: push existing localStorage entries to Supabase.
      if (!localStorage.getItem(MIGRATED_KEY)) {
        const { pushed } = await pushLocalToSupabase();
        if (pushed > 0) {
          console.info(`[DiarySync] migrated ${pushed} local entries to Supabase`);
        }
        localStorage.setItem(MIGRATED_KEY, '1');
      }

      // Pull any remote entries we're missing (other devices wrote them).
      const { added } = await syncFromSupabase();
      if (added > 0) {
        console.info(`[DiarySync] pulled ${added} remote entries from Supabase`);
      }
    })();
  }, []);

  return null;
}
