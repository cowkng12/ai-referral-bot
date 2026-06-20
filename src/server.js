require('dotenv').config();
const express = require('express');

require('./bot');

const app = express();
const port = Number(process.env.PORT || 3000);

app.get('/', (req, res) => {
  res.send('AI Referral Bot is running.');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Health server is running on port ${port}.`);
});
