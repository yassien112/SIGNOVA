$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $workspace 'frontend'
$backendDir = Join-Path $workspace 'backend'

$portsToRestart = 5000, 5173

foreach ($port in $portsToRestart) {
  $listeners = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
  foreach ($listener in $listeners) {
    Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}

Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$backendDir`" && node server.js" -WindowStyle Minimized
Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$frontendDir`" && npm run dev:lan -- --host 0.0.0.0 --port 5173" -WindowStyle Minimized

Write-Host 'Starting Signova local development servers...'
Write-Host 'Frontend: https://localhost:5173/'
Write-Host 'AI Camera: https://localhost:5173/ai-camera'
Write-Host 'Chat: https://localhost:5173/chat'
Write-Host 'Backend health: http://localhost:5000/api/health'
