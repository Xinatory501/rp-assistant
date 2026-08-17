const crypto = require('crypto');

const SECRET_SALT = 'AMAZING_RP_2026_SECURE_HMAC_SALT_KEYAUTH_XINATORY_9921';

function verifyKeyCryptographic(key) {
  const clean = (key || '').trim().toUpperCase();
  // Format: AMAZING-{TYPE}-{DURATION}-{PAYLOAD}-{SIGNATURE}
  // Example: AMAZING-PRO-30D-A8F2-491B
  // Or Lifetime: AMAZING-LIFE-8E12-F9A0-3C4B
  const parts = clean.split('-');
  if (parts.length < 4 || parts[0] !== 'AMAZING') {
    return { valid: false, message: 'Неверный формат ключа' };
  }

  // Calculate HMAC of parts before the signature
  const payload = parts.slice(0, -1).join('-');
  const providedSig = parts[parts.length - 1];
  const hmac = crypto.createHmac('sha256', SECRET_SALT)
    .update(payload)
    .digest('hex')
    .substring(0, providedSig.length)
    .toUpperCase();

  if (providedSig !== hmac) {
    return { valid: false, message: 'Цифровая подпись ключа недействительна (ключ подделан)' };
  }

  // Extract duration
  let days = -1;
  let isLifetime = true;
  if (parts[2].endsWith('D')) {
    days = parseInt(parts[2].replace('D', ''), 10) || 30;
    isLifetime = false;
  } else if (parts[1] === 'LIFE' || parts[2] === 'LIFE') {
    isLifetime = true;
    days = -1;
  }

  return {
    valid: true,
    type: parts[1],
    days: days,
    isLifetime: isLifetime,
    message: isLifetime ? 'Бессрочная лицензия PRO (Lifetime)' : `Лицензия PRO на ${days} дней`
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let key = '';
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }
    key = body?.key || '';
  } else {
    key = req.query?.key || '';
  }

  if (!key) {
    return res.status(400).json({ success: false, message: 'Ключ не передан' });
  }

  const result = verifyKeyCryptographic(key);
  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.message });
  }

  const now = new Date();
  let expiryDate = 'Бессрочно';
  if (!result.isLifetime && result.days > 0) {
    const exp = new Date(now.getTime() + result.days * 24 * 60 * 60 * 1000);
    expiryDate = exp.toLocaleDateString('ru-RU');
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    subscription: `PRO ${result.isLifetime ? 'Lifetime' : `${result.days} Дней`}`,
    expiry: expiryDate,
    isLifetime: result.isLifetime,
    isPremium: true
  });
};
