# Script para instalar Redis no Windows
# Execute como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalador do Redis - Post Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se WSL está instalado
Write-Host "Verificando WSL..." -ForegroundColor Yellow
$wslVersion = wsl --version 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ WSL está instalado!" -ForegroundColor Green
    
    # Verificar se tem distribuição instalada
    $distros = wsl --list --quiet
    
    if ($distros) {
        Write-Host "✓ Distribuição Linux encontrada: $distros" -ForegroundColor Green
        Write-Host ""
        Write-Host "Instalando Redis no WSL..." -ForegroundColor Yellow
        
        # Instalar Redis
        wsl sudo apt-get update
        wsl sudo apt-get install redis-server -y
        
        # Iniciar Redis
        wsl sudo service redis-server start
        
        # Testar
        Write-Host ""
        Write-Host "Testando Redis..." -ForegroundColor Yellow
        $result = wsl redis-cli ping
        
        if ($result -eq "PONG") {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  ✓ REDIS INSTALADO COM SUCESSO!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Para iniciar o Redis sempre que precisar:" -ForegroundColor Cyan
            Write-Host "  wsl sudo service redis-server start" -ForegroundColor White
        } else {
            Write-Host "✗ Erro ao testar Redis" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Nenhuma distribuição Linux instalada no WSL" -ForegroundColor Red
        Write-Host ""
        Write-Host "Instalando Ubuntu..." -ForegroundColor Yellow
        Write-Host "Isso pode demorar alguns minutos..." -ForegroundColor Yellow
        
        wsl --install Ubuntu-24.04
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "  Ubuntu instalado!" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
        Write-Host "1. Reinicie o computador" -ForegroundColor White
        Write-Host "2. Abra o Ubuntu (vai aparecer no menu Iniciar)" -ForegroundColor White
        Write-Host "3. Crie um usuário e senha" -ForegroundColor White
        Write-Host "4. Execute este script novamente" -ForegroundColor White
    }
} else {
    Write-Host "✗ WSL não está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instalando WSL..." -ForegroundColor Yellow
    
    wsl --install
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  WSL instalado!" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
    Write-Host "1. Reinicie o computador" -ForegroundColor White
    Write-Host "2. Execute este script novamente" -ForegroundColor White
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
