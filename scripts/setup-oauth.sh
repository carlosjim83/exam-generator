#!/bin/bash

# OAuth Testing Setup Script
# This script guides you through setting up Google OAuth for local development

echo "🔐 Google OAuth Testing Setup"
echo "=============================="
echo ""
echo "Follow these steps to set up Google OAuth for localhost testing:"
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/credentials"
echo ""
echo "2. Click 'Create Credentials' → 'OAuth client ID'"
echo ""
echo "3. Application type: 'Web application'"
echo ""
echo "4. Name: 'ExamGen SaaS - Local Development'"
echo ""
echo "5. Authorized JavaScript origins:"
echo "   - http://localhost:3000"
echo "   - http://localhost:3001"
echo ""
echo "6. Authorized redirect URIs:"
echo "   - http://localhost:3001/auth/google/callback"
echo ""
echo "7. Click 'Create' and copy your credentials:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prompt for Client ID
read -p "📝 Paste your Client ID: " CLIENT_ID
echo ""

# Prompt for Client Secret
read -p "📝 Paste your Client Secret: " CLIENT_SECRET
echo ""

# Validate inputs
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Error: Both Client ID and Client Secret are required!"
    exit 1
fi

# Update .env file
ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    exit 1
fi

echo "✅ Updating $ENV_FILE..."
echo ""

# Backup original .env
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%s)"

# Update Google OAuth credentials using sed
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$CLIENT_ID|" "$ENV_FILE"
    sed -i '' "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$CLIENT_SECRET|" "$ENV_FILE"
else
    # Linux
    sed -i "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$CLIENT_ID|" "$ENV_FILE"
    sed -i "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$CLIENT_SECRET|" "$ENV_FILE"
fi

echo "✅ Credentials updated successfully!"
echo ""
echo "📋 Current configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "^GOOGLE_" "$ENV_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔄 Next steps:"
echo "1. Restart your backend server: cd backend && pnpm dev"
echo "2. Wait 5 minutes for Google changes to propagate"
echo "3. Test OAuth: http://localhost:3000/login → 'Sign in with Google'"
echo ""
echo "💾 Backup saved: $ENV_FILE.backup.$(date +%s)"
echo ""
