import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Heart, Award, Shield, Lock, UserCheck, Search } from 'lucide-react';
import api from '../../services/api';

import ProductCustomizeModal from '../../components/ProductCustomizeModal';
import { useCart } from '../../context/CartContext';

import './Home.css';

// Giúp demo offline: vài sản phẩm fallback có thời gian tạo gần đây (hiện badge MỚI)
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

const FALLBACK_FEATURED = [
  {
    _id: 'fallback-1',
    name: 'Trà Sữa Phúc Long',
    description: 'Trà sữa Phúc Long đậm vị trà đặc trưng kết hợp cùng sữa béo ngậy hảo hạng.',
    price: 45000,
    category: 'Trà sữa',
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 7000 }],
    toppings: [{ name: 'Trân châu hoàng kim', price: 10000 }, { name: 'Kem phô mai', price: 12000 }],
    isAvailable: true,
    isFeatured: true,
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
  },
  {
    _id: 'fallback-2',
    name: 'Trà Đào Đặc Thơm',
    description: 'Trà đen đậm đà kết hợp với syrup đào thanh ngọt và những miếng đào giòn thơm.',
    price: 50000,
    category: 'Trà trái cây',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 8000 }],
    toppings: [{ name: 'Thạch đào', price: 10000 }, { name: 'Thạch nha đam', price: 8000 }],
    isAvailable: true,
    isFeatured: true,
    createdAt: hoursAgo(26),
    updatedAt: hoursAgo(26),
  },
  {
    _id: 'fallback-3',
    name: 'Trà Vải Lài',
    description: 'Hương vị lài nhẹ nhàng thanh khiết kết hợp cùng vị vải ngọt mọng nước.',
    price: 48000,
    category: 'Trà trái cây',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 7000 }],
    toppings: [{ name: 'Thạch nha đam', price: 8000 }],
    isAvailable: true,
    isFeatured: true,
    createdAt: hoursAgo(80),
    updatedAt: hoursAgo(80),
  },
  {
    _id: 'fallback-4',
    name: 'Cà Phê Sữa Đá',
    description: 'Cà phê phin truyền thống đậm đà, pha trộn hoàn hảo cùng sữa đặc béo ngậy.',
    price: 35000,
    category: 'Cà phê',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 6000 }],
    toppings: [{ name: 'Thạch cà phê', price: 8000 }],
    isAvailable: true,
    isFeatured: true,
  },
  {
    _id: 'fallback-5',
    name: 'Matcha Đá Xay',
    description: 'Bột trà xanh Nhật Bản cao cấp đá xay mát lạnh, phủ kem tươi mịn màng.',
    price: 59000,
    category: 'Đá xay',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    sizes: [{ size: 'M', priceAdjustment: 0 }, { size: 'L', priceAdjustment: 9000 }],
    toppings: [{ name: 'Trân châu đường đen', price: 10000 }],
    isAvailable: true,
    isFeatured: true,
  }
];

const FALLBACK_COUPONS = [
  {
    _id: 'fb-cp-1',
    code: 'PHUCLONGNEW',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 50000,
    isActive: true,
  },
  {
    _id: 'fb-cp-2',
    code: 'TEE30K',
    discountType: 'fixed',
    discountValue: 30000,
    minOrderAmount: 100000,
    isActive: true,
  }
];

