import * as notificationService from '../services/notificationService.js';

export async function listNotifications(req, res, next) {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = parseInt(req.query.limit || '20', 10);
    const notifications = await notificationService.getUserNotifications(req.userId, { limit, unreadOnly });
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markNotificationAsRead(req.userId, req.params.id);
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllNotificationsAsRead(req.userId);
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
}
