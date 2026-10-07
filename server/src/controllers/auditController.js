import { AuditLog, Notification } from '../models/AuditLog.js';

export const listAuditLogs = async (req, res) => {
  try {
    const { entityType, entityNumber, action, limit = 100 } = req.query;
    const query = {};
    if (entityType) query.entityType = entityType;
    if (entityNumber) query.entityNumber = entityNumber;
    if (action) query.action = action;

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(Number(limit));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(30);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
