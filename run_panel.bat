@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo AI Referral Bot control panel launcher
echo.
echo The control panel will run locally in this window.
echo Open http://localhost:3000 and press Start bot.
echo To stop the panel, press Ctrl+C, then confirm with Y if Windows asks.
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
echo Starting local control panel. Keep this window open.
echo.
call npm.cmd run panel

echo.
echo Panel stopped or crashed. Read the message above.
pause
