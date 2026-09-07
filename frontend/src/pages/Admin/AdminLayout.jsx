import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, Coffee, LogOut, Home, Shield, BarChart3, Ticket, Users, FileCheck, MessageCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { socket, joinAdminRoom } from '../../services/socket';
import DashboardOverview from './DashboardOverview';
import OrderManager from './OrderManager';
import ProductManager from './ProductManager';
import CouponManager from './CouponManager';
import MemberManager from './MemberManager';
import PolicyManager from './PolicyManager';
import LiveChatManager from './LiveChatManager';
import './AdminLayout.css';

const AdminLayout = () => {
  const { isAuthenticated, isAdmin, loading, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'dashboard');
  const [selectedChatUser, setSelectedChatUser] = useState(location.state?.targetUser || null);
  const [cancelNotice, setCancelNotice] = useState(null);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (location.state?.targetUser) {
      setSelectedChatUser(location.state.targetUser);
    }
  }, [location.state]);

  const handleContactUser = (targetUser) => {
    setSelectedChatUser(targetUser);
    setActiveTab('chat');
  };

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  // Real-time socket listener for customer order cancellation
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      joinAdminRoom();

      const handleOrderCancelled = (data) => {
        const orderCode = data.orderId ? data.orderId.toString().slice(-6).toUpperCase() : 'MỚI';
        const msg = data.message || `Khách hàng ${data.customerName || 'Khách hàng'} vừa hủy đơn hàng #${orderCode}`;
        setCancelNotice({
          code: orderCode,
          customer: data.customerName || 'Khách hàng',
          phone: data.customerPhone || '',
          msg: msg,
        });
      };

      socket.on('order_cancelled_by_customer', handleOrderCancelled);
      return () => {
        socket.off('order_cancelled_by_customer', handleOrderCancelled);
      };
    }
  }, [isAuthenticated, isAdmin]);

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu quản trị...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="admin-loading-screen">
        <div className="loading-spinner"></div>
        <p>Đang chuyển hướng về trang đăng nhập Quản trị viên...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Shield size={24} className="brand-icon" />
          <div className="brand-text">
            <h3>PHÚC LONG</h3>
            <span>Quản Trị Viên</span>
          </div>
        </div>

        <div className="admin-user-profile">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div>
          <div className="user-info">
            <span className="user-name">Chào, {user?.username || 'Admin'}</span>
            <span className="user-role">Mã số: #{user?._id?.slice(-5) || '0001'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={20} />
            <span>Tổng Quan Doanh Thu</span>
          </button>
          
          <button 
            className={`sidebar-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ClipboardList size={20} />
            <span>Quản Lý Đơn Hàng</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Coffee size={20} />
            <span>Quản Lý Thực Đơn</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            <Ticket size={20} />
            <span>Quản Lý Mã Giảm Giá</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            <span>Quản Lý Thành Viên</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'policies' ? 'active' : ''}`}
            onClick={() => setActiveTab('policies')}
          >
            <FileCheck size={20} />
            <span>Quản Lý Chính Sách</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageCircle size={20} />
            <span>Hỗ Trợ Trực Tuyến</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-footer-item btn-view-shop" onClick={() => navigate('/')}>
            <Home size={18} />
            <span>Xem Cửa Hàng</span>
          </button>
          <button className="sidebar-footer-item btn-logout-admin" onClick={logout}>
            <LogOut size={18} />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <header className="admin-header">
          <div className="header-left">
            <h2>
              {activeTab === 'dashboard' && 'Tổng Quan Doanh Thu'}
              {activeTab === 'orders' && 'Danh Sách Đơn Hàng'}
              {activeTab === 'products' && 'Danh Sách Sản Phẩm'}
              {activeTab === 'coupons' && 'Danh Sách Mã Giảm Giá'}
              {activeTab === 'users' && 'Danh Sách Thành Viên'}
              {activeTab === 'policies' && 'Quản Lý Chính Sách & Điều Khoản'}
              {activeTab === 'chat' && 'Hỗ Trợ Trực Tuyến (Live Chat)'}
            </h2>
            <p className="header-date">Hệ thống quản lý thời gian thực</p>
          </div>
          <div className="header-right">
            <span className="system-status-indicator">
              <span className="status-dot"></span> Hệ thống Hoạt động
            </span>
          </div>
        </header>

        <div className="admin-content-body">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'orders' && <OrderManager />}
          {activeTab === 'products' && <ProductManager />}
          {activeTab === 'coupons' && <CouponManager />}
          {activeTab === 'users' && <MemberManager onContactUser={handleContactUser} />}
          {activeTab === 'policies' && <PolicyManager />}
          {activeTab === 'chat' && <LiveChatManager initialTargetUser={selectedChatUser} />}
        </div>

        {/* Real-time Order Cancelled Toast Notification */}
        {cancelNotice && (
          <div
            className="admin-cancel-toast-alert"
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              backgroundColor: '#ffffff',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 10px 30px rgba(239, 68, 68, 0.25)',
              maxWidth: '420px',
              animation: 'slideInRight 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <AlertTriangle size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, color: '#991b1b', fontSize: '0.95rem', fontWeight: '700' }}>
                    THÔNG BÁO HỦY ĐƠN HÀNG!
                  </h4>
                  <p style={{ margin: '4px 0 0 0', color: '#7f1d1d', fontSize: '0.86rem' }}>
                    {cancelNotice.msg}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancelNotice(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#991b1b',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setCancelNotice(null);
                }}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Xem Quản Lý Đơn Hàng
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminLayout;
