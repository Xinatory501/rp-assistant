const crypto = require('crypto');

const SECRET_SALT = 'AMAZING_RP_2026_SECURE_HMAC_SALT_KEYAUTH_XINATORY_9921';
const DURATION_XOR_MASK = 0x5D8A;

function verifyKeyCryptographic(key) {
  const clean = (key || '').trim().toUpperCase();
  const parts = clean.split('-');

  // 1. New Encrypted Opaque Format: AMZ-XXXX-XXXX-XXXX-XXXX
  if (parts.length === 5 && (parts[0] === 'AMZ' || parts[0] === 'AMAZING')) {
    const b1 = parts[1];
    const b2 = parts[2];
    const b3 = parts[3];
    const b4 = parts[4]; // Signature

    // Verify HMAC-SHA256 signature
    const base = `${parts[0]}-${b1}-${b2}-${b3}`;
    const hmac = crypto.createHmac('sha256', SECRET_SALT)
      .update(base)
      .digest('hex')
      .substring(0, 4)
      .toUpperCase();

    if (b4 !== hmac) {
      return { valid: false, message: 'Цифровая подпись ключа недействительна (ключ подделан)' };
    }

    // Verify block 3 checksum
    const b1Num = parseInt(b1, 16);
    const b2Num = parseInt(b2, 16);
    const expectedB3 = (((b1Num * 31) + (b2Num * 17)) & 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
    if (b3 !== expectedB3) {
      return { valid: false, message: 'Контрольная сумма зашифрованного ключа повреждена' };
    }

    // Decrypt duration
    const rawVal = b1Num ^ DURATION_XOR_MASK;
    let days = -1;
    let isLifetime = true;
    if (rawVal === 0x7FFF || rawVal === 0xFFFF) {
      isLifetime = true;
      days = -1;
    } else {
      days = rawVal;
      isLifetime = false;
    }

    return {
      valid: true,
      type: 'PRO',
      days: days,
      isLifetime: isLifetime,
      message: isLifetime ? 'Бессрочная лицензия PRO (Lifetime)' : `Лицензия PRO на ${days} дней`
    };
  }

  // 2. Legacy Format fallback (AMAZING-PRO-...)
  if (parts.length >= 4 && parts[0] === 'AMAZING') {
    const payload = parts.slice(0, -1).join('-');
    const providedSig = parts[parts.length - 1];
    const hmac = crypto.createHmac('sha256', SECRET_SALT)
      .update(payload)
      .digest('hex')
      .substring(0, providedSig.length)
      .toUpperCase();

    if (providedSig === hmac) {
      let days = -1;
      let isLifetime = true;
      if (parts[2].endsWith('D')) {
        days = parseInt(parts[2].replace('D', ''), 10) || 30;
        isLifetime = false;
      }
      return {
        valid: true,
        type: parts[1],
        days: days,
        isLifetime: isLifetime,
        message: isLifetime ? 'Бессрочная лицензия PRO (Lifetime)' : `Лицензия PRO на ${days} дней`
      };
    }
  }

  return { valid: false, message: 'Неверный или неподлинный лицензионный ключ' };
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
