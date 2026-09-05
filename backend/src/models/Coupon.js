const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Vui lòng nhập mã giảm giá'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Vui lòng nhập giá trị giảm giá'],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày hết hạn'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Coupon', couponSchema);
