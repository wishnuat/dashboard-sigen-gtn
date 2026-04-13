import axios from 'axios';
import NodeCache from 'node-cache';

const TOKEN_CACHE_KEY = 'sigen_oauth_token';
const tokenCache = new NodeCache({ stdTTL: 42000 }); // 42000 seconds (slightly less than 12 hours)

/**
 * Get OAuth2 token from Sigen API
 * @returns {Promise<string>} Access token
 */
export async function getAccessToken() {
  const cachedToken = tokenCache.get(TOKEN_CACHE_KEY);
  if (cachedToken) {
    console.log('[Auth] Using cached token');
    return cachedToken;
  }

  const appKey = process.env.SIGEN_APP_KEY;
  const appSecret = process.env.SIGEN_APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error('SIGEN_APP_KEY or SIGEN_APP_SECRET not configured');
  }

  // Base64 encode AppKey:AppSecret
  const credentials = Buffer.from(`${appKey}:${appSecret}`).toString('base64');

  try {
    const response = await axios.post(
      'https://api-apac.sigencloud.com/oauth/token',
      { key: credentials },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { access_token, expires_in } = response.data;
    
    // Cache token with TTL slightly less than expires_in
    const cacheTTL = Math.max(expires_in - 300, 3600); // At least 1 hour
    tokenCache.set(TOKEN_CACHE_KEY, access_token, cacheTTL);
    
    console.log('[Auth] New token acquired, expires in', expires_in, 'seconds');
    return access_token;
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
