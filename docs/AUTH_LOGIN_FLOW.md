# Authentication Login Flow - Frontend Integration Guide

## Overview

This API implements a secure authentication system with:

1. **Two-factor authentication (2FA)** - Optional additional security layer
2. **Forced password change** - New users must change their temporary password on first login

When a user has 2FA enabled, the login process requires two steps. Additionally, newly created users will have limited access until they change their password.

## Login Flow

### Step 1: Initial Login Request

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

**Possible Responses:**

#### A) User WITHOUT 2FA Enabled (Standard Login)

**Status:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "15m",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "mustChangePassword": false
  }
}
```

**Action:**

- Check if `mustChangePassword` is `true` - if so, redirect to change password page
- Otherwise, store tokens and redirect to dashboard

#### B) User WITH 2FA Enabled (2FA Required)

**Status:** `200 OK`

```json
{
  "requiresTwoFactor": true,
  "message": "Two-factor authentication required",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Action:** Show 2FA token input form and proceed to Step 2.

#### C) Invalid Credentials

**Status:** `401 Unauthorized`

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Action:** Show error message to user.

#### D) Account Deactivated

**Status:** `401 Unauthorized`

```json
{
  "statusCode": 401,
  "message": "Account is deactivated"
}
```

**Action:** Show appropriate message to user.

---

### Step 2: Complete Login with 2FA Token

**Endpoint:** `POST /auth/login/2fa`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "userPassword123",
  "token": "123456"
}
```

**Success Response:**

**Status:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "15m",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "twoFactorEnabled": true
  }
}
```

**Action:** Store tokens and redirect to dashboard.

**Error Response:**

**Status:** `401 Unauthorized`

```json
{
  "statusCode": 401,
  "message": "Invalid 2FA token"
}
```

**Action:** Show error and allow user to re-enter token.

---

## Frontend Implementation Example

### React/TypeScript Example

