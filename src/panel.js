const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();
const express = require('express');

const app = express();
const port = Number(process.env.PANEL_PORT || 3000);
let botProcess = null;
const logs = [];

app.use(express.urlencoded({ extended: false }));

function addLog(message) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  logs.push(line);

  if (logs.length > 80) {
    logs.shift();
  }
}

function isBotRunning() {
  return Boolean(botProcess && !botProcess.killed && botProcess.exitCode === null);
}

function renderPage() {
  const running = isBotRunning();

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Referral Bot Panel</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; }
    main { width: min(760px, calc(100% - 32px)); margin: 40px auto; }
    .card { background: #111827; border: 1px solid #243244; border-radius: 18px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,.25); }
    h1 { margin: 0 0 8px; font-size: 28px; }
    p { color: #94a3b8; }
    .status { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: ${running ? '#064e3b' : '#4c1d1d'}; color: ${running ? '#bbf7d0' : '#fecaca'}; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: ${running ? '#22c55e' : '#ef4444'}; }
    form { display: inline-block; margin: 18px 8px 20px 0; }
    button { border: 0; border-radius: 12px; padding: 12px 18px; font-weight: 700; cursor: pointer; color: #0f172a; background: #38bdf8; }
    button.stop { background: #fb7185; }
    button:disabled { opacity: .45; cursor: not-allowed; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; min-height: 220px; padding: 16px; border-radius: 14px; background: #020617; color: #cbd5e1; }
    a { color: #7dd3fc; }
  </style>
</head>
<body>
  <main>
    <section class="card">
      <h1>Панель запуска бота</h1>
      <p>Локальная панель для простого старта и остановки Telegram-бота перед переносом на хостинг.</p>
      <div class="status"><span class="dot"></span>${running ? 'Бот запущен' : 'Бот остановлен'}</div>
      <div>
        <form method="post" action="/start"><button ${running ? 'disabled' : ''}>Запустить бота</button></form>
        <form method="post" action="/stop"><button class="stop" ${running ? '' : 'disabled'}>Остановить бота</button></form>
      </div>
      <p>После запуска проверь бота в Telegram. Панель открыта на <a href="http://localhost:${port}">localhost:${port}</a>.</p>
      <h2>Логи</h2>
      <pre>${logs.slice().reverse().join('\n') || 'Логов пока нет.'}</pre>
    </section>
  </main>
</body>
</html>`;
}

app.get('/', (req, res) => {
  res.send(renderPage());
});

app.post('/start', (req, res) => {
  if (isBotRunning()) {
    res.redirect('/');
    return;
  }

  botProcess = spawn(process.execPath, [path.join(__dirname, 'bot.js')], {
    cwd: path.join(__dirname, '..'),
    env: process.env
  });

  addLog('Bot process started.');

  botProcess.stdout.on('data', (data) => addLog(data.toString().trim()));
  botProcess.stderr.on('data', (data) => addLog(data.toString().trim()));
  botProcess.on('exit', (code, signal) => {
    addLog(`Bot process stopped. Code: ${code ?? 'none'}, signal: ${signal ?? 'none'}.`);
  });

  res.redirect('/');
});

app.post('/stop', (req, res) => {
  if (isBotRunning()) {
    botProcess.kill('SIGTERM');
    addLog('Stop signal sent.');
  }

  res.redirect('/');
});

const server = app.listen(port, () => {
  console.log(`Panel is running: http://localhost:${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Close the old panel or set another PANEL_PORT in .env.`);
    process.exit(1);
  }

  throw error;
});
