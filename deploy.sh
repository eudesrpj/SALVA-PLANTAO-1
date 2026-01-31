#!/bin/bash
# Deploy script para Salva Plantão no Cloud Run
# Uso: ./deploy.sh

set -e

PROJECT_ID="salva-plantao-prod1"
SERVICE_NAME="salva-plantao-prod"
REGION="southamerica-east1"
AR_REPO="salva-plantao"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE_NAME}:latest"

echo "🚀 Iniciando deploy para Cloud Run..."
echo "   Projeto: $PROJECT_ID"
echo "   Serviço: $SERVICE_NAME"
echo "   Região: $REGION"
echo "   Imagem: $IMAGE_NAME"

# Step 1: Build local (usando Docker via gcloud)
echo ""
echo "📦 Building Docker image..."
gcloud builds submit \
  --project=$PROJECT_ID \
  --config=cloudbuild.yaml

echo ""
echo "✅ Deploy concluído!"
echo "   Cloud Run Service: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
