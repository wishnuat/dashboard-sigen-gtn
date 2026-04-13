import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SIGEN_BASE_URL = 'https://api-apac.sigencloud.com/openapi';
const USERNAME = process.env.SIGEN_USERNAME;
const PASSWORD = process.env.SIGEN_PASSWORD;

let accessToken = null;
let tokenExpiresAt = 0;
let lockUntil = 0; // Timestamp kapan boleh request lagi jika kena ban

/**
 * Get Access Token with Rate Limit Handling
 * Jika kena error 1201, kunci akses selama 5 menit
 */
export async function getAccessToken() {
  const now = Date.now();

  // 1. Cek apakah sedang dalam masa hukuman (lockout)
  if (now < lockUntil) {
    const waitSeconds = Math.ceil((lockUntil - now) / 1000);
    throw new Error(`RATE_LIMIT_LOCKED: Wait ${waitSeconds}s`);
  }

  // 2. Cek apakah token masih valid (ambil buffer 1 menit)
  if (accessToken && now < tokenExpiresAt - 60000) {
    return accessToken;
  }

  console.log('[Auth] Requesting new token...');

  try {
    const response = await axios.post(
      `${SIGEN_BASE_URL}/auth/login/password`,
      {
        username: USERNAME,
        password: PASSWORD,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const { code, msg, data } = response.data;

    if (code !== 0) {
      if (code === 1201) {
        // Kena rate limit saat login, kunci 5 menit
        lockUntil = Date.now() + 300000; 
        throw new Error(`Login failed: Access restriction (${msg}). Locked for 5m.`);
      }
      throw new Error(`Login failed: ${msg} (code: ${code})`);
    }

    // Handle double-encoded JSON string jika ada
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.error('[Auth] Failed to parse nested JSON', e);
      }
    }

    if (!parsedData || !parsedData.accessToken) {
      throw new Error('No access token in response');
    }

    accessToken = parsedData.accessToken;
    const expiresIn = parsedData.expiresIn || 43200; // Default 12 jam
    tokenExpiresAt = Date.now() + expiresIn * 1000;

    console.log('[Auth] Token acquired successfully');
    return accessToken;

  } catch (error) {
    if (error.message.includes('RATE_LIMIT_LOCKED')) {
      throw error; // Lempar ulang agar server tahu ini masalah timing
    }
    
    // Jika error network atau 1201, set lock
    if (error.response?.data?.code === 1201 || error.code === 'ECONNABORTED') {
      lockUntil = Date.now() + 300000;
      console.error('[Auth] Rate limit detected. Locking for 5 minutes.');
    }
    
    throw error;
  }
}

export function getLockStatus() {
  const now = Date.now();
  if (now < lockUntil) {
    return {
      isLocked: true,
      remainingSeconds: Math.ceil((lockUntil - now) / 1000)
    };
  }
  return { isLocked: false, remainingSeconds: 0 };
}