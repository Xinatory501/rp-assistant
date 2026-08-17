const crypto = require('crypto');

const SECRET_SALT = 'AMAZING_RP_2026_SECURE_HMAC_SALT_KEYAUTH_XINATORY_9921';
const DURATION_XOR_MASK = 0x5D8A;
const ADMIN_USER = 'xinatory';
const ADMIN_PASS = '111qqq111';

function generateEncryptedOpaqueKey(prefix = 'AMZ', days = -1) {
  // 1. Block 1: Encrypted duration
  const rawDur = (days === -1 || days >= 99999) ? 0x7FFF : (days & 0x7FFF);
  const b1Num = (rawDur ^ DURATION_XOR_MASK) & 0xFFFF;
  const b1 = b1Num.toString(16).padStart(4, '0').toUpperCase();

  // 2. Block 2: Random Nonce
  const b2Num = crypto.randomBytes(2).readUInt16BE(0);
  const b2 = b2Num.toString(16).padStart(4, '0').toUpperCase();

  // 3. Block 3: Checksum
  const b3Num = ((b1Num * 31) + (b2Num * 17)) & 0xFFFF;
  const b3 = b3Num.toString(16).padStart(4, '0').toUpperCase();

  // 4. Block 4: HMAC-SHA256 Signature
  const base = `${prefix}-${b1}-${b2}-${b3}`;
  const b4 = crypto.createHmac('sha256', SECRET_SALT)
    .update(base)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();

  return `${base}-${b4}`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) {}
  }
  body = body || {};

  const user = body.username || req.query.username;
  const pass = body.password || req.query.password;

  // Strict Server-Side Authentication
  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    return res.status(401).json({ success: false, message: '401 Unauthorized: Access Denied' });
  }

  const action = body.action || req.query.action || 'generate';

  if (action === 'login' || action === 'auth') {
    const token = crypto.createHmac('sha256', SECRET_SALT).update(`${ADMIN_USER}:${Date.now()}`).digest('hex');
    return res.status(200).json({
      success: true,
      message: 'System Authentication Successful',
      admin: ADMIN_USER,
      token: token,
      timestamp: new Date().toISOString()
    });
  }

  if (action === 'generate') {
    const count = Math.min(Math.max(parseInt(body.count || '1', 10), 1), 50);
    const prefix = (body.prefix || 'AMZ').trim().toUpperCase();
    const days = parseInt(body.days ?? '-1', 10);

    const generated = [];
    for (let i = 0; i < count; i++) {
      const key = generateEncryptedOpaqueKey(prefix, days);
      generated.push({
        key: key,
        days: days,
        isLifetime: days === -1,
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      keys: generated.map(g => g.key),
      details: generated
    });
  }

  return res.status(400).json({ success: false, message: 'Invalid Action Parameter' });
};

