# Swagger/OpenAPI Documentation - Visual Guide

## 🎯 Access Point

**URL**: http://localhost:3001/docs

The API documentation is now live and interactive at `/docs`. Frontend developers can explore all endpoints, test them directly, and see request/response examples without needing Postman or curl.

---

## 📸 Swagger UI Overview

When you open `http://localhost:3001/docs` in your browser, you'll see:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Exam Generator API  v0.1.0                                         │
│  AI-powered exam generation platform with RAG                       │
│  (Retrieval-Augmented Generation)                                   │
│                                                                     │
│  📄 OpenAPI 3.1.0 Specification                                     │
│  📧 Contact: support@exam-generator.dev                             │
│  ⚖️  License: MIT                                                    │
│                                                                     │
│  🔐 Authorize: [JWT Bearer Token]                                   │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  📦 auth - Authentication endpoints                           │
│  ────────────────────────────────────────────────────────────│
│  ▼ POST /auth/register      Register new user                │
│  ▼ POST /auth/login         Login with credentials           │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  🔒 protected - Protected endpoints (require authentication)  │
│  ────────────────────────────────────────────────────────────│
│  ▼ GET /api/profile         Get user profile         🔐       │
│  ▼ GET /api/teacher/dashboard  Get teacher dashboard 🔐       │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  📁 documents - Document upload and management (coming soon)  │
│  ────────────────────────────────────────────────────────────│
│  (No endpoints yet)                                           │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  📝 exams - Exam generation and management (coming soon)      │
│  ────────────────────────────────────────────────────────────│
│  (No endpoints yet)                                           │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔍 Endpoint Detail View (Example: POST /auth/register)

When you click on an endpoint, you'll see:

```
┌──────────────────────────────────────────────────────────────────┐
│  POST /auth/register                                             │
│  Register new user                                               │
│  ────────────────────────────────────────────────────────────────│
│  Create a new user account with local authentication             │
│  (email/password). Returns user data and JWT tokens upon         │
│  successful registration.                                        │
│                                                                  │
│  [Try it out]                                                    │
│                                                                  │
│  Request Body (application/json) *required                       │
│  ────────────────────────────────────────────────────────────────│
│  {                                                               │
│    "email": "teacher@example.com",        ← example value       │
│    "password": "SecurePass123!",          ← min 8 characters    │
│    "firstName": "John",                                          │
│    "lastName": "Doe",                                            │
│    "role": "TEACHER"                      ← TEACHER | STUDENT   │
│  }                                                               │
│                                                                  │
│  Responses:                                                      │
│  ────────────────────────────────────────────────────────────────│
│  ✅ 201 Created                                                  │
│  {                                                               │
│    "user": {                                                     │
│      "id": "uuid",                                               │
│      "email": "teacher@example.com",                             │
│      "firstName": "John",                                        │
│      "lastName": "Doe",                                          │
│      "role": "TEACHER",                                          │
│      "provider": "LOCAL",                                        │
│      "createdAt": "2026-01-26T12:00:00Z",                        │
│      "updatedAt": "2026-01-26T12:00:00Z"                         │
│    },                                                            │
│    "accessToken": "eyJhbGc...",          ← 15 min TTL           │
│    "refreshToken": "eyJhbGc..."          ← 7 days TTL           │
│  }                                                               │
│                                                                  │
│  ❌ 400 Bad Request                                              │
│  {                                                               │
│    "statusCode": 400,                                            │
│    "error": "Bad Request",                                       │
│    "message": "Validation error message"                         │
│  }                                                               │
│                                                                  │
│  ❌ 409 Conflict                                                 │
│  {                                                               │
│    "statusCode": 409,                                            │
│    "error": "Conflict",                                          │
│    "message": "Email already exists"                             │
│  }                                                               │
│                                                                  │
│  [Execute] [Clear]                                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Using Protected Endpoints

### Step 1: Authenticate

1. Click on **POST /auth/login** or **POST /auth/register**
2. Click **"Try it out"**
3. Fill in the request body:
   ```json
   {
     "email": "teacher@example.com",
     "password": "password123"
   }
   ```
4. Click **Execute**
5. Copy the `accessToken` from the response

### Step 2: Authorize

1. Click the **🔐 Authorize** button at the top of the page
2. Paste your `accessToken` in the **bearerAuth** field:
   ```
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Click **Authorize**
4. Click **Close**

### Step 3: Access Protected Endpoints

Now all requests will automatically include the `Authorization: Bearer <token>` header.

Try **GET /api/profile**:
1. Click **Try it out**
2. Click **Execute**
3. You'll receive your user profile:
   ```json
   {
     "message": "Access granted",
     "user": {
       "userId": "uuid",
       "email": "teacher@example.com",
       "role": "TEACHER"
     }
   }
   ```

---

## 📋 Endpoint Summary

