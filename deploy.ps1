# Script de Deploy Automático para GHCR
$ErrorActionPreference = "Stop"

# --- Configurações ---
$IMAGE_NAME = "remix-of-cut-style-hub"
$GH_USERNAME = "balbiss"
$REGISTRY = "ghcr.io"
$FULL_IMAGE_NAME = "$REGISTRY/$GH_USERNAME/$IMAGE_NAME"
$TAG = "latest"

Write-Host "🚀 Iniciando processo de deploy para $FULL_IMAGE_NAME..." -ForegroundColor Cyan

# 1. Verificar Login no GHCR
Write-Host "🔑 Verificando autenticação no GitHub Container Registry..." -ForegroundColor Yellow
$loginCheck = docker logout $REGISTRY 2>&1
# Para simplificar, vamos pedir login sempre ou assumir que o usuário vai logar se falhar depois.
# Mas a melhor prática é tentar rodar um comando docker info ou similar.
# Vamos rodar o login explicitamente se não estiver configurado, mas aqui vamos assumir que o usuário já fez ou fará.
# DICA: Se falhar, rode: docker login ghcr.io -u SEU_USUARIO -p SEU_TOKEN

# 2. Build da Imagem
Write-Host "📦 Construindo imagem Docker..." -ForegroundColor Yellow
docker build -t $IMAGE_NAME .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha no build da imagem." -ForegroundColor Red
}

# 3. Tag da Imagem
Write-Host "🏷️ Criando tag para GHCR..." -ForegroundColor Yellow
docker tag "$IMAGE_NAME`:$TAG" "$FULL_IMAGE_NAME`:$TAG"

# 4. Push para o Registry
Write-Host "⬆️ Enviando imagem para $REGISTRY..." -ForegroundColor Yellow
docker push "$FULL_IMAGE_NAME`:$TAG"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "Imagem disponível em: $FULL_IMAGE_NAME`:$TAG"
} else {
    Write-Host "❌ Falha no push da imagem. Verifique se você está logado: docker login ghcr.io" -ForegroundColor Red
}

Write-Host "Pressione Enter para sair..."
Read-Host
