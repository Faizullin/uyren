Write-Host "Running Simple Online Compiler Test" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

Set-Location $PSScriptRoot
python tests\simple.py

Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
