const { decryptToken } = require('./tokenEncryption');

const decryptGitHubToken = (encryptedValue) => {
  return decryptToken(
    encryptedValue,
    'GITHUB_TOKEN_ENCRYPTION_KEY'
  );
};

module.exports = {
  decryptGitHubToken
};
