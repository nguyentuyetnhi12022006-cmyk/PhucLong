const Message = require('../models/Message');
const User = require('../models/User');

// Send message
const sendMessage = async (req, res) => {
  try {
    const { text, targetUserId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
    }

    const isAdmin = req.user.role === 'admin';
    const userId = isAdmin ? targetUserId : req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Không xác định được ID người dùng' });
    }

    const message = await Message.create({
      userId,
      sender: isAdmin ? 'admin' : 'user',
      senderName: req.user.username || (isAdmin ? 'Cửa Hàng Phúc Long' : 'Khách Hàng'),
      text: text.trim(),
      isRead: false,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi gửi tin nhắn', error: error.message });
  }
};

// Get messages thread
const getMessages = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userId = isAdmin ? (req.params.userId || req.query.userId) : req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu ID người dùng' });
    }

    const messages = await Message.find({ userId }).sort({ createdAt: 1 });

    // Mark unread messages from other side as read
    const oppositeSender = isAdmin ? 'user' : 'admin';
    await Message.updateMany(
      { userId, sender: oppositeSender, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tải tin nhắn', error: error.message });
  }
};

// Get ALL registered customer accounts for the admin chat, merged with
// conversation info (last message, unread count) where one exists.
// This lets the admin see every created account and start a chat with any of them.
const getChatUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối' });
    }

    // Latest message per user (only users who already have messages)
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$text' },
          lastSender: { $first: '$sender' },
          lastSenderName: { $first: '$senderName' },
          updatedAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$isRead', false] }] }, 1, 0],
            },
          },
        },
      },
    ]);

    const convByUser = new Map(conversations.map((c) => [String(c._id), c]));

    // All customer accounts (excluding admins)
    const users = await User.find({ role: 'user' }).select('username email phone createdAt').sort({ createdAt: -1 });

    const populated = users.map((u) => {
      const conv = convByUser.get(String(u._id));
      return {
        _id: u._id,
        username: u.username,
        email: u.email || '',
        phone: u.phone || '',
        createdAt: u.createdAt,
        hasChat: !!conv,
        lastMessage: conv ? conv.lastMessage : '',
        lastSender: conv ? conv.lastSender : null,
        lastSenderName: conv ? conv.lastSenderName : '',
        updatedAt: conv ? conv.updatedAt : u.createdAt,
        unreadCount: conv ? conv.unreadCount : 0,
      };
    });

    // Users with conversations first (by recency), then accounts without chats (by creation date)
    populated.sort((a, b) => {
      if (a.hasChat !== b.hasChat) return a.hasChat ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    res.json({ success: true, users: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách tài khoản', error: error.message });
  }
};

// Get active conversations list (Admin only)
const getConversations = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối' });
    }

    const conversations = await Message.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$text' },
          lastSender: { $first: '$sender' },
          lastSenderName: { $first: '$senderName' },
          updatedAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$isRead', false] }] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
    ]);

    // Populate user info for each conversation
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const userDoc = await User.findById(conv._id).select('username email');
        return {
          ...conv,
          username: userDoc ? userDoc.username : 'Khách hàng',
          email: userDoc ? userDoc.email : '',
        };
      })
    );

    res.json({ success: true, conversations: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách hội thoại', error: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  getChatUsers,
};
