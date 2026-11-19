const crypto = require('crypto');

const getEncryptionKey = (environmentVariable) => {
  const keyHex = process.env[environmentVariable] || '';

  if (!/^[0-9a-f]{64}$/i.test(keyHex)) {
    throw new Error(
      `${environmentVariable} must contain a 32-byte hexadecimal key`
    );
  }

  return Buffer.from(keyHex, 'hex');
};

const encryptToken = (token, environmentVariable) => {
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Token must be a non-empty string');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    getEncryptionKey(environmentVariable),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final()
  ]);

  return [
    iv.toString('hex'),
    cipher.getAuthTag().toString('hex'),
    encrypted.toString('hex')
  ].join(':');
};

const decryptToken = (encryptedValue, environmentVariable) => {
  if (typeof encryptedValue !== 'string') {
    throw new Error('Encrypted token must be a string');
  }

  const parts = encryptedValue.split(':');

  if (
    parts.length !== 3 ||
    parts.some((part) => !/^(?:[0-9a-f]{2})*$/i.test(part))
  ) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  if (
    iv.length !== 12 ||
    authTag.length !== 16 ||
    encrypted.length === 0
  ) {
    throw new Error('Invalid encrypted token');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(environmentVariable),
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
};

module.exports = {
  encryptToken,
  decryptToken
};
