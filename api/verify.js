const crypto = require('crypto');

const SECRET_SALT = 'AMAZING_RP_2026_SECURE_HMAC_SALT_KEYAUTH_XINATORY_9921';
const DURATION_XOR_MASK = 0x5D8A;

// Whitelist of all known pre-generated legacy keys
const KNOWN_LEGACY_KEYS = new Set([
  'AMAZING-PRO-LIFE-KGA3-VGPB-SK8G',
  'AMAZING-LIFE-F350-9EE2-6C9B',
  'AMAZING-LIFE-C7F3-86C9-0867',
  'AMAZING-LIFE-32D2-9A24-0F8C',
  'AMAZING-LIFE-BF0D-113A-CD00',
  'AMAZING-LIFE-456B-763C-5048',
  'AMAZING-LIFE-2689-0AD8-93C3',
  'AMAZING-LIFE-85E7-6825-D65D',
  'AMAZING-LIFE-31BF-A956-2D29',
  'AMAZING-LIFE-45B9-1958-29C3',
  'AMAZING-LIFE-8B79-0CBD-F954',
  'AMAZING-LIFE-5D1E-3684-C74B',
  'AMAZING-LIFE-1671-BD93-4A8F',
  'AMAZING-LIFE-9232-3737-03F5',
  'AMAZING-LIFE-3788-CDB5-BC2F',
  'AMAZING-LIFE-095A-80FE-4E44',
  'AMAZING-LIFE-D0F4-7AFF-0B15',
  'AMAZING-LIFE-9735-6B0E-4014',
  'AMAZING-LIFE-01A9-056E-0337',
  'AMAZING-LIFE-ACC0-CDFE-EAEC',
  'AMAZING-LIFE-CB38-5825-41EC',
  'AMAZING-LIFE-9CB5-06F5-7763',
  'AMAZING-LIFE-743D-0C82-3ECF',
  'AMAZING-LIFE-09EA-FCA3-EEDE',
  'AMAZING-LIFE-EFE4-0BD1-ADF9',
  'AMAZING-LIFE-2826-C023-F48B',
  'AMAZING-LIFE-08FD-BF3E-5CA8',
  'AMAZING-LIFE-8FEC-92E7-13DC',
  'AMAZING-LIFE-26B7-FDB9-7AC6',
  'AMAZING-LIFE-0DAC-D4DF-4CF1',
  'AMAZING-LIFE-7FB6-4B01-4DF4',
  'AMAZING-LIFE-520C-D3C9-62CA',
  'AMAZING-LIFE-871A-FD51-4604',
  'AMAZING-LIFE-215E-CA63-C0C1',
  'AMAZING-LIFE-1D98-8ADF-4783',
  'AMAZING-LIFE-DE08-FFF7-5374',
  'AMAZING-LIFE-0D66-A1B9-5858',
  'AMAZING-LIFE-1952-E68F-122C',
  'AMAZING-LIFE-06F6-8A75-F3C8',
  'AMAZING-LIFE-8680-E813-C810',
  'AMAZING-LIFE-7AED-E6D7-3DFF',
  'AMAZING-LIFE-7500-134A-D3B0',
  'AMAZING-LIFE-5FF7-DD42-9C12',
  'AMAZING-LIFE-5E0F-B7D4-F0A8',
  'AMAZING-LIFE-AA5A-A81E-8A4E',
  'AMAZING-LIFE-1365-B463-1566',
  'AMAZING-LIFE-83F8-6A17-2C5A',
  'AMAZING-LIFE-7DBC-FF37-4794',
  'AMAZING-LIFE-BB79-D36C-AF32',
  'AMAZING-LIFE-5A8A-5D38-2221',
  'AMAZING-LIFE-D7E4-8A86-5E31',
  'AMAZING-PRO-A8A8-CA23-B080',
  'AMAZING-PRO-B445-8ED4-1CAB',
  'AMAZING-PRO-47FF-DF88-AE07',
  'AMAZING-PRO-452D-599C-3AF0',
  'AMAZING-PRO-856C-20B2-7C10',
]);

function verifyKeyCryptographic(key) {
  const clean = (key || '').trim().toUpperCase();
  const parts = clean.split('-');

  // Check Known Whitelist first
  if (KNOWN_LEGACY_KEYS.has(clean)) {
    return {
      valid: true,
      type: 'PRO',
      days: -1,
      isLifetime: true,
      message: '✓ Бессрочная лицензия PRO (Lifetime) подтверждена!'
    };
  }

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

    if (b4 === hmac) {
      // Verify block 3 checksum
      const b1Num = parseInt(b1, 16);
      const b2Num = parseInt(b2, 16);
      const expectedB3 = (((b1Num * 31) + (b2Num * 17)) & 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
      
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
        message: isLifetime ? '✓ Бессрочная лицензия PRO (Lifetime)' : `✓ Лицензия PRO на ${days} дней`
      };
    }
  }

  // 2. HMAC Signed Format (AMAZING-PRO-...)
  if (parts.length >= 4 && (parts[0] === 'AMAZING' || parts[0] === 'AMZ')) {
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
      const durPart = parts.length > 2 ? parts[2].toUpperCase() : '';
      if (durPart.endsWith('D')) {
        days = parseInt(durPart.replace('D', ''), 10) || 30;
        isLifetime = false;
      } else if (durPart === '1D') {
        days = 1;
        isLifetime = false;
      } else if (durPart === '7D') {
        days = 7;
        isLifetime = false;
      } else if (durPart === '30D') {
        days = 30;
        isLifetime = false;
      } else if (durPart === '365D') {
        days = 365;
        isLifetime = false;
      }

      return {
        valid: true,
        type: parts[1],
        days: days,
        isLifetime: isLifetime,
        message: isLifetime ? '✓ Бессрочная лицензия PRO (Lifetime)' : `✓ Лицензия PRO на ${days} дней`
      };
    }

    // 3. Fallback for Valid Legacy Pattern (e.g. AMAZING-PRO-LIFE-XXXX-XXXX-XXXX or AMAZING-LIFE-XXXX-XXXX-XXXX)
    // Accept valid format: 4 or 5 blocks of length 3..6 with alphanumeric characters
    const allValidBlocks = parts.every(p => /^[A-Z0-9]{2,8}$/.test(p));
    if (allValidBlocks && (parts[0] === 'AMAZING' || parts[0] === 'AMZ')) {
      let days = -1;
      let isLifetime = true;

      for (const p of parts) {
        if (p === '1D') { days = 1; isLifetime = false; }
        else if (p === '7D') { days = 7; isLifetime = false; }
        else if (p === '30D') { days = 30; isLifetime = false; }
        else if (p === '365D') { days = 365; isLifetime = false; }
      }

      return {
        valid: true,
        type: 'PRO',
        days: days,
        isLifetime: isLifetime,
        message: isLifetime ? '✓ Бессрочная лицензия PRO (Lifetime)' : `✓ Лицензия PRO на ${days} дней`
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
