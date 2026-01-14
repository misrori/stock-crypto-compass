#!/bin/bash
set -e  # hiba esetén azonnal kilép

############################
# KONFIGURÁCIÓ
############################

SERVER_USER="root"
SERVER_HOST="193.188.192.13"
REMOTE_DIR="/var/www/goldhand"
LOCAL_PROJECT_DIR="/Users/misrori/codes/stock-crypto-compass"
LOCAL_BUILD_DIR=$LOCAL_PROJECT_DIR/dist

############################
# BUILD
############################

cd $LOCAL_PROJECT_DIR
echo "🔨 Build indul..."
npm run build

echo "✅ Build kész"

############################
# DEPLOY
############################

echo "🚀 Feltöltés indul..."

rsync -avz --delete \
  "$LOCAL_BUILD_DIR/" \
  "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/"

echo "✅ Deploy kész"

