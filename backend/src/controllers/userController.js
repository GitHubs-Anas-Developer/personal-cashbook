import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import * as authService from '../services/authService.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getProfile(req, res) {
  res.json({
    success: true,
    data: req.user
  });
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousState = user.toObject();

    if (req.body.name) user.name = req.body.name;
    if (req.body.preferences) {
      user.preferences = {
        ...user.preferences.toObject(),
        ...req.body.preferences
      };
    }

    await user.save();

    await logAuditEvent({
      userId: req.userId,
      action: 'update',
      entityType: 'user',
      entityId: req.userId,
      previousState,
      newState: user.toObject()
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    user.password = newPassword;
    await user.save();

    await logAuditEvent({
      userId: req.userId,
      action: 'password_change',
      entityType: 'user',
      entityId: req.userId
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function exportAllData(req, res, next) {
  try {
    const exportBundle = await authService.exportUserData(req.userId);
    const filename = `personal-cashbook-data-export-${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(exportBundle, null, 2));
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    const result = await authService.deleteUserAccount(req.userId, password);

    res.clearCookie('token');
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function listSessions(req, res, next) {
  try {
    const sessions = await Session.find({
      userId: req.userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    })
      .sort({ lastActiveAt: -1 })
      .lean();

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    await Session.findOneAndUpdate({ _id: sessionId, userId: req.userId }, { isRevoked: true });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    next(error);
  }
}
