import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';
const SALT = 'renderloop-encryption-salt-v1';
const PREFIX = 'enc:v1:';

let cachedKey = null;
function getKey() {
  if (cachedKey) return cachedKey;
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error('No ENCRYPTION_KEY or JWT_SECRET set for at-rest encryption');
  cachedKey = crypto.scryptSync(secret, SALT, 32);
  return cachedKey;
}

export function encrypt(plain) {
  if (plain == null || plain === '') return plain ?? null;
  if (typeof plain === 'string' && plain.startsWith(PREFIX)) return plain; // already encrypted
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

export function decrypt(token) {
  if (typeof token !== 'string' || !token.startsWith(PREFIX)) return token ?? null;
  try {
    const [, , body] = token.split(':');
    // token format: enc:v1:<iv>:<tag>:<ct>  → after splitting by ':' [0]=enc [1]=v1 [2]=iv [3]=tag [4]=ct
    const parts = token.split(':');
    const iv = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const ct = Buffer.from(parts[4], 'hex');
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
