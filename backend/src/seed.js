require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Coupon = require('./models/Coupon');

const products = [
  {
    name: 'Trà Sữa Phúc Long',
    description: 'Trà sữa Phúc Long đậm vị trà đặc trưng kết hợp cùng sữa béo ngậy hảo hạng.',
    price: 45000,
    category: 'Trà sữa',
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80',
    sizes: [
      { size: 'M', priceAdjustment: 0 },
      { size: 'L', priceAdjustment: 7000 },
    ],
    toppings: [
      { name: 'Trân châu hoàng kim', price: 10000 },
      { name: 'Trân châu đen', price: 8000 },
      { name: 'Thạch nha đam', price: 8000 },
      { name: 'Kem phô mai (Cheese Foam)', price: 12000 },
    ],
    isAvailable: true,
    isFeatured: true,
  },
  {
    name: 'Trà Đào Phúc Long',
    description: 'Trà đen đậm đà kết hợp với syrup đào thanh ngọt và những miếng đào giòn thơm.',
    price: 50000,
    category: 'Trà trái cây',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    sizes: [
      { size: 'M', priceAdjustment: 0 },
      { size: 'L', priceAdjustment: 8000 },
    ],
    toppings: [
      { name: 'Thạch đào', price: 10000 },
      { name: 'Hạt chia', price: 6000 },
      { name: 'Thạch nha đam', price: 8000 },
    ],
    isAvailable: true,
    isFeatured: true,
  },
  {
    name: 'Trà Nhãn Sen',
    description: 'Sự kết hợp tinh tế giữa hồng trà thanh nhẹ, hạt sen bùi bùi và nhãn lồng ngọt lịm.',
    price: 55000,
    category: 'Trà trái cây',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    sizes: [
      { size: 'M', priceAdjustment: 0 },
      { size: 'L', priceAdjustment: 7000 },
    ],
    toppings: [
      { name: 'Hạt sen thêm', price: 12000 },
      { name: 'Thạch nha đam', price: 8000 },
    ],
    isAvailable: true,
    isFeatured: false,
  },
  {
    name: 'Cà Phê Sữa Đá',
    description: 'Cà phê Espresso Robusta nguyên chất từ Tây Nguyên quyện cùng sữa đặc béo ngậy truyền thống.',
    price: 35000,
    category: 'Cà phê',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    sizes: [
      { size: 'M', priceAdjustment: 0 },
      { size: 'L', priceAdjustment: 6000 },
    ],
    toppings: [
      { name: 'Thạch cà phê', price: 8000 },
      { name: 'Kem phô mai (Cheese Foam)', price: 12000 },
    ],
    isAvailable: true,
    isFeatured: true,
  },
  {
    name: 'Cà Phê Đen Đá',
    description: 'Cà phê phin truyền thống đậm đà, đắng thanh đầy tỉnh táo cho ngày mới.',
    price: 30000,
    category: 'Cà phê',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
    sizes: [
      { size: 'M', priceAdjustment: 0 },
      { size: 'L', priceAdjustment: 5000 },
    ],
    toppings: [],
    isAvailable: true,
    isFeatured: false,
  },
  {
    name: 'Matcha Đá Xay',
    description: 'Bột trà xanh Nhật Bản cao cấp đá xay mát lạnh, phủ kem tươi mịn màng.',
    price: 59000,
    category: 'Đá xay',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    sizes: [
      { size: 'M', priceAdjustment: 0 },
      { size: 'L', priceAdjustment: 9000 },
    ],
    toppings: [
      { name: 'Trân châu đường đen', price: 10000 },
      { name: 'Thêm kem tươi (Whipping Cream)', price: 10000 },
    ],
    isAvailable: true,
    isFeatured: true,
  },
  {
    name: 'Chocolate Đá Xay',
    description: 'Chocolate Bỉ đậm vị đắng ngọt quyện cùng sữa tươi đá xay mát lạnh, phủ kem béo ngậy.',
    price: 59000,
    category: 'Đá xay',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
    sizes: [
      { size: 'M', priceAdjustment: 0 },
      { size: 'L', priceAdjustment: 9000 },
    ],
    toppings: [
      { name: 'Thêm sốt socola', price: 5000 },
      { name: 'Bánh Oreo nghiền', price: 8000 },
    ],
    isAvailable: true,
    isFeatured: false,
  },
  {
    name: 'Bánh Croissant Bơ Tỏi',
    description: 'Bánh sừng bò ngàn lớp thơm phức mùi bơ và sốt tỏi nướng thơm lừng giòn tan.',
    price: 29000,
    category: 'Bánh ngọt',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    sizes: [],
    toppings: [],
    isAvailable: true,
    isFeatured: false,
  },
  {
    name: 'Bánh Tiramisu truyền thống',
    description: 'Bánh kem lạnh vị cà phê và rượu nhẹ thơm ngon, mềm mịn tan ngay trong miệng.',
    price: 38000,
    category: 'Bánh ngọt',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
    sizes: [],
    toppings: [],
    isAvailable: true,
    isFeatured: true,
  },
];

