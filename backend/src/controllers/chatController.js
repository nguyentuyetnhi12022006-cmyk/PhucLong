const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Send message
const sendMessage = async (req, res) => {
  try {
    const { text, targetUserId, imageUrl } = req.body;
    const hasText = text && text.trim();
    const hasImage = imageUrl && imageUrl.trim();

    if (!hasText && !hasImage) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn hoặc hình ảnh không được để trống' });
    }

    const isAdmin = req.user.role === 'admin';
    const userId = isAdmin ? targetUserId : req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Không xác định được ID người dùng' });
    }

    // If admin is sending, verify that target user account still exists
    if (isAdmin) {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản khách hàng này đã bị xóa, không thể gửi tin nhắn.',
        });
      }
    }

    const message = await Message.create({
      userId,
      sender: isAdmin ? 'admin' : 'user',
      senderName: req.user.username || (isAdmin ? 'Cửa Hàng Phúc Long' : 'Khách Hàng'),
      text: hasText ? text.trim() : '',
      imageUrl: hasImage ? imageUrl.trim() : '',
      status: 'sent',
      isRead: false,
    });

    if (isAdmin) {
      // Create notification for customer on bell
      const notif = await Notification.create({
        userId,
        recipient: 'user',
        title: 'Tin nhắn mới từ Phúc Long',
        message: 'Cửa hàng Phúc Long vừa gửi cho bạn một tin nhắn mới',
        type: 'chat_message',
        messageId: message._id,
        isRead: false,
      });

      if (req.io) {
        req.io.to(`user_${userId}`).emit('new_chat_message', message);
        req.io.to(`user_${userId}`).emit('user_notification', notif);
        req.io.to('admin_room').emit('chat_message_sent', message);
      }
    } else {
      if (req.io) {
        req.io.to('admin_room').emit('new_chat_message', message);
        req.io.to(`user_${userId}`).emit('chat_message_sent', message);
      }
    }

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

    const userDoc = await User.findById(userId).select('username email');
    const isUserDeleted = !userDoc;

    const oppositeSender = isAdmin ? 'user' : 'admin';
    const markRead = req.query.markRead === 'true' || req.body?.markRead === true;

    if (markRead) {
      const updateResult = await Message.updateMany(
        { userId, sender: oppositeSender, isRead: false },
        { isRead: true, status: 'read' }
      );

      // Also mark chat_message notifications as read for customer
      if (!isAdmin) {
        await Notification.updateMany(
          { userId, recipient: 'user', type: 'chat_message', isRead: false },
          { isRead: true }
        );
      }

      // Emit real-time read receipt to sender & notification update to user
      if (req.io) {
        if (isAdmin) {
          req.io.to(`user_${userId}`).emit('messages_read_by_recipient', { userId });
        } else {
          req.io.to('admin_room').emit('messages_read_by_recipient', { userId });
          req.io.to(`user_${userId}`).emit('user_notification_read');
        }
      }
    }

    const query = { userId };
    if (isAdmin) {
      query.deletedByAdmin = { $ne: true };
    } else {
      query.deletedByUser = { $ne: true };
    }

    const messages = await Message.find(query).sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
      isUserDeleted,
      user: userDoc
        ? userDoc
        : { _id: userId, username: 'Khách hàng', email: '', isDeleted: true },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tải tin nhắn', error: error.message });
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
        $match: { deletedByAdmin: { $ne: true } },
      },
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
          isDeleted: !userDoc,
        };
      })
    );

    res.json({ success: true, conversations: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách hội thoại', error: error.message });
  }
};

// Delete full conversation (Soft delete independently for Admin and Customer)
const deleteConversation = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userId = isAdmin ? (req.params.userId || req.query.userId) : req.user._id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu ID người dùng' });
    }

    if (isAdmin) {
      await Message.updateMany({ userId }, { deletedByAdmin: true });
      if (req.io) {
        req.io.to('admin_room').emit('conversation_deleted', { userId });
      }
    } else {
      await Message.updateMany({ userId }, { deletedByUser: true });
      if (req.io) {
        req.io.to(`user_${userId}`).emit('conversation_deleted', { userId });
      }
    }

    res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử cuộc trò chuyện' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa cuộc trò chuyện', error: error.message });
  }
};

// Delete single message by message ID (Soft delete independently for Admin and Customer)
const deleteSingleMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Tin nhắn không tồn tại' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && msg.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối' });
    }

    if (isAdmin) {
      await Message.findByIdAndUpdate(messageId, { deletedByAdmin: true });
      if (req.io) {
        req.io.to('admin_room').emit('message_deleted', { messageId, userId: msg.userId });
      }
    } else {
      await Message.findByIdAndUpdate(messageId, { deletedByUser: true });
      if (req.io) {
        req.io.to(`user_${msg.userId}`).emit('message_deleted', { messageId, userId: msg.userId });
      }
    }

    res.json({ success: true, message: 'Đã xóa tin nhắn' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tin nhắn', error: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  deleteConversation,
  deleteSingleMessage,
};
