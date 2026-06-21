require('dotenv').config();
const express = require('express');

require('./bot');

const app = express();
const port = Number(process.env.PORT || 3000);
const keepAliveUrl = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || '';
const keepAliveEnabled = process.env.KEEP_ALIVE_ENABLED !== 'false';
const keepAliveIntervalMs = Number(process.env.KEEP_ALIVE_INTERVAL_MS || 5 * 60 * 1000);

function startKeepAlive() {
  if (!keepAliveEnabled || !keepAliveUrl || keepAliveUrl.includes('localhost')) {
    return;
  }

  const healthUrl = `${keepAliveUrl.replace(/\/$/, '')}/health`;

  setInterval(() => {
    fetch(healthUrl).catch((error) => {
      console.error('Keep-alive ping failed:', error.message);
    });
  }, keepAliveIntervalMs).unref?.();
}

app.get('/', (req, res) => {
  res.send('AI Referral Bot is running.');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Health server is running on port ${port}.`);
  startKeepAlive();
});
