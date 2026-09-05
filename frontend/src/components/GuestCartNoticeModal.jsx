import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Zap, X, ShieldAlert } from 'lucide-react';
import './GuestCartNoticeModal.css';

const GuestCartNoticeModal = ({ isOpen, onClose, onContinueGuestCheckout }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLoginClick = () => {
    onClose();
    navigate('/login');
  };

  const handleGuestCheckoutClick = () => {
    onClose();
    if (onContinueGuestCheckout) {
      onContinueGuestCheckout();
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="modal-overlay guest-notice-overlay" onClick={onClose}>
      <div className="guest-notice-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <button className="guest-notice-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="guest-notice-badge-icon">
          <ShieldAlert size={30} />
        </div>

        <h3 className="guest-notice-title">Thông Báo Giỏ Hàng Lưu Trữ</h3>

        <p className="guest-notice-desc">
          Bạn đang chọn sản phẩm với tư cách <strong>Khách vãng lai</strong>. Vui lòng Đăng nhập hoặc Đăng ký tài khoản để giỏ hàng được tự động đồng bộ CSDL và lưu trữ lâu dài.
        </p>

        <div className="guest-notice-actions">
          {/* Button 1: Login / Register */}
          <button className="btn-guest-action btn-guest-login" onClick={handleLoginClick}>
            <UserCheck size={18} />
            <span>Đăng nhập / Đăng ký ngay</span>
          </button>

          {/* Button 2: Quick Guest Checkout (Buy Now) */}
          <button className="btn-guest-action btn-guest-buy" onClick={handleGuestCheckoutClick}>
            <Zap size={18} />
            <span>Tiếp tục mua nhanh (Mua ngay)</span>
          </button>
        </div>

        <div className="guest-notice-footer">
          <button className="btn-guest-skip" onClick={onClose}>
            Bỏ qua & tiếp tục chọn món
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestCartNoticeModal;
