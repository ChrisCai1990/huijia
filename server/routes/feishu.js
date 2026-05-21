const express = require('express');
const router = express.Router();
const { getToken } = require('../services/feishuToken');
const config = require('../config');

// GET /api/feishu/status - Check if Feishu is configured and token works
router.get('/status', async (req, res) => {
  try {
    if (!config.isConfigured()) {
      return res.json({ configured: false, message: 'Feishu credentials not configured. Running in demo mode.' });
    }
    await getToken();
    res.json({ configured: true, message: 'Feishu connection OK' });
  } catch (err) {
    res.status(500).json({ configured: false, error: err.message });
  }
});

module.exports = router;
