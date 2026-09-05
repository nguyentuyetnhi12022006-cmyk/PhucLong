const Notification = require('../models/Notification');

// Get notifications for current user or admin
const getNotifications = async (req, res) => {
  try {
    const isForAdmin = req.query.target === 'admin' || req.user.role === 'admin';
    let query = {};

    if (isForAdmin && req.user.role === 'admin') {
      query = { recipient: 'admin' };
    } else {
      query = { userId: req.user._id, recipient: 'user' };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thông báo',
      error: error.message,
    });
  }
};

// Mark single notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Thông báo không tồn tại' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: 'Đã đánh dấu là đã đọc' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo', error: error.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const isForAdmin = req.query.target === 'admin' || req.user.role === 'admin';
    let query = {};

    if (isForAdmin && req.user.role === 'admin') {
      query = { recipient: 'admin', isRead: false };
    } else {
      query = { userId: req.user._id, recipient: 'user', isRead: false };
    }

    await Notification.updateMany(query, { isRead: true });

    res.json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo', error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
