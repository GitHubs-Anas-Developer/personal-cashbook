import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Wallet } from '../models/Wallet.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { SavingsGoal } from '../models/SavingsGoal.js';
import { Debt } from '../models/Debt.js';
import { DebtPayment } from '../models/DebtPayment.js';
import { RecurringRule } from '../models/RecurringRule.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { config } from '../config/index.js';
import { seedDefaultWalletsForUser } from './walletService.js';
import { seedDefaultCategoriesForUser } from './categoryService.js';
import { logAuditEvent } from './auditService.js';

export async function registerUser({ name, email, password, currency = 'INR', timezone = 'Asia/Kolkata' }, clientInfo = {}) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('An account with this email address already exists.');
  }

  // Generate email verification token
  const rawVerificationToken = crypto.randomBytes(32).toString('hex');
  const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    isEmailVerified: true, // Set to true by default for frictionless demo/local experience, while preserving verification workflow
    emailVerificationToken: hashedVerificationToken,
    emailVerificationExpires: verificationExpires,
    preferences: {
      currency,
      timezone,
      language: 'en',
      theme: 'system'
    }
  });

  // Automatically seed initial wallets and categories
  await seedDefaultWalletsForUser(user._id, currency);
  await seedDefaultCategoriesForUser(user._id);

  // Create initial login session
  const token = jwt.sign({ userId: user._id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });

  const sessionExpires = new Date(Date.now() + config.sessionDurationDays * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    userId: user._id,
    token,
    userAgent: clientInfo.userAgent || 'Unknown',
    ipAddress: clientInfo.ipAddress || 'Unknown',
    deviceType: clientInfo.deviceType || 'desktop',
    expiresAt: sessionExpires
  });

  await logAuditEvent({
    userId: user._id,
    action: 'login',
    entityType: 'user',
    entityId: user._id,
    metadata: { reason: 'User registration & initial login' }
  });

  const userObj = user.toObject();
  delete userObj.password;

  return {
    user: userObj,
    token,
    sessionId: session._id,
    verificationToken: rawVerificationToken
  };
}

export async function loginUser({ email, password }, clientInfo = {}) {
  const user = await User.findOne({ email: email.toLowerCase(), status: 'active' }).select('+password');
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const token = jwt.sign({ userId: user._id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });

  const sessionExpires = new Date(Date.now() + config.sessionDurationDays * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    userId: user._id,
    token,
    userAgent: clientInfo.userAgent || 'Unknown',
    ipAddress: clientInfo.ipAddress || 'Unknown',
    deviceType: clientInfo.deviceType || 'desktop',
    expiresAt: sessionExpires
  });

  await logAuditEvent({
    userId: user._id,
    action: 'login',
    entityType: 'session',
    entityId: session._id,
    metadata: { ipAddress: clientInfo.ipAddress }
  });

  const userObj = user.toObject();
  delete userObj.password;

  return {
    user: userObj,
    token,
    sessionId: session._id
  };
}

export async function logoutUser(sessionToken) {
  if (sessionToken) {
    await Session.updateOne({ token: sessionToken }, { isRevoked: true });
  }
}

export async function revokeAllUserSessions(userId) {
  await Session.updateMany({ userId }, { isRevoked: true });
}

export async function verifyEmail(rawToken) {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new Error('Verification token is invalid or has expired.');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return { success: true, message: 'Email successfully verified.' };
}

export async function initiateForgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase(), status: 'active' });
  if (!user) {
    // For security reasons, don't reveal whether user exists
    return { success: true, message: 'If an account exists, a reset link has been dispatched.' };
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

  user.passwordResetToken = hashedResetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  return {
    success: true,
    message: 'If an account exists, a reset link has been dispatched.',
    resetToken: rawResetToken // Provided for dev preview / testing
  };
}

export async function resetPassword({ token: rawToken, password }) {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new Error('Password reset token is invalid or has expired.');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Revoke all existing sessions for security
  await Session.updateMany({ userId: user._id }, { isRevoked: true });

  await logAuditEvent({
    userId: user._id,
    action: 'password_change',
    entityType: 'user',
    entityId: user._id,
    metadata: { reason: 'Password reset via token' }
  });

  return { success: true, message: 'Password has been successfully updated.' };
}

export async function exportUserData(userId) {
  const [
    user,
    wallets,
    categories,
    transactions,
    budgets,
    savingsGoals,
    debts,
    debtPayments,
    recurringRules,
    auditLogs
  ] = await Promise.all([
    User.findById(userId).lean(),
    Wallet.find({ userId }).lean(),
    Category.find({ userId }).lean(),
    Transaction.find({ userId }).lean(),
    Budget.find({ userId }).lean(),
    SavingsGoal.find({ userId }).lean(),
    Debt.find({ userId }).lean(),
    DebtPayment.find({ userId }).lean(),
    RecurringRule.find({ userId }).lean(),
    AuditLog.find({ userId }).lean()
  ]);

  if (user) {
    delete user.password;
    delete user.emailVerificationToken;
    delete user.passwordResetToken;
  }

  return {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: {
      profile: user,
      wallets,
      categories,
      transactions,
      budgets,
      savingsGoals,
      debts,
      debtPayments,
      recurringRules,
      auditLogs
    }
  };
}

export async function deleteUserAccount(userId, password) {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Incorrect password. Account deletion cannot proceed.');
  }

  // Cascade deletion across all user-owned collections
  await Promise.all([
    Session.deleteMany({ userId }),
    Wallet.deleteMany({ userId }),
    Category.deleteMany({ userId }),
    Transaction.deleteMany({ userId }),
    Budget.deleteMany({ userId }),
    SavingsGoal.deleteMany({ userId }),
    Debt.deleteMany({ userId }),
    DebtPayment.deleteMany({ userId }),
    RecurringRule.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    AuditLog.deleteMany({ userId }),
    User.deleteOne({ _id: userId })
  ]);

  return { success: true, message: 'Account and all associated records permanently deleted.' };
}
