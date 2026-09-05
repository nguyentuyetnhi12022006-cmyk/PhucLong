const Order = require('../models/Order');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// Normalize order items: toppings may arrive as plain strings (from the frontend
// cart) or as { name, price } objects. Convert strings to objects so the Order
// model validation passes, and ensure every item has a sane positive price.
const normalizeItems = (items = []) => {
  return items.map((item) => ({
    ...item,
    price: Number(item.price) > 0 ? Number(item.price) : 0,
    quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
    toppings: Array.isArray(item.toppings)
      ? item.toppings.map((t) =>
          typeof t === 'string' ? { name: t, price: 0 } : { ...t }
        )
      : [],
  }));
};

// Helper: verify a Bearer token and return the user id (or null)
const getUserIdFromToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'phuclong_secret_key_123456'
      );
      return decoded.id || decoded._id || null;
    } catch (err) {
      console.error('Error verifying token:', err.message);
    }
  }
  return null;
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  const {
    customerName,
    customerPhone,
    shippingAddress,
    notes,
    items,
    totalAmount,
    couponCode,
    discountAmount,
    paymentMethod,
    paymentStatus,
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Đơn hàng chưa có sản phẩm nào.' });
  }

  if (Number(totalAmount) <= 0) {
    return res
      .status(400)
      .json({ success: false, message: 'Tổng tiền đơn hàng không hợp lệ.' });
  }

  // Extract user ID from the verified token only. Never trust a
  // client-supplied user id in the request body.
  let userId = getUserIdFromToken(req);

  // Fallback: If userId is still null, look up registered User in database by phone or username
  if (!userId && (customerPhone || customerName)) {
    try {
      const User = require('../models/User');
      const searchConditions = [];
      if (customerPhone) {
        searchConditions.push({ phone: customerPhone });
        searchConditions.push({ username: customerPhone });
      }
      if (customerName) {
        searchConditions.push({ username: customerName });
      }
      if (searchConditions.length > 0) {
        const existingUser = await User.findOne({ $or: searchConditions });
        if (existingUser) {
          userId = existingUser._id;
        }
      }
    } catch (err) {
      console.error('Fallback user lookup error during createOrder:', err.message);
    }
  }

  try {
    const order = await Order.create({
      user: userId,
      customerName,
      customerPhone,
      shippingAddress,
      notes,
      items: normalizeItems(items),
      totalAmount: Number(totalAmount),
      couponCode,
      discountAmount,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentStatus || 'Pending',
    });

    // Notify Admin of new order
    const notif = await Notification.create({
      userId: userId || null,
      recipient: 'admin',
      type: 'order_created',
      title: 'Đơn hàng mới!',
      message: `Khách hàng ${customerName} (${customerPhone}) vừa đặt đơn #${order._id.toString().slice(-6)} trị giá ${totalAmount.toLocaleString()}đ`,
      orderId: order._id,
    });

    if (req.io) {
      req.io.to('admin_room').emit('order_created', {
        order,
        notification: notif,
      });
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Track order by ID, phone number or query string
// @route   GET /api/orders/track
// @access  Public
const trackOrder = async (req, res) => {
  const queryStr = req.query.q || req.query.id || req.query.phone || '';
  let cleanQuery = queryStr.toString().trim().replace(/^#/, '');

  if (!cleanQuery) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mã đơn hàng hoặc số điện thoại để tra cứu.',
    });
  }

  try {
    const mongoose = require('mongoose');
    let orders = [];

    // Clean target string & target digits
    const targetLower = cleanQuery.toLowerCase();
    const targetDigits = cleanQuery.replace(/\D/g, '');
    // Extract last 9 digits for flexible phone matching (handles 090..., 90..., +8490...)
    const targetPhoneSuffix = targetDigits.length >= 8 ? targetDigits.slice(-9) : targetDigits;

    // 1. If valid 24-hex ObjectId, try exact match
    if (mongoose.Types.ObjectId.isValid(cleanQuery)) {
      try {
        const exactOrder = await Order.findById(cleanQuery);
        if (exactOrder) orders.push(exactOrder);
      } catch (e) {
        // ignore cast error
      }
    }

    // 2. Fetch recent orders and perform smart multi-field matching
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).limit(300);

    const matchedMap = new Map();
    orders.forEach(o => matchedMap.set(o._id.toString(), o));

    allOrders.forEach(o => {
      if (matchedMap.has(o._id.toString())) return;

      const idStr = o._id ? o._id.toString().toLowerCase() : '';
      const rawPhone = o.customerPhone ? o.customerPhone.toString() : '';
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const phoneSuffix = phoneDigits.length >= 8 ? phoneDigits.slice(-9) : phoneDigits;
      const nameStr = o.customerName ? o.customerName.toString().toLowerCase() : '';

      // Check ID match (partial or exact)
      if (idStr.includes(targetLower)) {
        matchedMap.set(o._id.toString(), o);
        return;
      }

      // Check raw phone string match
      if (rawPhone.toLowerCase().includes(targetLower)) {
        matchedMap.set(o._id.toString(), o);
        return;
      }

      // Check phone suffix match (e.g. 09089866534 vs 9089866534 or +849089866534)
      if (targetPhoneSuffix && targetPhoneSuffix.length >= 7) {
        if (phoneDigits.includes(targetPhoneSuffix) || phoneSuffix.includes(targetPhoneSuffix) || targetPhoneSuffix.includes(phoneSuffix)) {
          matchedMap.set(o._id.toString(), o);
          return;
        }
      }

      // Check Name match
      if (targetLower.length >= 2 && nameStr.includes(targetLower)) {
        matchedMap.set(o._id.toString(), o);
        return;
      }
    });

    orders = Array.from(matchedMap.values());

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status or payment status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  const { status, paymentStatus } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    const statusMap = {
      Pending: 'Chờ duyệt',
      Processing: 'Đang pha chế',
      Delivering: 'Đang giao hàng',
      Completed: 'Đã hoàn thành',
      Cancelled: 'Đã hủy',
    };

    if (status) {
      const validStatuses = ['Pending', 'Processing', 'Delivering', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ.' });
      }
      order.status = status;
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['Pending', 'Paid', 'Failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ success: false, message: 'Trạng thái thanh toán không hợp lệ.' });
      }
      order.paymentStatus = paymentStatus;
    }

    const updatedOrder = await order.save();

    // Send notification to customer if order belongs to a registered user
    if (order.user && status) {
      const isApproved = status === 'Processing';
      const isCancelled = status === 'Cancelled';
      const notifType = isApproved ? 'order_approved' : isCancelled ? 'order_cancelled' : 'order_status_updated';
      const notifTitle = isApproved ? 'Đơn hàng đã được duyệt!' : isCancelled ? 'Đơn hàng bị hủy' : 'Cập nhật đơn hàng';
      const notifMsg = `Đơn hàng #${order._id.toString().slice(-6)} của bạn đã được chuyển sang trạng thái: "${statusMap[status] || status}"`;

      await Notification.create({
        userId: order.user,
        recipient: 'user',
        type: notifType,
        title: notifTitle,
        message: notifMsg,
        orderId: order._id,
      });
    }

    if (req.io) {
      // Emit real-time to admin room
      req.io.to('admin_room').emit('order_status_updated_admin', {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });

      // Emit real-time to customer room
      if (order.user) {
        req.io.to(`user_${order.user.toString()}`).emit('order_status_updated', {
          orderId: order._id,
          status: order.status,
          statusText: statusMap[order.status] || order.status,
        });
      }
    }

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const User = require('../models/User');
    const userDoc = await User.findById(currentUserId);

    // Build flexible query matching user ID OR customer phone/username
    const orConditions = [{ user: currentUserId }];
    if (userDoc) {
      if (userDoc.phone) {
        orConditions.push({ customerPhone: userDoc.phone });
      }
      if (userDoc.username) {
        orConditions.push({ customerPhone: userDoc.username });
        orConditions.push({ customerName: userDoc.username });
      }
    }

    const orders = await Order.find({ $or: orConditions }).sort({ createdAt: -1 });

    // Auto-sync database: Link any orders found matching customer phone/name to user's MongoDB _id
    const unlinkedIds = orders
      .filter((o) => !o.user)
      .map((o) => o._id);

    if (unlinkedIds.length > 0) {
      await Order.updateMany(
        { _id: { $in: unlinkedIds } },
        { $set: { user: currentUserId } }
      );
    }

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new guest order (no login required)
// @route   POST /api/orders/guest
// @access  Public
const createGuestOrder = async (req, res) => {
  const {
    customerName,
    customerPhone,
    shippingAddress,
    notes,
    items,
    totalAmount,
    couponCode,
    discountAmount,
    paymentMethod,
    paymentStatus,
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Đơn hàng chưa có sản phẩm nào.' });
  }

  if (!customerName || !customerPhone || !shippingAddress) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên, SĐT và địa chỉ giao hàng.' });
  }

  try {
    // Attempt auto-linking if customer matches registered user in DB
    let guestUserId = null;
    try {
      const User = require('../models/User');
      const searchConditions = [];
      if (customerPhone) {
        searchConditions.push({ phone: customerPhone });
        searchConditions.push({ username: customerPhone });
      }
      if (customerName) {
        searchConditions.push({ username: customerName });
      }
      if (searchConditions.length > 0) {
        const existingUser = await User.findOne({ $or: searchConditions });
        if (existingUser) {
          guestUserId = existingUser._id;
        }
      }
    } catch (e) {
      console.error('Guest order user lookup error:', e.message);
    }

    const order = await Order.create({
      user: guestUserId,
      customerName,
      customerPhone,
      shippingAddress,
      notes: notes || '',
      items: normalizeItems(items),
      totalAmount: Number(totalAmount) || 0,
      couponCode: couponCode || null,
      discountAmount: discountAmount || 0,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentStatus || 'Pending',
      status: 'Pending',
    });

    // Notify Admin of new guest order
    const notif = await Notification.create({
      userId: null,
      recipient: 'admin',
      type: 'order_created',
      title: 'Đơn hàng vãng vãng mới!',
      message: `Khách hàng ${customerName} (${customerPhone}) vừa đặt đơn vãng vãng #${order._id.toString().slice(-6)} trị giá ${totalAmount.toLocaleString()}đ`,
      orderId: order._id,
    });

    if (req.io) {
      req.io.to('admin_room').emit('order_created', {
        order,
        notification: notif,
      });
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Customer self cancel order (Only if status is Pending)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    const currentUserId = req.user?._id?.toString() || req.user?.id?.toString();
    const orderUserId = order.user?.toString();

    if (orderUserId && currentUserId && orderUserId !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này.' });
    }

    if (order.status !== 'Pending') {
      const statusMap = {
        Processing: 'Đang pha chế',
        Delivering: 'Đang giao hàng',
        Completed: 'Đã hoàn thành',
        Cancelled: 'Đã hủy',
      };
      const statusName = statusMap[order.status] || order.status;
      return res.status(400).json({
        success: false,
        message: `Đơn hàng đang ở trạng thái "${statusName}". Cửa hàng đã bắt đầu thực hiện nên không thể tự hủy.`,
      });
    }

    order.status = 'Cancelled';
    const updatedOrder = await order.save();

    // Notify Admin that customer cancelled their order
    await Notification.create({
      userId: order.user || null,
      recipient: 'admin',
      type: 'order_cancelled',
      title: 'Khách hàng hủy đơn!',
      message: `Khách hàng ${order.customerName} (${order.customerPhone}) vừa hủy đơn hàng #${order._id.toString().slice(-6)}`,
      orderId: order._id,
    });

    if (req.io) {
      // Broadcast real-time to admin
      req.io.to('admin_room').emit('order_cancelled_by_customer', {
        orderId: order._id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        message: `Khách hàng ${order.customerName} đã hủy đơn #${order._id.toString().slice(-6).toUpperCase()}`,
      });

      // Broadcast real-time to customer
      if (order.user) {
        req.io.to(`user_${order.user.toString()}`).emit('order_status_updated', {
          orderId: order._id,
          status: 'Cancelled',
          statusText: 'Đã hủy',
        });
      }
    }

    res.json({ success: true, message: 'Đã hủy đơn hàng thành công.', data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Customer claims they have transferred money for an order
// @route   PUT /api/orders/:id/confirm-payment
// @access  Public (requires verified token or matching customer phone)
// Behavior: marks the order as "Pending" (customer claimed transfer).
// The order becomes "Paid" only after an admin verifies it via
// POST /api/orders/:id/verify-payment, or "Failed" if the admin rejects it.
const confirmPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    const tokenUserId = getUserIdFromToken(req);
    const bodyPhone = (req.body && req.body.customerPhone
      ? req.body.customerPhone.toString()
      : ''
    ).replace(/\s/g, '');
    const orderPhone = (order.customerPhone || '').toString().replace(/\s/g, '');
    const isOwner =
      (tokenUserId && order.user && tokenUserId.toString() === order.user.toString()) ||
      (bodyPhone && orderPhone && bodyPhone === orderPhone);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xác nhận thanh toán cho đơn hàng này.',
      });
    }

    if (order.paymentStatus === 'Paid') {
      return res.json({
        success: true,
        message: 'Đơn hàng này đã được xác nhận thanh toán.',
        data: order,
      });
    }

    // Customer claims they transferred: record a "Pending" payment status
    // (bank/shop still needs to verify). Never auto-mark Paid from the
    // customer side.
    order.paymentStatus = 'Pending';
    const updatedOrder = await order.save();

    // Notify admin: customer claims they transferred
    await Notification.create({
      userId: order.user || null,
      recipient: 'admin',
      type: 'payment_claimed',
      title: 'Khách hàng xác nhận đã chuyển khoản 💚',
      message: `Khách hàng ${order.customerName} (${order.customerPhone}) vừa xác nhận đã chuyển khoản cho đơn hàng #${order._id.toString().slice(-6)} (${order.totalAmount.toLocaleString()}đ). Vui lòng kiểm tra và duyệt.`,
      orderId: order._id,
    });

    if (req.io) {
      req.io.to('admin_room').emit('order_status_updated_admin', {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    res.json({
      success: true,
      message: 'Đơn hàng đang chờ xác nhận từ ngân hàng. Vui lòng chờ quản trị viên duyệt.',
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin verifies / approves a customer's payment claim
// @route   POST /api/orders/:id/verify-payment
// @access  Private/Admin
const verifyPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    const tokenUserId = getUserIdFromToken(req);
    if (!tokenUserId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
    }

    const User = require('../models/User');
    const admin = await User.findById(tokenUserId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chỉ quản trị viên mới có quyền duyệt thanh toán.' });
    }

    const { status } = req.body; // 'paid' | 'failed'
    if (status !== 'paid' && status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Tham số status không hợp lệ. Gửi status="paid" hoặc status="failed".',
      });
    }

    if (status === 'paid') {
      order.paymentStatus = 'Paid';
      if (order.status === 'Pending') {
        order.status = 'Processing';
      }

      await Notification.create({
        userId: order.user || null,
        recipient: 'user',
        type: 'order_status_updated',
        title: 'Đơn hàng đã được xác nhận thanh toán! 🎉',
        message: `Đơn hàng #${order._id.toString().slice(-6)} của bạn đã được xác nhận thanh toán thành công. Đơn hàng đang được Phúc Long chuẩn bị.`,
        orderId: order._id,
      });

      if (req.io) {
        req.io.to('admin_room').emit('order_status_updated_admin', {
          orderId: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
        });
        if (order.user) {
          req.io.to(`user_${order.user.toString()}`).emit('order_status_updated', {
            orderId: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            statusText: order.status === 'Processing' ? 'Đang pha chế' : order.status,
          });
        }
      }

      return res.json({
        success: true,
        message: 'Đã xác nhận thanh toán thành công cho đơn hàng.',
        data: order,
      });
    }

    // status === 'failed'
    order.paymentStatus = 'Failed';

    await Notification.create({
      userId: order.user || null,
      recipient: 'user',
      type: 'order_status_updated',
      title: 'Xác nhận thanh toán không thành công',
      message: `Đơn hàng #${order._id.toString().slice(-6)} của bạn chưa được xác nhận thanh toán. Vui lòng chuyển khoản đúng số tiền và thử lại, hoặc liên hệ Phúc Long qua hotline 1800 6179.`,
      orderId: order._id,
    });

    if (req.io) {
      req.io.to('admin_room').emit('order_status_updated_admin', {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });
      if (order.user) {
        req.io.to(`user_${order.user.toString()}`).emit('order_status_updated', {
          orderId: order._id,
          paymentStatus: order.paymentStatus,
          paymentStatusText: 'Thanh toán không thành công',
        });
      }
    }

    return res.json({
      success: true,
      message: 'Đã đánh dấu đơn hàng thanh toán không thành công.',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin send thank you message to customer for an order
// @route   POST /api/orders/:id/send-thank-you
// @access  Private/Admin
const sendThankYouMessage = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    const { customNote } = req.body;
    const orderCode = order._id.toString().slice(-6).toUpperCase();
    const messageText = customNote || `Cảm ơn quý khách ${order.customerName} đã ủng hộ Phúc Long! Đơn hàng #${orderCode} của quý khách đã được phục vụ. Chúc quý khách ngon miệng và có một ngày thật ngọt ngào! 🍵✨`;

    if (order.user) {
      const Message = require('../models/Message');
      await Message.create({
        userId: order.user,
        sender: 'admin',
        senderName: 'Cửa Hàng Phúc Long',
        text: messageText,
        isRead: false,
      });

      await Notification.create({
        userId: order.user,
        recipient: 'user',
        type: 'system',
        title: 'Lời cảm ơn từ Phúc Long 💚',
        message: messageText,
        orderId: order._id,
      });
    }

    res.json({
      success: true,
      message: `Đã gửi lời cảm ơn tới khách hàng ${order.customerName}!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  createGuestOrder,
  getOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  getMyOrders,
  cancelOrder,
  confirmPayment,
  verifyPayment,
  sendThankYouMessage,
};

