'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface SearchLimit {
  remaining: number;
  total: number;
  isAuthenticated: boolean;
  canSearch: boolean;
  loading: boolean;
}

export function useSearchLimit() {
  const { user, isLoaded } = useUser();
  const [limit, setLimit] = useState<SearchLimit>({
    remaining: 1,
    total: 1,
    isAuthenticated: false,
    canSearch: true,
    loading: true,
  });

  useEffect(() => {
    async function checkLimit() {
      if (!isLoaded) return;

      try {
        const response = await fetch('/api/search/check-limit');
        if (response.ok) {
          const data = await response.json();
          setLimit({
            ...data,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error checking search limit:', error);
        setLimit(prev => ({ ...prev, loading: false }));
      }
    }

    checkLimit();
  }, [user, isLoaded]);

  const refreshLimit = async () => {
    setLimit(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch('/api/search/check-limit');
      if (response.ok) {
        const data = await response.json();
        setLimit({
          ...data,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error refreshing search limit:', error);
      setLimit(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    ...limit,
    refreshLimit,
  };
}