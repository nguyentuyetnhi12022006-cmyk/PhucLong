const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// @desc    Get dashboard overview statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    // 1. Get totals
    const totalOrdersCount = await Order.countDocuments();
    const completedOrders = await Order.find({ status: 'Completed' });
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const pendingOrdersCount = await Order.countDocuments({ status: 'Pending' });
    const processingOrdersCount = await Order.countDocuments({ status: { $in: ['Processing', 'Delivering'] } });
    const cancelledOrdersCount = await Order.countDocuments({ status: 'Cancelled' });
    const completedOrdersCount = completedOrders.length;

    const totalProductsCount = await Product.countDocuments();
    const totalUsersCount = await User.countDocuments({ role: 'user' });

    // 2. Compute sales trend (daily for the last 30 days)
    const dailyRevenueMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyRevenueMap[dateStr] = { date: dateStr, revenue: 0, orderCount: 0 };
    }

    const startOf30DaysAgo = new Date();
    startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);
    startOf30DaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await Order.find({
      createdAt: { $gte: startOf30DaysAgo },
    });

    recentOrders.forEach((order) => {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
      if (dailyRevenueMap[dateStr]) {
        dailyRevenueMap[dateStr].orderCount += 1;
        if (order.status === 'Completed') {
          dailyRevenueMap[dateStr].revenue += order.totalAmount;
        }
      }
    });

    const dailyRevenueTrend = Object.values(dailyRevenueMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 3. Compute top selling products
    const productSalesMap = {};
    const products = await Product.find();
    const productCategoryMap = {};
    products.forEach((p) => {
      productCategoryMap[p.name] = p.category;
    });

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.name;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            category: productCategoryMap[item.name] || 'Trà sữa',
          };
        }
        productSalesMap[key].quantity += item.quantity;
        productSalesMap[key].revenue += item.price * item.quantity;
      });
    });

    let topProducts = Object.values(productSalesMap).sort(
      (a, b) => b.quantity - a.quantity
    );

    if (topProducts.length < 5 && products.length > 0) {
      const existingNames = new Set(topProducts.map((p) => p.name));
      for (const p of products) {
        if (topProducts.length >= 5) break;
        if (!existingNames.has(p.name)) {
          topProducts.push({
            name: p.name,
            quantity: 0,
            revenue: 0,
            category: p.category || 'Trà sữa',
          });
          existingNames.add(p.name);
        }
      }
    }

    topProducts = topProducts.slice(0, 5);

    // 4. Compute category sales distribution
    const categorySalesMap = {
      'Trà sữa': 0,
      'Trà trái cây': 0,
      'Cà phê': 0,
      'Đá xay': 0,
      'Bánh ngọt': 0,
    };

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const cat = productCategoryMap[item.name] || 'Trà sữa';
        if (categorySalesMap[cat] !== undefined) {
          categorySalesMap[cat] += item.price * item.quantity;
        } else {
          categorySalesMap[cat] = item.price * item.quantity;
        }
      });
    });

    const categorySales = Object.keys(categorySalesMap).map((key) => ({
      category: key,
      value: categorySalesMap[key],
    }));

    // 5. Get recent 5 orders
    const recent5Orders = await Order.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrdersCount,
          completedOrdersCount,
          pendingOrdersCount,
          processingOrdersCount,
          cancelledOrdersCount,
          totalProductsCount,
          totalUsersCount,
          avgOrderValue:
            completedOrdersCount > 0
              ? Math.round(totalRevenue / completedOrdersCount)
              : 0,
        },
        dailyRevenueTrend,
        topProducts,
        categorySales,
        recentOrders: recent5Orders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const isMasterAdminUser = (u) => {
  if (!u) return false;
  return !!(
    u.isMasterAdmin ||
    u.username === 'admin' ||
    u.email === 'admin@phuclong.vn' ||
    u.email === 'admin@phuclong.com'
  );
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const formattedUsers = users.map((u) => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isMasterAdmin: u.isMasterAdmin || isMasterAdminUser(u),
      createdAt: u.createdAt,
    }));
    res.json({ success: true, count: formattedUsers.length, data: formattedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user details (role)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin (Master Admin only for role changes)
const updateUser = async (req, res) => {
  const { role } = req.body;

  try {
    // Only Master Admin is allowed to grant (cấp) or revoke (thu hồi) admin privileges
    if (!isMasterAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ tài khoản Admin gốc (Master Admin) mới có quyền cấp hoặc thu hồi quyền quản trị viên.',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên.' });
    }

    // Cannot demote Master Admin account itself
    if (isMasterAdminUser(user) && role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'Không thể thu hồi quyền Admin tối cao của hệ thống.',
      });
    }

    if (user.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ success: false, message: 'Không thể hạ quyền Admin duy nhất còn lại của hệ thống.' });
      }
    }

    user.role = role || user.role;
    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isMasterAdmin: updatedUser.isMasterAdmin || isMasterAdminUser(updatedUser),
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin (Master Admin only)
const deleteUser = async (req, res) => {
  try {
    // Only Master Admin can delete users
    if (!isMasterAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ tài khoản Admin gốc (Master Admin) mới có quyền xóa thành viên.',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên.' });
    }

    // Prevent deleting logged-in user or master admin
    if (
      user._id.toString() === req.user.id.toString() ||
      isMasterAdminUser(user)
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Không thể xóa tài khoản Admin tối cao hoặc tài khoản đang sử dụng.' });
    }

    await user.deleteOne();
    res.json({ success: true, message: 'Xóa thành viên thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
};
