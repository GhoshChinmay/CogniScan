# CogniScan — Local Stack Starter (Fixed)
# ============================================================

$Root = $PSScriptRoot

# 1. Kill existing processes on ports 3000 and 8000 properly
echo "Cleaning up ports 3000 and 8000..."
Get-NetTCPConnection -LocalPort 3000, 8000 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

echo "Starting CogniScan Stack..."

# 2. Start Backend (FastAPI) on 127.0.0.1
echo "Launching Backend on http://127.0.0.1:8000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000 --host 127.0.0.1"

# 3. Start Frontend (Next.js) on 127.0.0.1
echo "Launching Frontend on http://127.0.0.1:3000..."
npx next dev -p 3000 -H 127.0.0.1
