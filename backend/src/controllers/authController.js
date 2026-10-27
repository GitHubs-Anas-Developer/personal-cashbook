import * as authService from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceType: /mobile/i.test(req.headers['user-agent']) ? 'mobile' : 'desktop'
    };

    const result = await authService.registerUser(req.body, clientInfo);

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceType: /mobile/i.test(req.headers['user-agent']) ? 'mobile' : 'desktop'
    };

    const result = await authService.loginUser(req.body, clientInfo);

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);
    await authService.logoutUser(token);

    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    const result = await authService.verifyEmail(token);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.initiateForgotPassword(email);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res) {
  res.json({
    success: true,
    data: {
      user: req.user,
      session: {
        id: req.session._id,
        deviceType: req.session.deviceType,
        lastActiveAt: req.session.lastActiveAt
      }
    }
  });
}
