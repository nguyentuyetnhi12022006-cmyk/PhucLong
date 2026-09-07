import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, CheckCircle, ArrowLeft, ClipboardList, MapPin, User, Phone, CreditCard, QrCode, Copy, Check, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import QRPaymentModal from '../../components/QRPaymentModal';
import './Checkout.css';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Pre-fill name and phone if logged in
  useEffect(() => {
    if (user) {
      if (user.phone) {
        setCustomerPhone(user.phone);
      } else {
        const isPhone = /^\+?[0-9\s\-()]{9,15}$/.test(user.username);
        if (isPhone) {
          setCustomerPhone(user.username);
        }
      }

      const isEmail = user.username.includes('@');
      const isPhoneUsername = /^\+?[0-9\s\-()]{9,15}$/.test(user.username);
      if (!isEmail && !isPhoneUsername) {
        setCustomerName(user.username);
      }
    }
  }, [user]);

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState([]);

  // Fetch active coupons for quick selection
  useEffect(() => {
    const fetchActiveCoupons = async () => {
      try {
        const response = await api.get('/coupons/active');
        if (response.data.success) {
          setActiveCoupons(response.data.data);
        }
      } catch (err) {
        console.warn('Could not fetch active coupons:', err.message);
      }
    };
    fetchActiveCoupons();
  }, []);

  const handleApplyCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const response = await api.post('/coupons/validate', {
        code: couponCode.trim().toUpperCase(),
        orderAmount: cartTotal,
      });
      if (response.data.success) {
        const { code: verifiedCode, discountAmount: amt } = response.data.data;
        setAppliedCoupon(verifiedCode);
        setDiscountAmount(amt);
        setCouponSuccess(`Áp dụng mã ${verifiedCode} thành công! Giảm ${formatPrice(amt)}.`);
      }
    } catch (err) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponError(err.response?.data?.message || 'Áp dụng mã giảm giá thất bại.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSelectQuickCoupon = async (code) => {
    setCouponCode(code);
    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const response = await api.post('/coupons/validate', {
        code: code.trim().toUpperCase(),
        orderAmount: cartTotal,
      });
      if (response.data.success) {
        const { code: verifiedCode, discountAmount: amt } = response.data.data;
        setAppliedCoupon(verifiedCode);
        setDiscountAmount(amt);
        setCouponSuccess(`Áp dụng mã ${verifiedCode} thành công! Giảm ${formatPrice(amt)}.`);
      }
    } catch (err) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponError(err.response?.data?.message || 'Áp dụng mã giảm giá thất bại.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const deliveryFee = cartTotal >= 150000 ? 0 : 20000;
  const finalTotal = Math.max(0, cartTotal + deliveryFee - discountAmount);

  // Format price to VND
  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || !customerPhone || !shippingAddress) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setSubmitting(true);
    setError('');

    const orderData = {
      user: user ? (user._id || user.id) : undefined,
      customerName,
      customerPhone,
      shippingAddress,
      notes,
      items: cart.map(item => ({
        product: item.product,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        toppings: item.toppings
      })),
      totalAmount: finalTotal,
      couponCode: appliedCoupon,
      discountAmount: discountAmount,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'QR' ? 'Pending' : 'Pending',
    };

    const saveOrderToLocalStorage = (newOrder) => {
      try {
        const existing = JSON.parse(localStorage.getItem('pl_orders_history') || '[]');
        const updated = [newOrder, ...existing.filter(o => o._id !== newOrder._id)];
        localStorage.setItem('pl_orders_history', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not save order to local storage:', err);
      }
    };

    try {
      const endpoint = user ? '/orders' : '/orders/guest';
      const response = await api.post(endpoint, orderData);
      if (response.data.success) {
        setCreatedOrder(response.data.data);
        saveOrderToLocalStorage(response.data.data);
        setOrderSuccess(true);
        clearCart();
      }
    } catch (err) {
      // Never simulate a successful order. Surface the real error and keep the cart.
      console.error('Checkout failed:', err);
      const msg = err.response?.data?.message || 'Không thể đặt hàng ngay lúc này. Vui lòng thử lại.';
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (orderSuccess && createdOrder) {
    return (
      <div className="checkout-page checkout-success-state animate-fade-in">
        <div className="container success-container">
          <div className="success-card">
            <div className="success-icon-box">
              <CheckCircle size={56} />
            </div>
            <h2>Đặt Hàng Thành Công!</h2>
            <p className="success-subtext">Cảm ơn bạn đã lựa chọn Phúc Long. Đơn hàng của bạn đã được tiếp nhận và đang xử lý.</p>

            <div className="order-details-summary-box">
              <div className="order-summary-row">
                <span>Mã đơn hàng:</span>
                <span className="order-summary-value highlight-id">{createdOrder._id}</span>
              </div>
              <div className="order-summary-row">
                <span>Khách hàng:</span>
                <span className="order-summary-value">{createdOrder.customerName}</span>
              </div>
              <div className="order-summary-row">
                <span>Số điện thoại:</span>
                <span className="order-summary-value">{createdOrder.customerPhone}</span>
              </div>
              <div className="order-summary-row">
                <span>Phương thức thanh toán:</span>
                <span className="order-summary-value font-semibold text-primary">
                  {createdOrder.paymentMethod === 'QR' ? '📱 Thanh toán Mã QR (VietQR)' : '💵 Thanh toán khi nhận hàng (COD)'}
                </span>
              </div>
              <div className="order-summary-row">
                <span>Trạng thái thanh toán:</span>
                <span className={`order-summary-value font-semibold ${createdOrder.paymentStatus === 'Paid' ? 'text-success' : 'text-warning'}`}>
                  {createdOrder.paymentStatus === 'Paid'
                    ? '🟢 THANH TOÁN THÀNH CÔNG'
                    : createdOrder.paymentStatus === 'AwaitingConfirm'
                      ? '🟡 ĐÃ CHUYỂN KHOẢN — CHỜ XÁC NHẬN'
                      : '🟡 CHƯA THANH TOÁN'}
                </span>
              </div>
              <div className="order-summary-row">
                <span>Địa chỉ giao:</span>
                <span className="order-summary-value">{createdOrder.shippingAddress}</span>
              </div>
              <div className="order-summary-row total-sum-row">
                <span>Tổng tiền thanh toán:</span>
                <span className="order-summary-value order-total-value">{formatPrice(createdOrder.totalAmount)}</span>
              </div>
            </div>

            {/* QR Payment Code display box if QR method chosen */}
            {createdOrder.paymentMethod === 'QR' && (
              <div style={{ width: '100%', marginBottom: '24px' }}>
                <QRPaymentModal
                  amount={createdOrder.totalAmount}
                  orderId={createdOrder._id}
                  customerPhone={createdOrder.customerPhone}
                  isInline={true}
                  initialPaymentStatus={createdOrder.paymentStatus}
                />
              </div>
            )}

            <div className="success-actions">
              <Link to={`/profile?tab=track&id=${createdOrder._id}`} className="btn btn-primary btn-track-order-success">
                <Search size={18} /> Theo Dõi Trạng Thái Đơn Hàng
              </Link>
              <Link to="/menu" className="btn btn-outline">Tiếp Tục Mua Sắm</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Redirect if cart is empty and not checked out
  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="checkout-page animate-fade-in">
        <div className="container empty-checkout-container">
          <div className="empty-checkout-card">
            <ClipboardList size={48} className="empty-icon" />
            <h2>Không có sản phẩm để thanh toán</h2>
            <p>Giỏ hàng của bạn hiện đang trống. Hãy chọn một vài ly trà sữa thơm ngon rồi quay lại nhé.</p>
            <Link to="/menu" className="btn btn-primary">Quay lại thực đơn</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page animate-fade-in">
      <div className="container checkout-container">
        <div className="checkout-header">
          <Link to="/cart" className="btn-back-to-cart">
            <ArrowLeft size={18} /> Quay lại giỏ hàng
          </Link>
          <h1 className="checkout-title">Thanh Toán Đơn Hàng</h1>
        </div>

        <div className="checkout-grid">
          {/* Left: Shipping Form */}
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit} className="checkout-form">
              <h2 className="form-section-title"><MapPin size={20} /> Thông Tin Giao Hàng</h2>

              {error && <div className="checkout-error-msg">{error}</div>}

              <div className="form-group">
                <label htmlFor="name">Họ và Tên *</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="name"
                    placeholder="Nhập tên người nhận"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số Điện Thoại *</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    id="phone"
                    placeholder="Nhập số điện thoại"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Địa Chỉ Nhận Hàng *</label>
                <div className="input-with-icon">
                  <MapPin size={18} className="input-icon" />
                  <textarea
                    id="address"
                    placeholder="Nhập địa chỉ giao hàng cụ thể (Số nhà, Tên đường, Phường/Xã, Quận/Huyện...)"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    required
                    rows="3"
                    className="form-control"
                  ></textarea>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Ghi Chú Đơn Hàng</label>
                <textarea
                  id="notes"
                  placeholder="Ghi chú thêm cho người chuẩn bị hoặc người giao hàng (e.g. Ít đá, giao giờ hành chính, gọi điện trước khi đến...)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  className="form-control"
                ></textarea>
              </div>

              <h2 className="form-section-title spacing-top"><CreditCard size={20} /> Phương Thức Thanh Toán</h2>
              <div className="payment-method-selector">
                <label className={`payment-method-card ${paymentMethod === 'COD' ? 'selected' : ''}`} onClick={() => setPaymentMethod('COD')}>
                  <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="payment-radio" />
                  <div className="payment-details">
                    <span className="payment-name">💵 Thanh toán khi nhận hàng (COD)</span>
                    <span className="payment-desc">Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận hàng.</span>
                  </div>
                </label>

                <label className={`payment-method-card ${paymentMethod === 'QR' ? 'selected' : ''}`} onClick={() => setPaymentMethod('QR')}>
                  <input type="radio" name="payment" checked={paymentMethod === 'QR'} onChange={() => setPaymentMethod('QR')} className="payment-radio" />
                  <div className="payment-details">
                    <span className="payment-name">📱 Thanh toán bằng Mã QR (VietQR / Ngân hàng)</span>
                    <span className="payment-desc">Quét mã QR chuyển khoản nhanh qua app Ngân hàng hoặc Ví điện tử.</span>
                  </div>
                </label>
              </div>

              {paymentMethod === 'QR' && (
                <div className="qr-preview-box" style={{ marginBottom: '24px' }}>
                  <div className="qr-box-header">
                    <QrCode size={18} /> Mã QR thanh toán (bước sau)
                  </div>
                  <p style={{ margin: 0, color: 'var(--color-text)' }}>
                    Mã QR thanh toán sẽ xuất hiện ngay sau khi bạn bấm <strong>Đặt Hàng</strong>.
                    Vui lòng điền đầy đủ thông tin giao hàng bên trên trước khi xác nhận thanh toán.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-place-order"
                disabled={submitting}
              >
                {submitting ? 'Đang Xử Lý...' : `Đặt Hàng - ${formatPrice(finalTotal)}`}
              </button>
            </form>
          </div>

          {/* Right: Order Review */}
          <div className="checkout-review-section">
            <div className="review-card">
              <h2 className="review-title"><ShoppingBag size={20} /> Tóm Tắt Đơn Hàng</h2>

              <div className="review-items-list">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="review-item">
                    <div className="review-item-main">
                      <span className="review-item-qty">{item.quantity}x</span>
                      <span className="review-item-name">{item.name} (Size {item.size})</span>
                      <span className="review-item-price">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    {item.toppings.length > 0 && (
                      <div className="review-item-toppings">
                        Toppings: {item.toppings.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="review-divider"></div>

              <div className="review-row">
                <span>Tạm tính</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="review-row">
                <span>Phí vận chuyển</span>
                <span>{deliveryFee === 0 ? 'Miễn phí' : formatPrice(deliveryFee)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="review-row discount-row text-success font-semibold">
                  <span>Khấu trừ ({appliedCoupon})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="review-divider"></div>

              {/* Coupon area */}
              <div className="coupon-apply-section">
                <label className="coupon-label">Mã Giảm Giá</label>
                <div className="coupon-input-group">
                  <input
                    type="text"
                    placeholder="Nhập mã..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={appliedCoupon !== null}
                    className="form-control coupon-input"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setDiscountAmount(0);
                        setCouponCode('');
                        setCouponSuccess('');
                      }}
                      className="btn btn-outline btn-remove-coupon"
                    >
                      Gỡ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode}
                      className="btn btn-primary btn-apply-coupon"
                    >
                      {validatingCoupon ? '...' : 'Áp dụng'}
                    </button>
                  )}
                </div>
                {couponError && <p className="coupon-message-text error">{couponError}</p>}
                {couponSuccess && <p className="coupon-message-text success">{couponSuccess}</p>}

                {/* Quick Coupon Pills Suggestions */}
                {activeCoupons.length > 0 && !appliedCoupon && (
                  <div className="quick-coupons-wrapper">
                    <span className="quick-coupons-label">Mã gợi ý (bấm chọn nhanh):</span>
                    <div className="quick-coupons-list">
                      {activeCoupons.map((cp) => (
                        <button
                          key={cp._id}
                          type="button"
                          className="quick-coupon-pill"
                          onClick={() => handleSelectQuickCoupon(cp.code)}
                          title={
                            cp.minOrderAmount > 0
                              ? `Đơn tối thiểu ${formatPrice(cp.minOrderAmount)}`
                              : ''
                          }
                        >
                          🏷️ <strong>{cp.code}</strong> (
                          {cp.discountType === 'percentage'
                            ? `-${cp.discountValue}%`
                            : `-${formatPrice(cp.discountValue)}`}
                          )
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="review-divider"></div>

              <div className="review-row total-row">
                <span>Tổng cộng</span>
                <span className="final-total-amount">{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
