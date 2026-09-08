import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, error: authError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to admin dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!username || !password) {
      setLocalError('Vui lòng điền đầy đủ tên tài khoản và mật khẩu.');
      return;
    }

    setSubmitting(true);
    const success = await login(username, password);
    setSubmitting(false);

    if (success) {
      navigate('/admin');
    }
  };

  const displayError = localError || authError;

  return (
    <div className="admin-login-page animate-fade-in">
      <div className="login-card-glow"></div>
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-text-primary">PHÚC LONG</span>
            <span className="logo-text-secondary">ADMIN PORTAL</span>
          </div>
          <p className="login-subtitle">Đăng nhập quyền quản trị hệ thống</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {displayError && (
            <div className="login-error-alert">
              <AlertCircle size={18} />
              <span>{displayError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Tên tài khoản</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                id="username"
                placeholder="Nhập tên đăng nhập" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                id="password"
                placeholder="Nhập mật khẩu" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-control"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-login" 
            disabled={submitting}
          >
            {submitting ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>


      </div>
    </div>
  );
};

export default AdminLogin;
