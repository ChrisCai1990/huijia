const axios = require('axios');
const config = require('../config');

let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
  const now = Date.now();

  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const response = await axios.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      app_id: config.FEISHU_APP_ID,
      app_secret: config.FEISHU_APP_SECRET
    },
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  if (response.data.code !== 0) {
    throw new Error(`Failed to get Feishu token: ${response.data.msg}`);
  }

  cachedToken = response.data.tenant_access_token;
  // expire slightly before actual expiry (7200s - 60s buffer)
  tokenExpiry = now + (response.data.expire - 60) * 1000;

  return cachedToken;
}

module.exports = { getToken };
