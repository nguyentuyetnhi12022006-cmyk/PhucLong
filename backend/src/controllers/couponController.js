const Coupon = require('../models/Coupon');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
  const { code, discountType, discountValue, maxDiscountAmount, minOrderAmount, expiryDate, isActive } = req.body;

  try {
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã tồn tại.' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      expiryDate,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
    }

    if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
      const codeExists = await Coupon.findOne({ code: req.body.code.toUpperCase() });
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá mới đã tồn tại.' });
      }
      req.body.code = req.body.code.toUpperCase();
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updatedCoupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
    }

    await coupon.deleteOne();
    res.json({ success: true, message: 'Xóa mã giảm giá thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = async (req, res) => {
  const { code, orderAmount } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã giảm giá.' });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá hiện đã bị vô hiệu hóa.' });
    }

    const currentDate = new Date();
    if (new Date(coupon.expiryDate) < currentDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã quá hạn sử dụng.' });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Mã giảm giá này chỉ áp dụng cho đơn hàng từ ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(coupon.minOrderAmount)} trở lên.`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountAmount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active coupons for public customers
// @route   GET /api/coupons/active
// @access  Public
const getActiveCoupons = async (req, res) => {
  try {
    const currentDate = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: currentDate },
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCoupons,
  getActiveCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
