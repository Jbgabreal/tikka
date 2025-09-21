# Wallet Charging System Documentation

## Overview

This document explains how wallet charging works in the Solana AI Copilot Chatter application, including which wallets are charged for different types of transactions and how the system links wallets to operations.

## Current Wallet System Architecture

### 1. User Authentication & Wallet Management

#### User Account Structure
```typescript
interface User {
  id: string;           // Unique user ID
  email: string;        // User email
  passwordHash: string; // Encrypted password
  createdAt: Date;
  updatedAt: Date;
}
```

#### Wallet Structure
```typescript
interface Wallet {
  id: string;                    // Unique wallet ID
  userId: string;                // Owner user ID
  publicKey: string;             // Solana public key
  encryptedPrivateKey: string;   // Encrypted private key
  isImported: boolean;           // true = imported, false = generated
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Wallet Selection Logic

#### Default Wallet Selection
- **Primary**: First non-imported wallet (generated during registration)
- **Fallback**: First wallet in the list if no generated wallet exists
- **Auto-creation**: New wallet generated during user registration

#### Wallet Validation
- Balance checking before transactions
- Fee calculation and validation
- Sufficient funds verification

## Transaction Types & Wallet Charging

### 1. Token Creation Transactions

#### Which Wallet is Charged
- **User's Default Wallet** (generated or imported)
- **NOT** the API wallet or generated keypairs

#### Fee Structure
```typescript
interface TokenCreationFees {
  networkFee: 0.002005;    // Base network fee + creation fee
  priorityFee: 0.0005;     // Priority fee for faster processing
  totalFee: 0.002505;      // Total fees
  estimatedCost: amount + totalFee; // Total cost including amount
}
```

#### Process Flow
1. User initiates token creation
2. System gets user's default wallet
3. Validates wallet has sufficient balance
4. Calculates total cost (amount + fees)
5. Creates transaction using user's wallet public key
6. User signs transaction with their private key
7. Transaction is submitted to blockchain

### 2. Token Swap Transactions

#### Which Wallet is Charged
- **User's Default Wallet** (generated or imported)
- **NOT** the API wallet

#### Fee Structure
```typescript
interface TokenSwapFees {
  networkFee: 0.000005;    // Base network fee
  priorityFee: 0.0005;     // Priority fee
  totalFee: 0.000505;      // Total fees
  estimatedCost: amount + totalFee; // Total cost
}
```

#### Process Flow
1. User initiates token swap
2. System gets user's default wallet
3. Validates wallet has sufficient balance
4. Calculates swap amount + fees
5. Creates swap transaction using user's wallet
6. User signs transaction with their private key
7. Transaction is submitted to blockchain

### 3. Portfolio Queries

#### Which Wallet is Queried
- **User's Default Wallet** for balance and token holdings
- **All User Wallets** for comprehensive portfolio view

#### No Charging
- Portfolio queries are read-only
- No transaction fees
- No wallet charging

## Wallet Integration Points

### 1. Authentication Flow

```typescript
// User Registration
1. User creates account with email/password
2. System generates new Solana wallet
3. Wallet is encrypted and stored
4. User can import additional wallets

// User Login
1. User authenticates with email/password
2. System retrieves user's wallets
3. Default wallet is selected for transactions
```

### 2. Transaction Flow

```typescript
// Token Creation
1. User: "create token"
2. System: Gets user's default wallet
3. System: Validates balance
4. System: Shows wallet info and fees
5. User: "proceed"
6. System: Creates transaction with user's wallet
7. User: Signs transaction
8. System: Submits to blockchain

// Token Swap
1. User: "swap SOL to USDC"
2. System: Gets user's default wallet
3. System: Validates balance
4. System: Shows swap details and fees
5. User: "proceed"
6. System: Creates swap transaction
7. User: Signs transaction
8. System: Submits to blockchain
```

### 3. Balance Validation

```typescript
// Before any transaction
1. Get user's wallet balance
2. Calculate required amount + fees
3. Check if balance >= required amount
4. If insufficient: Show error with shortfall amount
5. If sufficient: Proceed with transaction
```

## Fee Calculation Details

### 1. Network Fees
- **Base Fee**: ~0.000005 SOL (5000 lamports)
- **Token Creation**: +0.002 SOL additional fee
- **Token Swap**: Standard base fee only

### 2. Priority Fees
- **Default**: 0.0005 SOL
- **Configurable**: Can be adjusted based on network conditions
- **Purpose**: Faster transaction processing

### 3. Total Cost Calculation
```typescript
totalCost = transactionAmount + networkFee + priorityFee
```

## Security Considerations

### 1. Private Key Management
- Private keys are encrypted before storage
- Keys are only decrypted for transaction signing
- No plaintext private key storage

### 2. Wallet Validation
- All wallets must belong to authenticated user
- Balance validation before transactions
- Sufficient funds verification

### 3. Transaction Signing
- User's private key is used for signing
- No server-side private key storage
- Client-side transaction signing

## Error Handling

### 1. Insufficient Balance
```typescript
if (!balanceCheck.sufficient) {
  throw new Error(
    `Insufficient balance. Need ${required} SOL, have ${current} SOL. ` +
    `Please add ${shortfall} SOL to your wallet.`
  );
}
```

### 2. Wallet Not Found
```typescript
if (!walletInfo) {
  throw new Error('No wallet found. Please create or import a wallet first.');
}
```

### 3. Invalid Wallet
```typescript
if (!walletBelongsToUser) {
  throw new Error('Wallet not found or does not belong to user');
}
```

## User Experience

### 1. Transaction Confirmation
Users see detailed information before confirming:
- Wallet address (truncated)
- Current balance
- Transaction amount
- Network fees
- Priority fees
- Total cost

### 2. Error Messages
Clear, actionable error messages:
- Specific shortfall amounts
- Instructions to add funds
- Alternative suggestions

### 3. Wallet Management
- View all wallets
- Check balances
- Import additional wallets
- Set default wallet

## API Integration

### 1. Pump.fun Integration
- Uses user's wallet for transaction signing
- No API wallet charging
- User pays all fees

### 2. Bonk.fun Integration
- Uses user's wallet for transaction signing
- No API wallet charging
- User pays all fees

### 3. Jupiter Integration
- Uses user's wallet for swap transactions
- No API wallet charging
- User pays all fees

## Summary

The wallet charging system ensures that:

1. **User Wallets are Charged**: All transactions use the user's authenticated wallet
2. **No API Wallet Charging**: The system doesn't charge API wallets for user transactions
3. **Transparent Fees**: Users see exactly what they're paying before confirming
4. **Balance Validation**: System checks sufficient funds before creating transactions
5. **Secure Signing**: User's private key is used for transaction signing
6. **Clear Error Handling**: Users get actionable feedback when issues occur

This system provides a secure, transparent, and user-friendly experience where users have full control over their wallets and transactions.
