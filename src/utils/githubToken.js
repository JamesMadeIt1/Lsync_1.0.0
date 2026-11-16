
const crypto = require('crypto');

const decryptGitHubToken = (encryptedValue) => {
  const key = Buffer.from(
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY || '',
    'hex'
  );

  if (key.length !== 32) {
    throw new Error('Invalid GitHub encryption key');
  }

  const parts = encryptedValue.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  if (iv.length !== 12 || authTag.length !== 16) {
    throw new Error('Invalid encrypted token');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
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
  decryptGitHubToken
};
