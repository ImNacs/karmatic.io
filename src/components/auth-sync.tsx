'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function AuthSync() {
  const { isSignedIn, isLoaded } = useUser();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    async function syncUser() {
      if (isLoaded && isSignedIn && !synced) {
        try {
          const response = await fetch('/api/auth/sync-user', {
            method: 'POST',
          });
          
          if (response.ok) {
            setSynced(true);
            console.log('User synced with database');
          }
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      }
    }

    syncUser();
  }, [isLoaded, isSignedIn, synced]);

  return null; // This component doesn't render anything
}