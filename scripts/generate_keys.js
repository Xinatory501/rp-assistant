#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET_SALT = 'AMAZING_RP_2026_SECURE_HMAC_SALT_KEYAUTH_XINATORY_9921';
const DURATION_XOR_MASK = 0x5D8A;

/**
 * Generates a cryptographically signed license key for RP Assistant
 * Supports:
 *  - 'LIFE' (Lifetime PRO)
 *  - '30' / '60' / '90' / '365' (Days PRO)
 */
function generateKey(duration = 'LIFE') {
  const durUpper = duration.toUpperCase();
  const isLifetime = durUpper === 'LIFE' || durUpper === 'LIFETIME' || durUpper === 'PERMANENT';
  const days = isLifetime ? 0x7FFF : (parseInt(duration, 10) || 30);

  // Block 1: Duration XOR encoded
  const b1Val = days ^ DURATION_XOR_MASK;
  const b1 = (b1Val & 0xFFFF).toString(16).padStart(4, '0').toUpperCase();

  // Block 2: Random Entropy
  const b2Val = crypto.randomBytes(2).readUInt16BE(0);
  const b2 = b2Val.toString(16).padStart(4, '0').toUpperCase();

  // Block 3: Checksum
  const b3Val = (((parseInt(b1, 16) * 31) + (parseInt(b2, 16) * 17)) & 0xFFFF);
  const b3 = b3Val.toString(16).padStart(4, '0').toUpperCase();

  // Block 4: HMAC-SHA256 Signature
  const base = `AMAZING-${b1}-${b2}-${b3}`;
  const hmac = crypto.createHmac('sha256', SECRET_SALT).update(base).digest('hex').toUpperCase();
  const b4 = hmac.substring(0, 4);

  return `AMAZING-${b1}-${b2}-${b3}-${b4}`;
}

/**
 * Also supports legacy readable format: AMAZING-PRO-LIFE-XXXX-SIG4
 */
function generateLegacyKey(duration = 'LIFE') {
  const durTag = (duration === 'lifetime' || duration === 'LIFE') ? 'LIFE' : `${duration}D`;
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  const payload = `AMAZING-PRO-${durTag}-${rand}`;
  const hmac = crypto.createHmac('sha256', SECRET_SALT).update(payload).digest('hex').toUpperCase();
  const sig = hmac.substring(0, 4);
  return `${payload}-${sig}`;
}

const count = parseInt(process.argv[2] || '10', 10);
const duration = (process.argv[3] || 'LIFE').toUpperCase();

console.log(`\n🔑 Генерация ${count} валидных ключей RP Assistant [Тариф: ${duration}]:\n`);
console.log('='.repeat(55));

const keys = [];
for (let i = 0; i < count; i++) {
  const k = generateLegacyKey(duration);
  keys.push(k);
  console.log(`${(i + 1).toString().padStart(2, ' ')}. ${k}`);
}

console.log('='.repeat(55));

const outPath = path.join(__dirname, '..', 'generated_keys.txt');
fs.writeFileSync(outPath, keys.join('\n') + '\n', 'utf8');
console.log(`\n💾 Все ${count} ключей сохранены в файл: ${outPath}\n`);