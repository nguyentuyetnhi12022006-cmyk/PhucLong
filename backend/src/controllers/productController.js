const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, sizes, toppings, isAvailable, isFeatured, isNewItem } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      sizes: sizes || [
        { size: 'M', priceAdjustment: 0 },
        { size: 'L', priceAdjustment: 6000 },
      ],
      toppings: toppings || [],
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      isNewItem: isNewItem !== undefined ? isNewItem : true,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Xóa sản phẩm thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to calculate top 5 selling products from Order management database
const calculateTopSellingProducts = async () => {
  const Order = require('../models/Order');

  // 1. Get orders from Order Management.
  // Prefer orders with status 'Completed', fallback to non-cancelled orders if no Completed orders yet.
  let orders = await Order.find({ status: 'Completed' });
  if (!orders || orders.length === 0) {
    orders = await Order.find({ status: { $ne: 'Cancelled' } });
  }

  // 2. Fetch all products to match metadata (category, image, price, etc.)
  const products = await Product.find();
  const productDocMap = {};
  products.forEach((p) => {
    productDocMap[p.name] = p;
    if (p._id) productDocMap[p._id.toString()] = p;
  });

  // 3. Aggregate quantity and revenue per product from order items
  const productSalesMap = {};

  orders.forEach((order) => {
    if (!order.items || !Array.isArray(order.items)) return;
    order.items.forEach((item) => {
      const key = item.name;
      const prodDoc = productDocMap[item.name] || (item.product ? productDocMap[item.product.toString()] : null);

      if (!productSalesMap[key]) {
        productSalesMap[key] = {
          _id: prodDoc ? prodDoc._id : `top-${key}`,
          name: item.name,
          quantity: 0,
          revenue: 0,
          category: prodDoc ? prodDoc.category : 'Trà sữa',
          price: prodDoc ? prodDoc.price : (item.price || 0),
          image: prodDoc ? prodDoc.image : 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80',
          description: prodDoc ? prodDoc.description : '',
          sizes: prodDoc ? prodDoc.sizes : [],
          toppings: prodDoc ? prodDoc.toppings : [],
          isAvailable: prodDoc ? prodDoc.isAvailable : true,
          isFeatured: prodDoc ? prodDoc.isFeatured : true,
        };
      }
      productSalesMap[key].quantity += item.quantity || 1;
      productSalesMap[key].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  let topProducts = Object.values(productSalesMap).sort(
    (a, b) => b.quantity - a.quantity || b.revenue - a.revenue
  );

  // 4. If fewer than 5 products have sales, append remaining products from database
  if (topProducts.length < 5 && products.length > 0) {
    const existingNames = new Set(topProducts.map((p) => p.name));
    for (const p of products) {
      if (topProducts.length >= 5) break;
      if (!existingNames.has(p.name)) {
        topProducts.push({
          _id: p._id,
          name: p.name,
          quantity: 0,
          revenue: 0,
          category: p.category || 'Trà sữa',
          price: p.price,
          image: p.image,
          description: p.description,
          sizes: p.sizes,
          toppings: p.toppings,
          isAvailable: p.isAvailable,
          isFeatured: p.isFeatured,
        });
        existingNames.add(p.name);
      }
    }
  }

  return topProducts.slice(0, 5);
};

// @desc    Get top 5 best selling products
// @route   GET /api/products/top-selling
// @access  Public
const getTopSellingProducts = async (req, res) => {
  try {
    const topProducts = await calculateTopSellingProducts();
    res.json({ success: true, count: topProducts.length, data: topProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  calculateTopSellingProducts,
  getTopSellingProducts,
};
