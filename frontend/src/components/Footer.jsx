import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Footer.css';

const Footer = () => {
  const { user } = useAuth();
  const isCustomer = user && user.role !== 'admin';

  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Brand Info */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="logo-text-primary">PHÚC LONG</span>
            <span className="logo-text-secondary">TEA & COFFEE</span>
          </Link>
          <p className="footer-desc">
            Trải nghiệm tinh hoa trà sữa và cà phê Việt Nam hảo hạng từ năm 1968. Chúng tôi cam kết mang lại hương vị đậm đà, tự nhiên nhất trong từng giọt nước uống.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-links-section">
          <h3 className="footer-title">Liên Kết Nhanh</h3>
          <ul className="footer-links">
            <li><Link to="/">Trang Chủ</Link></li>
            <li><Link to="/menu">Thực Đơn</Link></li>
            <li><Link to="/cart">Giỏ Hàng</Link></li>
            <li><Link to={isCustomer ? "/profile?tab=track" : "/tracking"}>Tra Cứu Đơn Hàng</Link></li>
            <li><Link to="/privacy">Chính Sách & Quyền Riêng Tư</Link></li>
          </ul>
        </div>

        {/* Store Info / Hours */}
        <div className="footer-hours-section">
          <h3 className="footer-title">Giờ Mở Cửa</h3>
          <ul className="footer-info-list">
            <li>
              <Clock size={16} className="footer-icon" />
              <span>Thứ 2 - Chủ Nhật: 07:00 - 22:30</span>
            </li>
            <li>
              <MapPin size={16} className="footer-icon" />
              <span>425 An Dương Vương, Phường 3, Quận 5, TP. HCM</span>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-contact-section">
          <h3 className="footer-title">Liên Hệ</h3>
          <ul className="footer-info-list">
            <li>
              <Phone size={16} className="footer-icon" />
              <a href="tel:18006179">1800 6179 (Hotline)</a>
            </li>
            <li>
              <Mail size={16} className="footer-icon" />
              <a href="mailto:info@phuclong.com.vn">info@phuclong.com.vn</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-content">
          <p>&copy; {new Date().getFullYear()} Phuc Long Tea & Coffee. All rights reserved. Powered by Antigravity.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