const Home = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodResponse = await api.get('/products');
        if (prodResponse.data.success && prodResponse.data.data.length > 0) {
          setAllProducts(prodResponse.data.data);
        } else {
          setAllProducts(FALLBACK_FEATURED);
        }
      } catch (error) {
        console.warn('Backend connection failed, using fallback products.');
        setAllProducts(FALLBACK_FEATURED);
      }

      try {
        const couponResponse = await api.get('/coupons/active');
        if (couponResponse.data.success && couponResponse.data.data.length > 0) {
          setCoupons(couponResponse.data.data);
        } else {
          setCoupons(FALLBACK_COUPONS);
        }
      } catch (error) {
        setCoupons(FALLBACK_COUPONS);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Filter products for the top 5 ranking section
  const getTop5Products = () => {
    if (allProducts.length >= 5) {
      return allProducts.slice(0, 5);
    }
    const combined = [...allProducts];
    for (const fb of FALLBACK_FEATURED) {
      if (combined.length >= 5) break;
      if (!combined.some(p => p._id === fb._id || p.name === fb.name)) {
        combined.push(fb);
      }
    }
    return combined.slice(0, 5);
  };

  return (
    <div className="home-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-subtitle">Tinh Hoa Trà Việt</span>
            <h1 className="hero-title">
              Tinh Hoa Trà Việt <br />
              <span className="text-gold">Đậm Vị Mộc Mạc</span>
            </h1>
            <p className="hero-desc">
              Hơn 50 năm chắt lọc tinh hoa từ những búp trà xanh sạch Bảo Lộc và hạt cà phê chín mọng trứ danh đất Việt. Phúc Long đem tới hương vị đậm đà chân thực trong từng ngụm nước cho cả gia đình.
            </p>
            <div className="hero-buttons">
              <Link to="/menu" className="btn btn-secondary hero-btn-pill">
                Đặt nước ngay <ArrowRight size={18} />
              </Link>
              <Link to="/menu" className="btn btn-outline hero-btn-outline hero-btn-pill">
                Khám phá thực đơn
              </Link>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <div className="hero-image-bg-glow"></div>
            <img
              src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80"
              alt="Signature Phuc Long Tea"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="explore-categories-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Danh Mục Thực Đơn</span>
            <h2 className="section-title">Khám phá hương vị đặc trưng</h2>
            <div className="section-divider"></div>
          </div>

          <div className="categories-explore-grid">
            <Link to="/menu" className="explore-cat-card">
              <div className="explore-cat-img-box">
                <img src="https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=80" alt="Trà sữa" />
              </div>
              <div className="explore-cat-content">
                <h3>Trà Sữa Hảo Hạng</h3>
                <p>Hương vị trà đen đậm đà hòa quyện cùng sữa béo ngậy chuẩn vị.</p>
              </div>
            </Link>

            <Link to="/menu" className="explore-cat-card">
              <div className="explore-cat-img-box">
                <img src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80" alt="Trà trái cây" />
              </div>
              <div className="explore-cat-content">
                <h3>Trà Trái Cây Tươi</h3>
                <p>Thanh nhiệt tức thì với các loại mứt trái cây tự nhiên kết hợp topping giòn ngọt.</p>
              </div>
            </Link>

            <Link to="/menu" className="explore-cat-card">
              <div className="explore-cat-img-box">
                <img src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80" alt="Cà phê" />
              </div>
              <div className="explore-cat-content">
                <h3>Cà Phê Rang Mộc</h3>
                <p>Hạt Arabica & Robusta Đắk Lắk rang xay nguyên bản đậm gu truyền thống.</p>
              </div>
            </Link>

            <Link to="/menu" className="explore-cat-card">
              <div className="explore-cat-img-box">
                <img src="https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80" alt="Đá xay" />
              </div>
              <div className="explore-cat-content">
                <h3>Thức Uống Đá Xay</h3>
                <p>Ngọt ngào, mát lạnh sảng khoái với lớp kem béo mịn màng phủ bên trên.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="values-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Giá Trị Cốt Lõi</span>
            <h2 className="section-title">Tại sao khách hàng luôn tin dùng trà & cà phê của chúng tôi?</h2>
            <div className="section-divider"></div>
          </div>

          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon-box">
                <Leaf size={32} />
              </div>
              <h3 className="value-title">Hương Vị Hảo Hạng</h3>
              <p className="value-desc">Nguyên liệu lá trà được thu hoạch thủ công tại các nông trường trà Bảo Lộc trứ danh.</p>
            </div>

            <div className="value-card">
              <div className="value-icon-box">
                <Shield size={32} />
              </div>
              <h3 className="value-title">Vệ Sinh An Toàn</h3>
              <p className="value-desc">Quy trình chế biến khép kín, sạch sẽ đảm bảo giữ trọn vị trà và cực kỳ an toàn sức khỏe.</p>
            </div>

            <div className="value-card">
              <div className="value-icon-box">
                <Heart size={32} />
              </div>
              <h3 className="value-title">Giao Hàng Siêu Tốc</h3>
              <p className="value-desc">Chỉ mất từ 15-30 phút để ly nước mát lạnh được chuyển đến tận nhà của bạn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Guest Order Banner Section */}
      <section className="home-privacy-banner-section">
        <div className="container">
          <div className="home-privacy-card">
            <div className="privacy-card-left">
              <span className="privacy-card-tag"><ShieldCheck size={16} /> CAM KẾT BẢO MẬT & TIỆN ÍCH KHÁCH HÀNG</span>
              <h2 className="privacy-card-title">Mua Sắm Dễ Dàng - Không Cần Đăng Nhập</h2>
              <p className="privacy-card-desc">
                Phúc Long tôn trọng quyền riêng tư của bạn. Khách chưa đăng nhập có thể dễ dàng duyệt menu, áp mã giảm giá và <strong>Đặt hàng bình thường</strong>. Để xem & theo dõi trạng thái đơn hàng (Đã giao / Chưa giao), quý khách vui lòng <strong>Đăng Nhập</strong> tài khoản.
              </p>
              <div className="privacy-features-list">
                <div className="p-feat-item">
                  <UserCheck size={18} className="feat-icon" />
                  <span>Cho phép Khách vãng lai đặt hàng nhanh không cần tài khoản</span>
                </div>
                <div className="p-feat-item">
                  <Search size={18} className="feat-icon" />
                  <span>Theo dõi tiến trình đơn hàng (Đang giao / Đã giao) sau khi Đăng Nhập</span>
                </div>
                <div className="p-feat-item">
                  <Lock size={18} className="feat-icon" />
                  <span>Bảo mật tuyệt đối dữ liệu cá nhân & thanh toán Mã QR VietQR</span>
                </div>
              </div>
              <div className="privacy-card-actions">
                <Link to="/privacy" className="btn btn-primary">
                  Xem Chi Tiết Chính Sách Bảo Mật <ArrowRight size={16} />
                </Link>
                <Link to="/tracking" className="btn btn-outline">
                  <Search size={16} /> Tra Cứu Đơn Hàng Ngay
                </Link>
              </div>
            </div>
            <div className="privacy-card-right">
              <div className="privacy-card-badge-box">
                <ShieldCheck size={48} className="badge-shield-icon" />
                <h3>100% An Toàn & Bảo Mật</h3>
                <p>Thông tin cá nhân được mã hóa và bảo vệ theo tiêu chuẩn nghiêm ngặt nhất.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top 5 Drinks Ranking Section */}
      <section className="top-ranking-section">
        <div className="container">
          <div className="section-header">
            <span className="ranking-badge-pill">BẢNG XẾP HẠNG YÊU THÍCH</span>
            <h2 className="section-title">Top 5 Đồ Uống Bán Chạy Nhất</h2>
            <div className="section-divider"></div>
          </div>

          <div className="ranking-cards-scroll-container">
            {getTop5Products().map((product, index) => (
              <div className="rank-card" key={product._id} onClick={() => setSelectedProduct(product)}>
                <img src={product.image || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80'} alt={product.name} className="rank-card-img" />
                <div className="rank-card-overlay"></div>
                <span className="rank-number">{index + 1}</span>
                <div className="rank-card-info">
                  <h4 className="rank-card-name">{product.name}</h4>
                  <p className="rank-card-price">{formatPrice(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Heritage Section (Câu chuyện thương hiệu - GIỮ LẠI) */}
      <section className="heritage-section">
        <div className="container heritage-container">
          <div className="heritage-image-wrapper">
            <img
              src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80"
              alt="Tea Harvest"
              className="heritage-image"
            />
          </div>
          <div className="heritage-content">
            <span className="heritage-subtitle">Câu Chuyện Thương Hiệu</span>
            <h2 className="heritage-title">Tinh Hoa Từ Những Đồi Trà Xanh Mướt</h2>
            <p className="heritage-desc">
              Hành trình của Phuc Long bắt đầu từ những năm 1968 tại Bảo Lộc - Lâm Đồng, nơi khí hậu mát mẻ quanh năm cực kỳ thích hợp cho cây trà phát triển.
            </p>
            <p className="heritage-desc">
              Chúng tôi luôn tin rằng giá trị thực sự của một ly trà nằm ở hương thơm nguyên bản và hậu vị ngọt sâu lắng. Đó là lí do vì sao Phuc Long luôn gìn giữ phương pháp rang xay mộc truyền thống kết hợp công nghệ hiện đại.
            </p>
            <Link to="/menu" className="btn btn-outline">Tìm hiểu thêm</Link>
          </div>
        </div>
      </section>

      {/* Store Location Map Section (Bản đồ địa chỉ quán - GIỮ LẠI) */}
      <section className="store-location-section animate-fade-in">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Ghé Thăm Cửa Hàng</span>
            <h2 className="section-title">Địa Chỉ Cửa Hàng Phúc Long</h2>
            <div className="section-divider"></div>
          </div>

          <div className="store-location-grid">
            <div className="store-info-card">
              <div className="store-info-header">
                <h3 className="store-branch-title">Phúc Long Lê Lợi</h3>
                <span className="store-status-badge">Đang mở cửa</span>
              </div>

              <div className="store-details-list">
                <div className="store-detail-item">
                  <span className="detail-icon">📍</span>
                  <div className="detail-text">
                    <strong>Địa chỉ:</strong>
                    <p>123 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
                  </div>
                </div>
                <div className="store-detail-item">
                  <span className="detail-icon">📞</span>
                  <div className="detail-text">
                    <strong>Hotline đặt hàng:</strong>
                    <p>1900 2345 (Hỗ trợ 7:00 - 22:00)</p>
                  </div>
                </div>
                <div className="store-detail-item">
                  <span className="detail-icon">⏰</span>
                  <div className="detail-text">
                    <strong>Giờ hoạt động:</strong>
                    <p>Thứ 2 - Chủ nhật: 07:00 - 22:30</p>
                  </div>
                </div>
                <div className="store-detail-item">
                  <span className="detail-icon">✉️</span>
                  <div className="detail-text">
                    <strong>Email phản hồi:</strong>
                    <p>info@phuclong.com.vn</p>
                  </div>
                </div>
              </div>

              <div className="store-info-footer">
                <a
                  href="https://maps.google.com/?q=123+Nguyễn+Huệ+Quận+1+TP+Hồ+Chí+Minh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-get-directions"
                >
                  Chỉ Đường Trên Google Maps
                </a>
              </div>
            </div>

            <div className="store-map-wrapper">
              <iframe
                title="Phúc Long Coffee & Tea Nguyễn Huệ Store Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.460232426305!2d106.70104791483321!3d10.776019892321876!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f40a50b8579%3A0x20afbc0754e3c6a!2zMTIzIE5ndXnhu4VuIEh14buHLCBC4bq_biBOZ2jDqSwgUXXhuq1uIDEsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1680000000000!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="store-map-iframe"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions & Membership Section (Ưu đãi & Tích điểm - Layout giống ảnh 3) */}
      <section className="promo-membership-section">
        <div className="container promo-membership-container">
          <div className="promo-membership-left">
            <span className="promo-membership-tag">✨ Đặc Quyền Thành Viên Phúc Long</span>
            <h2 className="promo-membership-title">Đặt hàng ngay nhận ưu đãi Và tích điểm thăng hạng thành viên</h2>
            <p className="promo-membership-desc">
              Mỗi đơn hàng giao dịch thành công tích lũy điểm thưởng thăng hạng thành viên để nhận tự động giảm giá đến 15% trọn đời. Áp dụng song song với các mã giảm giá hiện có.
            </p>
          </div>

          <div className="promo-membership-right">
            {coupons.map((coupon) => (
              <div className="promo-coupon-card" key={coupon._id}>
                <div className="coupon-card-body">
                  <span className="coupon-card-value">
                    {coupon.discountType === 'percentage' ? `Giảm ${coupon.discountValue}%` : `Giảm ${formatPrice(coupon.discountValue)}`}
                  </span>
                  <p className="coupon-card-limit">Đơn hàng tối thiểu {coupon.minOrderAmount >= 1000 ? `${coupon.minOrderAmount / 1000}k` : formatPrice(coupon.minOrderAmount)}</p>
                  <div className="coupon-code-row">
                    <span className="coupon-code-pill font-mono">{coupon.code}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Customization Modal */}
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

export default Home;
