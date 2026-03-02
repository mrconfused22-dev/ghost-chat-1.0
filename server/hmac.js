const crypto = require('crypto');

function hmacHash(value) {
  const secret = process.env.HMAC_SECRET || 'fallback_secret';
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

module.exports = { hmacHash };