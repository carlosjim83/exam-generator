# Authentication Feature

Complete authentication system with JWT tokens, protected routes, and user session management.

## 📁 Structure

```
features/auth/
├── components/
│   ├── LoginForm.tsx          # Login page with email/password
│   ├── RegisterForm.tsx       # Registration page with validation
│   └── ProtectedRoute.tsx     # HOC to protect routes
├── context/
│   └── AuthContext.tsx        # React Context for auth state
├── services/
│   └── api.service.ts         # API client with JWT management
└── types/
    └── auth.types.ts          # TypeScript types for auth
```

## 🔐 Features

### ✅ JWT Authentication
- Access token (short-lived)
- Refresh token (long-lived)
- Automatic token refresh on expiration
- Secure token storage in localStorage

### ✅ Login & Registration
- Email/password authentication
- Client-side validation
- Server-side error handling
- Loading states
- Beautiful gradient UI

### ✅ Protected Routes
- Automatic redirect to `/login` if not authenticated
- Loading spinner while checking auth status
- Persistent sessions (survives page refresh)

### ✅ User Session Management
- Global auth state with React Context
- User profile accessible via `useAuth()` hook
- Logout functionality
- User dropdown menu with profile info

## 🚀 Usage

### Login Page

```tsx
// app/login/page.tsx
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return <LoginForm />;
}
```

### Register Page

```tsx
// app/register/page.tsx
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return <RegisterForm />;
}
```

### Protected Route

```tsx
// app/dashboard/page.tsx
'use client';

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <h1>Welcome, {user?.name}!</h1>
    </ProtectedRoute>
  );
}
```

### useAuth Hook

```tsx
'use client';

import { useAuth } from '@/features/auth/context/AuthContext';

export function MyComponent() {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <p>Hello, {user?.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🔌 API Integration

The auth feature connects to the Fastify backend running on `http://localhost:3001`.

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### API Endpoints Used

- `POST /auth/register` - Create new user
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh access token
- `GET /profile` - Get current user profile

### API Client

The `apiClient` can be used anywhere in the app:

```tsx
import { apiClient } from '@/features/auth/services/api.service';

// Login
const response = await apiClient.login('email@example.com', 'password');

// Register
const response = await apiClient.register('email@example.com', 'password', 'John Doe');

// Generic GET request (authenticated)
const data = await apiClient.get<MyType>('/some-endpoint');

// Generic POST request (authenticated)
const data = await apiClient.post<MyType>('/some-endpoint', { key: 'value' });
```

## 🎨 UI Components

### Login Form

- Email input with validation
- Password input
- Error alerts
- Loading states
- Link to registration page

### Register Form

- Full name input
- Email input with validation
- Password input (min 8 chars)
- Confirm password input
- Client-side validation
- Server-side error display
- Link to login page

### User Dropdown Menu

Located in the top navigation bar:
- User avatar with initials
- User name and email display
- "Profile Settings" link
- "Sign out" button

## 🔒 Security Features

1. **JWT Tokens**: Short-lived access tokens, refresh tokens for renewal
2. **HttpOnly Cookies**: Backend sets httpOnly cookies (optional)
3. **CSRF Protection**: Tokens stored client-side, sent via Authorization header
4. **Password Validation**: Minimum 8 characters required
5. **Protected Routes**: Automatic redirect for unauthenticated users

## 🧪 Testing the Flow

### 1. Start Backend

```bash
cd backend
pnpm dev  # Runs on http://localhost:3001
```

### 2. Start Frontend

```bash
cd frontend
pnpm dev  # Runs on http://localhost:3000
```

### 3. Test Registration

1. Go to http://localhost:3000
2. Click "Create one" (redirects to /register)
3. Fill in:
   - Name: Professor Jones
   - Email: jones@university.edu
   - Password: password123
   - Confirm Password: password123
4. Click "Create account"
5. **Expected**: Redirects to `/dashboard`, shows "Good morning, Professor Jones"

### 4. Test Login

1. Go to http://localhost:3000
2. Fill in credentials
3. Click "Sign in"
4. **Expected**: Redirects to `/dashboard`

### 5. Test Protected Route

1. While NOT logged in, try to go to http://localhost:3000/dashboard
2. **Expected**: Redirects to `/login`

### 6. Test Logout

1. While logged in, click user avatar in top-right
2. Click "Sign out"
3. **Expected**: Redirects to `/login`, tokens cleared

### 7. Test Persistent Session

1. Log in successfully
2. Refresh the page (F5)
3. **Expected**: Still logged in, no redirect

## 📊 Code Statistics

- **Files**: 7 TypeScript/TSX files
- **Lines of Code**: ~727 lines
- **Components**: 3 (LoginForm, RegisterForm, ProtectedRoute)
- **Services**: 1 (API client with token management)
- **Context**: 1 (AuthContext with provider)
- **Types**: 1 (Complete auth type definitions)

## 🛠️ Troubleshooting

### "Network error. Please try again."

**Cause**: Backend not running or wrong API URL

**Fix**: 
```bash
# Check backend is running
curl http://localhost:3001

# Check .env.local
cat frontend/.env.local  # Should have NEXT_PUBLIC_API_URL=http://localhost:3001
```

### "Invalid credentials"

**Cause**: Email/password mismatch

**Fix**: 
- Double-check email and password
- Use the registration form to create a new account first

### Dashboard redirects to login immediately

**Cause**: Token expired or invalid

**Fix**:
- Clear localStorage: `localStorage.clear()` in browser console
- Log in again

### "jwt malformed" error

**Cause**: Invalid JWT token format

**Fix**:
- Clear tokens: `localStorage.clear()`
- Backend might be using different JWT_SECRET

---

**Built with Screaming Architecture** - Everything auth-related is in `features/auth/` 🎯
