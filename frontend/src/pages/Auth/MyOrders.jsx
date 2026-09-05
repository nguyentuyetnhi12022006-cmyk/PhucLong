import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Calendar, MapPin, Phone, CreditCard, ChevronDown, ChevronUp, AlertCircle, Coffee, Clock, CheckCircle2, Truck, XCircle, Tag, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './MyOrders.css';

const MyOrders = () => {
  const { isAuthenticated, token, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // all, not-delivered, delivered, cancelled

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/my-orders' } });
      return;
    }

    const fetchMyOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/orders/my-orders');
        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [isAuthenticated, token, navigate]);

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'Pending':
        return { icon: <Clock size={16} />, className: 'status-pending', text: 'Chờ duyệt', deliveryLabel: '🚚 CHƯA GIAO' };
      case 'Processing':
        return { icon: <Coffee size={16} />, className: 'status-processing', text: 'Đang chuẩn bị', deliveryLabel: '🚚 CHƯA GIAO' };
      case 'Delivering':
        return { icon: <Truck size={16} />, className: 'status-delivering', text: 'Đang giao hàng', deliveryLabel: '🚚 CHƯA GIAO' };
      case 'Completed':
        return { icon: <CheckCircle2 size={16} />, className: 'status-completed', text: 'Đã giao hàng', deliveryLabel: '🟢 ĐÃ GIAO' };
      case 'Cancelled':
        return { icon: <XCircle size={16} />, className: 'status-cancelled', text: 'Đã hủy', deliveryLabel: '❌ ĐÃ HỦY' };
      default:
        return { icon: <Clock size={16} />, className: 'status-pending', text: status, deliveryLabel: status };
    }
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

  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'not-delivered') {
      return ['Pending', 'Processing', 'Delivering'].includes(o.status);
    }
    if (filterTab === 'delivered') {
      return o.status === 'Completed';
    }
    if (filterTab === 'cancelled') {
      return o.status === 'Cancelled';
    }
    return true;
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="my-orders-page animate-fade-in">
      <div className="container my-orders-container">
        <div className="my-orders-header">
          <h1 className="my-orders-title">
            <ShoppingBag className="header-icon" /> Lịch Sử Mua Hàng & Theo Dõi Đơn
          </h1>
          <p className="my-orders-subtitle">Kiểm tra trạng thái giao hàng (Đã giao / Chưa giao) và chi tiết các đơn hàng của bạn</p>
        </div>

        {/* Delivery Status Filter Tabs */}
        <div className="my-orders-tabs-bar">
          <button
            className={`tab-btn ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            Tất cả đơn ({orders.length})
          </button>
          <button
            className={`tab-btn ${filterTab === 'not-delivered' ? 'active' : ''}`}
            onClick={() => setFilterTab('not-delivered')}
          >
            🚚 Chưa giao ({orders.filter(o => ['Pending', 'Processing', 'Delivering'].includes(o.status)).length})
          </button>
          <button
            className={`tab-btn ${filterTab === 'delivered' ? 'active' : ''}`}
            onClick={() => setFilterTab('delivered')}
          >
            🟢 Đã giao ({orders.filter(o => o.status === 'Completed').length})
          </button>
          <button
            className={`tab-btn ${filterTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilterTab('cancelled')}
          >
            ❌ Đã hủy ({orders.filter(o => o.status === 'Cancelled').length})
          </button>
        </div>

        {loading ? (
          <div className="orders-loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách đơn hàng của bạn...</p>
          </div>
        ) : error ? (
          <div className="orders-error-state">
            <AlertCircle size={40} className="error-icon" />
            <h3>Đã xảy ra lỗi</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">Tải lại trang</button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            <ShoppingBag size={48} className="empty-icon" />
            <h2>Không có đơn hàng nào trong danh mục này</h2>
            <p>Hãy chọn cho mình những ly trà sữa thơm ngon và thực hiện đặt hàng nhé!</p>
            <Link to="/menu" className="btn btn-primary">Khám phá thực đơn</Link>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => {
              const statusDetails = getStatusDetails(order.status);
              const isExpanded = expandedOrderId === order._id;
              const stepIdx = getStepIndex(order.status);
              const dateStr = new Date(order.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={order._id} className={`order-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="order-card-summary" onClick={() => toggleExpandOrder(order._id)}>
                    <div className="order-summary-left">
                      <span className="order-id-badge" title={order._id}>
                        Mã đơn: #{order._id.substring(order._id.length - 8).toUpperCase()}
                      </span>
                      <span className="order-date-text">
                        <Calendar size={14} /> {dateStr}
                      </span>
                      <span className={`order-delivery-tag ${order.status === 'Completed' ? 'tag-delivered' : order.status === 'Cancelled' ? 'tag-cancelled' : 'tag-not-delivered'}`}>
                        {statusDetails.deliveryLabel}
                      </span>
                    </div>

                    <div className="order-summary-right">
                      <div className="order-price-summary">
                        <span className="order-total-label">Tổng thanh toán:</span>
                        <span className="order-total-price">{formatPrice(order.totalAmount)}</span>
                      </div>
                      
                      <div className={`status-badge ${statusDetails.className}`}>
                        {statusDetails.icon}
                        <span>{statusDetails.text}</span>
                      </div>

                      <div className="expand-icon-wrapper">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="order-card-details animate-slide-down">
                      {/* Step Tracker Progress Bar */}
                      {order.status !== 'Cancelled' && (
                        <div className="myorders-step-tracker">
                          <h5 className="tracker-mini-title">Tiến Trình Đơn Hàng</h5>
                          <div className="mini-steps">
                            <div className={`mini-step ${stepIdx >= 1 ? 'active' : ''}`}>
                              <span className="dot"></span>
                              <span className="lbl">1. Đã đặt đơn</span>
                            </div>
                            <div className={`mini-line ${stepIdx >= 2 ? 'active' : ''}`}></div>
                            <div className={`mini-step ${stepIdx >= 2 ? 'active' : ''}`}>
                              <span className="dot"></span>
                              <span className="lbl">2. Chuẩn bị món</span>
                            </div>
                            <div className={`mini-line ${stepIdx >= 3 ? 'active' : ''}`}></div>
                            <div className={`mini-step ${stepIdx >= 3 ? 'active' : ''}`}>
                              <span className="dot"></span>
                              <span className="lbl">3. Đang giao hàng</span>
                            </div>
                            <div className={`mini-line ${stepIdx >= 4 ? 'active' : ''}`}></div>
                            <div className={`mini-step ${stepIdx >= 4 ? 'active' : ''}`}>
                              <span className="dot"></span>
                              <span className="lbl">4. Đã giao thành công</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="details-grid">
                        {/* Info Block */}
                        <div className="details-info-block">
                          <h4>Thông tin giao hàng</h4>
                          <div className="info-row">
                            <span className="info-label">Người nhận:</span>
                            <span className="info-value font-semibold">{order.customerName}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label"><Phone size={14} /> Số điện thoại:</span>
                            <span className="info-value">{order.customerPhone}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label"><MapPin size={14} /> Địa chỉ giao:</span>
                            <span className="info-value">{order.shippingAddress}</span>
                          </div>
                          {order.notes && (
                            <div className="info-row notes-row">
                              <span className="info-label">Ghi chú:</span>
                              <span className="info-value italic">"{order.notes}"</span>
                            </div>
                          )}
                          <div className="info-row">
                            <span className="info-label"><CreditCard size={14} /> Phương thức:</span>
                            <span className="info-value font-semibold text-primary">
                              {order.paymentMethod === 'QR' ? '📱 Thanh toán Mã QR (VietQR)' : '💵 Tiền mặt (COD)'}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Trạng thái TT:</span>
                            <span className={`info-value ${order.paymentStatus === 'Paid' ? 'text-success font-semibold' : ''}`}>
                              {order.paymentStatus === 'Paid' ? '✓ Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                          </div>
                        </div>

                        {/* Items Block */}
                        <div className="details-items-block">
                          <h4>Chi tiết món ăn</h4>
                          <div className="order-items-list-box">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="details-order-item">
                                <div className="item-main-details">
                                  <span className="item-qty">{item.quantity}x</span>
                                  <span className="item-name">{item.name} {item.size && `(Size ${item.size})`}</span>
                                  <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                                {item.toppings && item.toppings.length > 0 && (
                                  <div className="item-toppings-details">
                                    + Toppings: {item.toppings.map(t => typeof t === 'string' ? t : t.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="order-price-breakdown">
                            {order.couponCode && (
                              <div className="breakdown-row discount">
                                <span className="label"><Tag size={12} /> Mã giảm giá ({order.couponCode}):</span>
                                <span className="val">-{formatPrice(order.discountAmount)}</span>
                              </div>
                            )}
                            <div className="breakdown-row grand-total">
                              <span className="label">Tổng cộng:</span>
                              <span className="val">{formatPrice(order.totalAmount)}</span>
                            </div>
                          </div>

                          {order.status === 'Pending' && (
                            <div className="order-cancel-action-box" style={{ marginTop: '15px', textAlign: 'right' }}>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
                                  try {
                                    const res = await api.put(`/orders/${order._id}/cancel`);
                                    if (res.data.success) {
                                      setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'Cancelled' } : o));
                                      alert('Hủy đơn hàng thành công!');
                                    }
                                  } catch (err) {
                                    alert(err.response?.data?.message || 'Không thể hủy đơn hàng.');
                                  }
                                }}
                                className="btn btn-outline"
                                style={{ color: '#d9534f', borderColor: '#d9534f' }}
                              >
                                Hủy Đơn Hàng
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;

