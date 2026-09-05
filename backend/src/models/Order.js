const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  size: { type: String, required: true },
  toppings: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
  ],
  quantity: { type: Number, required: true, default: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customerName: {
      type: String,
      required: [true, 'Vui lòng nhập tên người nhận'],
    },
    customerPhone: {
      type: String,
      required: [true, 'Vui lòng nhập số điện thoại'],
    },
    shippingAddress: {
      type: String,
      required: [true, 'Vui lòng nhập địa chỉ giao hàng'],
    },
    notes: {
      type: String,
      default: '',
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Processing', 'Delivering', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    couponCode: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'QR'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
