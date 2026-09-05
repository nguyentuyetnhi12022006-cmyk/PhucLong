import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { changePassword } = useAuth();

  if (!isOpen) return null;

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLocalError('');
    setSuccessMessage('');
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setLocalError('Vui lòng nhập đầy đủ các trường mật khẩu.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setLocalError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    setSubmitting(true);
    const result = await changePassword(currentPassword, newPassword, confirmPassword);
    setSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Đổi mật khẩu thành công!');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setLocalError(result.message || 'Đổi mật khẩu thất bại.');
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={handleClose}>
      <div
        className="change-password-modal modal-content-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="modal-header-custom">
          <div className="icon-badge">
            <KeyRound size={24} className="badge-icon" />
          </div>
          <h3>Đổi mật khẩu tài khoản</h3>
          <p>Nhập mật khẩu hiện tại và mật khẩu mới để bảo mật tài khoản</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-form">
          {localError && (
            <div className="auth-alert error-alert animate-shake">
              <AlertCircle size={18} />
              <span>{localError}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert success-alert animate-fade-in">
              <CheckCircle size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="currentPassword">Mật khẩu hiện tại *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="currentPassword"
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="newPassword"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-actions-custom">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-submit-change"
              disabled={submitting}
            >
              {submitting ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