### Authentication Endpoints (No Auth Required)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Create new user account | ✅ Documented |
| POST | `/auth/login` | Login with email/password | ✅ Documented |
| POST | `/auth/refresh` | Renew access token | 🚧 Coming soon |
| POST | `/auth/logout` | Invalidate token | 🚧 Coming soon |

### Protected Endpoints (Auth Required)

| Method | Endpoint | Description | Roles | Status |
|--------|----------|-------------|-------|--------|
| GET | `/api/profile` | Get user profile | Any | ✅ Documented |
| GET | `/api/teacher/dashboard` | Teacher dashboard | TEACHER | ✅ Documented |

### System Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/` | API information | ✅ Documented |
| GET | `/health` | Health check | ✅ Documented |

---

## 🔧 Using Swagger for Frontend Development

### 1. Explore Available Endpoints
Browse all endpoints by tag (auth, protected, documents, exams).

### 2. Understand Request/Response Schemas
- See required vs optional fields
- View data types and validation rules
- Check examples for each field

### 3. Test Endpoints Directly
No need for Postman or curl:
- Fill in request body
- Execute the request
- See real responses from your backend

### 4. Generate Client SDKs (Future)
Swagger can auto-generate TypeScript/JavaScript clients:
```bash
npm install @openapitools/openapi-generator-cli
openapi-generator-cli generate -i http://localhost:3001/docs/json -g typescript-fetch -o ./src/api
```

This creates type-safe API client functions for your frontend.

---

## 📝 Schema Examples

### Register Request Body
```typescript
interface RegisterRequest {
  email: string;         // format: email, must be unique
  password: string;      // min length: 8
  firstName: string;     // min length: 1
  lastName: string;      // min length: 1
  role: "TEACHER" | "STUDENT";
}
```

### Login Request Body
```typescript
interface LoginRequest {
  email: string;         // format: email
  password: string;      // min length: 1
}
```

### Auth Response
```typescript
interface AuthResponse {
  user: {
    id: string;           // UUID
    email: string;
    firstName: string;
    lastName: string;
    role: "TEACHER" | "STUDENT";
    provider: "LOCAL" | "GOOGLE" | "GITHUB" | "MICROSOFT";
    createdAt: string;    // ISO 8601
    updatedAt: string;    // ISO 8601
  };
  accessToken: string;    // JWT (15 min TTL)
  refreshToken: string;   // JWT (7 days TTL)
}
```

### Error Response
```typescript
interface ErrorResponse {
  statusCode: number;     // HTTP status code
  error: string;          // Error name
  message: string;        // Human-readable message
}
```

---

## 🎨 Swagger UI Features

### Interactive Testing
- **Try it out**: Execute requests directly from the browser
- **Request body editor**: JSON editor with syntax highlighting
- **Response viewer**: Formatted JSON responses with status codes
- **cURL command**: Copy generated cURL command for CLI testing

### Documentation Features
- **Search**: Filter endpoints by name or tag
- **Collapse/Expand**: Organize view by hiding/showing endpoints
- **Dark mode**: Toggle between light/dark themes (in UI settings)
- **Deep linking**: Share direct links to specific endpoints

### Developer Tools
- **Download spec**: Download OpenAPI 3.1 JSON spec
- **Export**: Export as YAML or JSON
- **Validate**: Check spec compliance
- **Models**: View all schema definitions

---

## 🚀 Next Steps

### For Frontend Developers:
1. Open http://localhost:3001/docs
2. Test the auth flow:
   - Register a test account
   - Login with credentials
   - Copy accessToken
   - Authorize in Swagger
   - Test protected endpoints
3. Use the schemas to implement TypeScript interfaces
4. Build your API client based on the documented contracts

### For Backend Developers:
1. Add new endpoints → They auto-appear in Swagger
2. Update schemas → Documentation updates instantly
3. Add examples → Improves frontend understanding
4. Document errors → Frontend can handle them properly

---

## 📊 Coverage Status

| Category | Endpoints Documented | Status |
|----------|---------------------|--------|
| **Authentication** | 2/4 (50%) | 🟡 Partial |
| **Protected Routes** | 2/2 (100%) | ✅ Complete |
| **Documents** | 0/? | 🔴 Not Started |
| **Exams** | 0/? | 🔴 Not Started |
| **System** | 2/2 (100%) | ✅ Complete |
| **TOTAL** | 6/? | 🟡 In Progress |

---

## 🔥 Why This Matters

### Without Swagger:
- ❌ Frontend guesses request/response formats
- ❌ Postman collections get outdated
- ❌ Documentation is in separate docs (if exists)
- ❌ API changes break frontend silently
- ❌ "What does this endpoint return?" (Slack messages)

### With Swagger:
- ✅ **Single source of truth** for API contract
- ✅ **Always up-to-date** (generated from code)
- ✅ **Interactive testing** (no Postman needed)
- ✅ **Type-safe** (can generate TS types)
- ✅ **Self-service** (frontend can explore independently)

---

**The API is now a first-class citizen with professional documentation.** 🏆

Frontend can start development immediately without asking "how does this endpoint work?" every 5 minutes.
