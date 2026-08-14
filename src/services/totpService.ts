/**
 * Standard RFC 6238 TOTP (Time-based One-Time Password) implementation
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, Apple Passwords, etc.
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Base32 decode helper
function base32Decode(base32: string): Uint8Array {
  const cleanBase32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  let index = 0;
  const bytes = new Uint8Array(Math.floor((cleanBase32.length * 5) / 8));

  for (let i = 0; i < cleanBase32.length; i++) {
    const val = BASE32_CHARS.indexOf(cleanBase32.charAt(i));
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return bytes;
}

// Generate HMAC-SHA1 using Web Crypto API
async function generateHOTP(secret: string, counter: number): Promise<string> {
  const keyBytes = base32Decode(secret);
  if (keyBytes.length === 0) {
    throw new Error('Invalid Base32 secret key');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  // Counter buffer (8 bytes big-endian)
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setBigUint64(0, BigInt(counter), false);

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hash = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

export const ADMIN_TOTP_STORAGE_KEY = 'las3yr_admin_totp_secret';
export const DEFAULT_ADMIN_SECRET = 'KRUGS4ZANFZSAYJAONSWG4TFOR2HI2DF'; // Base32 encoded standard key

export const totpService = {
  /**
   * Get the current active secret key
   */
  getSecret(): string {
    const stored = localStorage.getItem(ADMIN_TOTP_STORAGE_KEY);
    return stored || DEFAULT_ADMIN_SECRET;
  },

  /**
   * Set a custom secret key
   */
  setSecret(newSecret: string): void {
    const clean = newSecret.toUpperCase().replace(/[^A-Z2-7]/g, '');
    if (clean.length >= 16) {
      localStorage.setItem(ADMIN_TOTP_STORAGE_KEY, clean);
    }
  },

  /**
   * Generate an otpauth:// URI for QR Code scanning
   */
  getOtpAuthUri(email: string = 'admin@las3yr.com'): string {
    const secret = this.getSecret();
    const issuer = 'Las 3YR - Donde Enith';
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  },

  /**
   * Calculate current TOTP code
   */
  async getCurrentCode(): Promise<string> {
    const secret = this.getSecret();
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);
    return await generateHOTP(secret, counter);
  },

  /**
   * Get seconds remaining for the current 30s code cycle
   */
  getSecondsRemaining(): number {
    const epoch = Math.floor(Date.now() / 1000);
    return 30 - (epoch % 30);
  },

  /**
   * Verify a 6-digit TOTP code with time-drift tolerance (±1 step = ±30 seconds)
   */
  async verifyCode(inputCode: string): Promise<boolean> {
    const cleanCode = inputCode.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return false;
    }

    const secret = this.getSecret();
    const epoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / 30);

    // Check previous, current, and next 30-second windows for slight clock differences
    for (let delta = -1; delta <= 1; delta++) {
      try {
        const expected = await generateHOTP(secret, currentCounter + delta);
        if (expected === cleanCode) {
          return true;
        }
      } catch (err) {
        console.error('Error computing TOTP window:', err);
      }
    }

    return false;
  }
};
