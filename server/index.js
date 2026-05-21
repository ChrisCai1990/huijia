require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');

const clientsRouter = require('./routes/clients');
const feishuRouter = require('./routes/feishu');
const docsRouter = require('./routes/docs');

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/clients', clientsRouter);
app.use('/api/feishu', feishuRouter);
app.use('/api/docs', docsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: config.isConfigured() ? 'feishu' : 'demo' });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`\n汇泽甲功 CRM Server running on port ${PORT}`);
  console.log(`Mode: ${config.isConfigured() ? '🔗 Feishu connected' : '🎭 Demo mode (no Feishu credentials)'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health\n`);
});
