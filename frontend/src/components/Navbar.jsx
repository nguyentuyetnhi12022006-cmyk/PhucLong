import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Menu,
  X,
  User,
  Coffee,
  LogOut,
  Bell,
  LayoutDashboard,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { socket, joinAdminRoom, joinUserRoom } from '../services/socket';
import api from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');



  const { cartCount } = useCart();
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);


  const isAdmin = isAuthenticated && user?.role === 'admin';

  // Handle scroll shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu & dropdowns on route change
  useEffect(() => {
    setIsOpen(false);
    setShowNotifDropdown(false);

  }, [location]);

  // Click outside to close notification dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
  
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll for Admin pending orders & notifications
  useEffect(() => {
    let timer;
    const fetchPendingOrders = async () => {
      if (!isAdmin) return;
      try {
        const res = await api.get('/orders?status=Pending');
        if (res.data.success) {
          setPendingOrders(res.data.data);
          setPendingCount(res.data.data.length);
        }
      } catch (err) {
        console.warn('Could not fetch pending orders:', err.message);
      }
    };

    if (isAdmin) {
      fetchPendingOrders();
      timer = setInterval(fetchPendingOrders, 5000);
    } else {
      setPendingOrders([]);
      setPendingCount(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAdmin]);



  // Keep pendingCount strictly synchronized with pendingOrders.length
  useEffect(() => {
    if (isAdmin) {
      setPendingCount(pendingOrders.length);
    }
  }, [pendingOrders, isAdmin]);

  // Real-time socket listeners for Admin & Customer badge sync
  useEffect(() => {
    if (isAdmin) {
      joinAdminRoom();

      const handleOrderCreated = ({ order }) => {
        setPendingOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
        setSuccessMsg(`🔔 Đơn hàng mới từ ${order.customerName} (#${order._id.slice(-6).toUpperCase()})`);
        setTimeout(() => setSuccessMsg(''), 5000);
      };

      const handleOrderCancelledByCustomer = ({ orderId, customerName, message }) => {
        setPendingOrders((prev) => prev.filter((o) => o._id !== orderId));
        setSuccessMsg(`⚠️ ${message || `Khách hàng ${customerName} đã hủy đơn`}`);
        setTimeout(() => setSuccessMsg(''), 6000);
      };

      const handleOrderStatusUpdatedAdmin = ({ orderId, status }) => {
        if (status !== 'Pending') {
          setPendingOrders((prev) => prev.filter((o) => o._id !== orderId));
        }
      };

      socket.on('order_created', handleOrderCreated);
      socket.on('order_cancelled_by_customer', handleOrderCancelledByCustomer);
      socket.on('order_status_updated_admin', handleOrderStatusUpdatedAdmin);

      return () => {
        socket.off('order_created', handleOrderCreated);
        socket.off('order_cancelled_by_customer', handleOrderCancelledByCustomer);
        socket.off('order_status_updated_admin', handleOrderStatusUpdatedAdmin);
      };
    } else if (isAuthenticated && user?._id) {
      joinUserRoom(user._id);

      socket.on('order_status_updated', () => {});
      return () => {
        socket.off('order_status_updated');
      };
    }
  }, [isAdmin, isAuthenticated, user]);

  const handleQuickApprove = async (orderId) => {
    setApprovingId(orderId);
    setSuccessMsg('');
    try {
      const response = await api.put(`/orders/${orderId}/status`, {
        status: 'Processing',
      });
      if (response.data.success) {
        setSuccessMsg(`Đã duyệt thành công đơn #${orderId.slice(-6).toUpperCase()}!`);
        setPendingOrders((prev) => prev.filter((o) => o._id !== orderId));
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể duyệt đơn.');
    } finally {
      setApprovingId(null);
    }
  };



  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : ''} ${isOpen ? 'menu-open' : ''}`}>
      <div className="container navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon-circle">
            <Coffee size={18} />
          </div>
          <div className="logo-text-group">
            <span className="logo-text-primary">PHÚC LONG</span>
            <span className="logo-text-secondary">COFFEE & TEA</span>
          </div>
        </Link>

        {/* Center Links */}
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            Trang chủ
          </Link>
          <Link to="/menu" className={`nav-link ${isActive('/menu')}`}>
            Thực đơn
          </Link>
          <Link to="/privacy" className={`nav-link ${isActive('/privacy')}`}>
            Chính sách & Bảo mật
          </Link>
        </div>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* CART ICON (Non-Admin only) */}
          {!isAdmin && (
            <Link to="/cart" className="cart-icon-wrapper" aria-label="Shopping Cart">
              <ShoppingBag size={22} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}



          {/* ADMIN QUICK-ACTION BAR */}
          {isAdmin && (
            <div className="admin-quick-bar">
              <div className="admin-notif-wrapper" ref={notifRef}>
                <button
                  className={`btn-notif-bell ${pendingCount > 0 ? 'has-pending' : ''} ${
                    showNotifDropdown ? 'active' : ''
                  }`}
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  title="Thông báo đơn hàng mới"
                >
                  <Bell size={20} />
                  {pendingCount > 0 && (
                    <span className="bell-badge-count">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </button>

                {/* Admin Notifications Dropdown */}
                {showNotifDropdown && (
                  <div className="admin-notif-dropdown animate-fade-in">
                    <div className="notif-dropdown-header">
                      <div className="notif-header-title">
                        <Bell size={16} />
                        <span>Đơn hàng mới chờ duyệt</span>
                      </div>
                      <span className="notif-badge-pill">{pendingCount} đơn</span>
                    </div>

                    {successMsg && <div className="notif-success-banner">{successMsg}</div>}

                    <div className="notif-dropdown-body">
                      {pendingOrders.length === 0 ? (
                        <div className="notif-empty">
                          <CheckCircle2 size={36} className="empty-icon" />
                          <p>Không có đơn hàng mới nào cần duyệt 🎉</p>
                        </div>
                      ) : (
                        pendingOrders.map((order) => (
                          <div key={order._id} className="notif-order-card">
                            <div className="notif-order-top">
                              <span className="notif-order-id">
                                #{order._id.slice(-6).toUpperCase()}
                              </span>
                              <span className="notif-order-time">
                                <Clock size={12} />
                                {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })} {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className="notif-order-customer">
                              <strong>{order.customerName}</strong> • {order.customerPhone}
                            </div>

                            <div className="notif-order-items">
                              {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                            </div>

                            <div className="notif-order-footer">
                              <span className="notif-order-amount">
                                {order.totalAmount?.toLocaleString('vi-VN')}đ
                              </span>
                              <button
                                className="btn-approve-quick"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickApprove(order._id);
                                }}
                                disabled={approvingId === order._id}
                              >
                                <Check size={14} />
                                <span>
                                  {approvingId === order._id ? 'Đang duyệt...' : 'Duyệt đơn'}
                                </span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="notif-dropdown-footer">
                      <button
                        className="btn-view-all-orders"
                        onClick={() => {
                          setShowNotifDropdown(false);
                          navigate('/admin');
                        }}
                      >
                        <span>Vào trang quản lý đơn hàng</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/admin')}
                className="btn-login-header btn-quick-dashboard"
                title="Trang quản trị Admin"
              >
                <LayoutDashboard size={16} />
                <span>Quản lý</span>
              </button>
            </div>
          )}

          {/* User Logged Info & Logout (Navigates to /profile on click) */}
          {isAuthenticated ? (
            <div className="admin-actions-group">
              <div
                className="user-logged-info clickable-user-pill"
                onClick={() => navigate('/profile')}
                title="Vào Trang cá nhân"
              >
                <User size={14} className="user-info-icon" />
                <span className="user-info-name">Chào, {user.username}</span>
              </div>
              <button onClick={logout} className="btn-logout-header" title="Đăng xuất">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-login-header">
              <User size={16} />
              <span>Đăng nhập</span>
            </button>
          )}

          <button
            className="mobile-menu-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <Link to="/" className={`mobile-nav-link ${isActive('/')}`}>
          Trang chủ
        </Link>
        <Link to="/menu" className={`mobile-nav-link ${isActive('/menu')}`}>
          Thực đơn
        </Link>
        <Link to="/privacy" className={`mobile-nav-link ${isActive('/privacy')}`}>
          Chính sách & Bảo mật
        </Link>
        {isAuthenticated ? (
          <>
            <Link to="/profile" className={`mobile-nav-link ${isActive('/profile')}`}>
              👤 Trang Cá Nhân ({user?.username})
            </Link>
            <button onClick={logout} className="mobile-nav-link mobile-logout-btn">
              Đăng xuất
            </button>
          </>
        ) : (
          <Link to="/login" className="mobile-nav-link">
            Đăng nhập / Đăng ký
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
