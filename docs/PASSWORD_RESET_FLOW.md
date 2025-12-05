# Password Reset Flow - API Integration Guide

## Overview

The password reset feature allows users to reset their forgotten passwords via email. Admins can trigger password resets for any user in the system.

---

## Flow Overview

1. **Admin triggers reset** - Admin calls API to send reset email to user
2. **User receives email** - Email contains reset link with token
3. **User clicks link** - Opens reset password page with token in URL query parameter
4. **User submits new password** - Frontend calls API with token and new password
5. **Password is reset** - User must login with new password

---

## API Endpoints

### 1. Admin Triggers Password Reset (Protected - Admin Only)

**Endpoint:** `POST /users/:id/reset-password`

**Authentication:** Required (Admin role)

**Headers:**

```
Authorization: Bearer {admin_access_token}
Content-Type: application/json
```

**URL Parameters:**

- `id` (string, required) - The UUID of the user who needs password reset

**Request Example:**

```http
POST /api/users/550e8400-e29b-41d4-a716-446655440000/reset-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset link has been sent to your email"
}
```

**Error Responses:**

**400 Bad Request** - User cannot receive reset email:

```json
{
  "statusCode": 400,
  "message": "User account is deactivated or has no email address"
}
```

**401 Unauthorized** - Missing or invalid authentication:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Not an admin user:

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

**404 Not Found** - User does not exist:

```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

---

### 2. Reset Password with Token (Public)

**Endpoint:** `POST /users/reset-password`

**Authentication:** Not required (Public endpoint)

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "newPassword": "MyNewSecurePass123!"
}
```

**Body Parameters:**

- `token` (string, required) - 64-character reset token from email link
- `newPassword` (string, required) - New password meeting security requirements

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password."
}
```

**Error Responses:**

**400 Bad Request** - Invalid, expired, or used token:

```json
{
  "statusCode": 400,
  "message": "Invalid or expired reset token"
}
```

```json
{
  "statusCode": 400,
  "message": "This reset token has expired"
}
```

```json
{
  "statusCode": 400,
  "message": "This reset token has already been used"
}
```

**422 Unprocessable Entity** - Password validation failed:

```json
{
  "statusCode": 422,
  "message": [
    "newPassword must be longer than or equal to 8 characters",
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  ],
  "error": "Unprocessable Entity"
}
```

---

## Integration Flow

### Step 1: Extract Token from Email Link

When user receives reset email and clicks the reset button, they are redirected to:

```
https://aostp.akomapacargo.com/reset-password?token=a1b2c3d4e5f6g7h8i9j0...
```

Frontend should extract the `token` query parameter from the URL.

---

### Step 2: Submit Password Reset Request

Frontend makes API call with the token and new password:

**Request:**

```http
POST /api/users/reset-password
Content-Type: application/json

{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "newPassword": "MyNewSecurePass123!"
}
```

**Success Response:**

- Redirect user to login page
- Show success message: "Password reset successful! Please login with your new password."

**Error Response:**

- Display appropriate error message
- If token expired/used/invalid: Prompt user to request new reset link

---

## Frontend Implementation Notes

### Admin Panel Integration

Admin should trigger password reset by calling:

- `POST /users/{userId}/reset-password` with admin Bearer token
- Display success/error messages to admin
- User receives email with reset link

---

### Password Reset Page Requirements

1. **Extract Token:** Parse `token` query parameter from URL
2. **Password Form:**
   - New password input
   - Confirm password input (client-side validation)
   - Show/hide password toggle (optional)
3. **Validation:**
   - Minimum 8 characters
   - Contains uppercase, lowercase, and number
   - Passwords match
4. **Submit:** POST to `/users/reset-password` with token and newPassword
5. **Handle Response:**
   - Success → Redirect to login page
   - Error → Display appropriate error message

---

## Password Requirements

The backend enforces the following password requirements:

- **Minimum length:** 8 characters
- **Must contain:**
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)

**Example valid passwords:**

- `SecurePass123`
- `MyPassword99!`
- `Test1234Password`

**Example invalid passwords:**

- `short1` (too short)
- `nouppercase123` (no uppercase)
- `NOLOWERCASE123` (no lowercase)
- `NoNumbers` (no numbers)

---

## Error Handling

### Common Error Scenarios

| Error Type              | Status Code | Response Example                                                                                                                                                                            | Frontend Action                            |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Token Expired**       | 400         | `{"statusCode": 400, "message": "This reset token has expired"}`                                                                                                                            | Show message and link to request new reset |
| **Token Used**          | 400         | `{"statusCode": 400, "message": "This reset token has already been used"}`                                                                                                                  | Show message and link to request new reset |
| **Invalid Token**       | 400         | `{"statusCode": 400, "message": "Invalid or expired reset token"}`                                                                                                                          | Show message and link to login             |
| **Password Validation** | 422         | `{"statusCode": 422, "message": ["newPassword must be longer than or equal to 8 characters", "Password must contain at least one uppercase letter, one lowercase letter, and one number"]}` | Display validation messages                |
| **User Deactivated**    | 400         | `{"statusCode": 400, "message": "User account is deactivated or has no email address"}`                                                                                                     | Show error to admin                        |
| **User Not Found**      | 404         | `{"statusCode": 404, "message": "User not found"}`                                                                                                                                          | Show error to admin                        |

---

## Security Considerations

1. **Token Expiration:** Tokens expire after 1 hour
2. **One-Time Use:** Each token can only be used once
3. **Session Invalidation:** All existing sessions are logged out after password reset
4. **HTTPS Only:** Always use HTTPS for password reset pages
5. **No Token in Logs:** Never log the reset token
6. **Rate Limiting:** Consider implementing rate limiting on the reset endpoint

---

## User Flow Examples

### Scenario 1: Forgotten Password (User-initiated)

1. User clicks "Forgot Password" on login page
2. Admin receives request and triggers reset via admin panel
3. User receives email: "Reset Your Password - AOSTP Logistics"
4. User clicks "Reset Password" button in email
5. User is redirected to: `https://aostp.akomapacargo.com/reset-password?token=abc123...`
6. User enters new password (twice for confirmation)
7. User clicks "Reset Password"
8. Success! User is redirected to login page
9. User logs in with new password

### Scenario 2: Admin-initiated Reset

1. Admin views user in admin panel
2. Admin clicks "Send Password Reset" button
3. System sends reset email to user
4. Admin sees success message: "Password reset email sent"
5. User follows steps 4-9 from Scenario 1

---

## Important Notes

1. **Token Format:** 64-character hexadecimal string passed as URL query parameter
2. **Token Lifetime:** 1 hour from generation
3. **One-Time Use:** Token becomes invalid after successful password reset
4. **Public Endpoint:** `POST /users/reset-password` does NOT require authentication
5. **Protected Endpoint:** `POST /users/:id/reset-password` requires admin Bearer token
6. **Session Invalidation:** All user sessions are terminated after password reset
7. **Email Delivery:** Reset emails are sent asynchronously
8. **HTTPS Required:** Always use HTTPS for password reset pages in production

---

## Email Details

Reset email includes:

- **Subject:** "Reset Your Password - AOSTP Logistics"
- **Reset Link:** `{FRONTEND_URL}/reset-password?token={64-char-token}`
- **Expiration Warning:** 1 hour validity
- **Security Notice:** Ignore if not requested

---

## Environment Configuration

Backend requires `FRONTEND_URL` environment variable:

```env
FRONTEND_URL=https://aostp.akomapacargo.com
```

Used to generate reset link in email template.
