@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo AI Referral Bot local launcher
echo.
echo The Telegram bot will run locally in this window via polling.
echo To stop the bot, press Ctrl+C, then confirm with Y if Windows asks.
echo.

if not exist ".env" (
  echo .env file was not found.
  echo Copy .env.example to .env and add BOT_TOKEN first.
  echo.
  pause
  exit /b 1
)

echo Installing dependencies if needed...
call npm.cmd install

echo.
echo Starting local bot. Keep this window open.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "npm.cmd start 2>&1 | Tee-Object -FilePath bot.log"

echo.
echo Bot stopped or crashed. Read the message above.
echo Last launch log was saved to bot.log.
pause
