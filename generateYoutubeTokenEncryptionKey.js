const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');

 process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY = key;

console.log(`YOUTUBE_TOKEN_ENCRYPTION_KEY=${key}`);