```typescript
// types/auth.ts
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: string;
  user?: User;
  requiresTwoFactor?: boolean;
  message?: string;
  userId?: string;
}

interface TwoFactorLoginRequest extends LoginRequest {
  twoFactorToken: string;
}

// services/authService.ts
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};

export const loginWith2FA = async (credentials: TwoFactorLoginRequest): Promise<LoginResponse> => {
  const response = await fetch('/auth/login/2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '2FA verification failed');
  }

  return response.json();
};

// components/LoginForm.tsx
export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ email, password });

      if (result.requiresTwoFactor) {
        // User has 2FA enabled - show 2FA input
        setRequires2FA(true);
      } else if (result.accessToken) {
        // Standard login successful - store tokens
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginWith2FA({ email, password, twoFactorToken });

      if (result.accessToken) {
        // 2FA login successful - store tokens
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.message);
      setTwoFactorToken(''); // Clear invalid token
    } finally {
      setLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <form onSubmit={handleTwoFactorLogin}>
        <h2>Two-Factor Authentication</h2>
        <p>Enter the 6-digit code from your authenticator app</p>

        {error && <div className="error">{error}</div>}

        <input
          type="text"
          placeholder="000000"
          value={twoFactorToken}
          onChange={(e) => setTwoFactorToken(e.target.value)}
          maxLength={6}
          pattern="[0-9]{6}"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <button type="button" onClick={() => setRequires2FA(false)}>
          Back to Login
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleInitialLogin}>
      <h2>Login</h2>

      {error && <div className="error">{error}</div>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

---

## Token Management

### Storing Tokens

After successful login (either standard or 2FA), store the tokens securely:

```typescript
// Store in localStorage (simple but less secure)
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// OR store in httpOnly cookies (more secure) - requires backend support
// The API would set cookies automatically in the response
```

### Using Access Token

Include the access token in all authenticated requests:

```typescript
const makeAuthenticatedRequest = async (url: string) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};
```

### Refreshing Tokens

When the access token expires (401 Unauthorized), use the refresh token:

```typescript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // Refresh token invalid/expired - redirect to login
    localStorage.clear();
    window.location.href = '/login';
    return null;
  }

  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  return data.accessToken;
};
```

---

## Security Best Practices

1. **Never log tokens** to console or analytics
2. **Clear tokens on logout** completely
3. **Validate token format** before storing
4. **Handle token expiration** gracefully with refresh mechanism
5. **Use HTTPS only** in production
6. **Consider httpOnly cookies** for token storage instead of localStorage
7. **Implement rate limiting** on failed login attempts (frontend throttling)
8. **Clear sensitive form data** after successful login

---

## Testing Checklist

- [ ] Login without 2FA works correctly
- [ ] Login with 2FA shows token input
- [ ] Invalid credentials show appropriate error
- [ ] Invalid 2FA token shows appropriate error
- [ ] Tokens are stored correctly after successful login
- [ ] Access token is included in authenticated requests
- [ ] Token refresh works when access token expires
- [ ] Logout clears all stored tokens
- [ ] Deactivated account shows appropriate message
- [ ] Network errors are handled gracefully

---

## Additional Endpoints

### Get Current User

```
GET /auth/me
Authorization: Bearer {accessToken}
```

### Logout

```
POST /auth/logout
Authorization: Bearer {accessToken}
Body (optional): { "refreshToken": "..." }
```

### Logout All Devices

```
POST /auth/logout-all
Authorization: Bearer {accessToken}
```

### Change Password

```
POST /auth/change-password
Authorization: Bearer {accessToken}
Body: {
  "currentPassword": "oldPass123",
  "newPassword": "newPass456"
}
```

**Note:** This endpoint is accessible even when `mustChangePassword` is `true`.

---

## Forced Password Change Flow

### Overview

When an admin creates a new user, the user receives a welcome email with temporary credentials and **must change their password** before accessing any system features.

### How It Works

1. **User Creation**: Admin creates user → User receives welcome email with temporary password
2. **First Login**: User logs in with temporary credentials
3. **Limited Access**: User can only access:
   - `GET /auth/me` - View their profile
   - `POST /auth/change-password` - Change their password
   - Public endpoints
4. **Blocked Access**: All other protected endpoints return `403 Forbidden`
5. **Password Change**: User changes password → `mustChangePassword` flag is cleared
6. **Full Access**: User can now access all authorized endpoints

### Login Response with Password Change Required

When `mustChangePassword` is `true`, the login response includes this flag:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "mustChangePassword": true // ← Check this flag!
  }
}
```

### Handling 403 Forbidden Errors

If a user with `mustChangePassword: true` tries to access a protected endpoint:

**Response:**

```json
{
  "statusCode": 403,
  "message": "You must change your password before accessing this resource. Please use the change password endpoint."
}
```

**Frontend Action:**

- Intercept 403 errors
- Check if message contains "must change your password"
- Redirect to change password page
- Show appropriate notification

### Change Password Flow for New Users

```typescript
// 1. User logs in and sees mustChangePassword: true
if (loginResponse.user.mustChangePassword) {
  router.push('/change-password');
  showNotification('For security, please change your temporary password');
}

// 2. User changes password
await changePassword({
  currentPassword: 'TempPassword123', // From welcome email
  newPassword: 'MyNewSecurePass456',
});

// 3. Success response - all sessions invalidated
// User must login again with new password

// 4. Clear tokens and redirect to login
localStorage.clear();
router.push('/login');
showNotification(
  'Password changed successfully. Please login with your new password.',
);
```

### Implementation Example

```typescript
// API Interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const message = error.response.data.message;
      if (message?.includes('must change your password')) {
        router.push('/change-password');
        toast.warning('Please change your password to continue');
      }
    }
    return Promise.reject(error);
  },
);

// Route Guard
if (user.mustChangePassword && currentRoute !== '/change-password') {
  return router.push('/change-password');
}

// Login Handler
const handleLogin = async (credentials) => {
  const response = await login(credentials);

  // Check for 2FA
  if (response.requiresTwoFactor) {
    setShow2FAInput(true);
    return;
  }

  // Check for password change requirement
  if (response.user.mustChangePassword) {
    router.push('/change-password');
    toast.info('Please change your temporary password');
    return;
  }

  // Normal login flow
  storeTokens(response);
  router.push('/dashboard');
};
```
