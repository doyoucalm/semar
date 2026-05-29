/**
 * DiarySync — invisible component mounted at root layout.
 *
 * On first render:
 * 1. One-time migration: pushes any existing localStorage entries to /api/diary.
 * 2. Pulls remote entries missing from localStorage (cross-device sync).
 *
 * Silent — no UI. Fails gracefully if the API is unreachable.
 */

'use client';

import { useEffect } from 'react';
import { syncFromRemote, pushLocalToRemote } from '@/lib/diary-store';

const MIGRATED_KEY = 'semar-diary-migrated-v1';

export function DiarySync() {
  useEffect(() => {
    void (async () => {
      // One-time migration: push existing localStorage entries to server DB.
      if (!localStorage.getItem(MIGRATED_KEY)) {
        const { pushed } = await pushLocalToRemote();
        if (pushed > 0) {
          console.info(`[DiarySync] migrated ${pushed} local entries to server`);
        }
        localStorage.setItem(MIGRATED_KEY, '1');
      }

      // Pull any remote entries we're missing (other devices wrote them).
      const { added } = await syncFromRemote();
      if (added > 0) {
        console.info(`[DiarySync] pulled ${added} remote entries from server`);
      }
    })();
  }, []);

  return null;
}
