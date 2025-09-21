# Migration Guide: Authentication System Implementation

## Overview
This guide covers the migration from wallet-only authentication to a full user account system with automatic wallet generation and API key management.

## What's New

### 1. User Account System
- Users now create accounts with email/password
- Automatic wallet generation during registration
- API key generation for Pump.fun integration
- Encrypted wallet storage

### 2. Authentication Flow
```
Old: Connect Wallet → Chat
New: Sign Up/Login → Auto Wallet Generation → Chat
```

### 3. New Features
- **Account Creation**: Email/password registration
- **Wallet Import**: Import existing Solana wallets
- **API Key Management**: Automatic Pump.fun API key generation
- **Session Management**: JWT-based authentication
- **Protected Routes**: Secure access to chat and settings

## Migration Steps

### 1. Install Dependencies
```bash
cd backend
npm install bcrypt jsonwebtoken uuid @types/bcrypt @types/jsonwebtoken @types/uuid
```

### 2. Environment Variables
Add to your `.env` file:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
WALLET_ENCRYPTION_KEY=your-wallet-encryption-key-change-in-production
```

### 3. Database Setup
The system currently uses in-memory storage. For production, you'll need to:
- Set up a PostgreSQL/MySQL database
- Run migrations for the new tables
- Update the models to use the database

### 4. Test the System
1. Start the backend: `npm run dev:doppler`
2. Start the frontend: `npm run dev:doppler`
3. Navigate to `/auth` to test registration/login
4. Test wallet import functionality
5. Verify protected routes work correctly

## Breaking Changes
- **None** - All changes are backward compatible
- Existing wallet-only authentication still works
- Legacy middleware available for gradual migration

## New API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/import-wallet` - Import existing wallet
- `GET /api/auth/wallets` - Get user wallets
- `GET /api/auth/api-keys` - Get user API keys
- `GET /api/auth/verify` - Verify JWT token

### Updated Endpoints
- All existing endpoints now support JWT authentication
- Legacy wallet authentication still supported

## Frontend Changes

### New Pages
- `/auth` - Authentication page with tabs for register/login/import

### New Components
- `AuthContext` - Authentication state management
- `ProtectedRoute` - Route protection wrapper
- Updated `Navbar` - User menu and authentication status

### Updated Components
- All chat functionality now requires authentication
- Settings page accessible only to authenticated users
- History page accessible only to authenticated users

## Security Features

### 1. Password Security
- Bcrypt hashing with salt rounds
- Minimum 8 character password requirement
- Password confirmation on registration

### 2. Wallet Security
- Private keys encrypted before storage
- AES-256-CBC encryption
- Secure key generation

### 3. JWT Security
- 7-day token expiration
- Secure token verification
- Automatic logout on token expiry

## Testing Checklist

### Backend Testing
- [ ] User registration works
- [ ] User login works
- [ ] Wallet generation works
- [ ] Wallet import works
- [ ] API key generation works
- [ ] JWT token verification works
- [ ] Protected routes work
- [ ] Legacy auth still works

### Frontend Testing
- [ ] Auth page loads correctly
- [ ] Registration form works
- [ ] Login form works
- [ ] Wallet import works
- [ ] Protected routes redirect to auth
- [ ] User menu works
- [ ] Logout works
- [ ] Session persistence works

## Production Considerations

### 1. Database Migration
- Set up proper database
- Run migrations
- Update models to use database
- Add database connection pooling

### 2. Security Hardening
- Use strong JWT secrets
- Use strong encryption keys
- Enable HTTPS
- Add rate limiting
- Add input validation

### 3. Monitoring
- Add logging for auth events
- Monitor failed login attempts
- Track API key usage
- Monitor wallet generation

## Rollback Plan
If issues arise, you can:
1. Remove the auth routes from `app.ts`
2. Revert the navbar changes
3. Remove the protected route wrappers
4. The system will work as before

## Support
For issues or questions:
1. Check the PROJECT_LOGGER.md for recent changes
2. Review the authentication flow
3. Test with the provided endpoints
4. Check environment variables
