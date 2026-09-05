const Cart = require('../models/Cart');

// Helper to check if two topping arrays are identical
const areToppingsEqual = (t1 = [], t2 = []) => {
  if (t1.length !== t2.length) return false;
  const names1 = t1.map((t) => t.name).sort();
  const names2 = t2.map((t) => t.name).sort();
  return names1.every((val, index) => val === names2[index]);
};

// @desc    Get logged in user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    res.json({ success: true, count: cart.items.length, data: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add item to cart (accumulate quantity if same size & toppings)
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  const { product, name, image, price, size, toppings, quantity } = req.body;

  if (!product || !name || !price || !size) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm.' });
  }

  const qty = Number(quantity) > 0 ? Number(quantity) : 1;
  const itemToppings = Array.isArray(toppings) ? toppings : [];

  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if item with same product, size, and toppings exists
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === product.toString() &&
        item.size === size &&
        areToppingsEqual(item.toppings, itemToppings)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += qty;
      if (image) cart.items[existingIndex].image = image;
    } else {
      cart.items.push({
        product,
        name,
        image: image || '',
        price,
        size,
        toppings: itemToppings,
        quantity: qty,
      });
    }

    await cart.save();
    cart = await cart.populate('items.product');
    res.status(201).json({ success: true, count: cart.items.length, data: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const qty = Number(quantity);

  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng.' });
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn trong giỏ hàng.' });
    }

    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = qty;
    }

    await cart.save();
    cart = await cart.populate('items.product');
    res.json({ success: true, count: cart.items.length, data: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove single item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeCartItem = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng.' });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
    await cart.save();
    cart = await cart.populate('items.product');

    res.json({ success: true, count: cart.items.length, data: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: 'Đã dọn sạch giỏ hàng.', count: 0, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
