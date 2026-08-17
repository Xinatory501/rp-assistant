const crypto = require('crypto');

const SECRET_SALT = 'AMAZING_RP_2026_SECURE_HMAC_SALT_KEYAUTH_XINATORY_9921';
const ADMIN_USER = 'xinatory';
const ADMIN_PASS = '111qqq111';

function generateSignedKey(prefix = 'AMAZING-PRO', days = -1) {
  const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const durTag = days === -1 ? 'LIFE' : `${days}D`;
  const base = `${prefix}-${durTag}-${p1}`;
  const sig = crypto.createHmac('sha256', SECRET_SALT)
    .update(base)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();
  return `${base}-${sig}`;
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

  // Verify Admin Login Credentials
  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    return res.status(401).json({ success: false, message: 'Неверный логин или пароль администратора' });
  }

  const action = body.action || req.query.action || 'generate';

  if (action === 'login') {
    return res.status(200).json({
      success: true,
      message: 'Успешная авторизация администратора',
      admin: ADMIN_USER
    });
  }

  if (action === 'generate') {
    const count = Math.min(Math.max(parseInt(body.count || '1', 10), 1), 50);
    const prefix = (body.prefix || 'AMAZING-PRO').trim().toUpperCase();
    const days = parseInt(body.days ?? '-1', 10);

    const generated = [];
    for (let i = 0; i < count; i++) {
      generated.push({
        key: generateSignedKey(prefix, days),
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

  return res.status(400).json({ success: false, message: 'Неизвестное действие' });
};
