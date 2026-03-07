#!/bin/sh
set -e

echo "📦 Installing dependencies..."
cd /app && pnpm install --filter=exam-generator-frontend...

cd /app/frontend
echo "🚀 Starting dev server..."
exec pnpm dev
