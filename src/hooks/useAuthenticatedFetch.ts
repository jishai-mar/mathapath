import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to make authenticated fetch requests to edge functions.
 * Uses the user's JWT token instead of the anon key.
 */
export function useAuthenticatedFetch() {
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    return {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${session.access_token}`,
    };
  }, []);

  const authenticatedFetch = useCallback(async (
    functionName: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = await getAuthHeaders();
    
    return fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
      {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {}),
        },
      }
    );
  }, [getAuthHeaders]);

  return {
    getAuthHeaders,
    authenticatedFetch,
  };
}

/**
 * Standalone function to get auth headers for use outside of React components.
 * Returns null if user is not authenticated.
 */
export async function getAuthHeaders(): Promise<Record<string, string> | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    return null;
  }

  return {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'Authorization': `Bearer ${session.access_token}`,
  };
}

/**
 * Make an authenticated fetch request to an edge function.
 * Throws an error if user is not authenticated.
 */
export async function authenticatedFetch(
  functionName: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders();
  
  if (!headers) {
    throw new Error('Authentication required');
  }
  
  return fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    }
  );
}
