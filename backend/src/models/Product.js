const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true },
  priceAdjustment: { type: Number, required: true, default: 0 },
});

const toppingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên sản phẩm'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng nhập giá sản phẩm'],
    },
    category: {
      type: String,
      required: [true, 'Vui lòng chọn danh mục'],
      enum: ['Trà sữa', 'Trà trái cây', 'Cà phê', 'Đá xay', 'Bánh ngọt'],
    },
    image: {
      type: String,
      default: '',
    },
    sizes: [sizeSchema],
    toppings: [toppingSchema],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