const customerNames = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Hoàng Long',
  'Phạm Minh Đức',
  'Hoàng Khánh Vy',
  'Vũ Quốc Anh',
  'Đặng Mỹ Linh',
  'Bùi Hữu Nghĩa',
  'Phan Thanh Thảo',
  'Đỗ Gia Bảo',
];

const addresses = [
  '123 Nguyễn Huệ, Quận 1, TP. HCM',
  '456 Lê Lợi, Quận 1, TP. HCM',
  '789 Điện Biên Phủ, Bình Thạnh, TP. HCM',
  '12 Trần Hưng Đạo, Quận 5, TP. HCM',
  '34 Cách Mạng Tháng 8, Quận 3, TP. HCM',
  '56 Nguyễn Thị Minh Khai, Quận 1, TP. HCM',
  '78 Phan Đăng Lưu, Phú Nhuận, TP. HCM',
  '90 Võ Văn Kiệt, Quận 2, TP. HCM',
];

const seedDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/phuclong_milktea'
    );
    console.log('MongoDB Connected for seeding...');

    // Clear existing collections
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Coupon.deleteMany();

    try {
      await User.collection.dropIndexes();
      console.log('Cleared existing indexes on users collection.');
    } catch (err) {
      console.log('No indexes to drop.');
    }

    // 1. Admin User
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      isMasterAdmin: true,
    });
    await adminUser.save();
    console.log('Admin user created (admin / admin123)');

    // 2. Customer Users
    const customers = [
      { username: 'Nguyễn Văn An', email: 'nguyenvanan@gmail.com', phone: '0901234567', password: 'customer123', role: 'user' },
      { username: 'Trần Thị Bình', email: 'tranthibinh@gmail.com', phone: '0902345678', password: 'customer123', role: 'user' },
      { username: 'Lê Hoàng Long', email: 'lehoanglong@gmail.com', phone: '0903456789', password: 'customer123', role: 'user' },
      { username: 'Phạm Minh Đức', email: 'phamminhduc@gmail.com', phone: '0904567890', password: 'customer123', role: 'user' },
      { username: 'Hoàng Khánh Vy', email: 'hoangkhanhvy@gmail.com', phone: '0905678901', password: 'customer123', role: 'user' },
      { username: 'Vũ Quốc Anh', email: 'vuquocanh@gmail.com', phone: '0906789012', password: 'customer123', role: 'user' },
      { username: 'Đặng Mỹ Linh', email: 'dangmylinh@gmail.com', phone: '0907890123', password: 'customer123', role: 'user' },
      { username: 'Bùi Hữu Nghĩa', email: 'buihuunghia@gmail.com', phone: '0908901234', password: 'customer123', role: 'user' },
    ];
    const seededCustomerUsers = [];
    for (const c of customers) {
      const u = new User(c);
      await u.save();
      seededCustomerUsers.push(u);
    }
    console.log(`Seeded ${seededCustomerUsers.length} customer users!`);

    // 3. Products
    // Tạo createdAt/updatedAt so le để demo mục "Món Mới": món vừa thêm/cập nhật
    // sẽ hiện badge "MỚI · X giờ/ngày trước" ở trang chủ (trong 14 ngày gần nhất).
    const productNow = Date.now();
    const productHourMs = 60 * 60 * 1000;
    const recencyOffsetsHours = [2, 26, 50, 74, 96, 150, 320, 440, 520];
    const productsWithTime = products.map((p, i) => {
      const t = new Date(productNow - recencyOffsetsHours[i % recencyOffsetsHours.length] * productHourMs);
      return { ...p, createdAt: t, updatedAt: t };
    });
    const seededProducts = await Product.insertMany(productsWithTime);
    console.log(`Seeded ${seededProducts.length} products!`);

    // 4. Coupons
    const coupons = [
      {
        code: 'PHUCLONG10',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscountAmount: 30000,
        minOrderAmount: 100000,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'KM50K',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderAmount: 200000,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'XUAN2026',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 100000,
        minOrderAmount: 150000,
        expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ];
    await Coupon.insertMany(coupons);
    console.log('Coupons seeded successfully!');

    // 5. Orders (historical analytics)
    const statuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Processing', 'Pending', 'Cancelled'];
    const ordersToSeed = [];

    for (let day = 0; day < 30; day++) {
      const ordersToday = Math.floor(Math.random() * 3);
      for (let o = 0; o < ordersToday; o++) {
        const numItems = Math.floor(Math.random() * 2) + 1;
        const items = [];
        let itemsSubtotal = 0;

        for (let i = 0; i < numItems; i++) {
          const prod = seededProducts[Math.floor(Math.random() * seededProducts.length)];
          const size = prod.sizes && prod.sizes.length > 0 ? prod.sizes[Math.floor(Math.random() * prod.sizes.length)] : null;
          const topping = prod.toppings && prod.toppings.length > 0 && Math.random() > 0.5 ? prod.toppings[Math.floor(Math.random() * prod.toppings.length)] : null;

          const sizeName = size ? size.size : 'M';
          const sizeAdj = size ? size.priceAdjustment : 0;
          const toppingsList = topping ? [{ name: topping.name, price: topping.price }] : [];
          const toppingPrice = topping ? topping.price : 0;

          const itemUnitPrice = prod.price + sizeAdj + toppingPrice;
          const qty = Math.floor(Math.random() * 2) + 1;

          items.push({
            product: prod._id,
            name: prod.name,
            price: itemUnitPrice,
            size: sizeName,
            toppings: toppingsList,
            quantity: qty,
          });

          itemsSubtotal += itemUnitPrice * qty;
        }

        let couponCode = null;
        let discountAmount = 0;
        if (Math.random() > 0.6 && itemsSubtotal >= 100000) {
          couponCode = 'PHUCLONG10';
          discountAmount = Math.round(itemsSubtotal * 0.1);
        }

        const deliveryFee = itemsSubtotal >= 150000 ? 0 : 20000;
        const totalAmount = itemsSubtotal - discountAmount + deliveryFee;

        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - day);
        orderDate.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0);

        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const randomCustomer = seededCustomerUsers[Math.floor(Math.random() * seededCustomerUsers.length)];

        ordersToSeed.push({
          user: randomCustomer._id,
          customerName: randomCustomer.username,
          customerPhone: randomCustomer.phone,
          shippingAddress: addresses[Math.floor(Math.random() * addresses.length)],
          notes: Math.random() > 0.7 ? 'Giao nhanh giúp mình' : '',
          items,
          totalAmount,
          status,
          couponCode,
          discountAmount,
          createdAt: orderDate,
          updatedAt: orderDate,
        });
      }
    }

    ordersToSeed.sort((a, b) => a.createdAt - b.createdAt);
    await Order.insertMany(ordersToSeed);
    console.log(`Seeded ${ordersToSeed.length} historical orders!`);

    mongoose.connection.close();
    console.log('Database connection closed. Seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDB();
