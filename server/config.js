require('dotenv').config();

module.exports = {
  FEISHU_APP_ID: process.env.FEISHU_APP_ID || '',
  FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET || '',
  FEISHU_APP_TOKEN: process.env.FEISHU_APP_TOKEN || '',
  FEISHU_TABLE_ID: process.env.FEISHU_TABLE_ID || '',
  FEISHU_ROOT_FOLDER_TOKEN: process.env.FEISHU_ROOT_FOLDER_TOKEN || '',
  PORT: process.env.PORT || 3001,
  isConfigured: () => {
    return !!(
      process.env.FEISHU_APP_ID &&
      process.env.FEISHU_APP_SECRET &&
      process.env.FEISHU_APP_TOKEN &&
      process.env.FEISHU_TABLE_ID
    );
  }
};
