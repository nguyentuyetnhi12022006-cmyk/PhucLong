import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, PackageCheck, Clock, Coffee, Truck, CheckCircle2, XCircle, MapPin, Phone, User, CreditCard, Tag, QrCode, AlertCircle, Copy, Check, Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './OrderTracking.css';

const OrderTracking = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [searchInput, setSearchInput] = useState(initialId || initialPhone || '');
  const [searchType, setSearchType] = useState(initialId ? 'id' : initialPhone ? 'phone' : 'id');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [txLoading, setTxLoading] = useState(null);
  const [txPending, setTxPending] = useState(null);
  const [txDone, setTxDone] = useState(null);
  const [txError, setTxError] = useState(null);

  const fetchTracking = async (queryVal) => {
    const rawVal = queryVal ? queryVal.toString().trim() : '';
    const cleanVal = rawVal.replace(/^#/, '').trim();

    if (!cleanVal) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      // Query backend with q parameter
      const res = await api.get(`/orders/track?q=${encodeURIComponent(cleanVal)}`);
      if (res.data.success && res.data.data.length > 0) {
        setOrders(res.data.data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend tracking request failed, checking local storage history:', err.message);
    }

    // Fallback: check localStorage for local/mock orders or offline mode
    try {
      const localOrders = JSON.parse(localStorage.getItem('pl_orders_history') || '[]');
      const lowerVal = cleanVal.toLowerCase();
      const cleanDigits = cleanVal.replace(/\D/g, '');
      const targetSuffix = cleanDigits.length >= 8 ? cleanDigits.slice(-9) : cleanDigits;

      const matched = localOrders.filter(o => {
        const idStr = o._id ? o._id.toString().toLowerCase() : '';
        const rawPhone = o.customerPhone ? o.customerPhone.toString() : '';
        const phoneDigits = rawPhone.replace(/\D/g, '');
        const oPhoneSuffix = phoneDigits.length >= 8 ? phoneDigits.slice(-9) : phoneDigits;
        const nameStr = o.customerName ? o.customerName.toString().toLowerCase() : '';

        if (idStr.includes(lowerVal)) return true;
        if (rawPhone.toLowerCase().includes(lowerVal)) return true;
        if (targetSuffix && targetSuffix.length >= 7 && (phoneDigits.includes(targetSuffix) || oPhoneSuffix.includes(targetSuffix))) return true;
        if (lowerVal.length >= 2 && nameStr.includes(lowerVal)) return true;
        return false;
      });

      if (matched.length > 0) {
        setOrders(matched);
      } else {
        setOrders([]);
        setError('Không tìm thấy thông tin đơn hàng phù hợp. Vui lòng kiểm tra lại SĐT hoặc Mã đơn.');
      }
    } catch (err) {
      setError('Không tìm thấy thông tin đơn hàng phù hợp.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto trigger search on mount if URL params exist
  useEffect(() => {
    if (!isAuthenticated) return;
    const q = initialId || initialPhone;
    if (q) {
      setSearchInput(q);
      fetchTracking(q);
    }
  }, [initialId, initialPhone, isAuthenticated]);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = searchInput.trim().replace(/^#/, '');
    if (!clean) {
      setError('Vui lòng nhập Mã đơn hàng hoặc Số điện thoại để tra cứu.');
      return;
    }
    const isPhone = /^\+?[0-9\s\-()]{8,15}$/.test(clean);
    if (isPhone) {
      setSearchParams({ phone: clean });
    } else {
      setSearchParams({ id: clean });
    }

    fetchTracking(clean);
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleMarkSentMoney = async (order) => {
    if (!order || !order._id) return;
    setTxLoading(order._id);
    setTxError(null);
    try {
      const res = await api.post(`/orders/${order._id}/mark-sent-money`);
      if (res.data.success) {
        setTxPending(null);
        setTxDone(order._id);
        setTxLoading(null);
        // Refresh order state using latest backend data
        try {
          const refreshRes = await api.get(`/orders/${order._id}`);
          if (refreshRes.data.success) {
            setOrders(prev => prev.map(o => o._id === order._id ? refreshRes.data.data : o));
          }
        } catch {
          // If refresh fails, keep local optimistic update but clear loading states
        }
      } else {
        setTxError(order._id);
        setTxLoading(null);
      }
    } catch (err) {
      console.warn('Mark sent money failed:', err.message);
      setTxError(order._id);
      setTxLoading(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'Pending': return 1;
      case 'Processing': return 2;
      case 'Delivering': return 3;
      case 'Completed': return 4;
      case 'Cancelled': return -1;
      default: return 1;
    }
  };

  // IF GUEST (NOT LOGGED IN), REQUIRE LOGIN TO VIEW ORDER STATUS
  if (!isAuthenticated) {
    return (
      <div className="order-tracking-page animate-fade-in" style={{ padding: '60px 0' }}>
        <div className="container tracking-container">
          <div className="tracking-empty-box" style={{ padding: '60px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--color-border-light)', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(12, 81, 63, 0.08)', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Lock size={42} />
            </div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)', marginBottom: '16px', fontWeight: '750' }}>Vui Lòng Đăng Nhập Để Xem Trạng Thái Đơn Hàng</h2>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-light)', maxWidth: '520px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
              Khách hàng chưa đăng nhập có thể đặt hàng bình thường. Tuy nhiên, để xem và theo dõi chi tiết trạng thái đơn hàng (Đang giao hay Đã giao thành công), vui lòng <strong>Đăng Nhập</strong> vào tài khoản của bạn.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> Đăng Nhập Ngay
              </Link>
              <Link to="/menu" className="btn btn-outline" style={{ padding: '12px 24px', fontSize: '1rem' }}>
                Tiếp Tục Đặt Hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracking-page animate-fade-in">
      <div className="container tracking-container">
        {/* Page Header */}
        <div className="tracking-header">
          <div className="tracking-badge-icon">
            <PackageCheck size={28} />
          </div>
          <div className="tracking-header-text">
            <h1 className="tracking-title">Tra Cứu & Theo Dõi Đơn Hàng</h1>
            <p className="tracking-subtitle">
              Nhập Mã đơn hàng hoặc Số điện thoại để kiểm tra xem đơn hàng đã được giao hay chưa!
            </p>
          </div>
        </div>

        {/* Search Box */}
        <div className="tracking-search-card">
          <form onSubmit={handleSearchSubmit} className="tracking-search-form">
            <div className="search-type-selector">
              <button
                type="button"
                className={`type-btn ${searchType === 'id' ? 'active' : ''}`}
                onClick={() => setSearchType('id')}
              >
                Mã đơn hàng
              </button>
              <button
                type="button"
                className={`type-btn ${searchType === 'phone' ? 'active' : ''}`}
                onClick={() => setSearchType('phone')}
              >
                Số điện thoại
              </button>
            </div>

            <div className="tracking-input-wrapper">
              <Search className="search-input-icon" size={20} />
              <input
                type="text"
                className="tracking-input"
                placeholder={
                  searchType === 'phone'
                    ? 'Nhập số điện thoại mua hàng (vd: 0901234567)'
                    : 'Nhập mã đơn hàng (vd: 64a8b...)'
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-search-tracking" disabled={loading}>
                {loading ? 'Đang tìm...' : 'Tra Cứu'}
              </button>
            </div>
          </form>
          {error && <div className="tracking-error-msg"><AlertCircle size={16} /> {error}</div>}
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="tracking-loading-box">
            <div className="spinner"></div>
            <p>Đang kiểm tra dữ liệu đơn hàng...</p>
          </div>
        ) : searched && orders.length === 0 ? (
          <div className="tracking-empty-box">
            <XCircle size={48} className="empty-icon text-muted" />
            <h3>Không Tìm Thấy Đơn Hàng</h3>
            <p>Vui lòng kiểm tra lại Mã đơn hàng hoặc Số điện thoại đã đăng ký khi mua hàng.</p>
          </div>
        ) : (
          <div className="tracking-results-list">
            {orders.map((order) => {
              const stepIdx = getStepIndex(order.status);
              const isDelivered = order.status === 'Completed';
              const isCancelled = order.status === 'Cancelled';

              return (
                <div key={order._id} className="tracking-order-card">
                  {/* Card Top Header */}
                  <div className="tracking-card-header">
                    <div className="order-meta-left">
                      <span className="order-id-highlight">Mã đơn: #{order._id}</span>
                      <span className="order-time-text">Ngày đặt: {formatDate(order.createdAt)}</span>
                    </div>

                    {/* Prominent Delivery Status Banner */}
                    <div className={`delivery-main-badge ${isDelivered ? 'badge-delivered' : isCancelled ? 'badge-cancelled' : 'badge-not-delivered'}`}>
                      {isDelivered ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>🟢 ĐÃ GIAO THÀNH CÔNG</span>
                        </>
                      ) : isCancelled ? (
                        <>
                          <XCircle size={18} />
                          <span>❌ ĐÃ HỦY ĐƠN HÀNG</span>
                        </>
                      ) : (
                        <>
                          <Truck size={18} className="animate-bounce-light" />
                          <span>🚚 CHƯA GIAO ({order.status === 'Pending' ? 'Chờ duyệt' : order.status === 'Processing' ? 'Đang chuẩn bị món' : 'Đang giao hàng'})</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 4-Step Progress Tracker Timeline */}
                  {!isCancelled && (
                    <div className="tracker-timeline-box">
                      <h4 className="timeline-title">Tiến Trình Giao Hàng</h4>
                      <div className="tracker-steps-wrapper">
                        {/* Step 1 */}
                        <div className={`tracker-step ${stepIdx >= 1 ? 'completed' : ''} ${stepIdx === 1 ? 'current' : ''}`}>
                          <div className="step-circle">
                            <Clock size={18} />
                          </div>
                          <span className="step-label">Đã đặt đơn</span>
                          <span className="step-sub">Đang chờ xác nhận</span>
                        </div>

                        <div className={`step-line ${stepIdx >= 2 ? 'active' : ''}`}></div>

                        {/* Step 2 */}
                        <div className={`tracker-step ${stepIdx >= 2 ? 'completed' : ''} ${stepIdx === 2 ? 'current' : ''}`}>
                          <div className="step-circle">
                            <Coffee size={18} />
                          </div>
                          <span className="step-label">Chuẩn bị món</span>
                          <span className="step-sub">Pha chế đồ uống</span>
                        </div>

                        <div className={`step-line ${stepIdx >= 3 ? 'active' : ''}`}></div>

                        {/* Step 3 */}
                        <div className={`tracker-step ${stepIdx >= 3 ? 'completed' : ''} ${stepIdx === 3 ? 'current' : ''}`}>
                          <div className="step-circle">
                            <Truck size={18} />
                          </div>
                          <span className="step-label">Đang giao hàng</span>
                          <span className="step-sub">Shipper đang tới</span>
                        </div>

                        <div className={`step-line ${stepIdx >= 4 ? 'active' : ''}`}></div>

                        {/* Step 4 */}
                        <div className={`tracker-step ${stepIdx >= 4 ? 'completed' : ''} ${stepIdx === 4 ? 'current' : ''}`}>
                          <div className="step-circle">
                            <CheckCircle2 size={18} />
                          </div>
                          <span className="step-label">Đã giao hàng</span>
                          <span className="step-sub">Hoàn thành đơn</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Details Grid */}
                  <div className="tracking-details-grid">
                    {/* Receiver Info */}
                    <div className="tracking-info-col">
                      <h4 className="col-title"><User size={16} /> Thông Tin Giao Hàng</h4>
                      <div className="info-line">
                        <span className="lbl">Người nhận:</span>
                        <span className="val font-semibold">{order.customerName}</span>
                      </div>
                      <div className="info-line">
                        <span className="lbl"><Phone size={14} /> Số điện thoại:</span>
                        <span className="val">{order.customerPhone}</span>
                      </div>
                      <div className="info-line">
                        <span className="lbl"><MapPin size={14} /> Địa chỉ giao:</span>
                        <span className="val">{order.shippingAddress}</span>
                      </div>
                      {order.notes && (
                        <div className="info-line notes">
                          <span className="lbl">Ghi chú:</span>
                          <span className="val italic">"{order.notes}"</span>
                        </div>
                      )}
                      <div className="info-line">
                        <span className="lbl"><CreditCard size={14} /> Phương thức:</span>
                        <span className="val font-semibold text-primary">
                          {order.paymentMethod === 'QR' ? '📱 Mã QR VietQR' : '💵 Tiền mặt (COD)'}
                        </span>
                      </div>                        <div className="info-line">
                        <span className="lbl">Thanh toán:</span>
                        <span className={`val badge-pay ${order.paymentStatus === 'Paid' ? 'paid' : order.paymentStatus === 'AwaitingConfirm' ? 'awaiting' : 'pending'}`}>
                          {order.paymentStatus === 'Paid' ? '🟢 THANH TOÁN THÀNH CÔNG' : order.paymentStatus === 'AwaitingConfirm' ? '🟡 ĐÃ CHUYỂN KHOẢN — CHỜ XÁC NHẬN' : '🟡 CHƯA THANH TOÁN'}
                        </span>
                      </div>
                      {order.paymentMethod === 'QR' && order.paymentStatus === 'Pending' && order.status !== 'Cancelled' && (
                        <div className="info-line tx-row" style={{ marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-tx"
                            disabled={txLoading === order._id || txPending === order._id}
                            onClick={() => handleMarkSentMoney(order)}
                          >
                            {txPending === order._id ? 'Đang gửi yêu cầu...' : 'Tôi đã chuyển khoản'}
                          </button>
                          {txError === order._id && <span className="tx-error">Lỗi: không thể gửi yêu cầu. Vui lòng thử lại.</span>}
                          {txDone === order._id && !txError && <span className="tx-done">Đã ghi nhận yêu cầu chuyển khoản. Vui lòng đợi admin xác nhận.</span>}
                        </div>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="tracking-items-col">
                      <h4 className="col-title"><Coffee size={16} /> Danh Sách Món Ăn ({order.items.length})</h4>
                      <div className="tracking-items-box">
                        {order.items.map((it, i) => (
                          <div key={i} className="tracking-item-row">
                            <div className="item-row-left">
                              <span className="qty-badge">{it.quantity}x</span>
                              <div className="item-names">
                                <span className="item-main-title">{it.name} {it.size && `(Size ${it.size})`}</span>
                                {it.toppings && it.toppings.length > 0 && (
                                  <span className="item-toppings-txt">+ {it.toppings.map(t => typeof t === 'string' ? t : t.name).join(', ')}</span>
                                )}
                              </div>
                            </div>
                            <span className="item-row-price">{formatPrice(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="tracking-price-sum">
                        {order.couponCode && (
                          <div className="sum-row discount">
                            <span><Tag size={12} /> Khấu trừ mã {order.couponCode}:</span>
                            <span>-{formatPrice(order.discountAmount)}</span>
                          </div>
                        )}
                        <div className="sum-row grand-total">
                          <span>Tổng tiền:</span>
                          <span className="price-big">{formatPrice(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
