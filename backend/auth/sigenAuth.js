import axios from 'axios';
import NodeCache from 'node-cache';

const TOKEN_CACHE_KEY = 'sigen_access_token';
const tokenCache = new NodeCache({ stdTTL: 42000 }); // 42000 seconds (slightly less than 12 hours)

/**
 * Get access token from Sigen API using username/password
 * POST https://api-apac.sigencloud.com/openapi/auth/login/password
 * @returns {Promise<string>} Access token
 */
export async function getAccessToken() {
  const cachedToken = tokenCache.get(TOKEN_CACHE_KEY);
  if (cachedToken) {
    console.log('[Auth] Using cached token');
    return cachedToken;
  }

  const username = process.env.SIGEN_USERNAME;
  const password = process.env.SIGEN_PASSWORD;

  if (!username || !password) {
    console.warn('[Auth] SIGEN_USERNAME or SIGEN_PASSWORD not configured, using mock mode');
    // Mock token for development/testing
    const mockToken = `mock_token_${Date.now()}`;
    tokenCache.set(TOKEN_CACHE_KEY, mockToken, 3600);
    return mockToken;
  }

  try {
    const response = await axios.post(
      'https://api-apac.sigencloud.com/openapi/auth/login/password',
      { 
        username: username,
        password: password
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    // Handle response structure - adjust based on actual API response
    const accessToken = data.accessToken || data.data?.accessToken || data.token;
    const expiresIn = data.expiresIn || data.data?.expiresIn || data.expires_in || 43200; // Default 12 hours
    
    if (!accessToken) {
      throw new Error('No access token in response');
    }
    
    // Cache token with TTL slightly less than expires_in
    const cacheTTL = Math.max(expiresIn - 300, 3600); // At least 1 hour
    tokenCache.set(TOKEN_CACHE_KEY, accessToken, cacheTTL);
    
    console.log('[Auth] New token acquired, expires in', expiresIn, 'seconds');
    return accessToken;
  } catch (error) {
    console.error('[Auth] Token request failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Clear token cache (useful for testing)
 */
export function clearTokenCache() {
  tokenCache.del(TOKEN_CACHE_KEY);
  console.log('[Auth] Token cache cleared');
}
