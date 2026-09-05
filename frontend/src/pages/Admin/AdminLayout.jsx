import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Coffee, LogOut, Home, Shield, BarChart3, Ticket, Users, FileCheck, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'orders' | 'products' | 'coupons' | 'users' | 'policies' | 'chat'

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

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
          {activeTab === 'users' && <MemberManager />}
          {activeTab === 'policies' && <PolicyManager />}
          {activeTab === 'chat' && <LiveChatManager />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
