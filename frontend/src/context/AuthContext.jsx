import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { updateSocketToken } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('userToken') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Set header token for this initial check
        localStorage.setItem('adminToken', token); // backward compatibility with api.js
        localStorage.setItem('userToken', token);
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session validation failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [token]);

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        const { token: userToken, role, username: uName, _id } = response.data.data;
        
        localStorage.setItem('userToken', userToken);
        localStorage.setItem('adminToken', userToken); // for api.js interceptor
        setToken(userToken);
        setUser({ _id, username: uName, role });
        updateSocketToken(userToken);
        return { success: true, role };
      }
      return { success: false };
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (username, email, phone, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', { username, email, phone, password, role: 'user' });
      if (response.data.success) {
        const { token: userToken, role, username: uName, email: uEmail, phone: uPhone, _id } = response.data.data;
        
        localStorage.setItem('userToken', userToken);
        localStorage.setItem('adminToken', userToken);
        setToken(userToken);
        setUser({ _id, username: uName, email: uEmail, phone: uPhone, role });
        updateSocketToken(userToken);
        return { success: true, role };
      }
      return { success: false };
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại. Tên tài khoản, Gmail hoặc Số điện thoại có thể đã tồn tại.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    setError(null);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const forgotPassword = async (identifier) => {
    setError(null);
    try {
      const response = await api.post('/auth/forgot-password', { identifier });
      if (response.data.success) {
        return { success: true, message: response.data.message, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const resetPassword = async (identifier, otp, newPassword, confirmPassword) => {
    setError(null);
    try {
      const response = await api.post('/auth/reset-password', {
        identifier,
        otp,
        newPassword,
        confirmPassword,
      });
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Mã OTP không hợp lệ hoặc đã hết hạn.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    setToken(null);
    setUser(null);
    setError(null);
    updateSocketToken('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        changePassword,
        forgotPassword,
        resetPassword,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
