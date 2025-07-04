import { useAuthContext } from '@/context/auth-context';

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Hook for making authenticated API requests
 */
export function useAuthenticatedFetch() {
  const { getIdToken } = useAuthContext();

  const authenticatedFetch = async (url: string, options: ApiOptions = {}) => {
    const token = await getIdToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response;
  };

  return authenticatedFetch;
}

/**
 * Helper function for making authenticated API requests outside of React components
 */
export async function authenticatedFetch(
  url: string, 
  options: ApiOptions & { token?: string } = {}
) {
  const { token, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: fetchOptions.method || 'GET',
    headers,
  };

  if (fetchOptions.body) {
    config.body = JSON.stringify(fetchOptions.body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required');
    }
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response;
} 