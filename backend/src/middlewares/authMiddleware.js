import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.'
      });
    }

    // Verify session in database
    const session = await Session.findOne({
      token: token,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session revoked or expired. Please log in again.'
      });
    }

    // Retrieve active user
    const user = await User.findOne({
      _id: decoded.userId,
      status: 'active'
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or has been deactivated.'
      });
    }

    // Background session touch (last active)
    session.lastActiveAt = new Date();
    session.save().catch(() => {});

    req.user = user;
    req.session = session;
    req.userId = user._id;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error: ' + error.message
    });
  }
}
