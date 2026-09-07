const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'phuclong_secret_key_123456', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, phone, password, role } = req.body;

  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Vui lòng điền tên tài khoản và mật khẩu.' });
    }

    if (!email && !phone) {
      return res
        .status(400)
        .json({ success: false, message: 'Vui lòng cung cấp Gmail hoặc Số điện thoại để đăng ký.' });
    }

    const searchOr = [{ username: username }];

    if (email) {
      if (!email.includes('@')) {
        return res
          .status(400)
          .json({ success: false, message: 'Vui lòng nhập địa chỉ Gmail hợp lệ.' });
      }
      searchOr.push({ email: email.toLowerCase() });
    }

    if (phone) {
      const isPhone = /^\+?[0-9\s\-()]{9,15}$/.test(phone);
      if (!isPhone) {
        return res
          .status(400)
          .json({ success: false, message: 'Vui lòng nhập số điện thoại hợp lệ.' });
      }
      searchOr.push({ phone: phone });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: searchOr });

    if (userExists) {
      if (userExists.username === username) {
        return res
          .status(400)
          .json({ success: false, message: 'Tên tài khoản này đã tồn tại.' });
      }
      if (email && userExists.email === email.toLowerCase()) {
        return res
          .status(400)
          .json({ success: false, message: 'Địa chỉ Gmail này đã được đăng ký.' });
      }
      if (phone && userExists.phone === phone) {
        return res
          .status(400)
          .json({ success: false, message: 'Số điện thoại này đã được đăng ký.' });
      }
    }

    // Never trust a client-supplied role: self-registration is always 'user'.
    // Admin accounts can only be created by an existing admin (see adminController).
    const userData = {
      username: username,
      password: password,
      role: 'user',
    };

    if (email) userData.email = email.toLowerCase();
    if (phone) userData.phone = phone;

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Thông tin người dùng không hợp lệ.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu.' });
    }

    // Search by username, email, or phone
    const query = {
      $or: [
        { username: username },
        { email: username.toLowerCase() },
        { phone: username },
      ],
    };

    const user = await User.findOne(query);

    if (user && (await user.matchPassword(password))) {
      const isMaster = !!(
        user.isMasterAdmin ||
        user.username === 'admin' ||
        user.email === 'admin@phuclong.vn' ||
        user.email === 'admin@phuclong.com'
      );
      res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isMasterAdmin: isMaster,
          token: generateToken(user._id),
        },
      });
    } else {
      res
        .status(401)
        .json({ success: false, message: 'Tên tài khoản, Email, Số điện thoại hoặc Mật khẩu không chính xác.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      const isMaster = !!(
        user.isMasterAdmin ||
        user.username === 'admin' ||
        user.email === 'admin@phuclong.vn' ||
        user.email === 'admin@phuclong.com'
      );
      res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isMasterAdmin: isMaster,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change current user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Xác nhận mật khẩu mới không trùng khớp.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password - Step 1: Generate & send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { identifier } = req.body; // email or phone only

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập Gmail hoặc Số điện thoại.' });
  }

  try {
    const searchVal = identifier.trim();
    const query = {
      $or: [
        { email: searchVal.toLowerCase() },
        { phone: searchVal },
      ],
    };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với Gmail hoặc Số điện thoại này.' });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireMinutes = 15;

    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = Date.now() + expireMinutes * 60 * 1000;
    await user.save();

    console.log(`[OTP FORGOT PASSWORD] Account: ${user.username} | Email/Phone: ${searchVal} | OTP: ${otp} | Expires in: 15 mins`);

    res.json({
      success: true,
      message: `Mã OTP xác nhận đã được gửi thành công (Hạn dùng ${expireMinutes} phút).`,
      data: {
        identifier: searchVal,
        otp: otp, // Returned for testing convenience
        expireMinutes: expireMinutes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password - Step 2: Verify OTP & Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { identifier, otp, newPassword, confirmPassword } = req.body;

  if (!identifier || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ Mã OTP và Mật khẩu mới.' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không trùng khớp.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
  }

  try {
    const searchVal = identifier.trim();
    const query = {
      $or: [
        { email: searchVal.toLowerCase() },
        { phone: searchVal },
      ],
      resetPasswordOTP: otp.trim(),
      resetPasswordExpire: { $gt: Date.now() },
    };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Mã xác thực OTP không chính xác hoặc đã hết hạn (15 phút).' });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};

