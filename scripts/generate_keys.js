#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateKey(prefix = 'AMAZING', duration = 'LIFE') {
  const seg1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const seg2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const seg3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const durTag = duration === 'lifetime' ? 'LIFE' : duration.toUpperCase();
  return `${prefix}-${durTag}-${seg1}-${seg2}-${seg3}`;
}

const count = parseInt(process.argv[2] || '10', 10);
const duration = (process.argv[3] || 'LIFE').toUpperCase();
const prefix = (process.argv[4] || 'AMAZING-PRO').toUpperCase();

console.log(`\n🔑 Генерация ${count} ключей активации AmazingRP Assistant [Тариф: ${duration}]:\n`);
console.log('='.repeat(45));

const keys = [];
for (let i = 0; i < count; i++) {
  const k = generateKey(prefix, duration);
  keys.push(k);
  console.log(`${(i + 1).toString().padStart(2, ' ')}. ${k}`);
}

console.log('='.repeat(45));

const outPath = path.join(__dirname, '..', 'generated_keys.txt');
fs.writeFileSync(outPath, keys.join('\n') + '\n', 'utf8');
console.log(`\n💾 Ключи сохранены в файл: ${outPath}\n`);
