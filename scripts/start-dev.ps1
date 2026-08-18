# Starts the backend (FastAPI on :8002) and frontend (Next.js on :3000).
# Backend requires PYTHONPATH=repo root so `import telegram_layer.src.*` resolves.
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$py = Join-Path $backend ".venv\Scripts\python.exe"

function Ensure-Port($port, $name) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }
}

Write-Host "Starting backend on :8002 ..."
Ensure-Port 8002 "backend"
$env:PYTHONPATH = $root
Start-Process -FilePath $py -ArgumentList "-m","uvicorn","app.main:app","--host","127.0.0.1","--port","8002" -WorkingDirectory $backend -WindowStyle Hidden

Write-Host "Starting frontend on :3000 ..."
Ensure-Port 3000 "frontend"
Start-Process -FilePath "npx.cmd" -ArgumentList "next","start","-p","3000" -WorkingDirectory $frontend -WindowStyle Hidden

Start-Sleep -Seconds 14
$b = Get-NetTCPConnection -LocalPort 8002 -State Listen -ErrorAction SilentlyContinue
$f = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($b) { Write-Host "backend UP (PID $($b.OwningProcess))" } else { Write-Host "backend DOWN - check PYTHONPATH / venv" }
if ($f) { Write-Host "frontend UP (PID $($f.OwningProcess))" } else { Write-Host "frontend DOWN - rebuild with: npm run build" }
