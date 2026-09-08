import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import ProductCustomizeModal from '../../components/ProductCustomizeModal';
import { useCart } from '../../context/CartContext';
import './Menu.css';

// Giúp demo offline: vài sản phẩm fallback có thời gian tạo gần đây (hiện badge MỚI)
const menuHoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

// Fallback menu data in case the database is not seeded/running
const FALLBACK_PRODUCTS = [
  {
    _id: 'fb-ts-1',
    name: 'Trà Sữa Phúc Long',
    description: 'Trà sữa Phúc Long đậm vị trà đặc trưng kết hợp cùng sữa béo ngậy hảo hạng.',
    price: 45000,
    category: 'Trà sữa',
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 7000 }],
    toppings: [
      { name: 'Trân châu hoàng kim', price: 10000 },
      { name: 'Trân châu đen', price: 8000 },
      { name: 'Kem phô mai (Cheese Foam)', price: 12000 }
    ],
    isAvailable: true,
    isFeatured: true,
    createdAt: menuHoursAgo(2),
    updatedAt: menuHoursAgo(2)
  },
  {
    _id: 'fb-ts-2',
    name: 'Trà Thiết Quan Âm',
    description: 'Hương vị trà Thiết Quan Âm thanh tao kết hợp cùng sữa béo nhẹ ngọt thanh thơm mát.',
    price: 48000,
    category: 'Trà sữa',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 7000 }],
    toppings: [{ name: 'Trân châu hoàng kim', price: 10000 }, { name: 'Thạch nha đam', price: 8000 }],
    isAvailable: true
  },
  {
    _id: 'fb-tc-1',
    name: 'Trà Đào Phúc Long',
    description: 'Trà đen đậm đà kết hợp với syrup đào thanh ngọt và những miếng đào giòn thơm.',
    price: 50000,
    category: 'Trà trái cây',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 8000 }],
    toppings: [{ name: 'Thạch đào', price: 10000 }, { name: 'Thạch nha đam', price: 8000 }],
    isAvailable: true,
    isFeatured: true,
    createdAt: menuHoursAgo(26),
    updatedAt: menuHoursAgo(26)
  },
  {
    _id: 'fb-tc-2',
    name: 'Trà Nhãn Sen',
    description: 'Sự kết hợp tinh tế giữa hồng trà thanh nhẹ, hạt sen bùi bùi và nhãn lồng ngọt lịm.',
    price: 55000,
    category: 'Trà trái cây',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 7000 }],
    toppings: [{ name: 'Hạt sen thêm', price: 12000 }, { name: 'Thạch nha đam', price: 8000 }],
    isAvailable: true
  },
  {
    _id: 'fb-cf-1',
    name: 'Cà Phê Sữa Đá',
    description: 'Cà phê Espresso Robusta nguyên chất từ Tây Nguyên quyện cùng sữa đặc béo ngậy truyền thống.',
    price: 35000,
    category: 'Cà phê',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 6000 }],
    toppings: [{ name: 'Thạch cà phê', price: 8000 }],
    isAvailable: true,
    isFeatured: true
  },
  {
    _id: 'fb-dx-1',
    name: 'Matcha Đá Xay',
    description: 'Bột trà xanh Nhật Bản cao cấp đá xay mát lạnh, phủ kem tươi mịn màng.',
    price: 59000,
    category: 'Đá xay',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 9000 }],
    toppings: [{ name: 'Trân châu đường đen', price: 10000 }],
    isAvailable: true,
    isFeatured: true,
    createdAt: menuHoursAgo(150),
    updatedAt: menuHoursAgo(150)
  },
  {
    _id: 'fb-bn-1',
    name: 'Bánh Croissant Bơ Tỏi',
    description: 'Bánh sừng bò ngàn lớp thơm phức mùi bơ và sốt tỏi nướng thơm lừng giòn tan.',
    price: 29000,
    category: 'Bánh ngọt',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    sizes: [],
    toppings: [],
    isAvailable: true
  },
  {
    _id: 'fb-bn-2',
    name: 'Bánh Tiramisu',
    description: 'Bánh kem lạnh vị cà phê và rượu nhẹ thơm ngon, mềm mịn tan ngay trong miệng.',
    price: 38000,
    category: 'Bánh ngọt',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
    sizes: [],
    toppings: [],
    isAvailable: true,
    isFeatured: true
  }
];

const CATEGORIES = ['Tất cả', 'Trà sữa', 'Trà trái cây', 'Cà phê', 'Đá xay', 'Bánh ngọt'];

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        if (response.data && response.data.success) {
          setProducts(response.data.data);
        }
      } catch (error) {
        console.warn('Backend connection failed, loading fallback menu data.');
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter and search products
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'Tất cả' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="menu-page animate-fade-in">
      {/* Banner */}
      <section className="menu-hero-section">
        <div className="container menu-hero-container">
          <div className="menu-hero-content">
            <span className="menu-hero-subtitle">Thực Đơn Phúc Long</span>
            <h1 className="menu-hero-title">
              Thực Đơn Phúc Long <br />
              <span className="text-gold">Hương Vị Đậm Đà</span>
            </h1>
            <p className="menu-hero-desc">
              Khám phá bộ sưu tập đồ uống mang hương vị đậm đà và đặc trưng của chúng tôi. Lựa chọn từ những búp trà tươi non nhất tại các nông trường trà Bảo Lộc trứ danh.
            </p>
          </div>
          <div className="menu-hero-image-wrapper">
            <div className="menu-hero-image-bg-glow"></div>
            <img 
              src="https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&auto=format&fit=crop&q=80" 
              alt="Phuc Long Menu Banner" 
              className="menu-hero-image"
            />
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="menu-filter-section">
        <div className="container">
          <div className="filter-search-wrapper">
            {/* Search Input */}
            <div className="search-bar">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Tìm kiếm đồ uống..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Categories Navigation */}
            <div className="category-tabs-container">
              <div className="category-tabs">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    className={`category-tab-btn ${activeCategory === category ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="menu-grid-section">
        <div className="container">
          {loading ? (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="menu-grid">
              {filteredProducts.map(product => (
                <div key={product._id} className="menu-item-animate">
                  <ProductCard 
                    product={product} 
                    onSelect={(p) => setSelectedProduct(p)} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products-found">
              <SlidersHorizontal size={48} className="no-products-icon" />
              <h3>Không tìm thấy sản phẩm</h3>
              <p>Vui lòng thử tìm kiếm bằng từ khóa khác hoặc thay đổi bộ lọc danh mục.</p>
              <button className="btn btn-outline" onClick={() => { setSearchQuery(''); setActiveCategory('Tất cả'); }}>
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Customization Modal */}
      {selectedProduct && (
        <ProductCustomizeModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
};

export default Menu;
