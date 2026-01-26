# Google OAuth Setup Guide

This guide explains how to configure Google OAuth 2.0 for the Exam Generator backend.

---

## 📋 Prerequisites

- Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## 🚀 Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `exam-generator` (or any name you prefer)
4. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "People API"
3. Click on it and press **Enable**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - **User Type**: External (for testing) or Internal (for organization)
   - **App name**: Exam Generator
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
   - **Scopes**: Add `userinfo.email` and `userinfo.profile`
   - **Test users** (if External): Add your Google account email
   - Click **Save and Continue**

4. Back to **Create OAuth client ID**:
   - **Application type**: Web application
   - **Name**: Exam Generator Backend
   - **Authorized JavaScript origins**:
     - `http://localhost:3001` (development)
     - `https://your-production-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3001/auth/google/callback` (development)
     - `https://your-production-domain.com/auth/google/callback` (production)
   - Click **Create**

5. **Copy the credentials**:
   - You'll see a popup with your **Client ID** and **Client Secret**
   - Copy both values (you'll need them for the `.env` file)

---

## 🔧 Configure Backend

1. Open `/backend/.env`
2. Replace the placeholder values:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

3. Restart the backend server:

```bash
cd backend
pnpm dev
```

---

## 🧪 Test Google OAuth

### Option 1: Manual Browser Test

1. Open your browser
2. Navigate to: `http://localhost:3001/auth/google`
3. You'll be redirected to Google's consent screen
4. Sign in with your Google account
5. Grant permissions
6. You'll be redirected back to `/auth/google/callback`
7. Check the JSON response with user info and JWT tokens

### Option 2: Using Swagger UI

1. Open: `http://localhost:3001/docs`
2. Find **GET /auth/google** endpoint
3. Click "Try it out" → "Execute"
4. You'll be redirected to Google
5. After authentication, check the response

### Expected Response

```json
{
  "user": {
    "id": "uuid",
    "email": "your-email@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER",
    "provider": "GOOGLE",
    "createdAt": "2026-01-26T...",
    "updatedAt": "2026-01-26T..."
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "message": "Google OAuth authentication successful"
}
