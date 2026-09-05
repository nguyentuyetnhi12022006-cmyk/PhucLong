const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'phuclong_secret_key_123456'
      );
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: 'Người dùng không tồn tại hoặc đã bị xóa.' });
      }

      return next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res
        .status(401)
        .json({ success: false, message: 'Phiên làm việc hết hạn hoặc token không hợp lệ.' });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Vui lòng đăng nhập để truy cập tính năng này.' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối. Chỉ dành cho Admin.' });
  }
};

module.exports = { protect, admin };
