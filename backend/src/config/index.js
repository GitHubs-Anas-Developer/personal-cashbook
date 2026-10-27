import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personal_cashbook',
  jwtSecret: process.env.JWT_SECRET || 'personal_cashbook_super_secret_jwt_key_2026_finance_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  sessionDurationDays: 30,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: 5 * 1024 * 1024, // 5MB receipt limit
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  
  // Financial Limits (in paise / minor units)
  // Max safe limit: 100 Crore INR = 100,000,000,000 paise (well within Number.MAX_SAFE_INTEGER = 9,007,199,254,740,991)
  maxAmountMinor: 100_000_000_000,
  minAmountMinor: 1, // at least 1 paisa / 1 cent

  currencies: {
    INR: { symbol: '₹', name: 'Indian Rupee', minorUnit: 100, decimals: 2 },
    USD: { symbol: '$', name: 'US Dollar', minorUnit: 100, decimals: 2 },
    EUR: { symbol: '€', name: 'Euro', minorUnit: 100, decimals: 2 },
    GBP: { symbol: '£', name: 'British Pound', minorUnit: 100, decimals: 2 },
    AED: { symbol: 'AED', name: 'UAE Dirham', minorUnit: 100, decimals: 2 },
    SGD: { symbol: 'S$', name: 'Singapore Dollar', minorUnit: 100, decimals: 2 },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', minorUnit: 100, decimals: 2 },
    AUD: { symbol: 'A$', name: 'Australian Dollar', minorUnit: 100, decimals: 2 },
    JPY: { symbol: '¥', name: 'Japanese Yen', minorUnit: 1, decimals: 0 }
  }
};
