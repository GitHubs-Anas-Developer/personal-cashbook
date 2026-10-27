import { Notification } from '../models/Notification.js';

export async function createNotification({
  userId,
  type,
  title,
  message,
  severity = 'info',
  data = {}
}) {
  try {
    return await Notification.create({
      userId,
      type,
      title,
      message,
      severity,
      data
    });
  } catch (error) {
    console.warn('[NotificationService] Failed to create notification:', error.message);
    return null;
  }
}

export async function getUserNotifications(userId, { limit = 20, unreadOnly = false } = {}) {
  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }
  return await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function markNotificationAsRead(userId, notificationId) {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
}

export async function markAllNotificationsAsRead(userId) {
  return await Notification.updateMany({ userId, isRead: false }, { isRead: true });
}
