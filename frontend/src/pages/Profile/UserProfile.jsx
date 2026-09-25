import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  ShoppingBag,
  KeyRound,
  Shield,
  Clock,
  Coffee,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  Mail,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  LogOut,
  PackageCheck,
  Calendar,
  Check,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { socket, joinUserRoom } from '../../services/socket';
import api from '../../services/api';
import OrderTracking from '../OrderTracking/OrderTracking';
import MemberManager from '../Admin/MemberManager';
import './UserProfile.css';

const UserProfile = () => {
  const { isAuthenticated, user, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State (default or from location search/state)
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab') || location.state?.tab;
  const initialTab = (tabParam === 'track' || tabParam === 'tracking') ? 'tracking' : (tabParam === 'orders' ? 'orders' : 'info');
  const [activeTab, setActiveTab] = useState(initialTab);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // My Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);



  const checkIsMasterAdmin = (u) => {
    if (!u) return false;
    return !!(
      u.isMasterAdmin ||
      u.username === 'admin' ||
      u.email === 'admin@phuclong.vn' ||
      u.email === 'admin@phuclong.com'
    );
  };

  const isMasterAdmin = checkIsMasterAdmin(user);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
      return;
    }
    const qTab = new URLSearchParams(location.search).get('tab') || location.state?.tab;
    if (user?.role === 'admin' && (qTab === 'track' || qTab === 'tracking')) {
      navigate('/tracking');
      return;
    }

    if (qTab === 'track' || qTab === 'tracking') {
      if (activeTab !== 'tracking') setActiveTab('tracking');
    } else if (qTab === 'orders') {
      if (activeTab !== 'orders') setActiveTab('orders');
    }

    const isMaster = checkIsMasterAdmin(user);
    if (user?.role === 'admin') {
      if (!isMaster && activeTab !== 'info') {
        setActiveTab('info');
      } else if (isMaster && activeTab !== 'info' && activeTab !== 'other-accounts') {
        setActiveTab('info');
      }
    }
    if (activeTab === 'orders' && user?.role !== 'admin') {
      fetchMyOrders();
    }
  }, [isAuthenticated, user, activeTab, navigate, location.search, location.state]);

  // Real-time Socket.io listener for customer order status changes
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      joinUserRoom(user._id);

      const handleStatusUpdated = ({ orderId, status }) => {
        setOrders((prevOrders) =>
          prevOrders.map((o) => (o._id === orderId ? { ...o, status } : o))
        );
      };

      socket.on('order_status_updated', handleStatusUpdated);
      return () => {
        socket.off('order_status_updated', handleStatusUpdated);
      };
    }
  }, [isAuthenticated, user]);

  const fetchMyOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const response = await api.get('/orders/my-orders');
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err);
      setOrdersError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Vui lòng điền đầy đủ tất cả các trường mật khẩu.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    setPwSubmitting(true);
    const result = await changePassword(currentPassword, newPassword, confirmPassword);
    setPwSubmitting(false);

    if (result.success) {
      setPwSuccess(result.message || 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwError(result.message || 'Cập nhật mật khẩu thất bại.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;

    setCancellingId(orderId);
    try {
      const response = await api.put(`/orders/${orderId}/cancel`);
      if (response.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: 'Cancelled' } : o))
        );
        alert('Đã hủy đơn hàng thành công!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng.');
    } finally {
      setCancellingId(null);
    }
  };



  const formatPrice = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const getStatusDetails = (status) => {
    switch (status) {
      case 'Pending':
        return { icon: <Clock size={16} />, class: 'status-pending', text: 'Chờ duyệt' };
      case 'Processing':
        return { icon: <Coffee size={16} />, class: 'status-processing', text: 'Đang pha chế' };
      case 'Delivering':
        return { icon: <Truck size={16} />, class: 'status-delivering', text: 'Đang giao hàng' };
      case 'Completed':
        return { icon: <CheckCircle2 size={16} />, class: 'status-completed', text: 'Đã hoàn thành' };
      case 'Cancelled':
        return { icon: <XCircle size={16} />, class: 'status-cancelled', text: 'Đã hủy' };
      default:
        return { icon: <Clock size={16} />, class: 'status-pending', text: status };
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'pending') return ['Pending', 'Processing', 'Delivering'].includes(o.status);
    if (orderFilter === 'completed') return o.status === 'Completed';
    if (orderFilter === 'cancelled') return o.status === 'Cancelled';
    return true;
  });

  if (!isAuthenticated) return null;

  return (
    <div className="profile-page-wrapper animate-fade-in">
      <div className="container profile-container">
        {/* Top User Header Banner */}
        <div className="profile-banner-card">
          <div className="profile-user-avatar">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="profile-user-details">
            <h2 className="profile-username">{user?.username}</h2>
            <div className="profile-user-meta">
              <span><Mail size={14} /> {user?.email}</span>
              <span className="badge-role">{user?.role === 'admin' ? 'Quản Trị Viên' : 'Khách Hàng Thân Thiết'}</span>
            </div>
          </div>
          <div className="profile-banner-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="btn-profile-admin"
                style={{
                  backgroundColor: '#0c513f',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '24px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 12px rgba(12, 81, 63, 0.25)',
                  transition: 'all 0.2s',
                }}
              >
                <Shield size={18} />
                <span>Vào Trang Quản Trị</span>
              </button>
            )}
            <button onClick={logout} className="btn-profile-logout" title="Đăng xuất">
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="profile-nav-tabs">
          <button
            className={`profile-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <User size={18} />
            <span>Thông Tin & Bảo Mật</span>
          </button>

          {/* Master Admin Tab: Tài Khoản Khác (Cấp & Thu Hồi Quyền Admin) */}
          {user?.role === 'admin' && isMasterAdmin && (
            <button
              className={`profile-tab-btn ${activeTab === 'other-accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('other-accounts')}
            >
              <Users size={18} />
              <span>Tài Khoản Khác</span>
            </button>
          )}

          {/* Customer Tabs */}
          {user?.role !== 'admin' && (
            <>
              <button
                className={`profile-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('orders');
                  fetchMyOrders();
                }}
              >
                <ShoppingBag size={18} />
                <span>Đơn Hàng Của Tôi</span>
                {orders.length > 0 && <span className="tab-badge">{orders.length}</span>}
              </button>

              <button
                className={`profile-tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
                onClick={() => setActiveTab('tracking')}
              >
                <Truck size={18} />
                <span>Theo Dõi Đơn Hàng</span>
              </button>
            </>
          )}
        </div>

        {/* TAB 1: THÔNG TIN CÁ NHÂN & ĐỔI MẬT KHẨU */}
        {activeTab === 'info' && (
          <div className="profile-tab-content animate-fade-in">
            <div className="profile-grid-two-col">
              {/* Account Info Box */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <Shield className="card-header-icon" size={20} />
                  <h3>Thông Tin Tài Khoản</h3>
                </div>
                <div className="profile-card-body">
                  <div className="info-row">
                    <span className="info-label">Họ và tên:</span>
                    <span className="info-value">{user?.username}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Địa chỉ Email:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Loại tài khoản:</span>
                    <span className="info-value highlight-green">
                      {user?.role === 'admin' ? 'Quản Trị Viên' : 'Thành Viên Phúc Long'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Mã thành viên:</span>
                    <span className="info-value">#{user?._id?.slice(-8) || '00000000'}</span>
                  </div>
                </div>
              </div>

              {/* Change Password Box */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <KeyRound className="card-header-icon" size={20} />
                  <h3>Đổi Mật Khẩu Bảo Mật</h3>
                </div>
                <div className="profile-card-body">
                  <form onSubmit={handleChangePassword} className="change-password-form">
                    {pwError && (
                      <div className="profile-alert alert-error">
                        <AlertCircle size={16} />
                        <span>{pwError}</span>
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="profile-alert alert-success">
                        <CheckCircle2 size={16} />
                        <span>{pwSuccess}</span>
                      </div>
                    )}

                    <div className="form-group-custom">
                      <label>Mật khẩu hiện tại *</label>
                      <div className="input-icon-wrapper">
                        <Lock size={16} className="input-prefix-icon" />
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu hiện tại"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group-custom">
                      <label>Mật khẩu mới *</label>
                      <div className="input-icon-wrapper">
                        <Lock size={16} className="input-prefix-icon" />
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group-custom">
                      <label>Xác nhận mật khẩu mới *</label>
                      <div className="input-icon-wrapper">
                        <Lock size={16} className="input-prefix-icon" />
                        <input
                          type="password"
                          placeholder="Nhập lại mật khẩu mới"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-pw"
                      disabled={pwSubmitting}
                    >
                      {pwSubmitting ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ĐƠN HÀNG CỦA TÔI */}
        {activeTab === 'orders' && (
          <div className="profile-tab-content animate-fade-in">
            {/* Filter Sub-Tabs */}
            <div className="orders-filter-bar">
              <button
                className={`filter-btn ${orderFilter === 'all' ? 'active' : ''}`}
                onClick={() => setOrderFilter('all')}
              >
                Tất cả ({orders.length})
              </button>
              <button
                className={`filter-btn ${orderFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setOrderFilter('pending')}
              >
                Đang xử lý / Giao ({orders.filter(o => ['Pending', 'Processing', 'Delivering'].includes(o.status)).length})
              </button>
              <button
                className={`filter-btn ${orderFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setOrderFilter('completed')}
              >
                Đã hoàn thành ({orders.filter(o => o.status === 'Completed').length})
              </button>
              <button
                className={`filter-btn ${orderFilter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setOrderFilter('cancelled')}
              >
                Đã hủy ({orders.filter(o => o.status === 'Cancelled').length})
              </button>

              <button onClick={fetchMyOrders} className="btn-refresh-orders" title="Làm mới">
                <RefreshCw size={16} className={ordersLoading ? 'spin' : ''} />
              </button>
            </div>

            {ordersLoading ? (
              <div className="profile-loading-box">
                <RefreshCw size={24} className="spin" />
                <p>Đang tải danh sách đơn hàng...</p>
              </div>
            ) : ordersError ? (
              <div className="profile-alert alert-error">
                <AlertCircle size={18} />
                <span>{ordersError}</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="orders-empty-state">
                <PackageCheck size={48} className="empty-icon" />
                <h4>Không tìm thấy đơn hàng nào</h4>
                <p>Bạn chưa có đơn hàng nào trong mục này.</p>
                <button onClick={() => navigate('/menu')} className="btn-primary-small">
                  Khám phá thực đơn ngay
                </button>
              </div>
            ) : (
              <div className="orders-list-group">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusDetails(order.status);
                  const isExpanded = expandedOrderId === order._id;

                  return (
                    <div key={order._id} className="order-card-item">
                      <div
                        className="order-card-header"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                      >
                        <div className="order-main-info">
                          <span className="order-code">#{order._id.slice(-8).toUpperCase()}</span>
                          <span className="order-date">
                            <Calendar size={14} /> {new Date(order.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <div className="order-status-badge-wrap">
                          <span className={`status-pill ${statusInfo.class}`}>
                            {statusInfo.icon}
                            <span>{statusInfo.text}</span>
                          </span>
                          <span className="order-total-price">{formatPrice(order.totalAmount)}</span>

                          {order.status === 'Pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(order._id);
                              }}
                              disabled={cancellingId === order._id}
                              className="btn-cancel-order-inline"
                              title="Hủy đơn hàng này"
                            >
                              {cancellingId === order._id ? 'Đang hủy...' : 'Hủy đơn'}
                            </button>
                          )}

                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="order-card-details animate-fade-in">
                          <div className="details-grid">
                            <div className="details-col">
                              <h5>Thông tin nhận hàng</h5>
                              <p><strong>Người nhận:</strong> {order.customerName}</p>
                              <p><strong>Số điện thoại:</strong> {order.customerPhone}</p>
                              <p><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
                              {order.notes && <p><strong>Ghi chú:</strong> {order.notes}</p>}
                            </div>
                            <div className="details-col">
                              <h5>Thanh toán</h5>
                              <p>
                                <strong>Phương thức:</strong>{' '}
                                {order.paymentMethod === 'QR' ? 'Chuyển khoản QR' : 'Thanh toán COD'}
                              </p>
                              <p>
                                <strong>Trạng thái thanh toán:</strong>{' '}
                                <span className={order.paymentStatus === 'Paid' ? 'text-success' : 'text-warning'}>
                                  {order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="details-items-table">
                            <h5>Danh sách món ({order.items.length})</h5>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="order-item-row">
                                <div className="item-title">
                                  <span className="item-qty">{item.quantity}x</span>
                                  <span className="item-name">{item.name} ({item.size})</span>
                                  {item.toppings?.length > 0 && (
                                    <span className="item-toppings">
                                      + {item.toppings.map((t) => t.name).join(', ')}
                                    </span>
                                  )}
                                </div>
                                <span className="item-subtotal">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB CHO MASTER ADMIN: TÀI KHOẢN KHÁC & PHÂN QUYỀN */}
        {user?.role === 'admin' && isMasterAdmin && activeTab === 'other-accounts' && (
          <div className="profile-tab-content animate-fade-in">
            <div className="profile-card" style={{ padding: '24px' }}>
              <div className="profile-card-header" style={{ marginBottom: '20px' }}>
                <Users className="card-header-icon" size={20} />
                <h3>Quản Lý Tài Khoản Khác & Phân Quyền Quản Trị</h3>
              </div>
              <MemberManager onContactUser={(targetUser) => navigate('/admin', { state: { activeTab: 'chat', targetUser } })} />
            </div>
          </div>
        )}

        {/* TAB 3: THEO DÕI ĐƠN HÀNG (Chỉ dành cho khách hàng) */}
        {user?.role !== 'admin' && (activeTab === 'track' || activeTab === 'tracking') && (
          <div className="profile-tab-content animate-fade-in">
            <OrderTracking />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
