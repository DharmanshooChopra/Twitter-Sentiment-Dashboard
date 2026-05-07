@echo off
echo Starting Flask Backend...
start cmd /k "cd /d ""%~dp0"" && call .\.venv\Scripts\activate.bat && set PYTHONUTF8=1 && python app.py"

echo Starting React Frontend...
start cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Both servers are starting up!
