import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Lock, AlertCircle, CheckCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './LoginRegister.css';

const LoginRegister = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', or 'forgot'
  const [forgotStep, setForgotStep] = useState(1); // 1: Send OTP, 2: Enter OTP & New Password

  const [registerMethod, setRegisterMethod] = useState('email'); // 'email' or 'phone'
  const [username, setUsername] = useState(''); // Used for Login input
  const [displayName, setDisplayName] = useState(''); // Register: Tên tài khoản
  const [email, setEmail] = useState(''); // Register: Gmail
  const [phone, setPhone] = useState(''); // Register: Số điện thoại
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [receivedOtpInfo, setReceivedOtpInfo] = useState('');

  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register, forgotPassword, resetPassword, error: authError, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        const from = location.state?.from || '/';
        navigate(from);
      }
    }
  }, [isAuthenticated, isAdmin, navigate, location]);

  const handleTabChange = (mode) => {
    setAuthMode(mode);
    setForgotStep(1);
    setRegisterMethod('email');
    setLocalError('');
    setSuccessMessage('');
    setUsername('');
    setDisplayName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setForgotIdentifier('');
    setOtpCode('');
    setReceivedOtpInfo('');
  };

  const handleForgotStep1Submit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!forgotIdentifier) {
      setLocalError('Vui lòng nhập địa chỉ Gmail hoặc Số điện thoại đã đăng ký.');
      return;
    }

    const val = forgotIdentifier.trim();
    const isEmail = val.includes('@');
    const isPhone = /^\+?[0-9\s\-()]{9,15}$/.test(val);

    if (!isEmail && !isPhone) {
      setLocalError('Vui lòng nhập đúng Gmail hoặc Số điện thoại để khôi phục (Không sử dụng Tên đăng nhập để bảo mật).');
      return;
    }

    setSubmitting(true);
    const result = await forgotPassword(forgotIdentifier);
    setSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message);
      if (result.data?.otp) {
        setReceivedOtpInfo(`Mã OTP thử nghiệm của bạn là: ${result.data.otp} (Hạn dùng 15 phút)`);
      }
      setForgotStep(2);
    } else {
      setLocalError(result.message || 'Không thể tạo mã xác thực.');
    }
  };

  const handleForgotStep2Submit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!otpCode || !password || !confirmPassword) {
      setLocalError('Vui lòng nhập đầy đủ Mã OTP, Mật khẩu mới và Xác nhận mật khẩu.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Mật khẩu mới phải chứa ít nhất 6 ký tự.');
      return;
    }

    setSubmitting(true);
    const result = await resetPassword(forgotIdentifier, otpCode, password, confirmPassword);
    setSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        handleTabChange('login');
      }, 2000);
    } else {
      setLocalError(result.message || 'Đặt lại mật khẩu thất bại.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    let emailVal = '';
    let phoneVal = '';

    if (authMode === 'login') {
      if (!username || !password) {
        setLocalError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
        return;
      }
    } else if (authMode === 'register') {
      if (!displayName || !password || !confirmPassword) {
        setLocalError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
        return;
      }

      if (registerMethod === 'email') {
        if (!email) {
          setLocalError('Vui lòng nhập địa chỉ Gmail.');
          return;
        }
        if (!email.includes('@')) {
          setLocalError('Vui lòng nhập địa chỉ Gmail/email hợp lệ.');
          return;
        }
        emailVal = email;
      } else {
        if (!phone) {
          setLocalError('Vui lòng nhập số điện thoại.');
          return;
        }
        const isPhone = /^\+?[0-9\s\-()]{9,15}$/.test(phone);
        if (!isPhone) {
          setLocalError('Vui lòng nhập số điện thoại hợp lệ.');
          return;
        }
        phoneVal = phone;
      }

      if (password !== confirmPassword) {
        setLocalError('Mật khẩu xác nhận không trùng khớp.');
        return;
      }

      if (password.length < 6) {
        setLocalError('Mật khẩu phải chứa ít nhất 6 ký tự.');
        return;
      }
    }

    setSubmitting(true);

    if (authMode === 'login') {
      const result = await login(username, password);
      setSubmitting(false);
      if (result.success) {
        if (result.role === 'admin') {
          navigate('/admin');
        } else {
          const from = location.state?.from || '/';
          navigate(from);
        }
      }
    } else if (authMode === 'register') {
      const result = await register(displayName, emailVal, phoneVal, password);
      setSubmitting(false);
      if (result.success) {
        setSuccessMessage('Đăng ký tài khoản thành công!');
        setTimeout(() => {
          const from = location.state?.from || '/';
          navigate(from);
        }, 1500);
      }
    }
  };

  const displayError = localError || authError;

  return (
    <div className="login-register-page animate-fade-in">
      <div className="auth-card-glow"></div>
      <div className="auth-card">
        {/* Header Tabs */}
        {authMode !== 'forgot' ? (
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Đăng Nhập
            </button>
            <button
              className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              Đăng Ký
            </button>
          </div>
        ) : (
          <div className="auth-forgot-header-bar">
            <button className="btn-back-login" onClick={() => handleTabChange('login')}>
              <ArrowLeft size={18} /> Quay lại Đăng nhập
            </button>
          </div>
        )}

        <div className="auth-body">
          <div className="auth-brand-header">
            <h3>PHÚC LONG</h3>
            <p>
              {authMode === 'login' && 'Chào mừng bạn quay trở lại!'}
              {authMode === 'register' && 'Tạo tài khoản để nhận nhiều ưu đãi hơn'}
              {authMode === 'forgot' && 'Khôi phục và đặt lại mật khẩu tài khoản'}
            </p>
          </div>

          {displayError && (
            <div className="auth-alert error-alert animate-shake">
              <AlertCircle size={18} />
              <span>{displayError}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert success-alert animate-fade-in">
              <CheckCircle size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {receivedOtpInfo && (
            <div className="auth-alert info-alert animate-fade-in">
              <KeyRound size={18} />
              <span>{receivedOtpInfo}</span>
            </div>
          )}

          {/* Forgot Password Flow */}
          {authMode === 'forgot' ? (
            forgotStep === 1 ? (
              <form onSubmit={handleForgotStep1Submit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="forgot-identifier">Gmail hoặc Số điện thoại đăng ký *</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      id="forgot-identifier"
                      placeholder="Nhập địa chỉ Gmail hoặc số điện thoại"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-auth-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Đang gửi mã OTP...' : 'Gửi Mã Xác Thực OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotStep2Submit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="otp-code">Mã OTP (6 chữ số) *</label>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="input-icon" />
                    <input
                      type="text"
                      id="otp-code"
                      placeholder="Nhập mã OTP 6 chữ số"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      className="form-control"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="forgot-new-password">Mật khẩu mới *</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      id="forgot-new-password"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="forgot-confirm-password">Xác nhận mật khẩu mới *</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      id="forgot-confirm-password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-auth-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác Nhận & Đặt Lại Mật Khẩu'}
                </button>
              </form>
            )
          ) : (
            /* Login & Register Forms */
            <form onSubmit={handleSubmit} className="auth-form">
              {authMode === 'login' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="login-username">Tên đăng nhập, Gmail hoặc Số điện thoại *</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        id="login-username"
                        placeholder="Nhập tên đăng nhập, Gmail hoặc số điện thoại"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="label-with-forgot">
                      <label htmlFor="login-password">Mật khẩu *</label>
                      <button
                        type="button"
                        className="btn-forgot-link"
                        onClick={() => handleTabChange('forgot')}
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input
                        type="password"
                        id="login-password"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="reg-displayname">Tên tài khoản (Tên hiển thị) *</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        id="reg-displayname"
                        placeholder="Nhập tên tài khoản của bạn"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="register-method-toggle-container">
                    <span className="toggle-label">Đăng ký bằng:</span>
                    <div className="register-method-tabs">
                      <button
                        type="button"
                        className={`register-method-tab ${registerMethod === 'email' ? 'active' : ''}`}
                        onClick={() => { setRegisterMethod('email'); setLocalError(''); }}
                      >
                        Gmail
                      </button>
                      <button
                        type="button"
                        className={`register-method-tab ${registerMethod === 'phone' ? 'active' : ''}`}
                        onClick={() => { setRegisterMethod('phone'); setLocalError(''); }}
                      >
                        Số điện thoại
                      </button>
                    </div>
                  </div>

                  {registerMethod === 'email' ? (
                    <div className="form-group animate-fade-in">
                      <label htmlFor="reg-email">Gmail *</label>
                      <div className="input-with-icon">
                        <User size={18} className="input-icon" />
                        <input
                          type="email"
                          id="reg-email"
                          placeholder="Nhập địa chỉ Gmail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="form-control"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="form-group animate-fade-in">
                      <label htmlFor="reg-phone">Số điện thoại *</label>
                      <div className="input-with-icon">
                        <User size={18} className="input-icon" />
                        <input
                          type="tel"
                          id="reg-phone"
                          placeholder="Nhập số điện thoại"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="form-control"
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="reg-password">Mật khẩu *</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input
                        type="password"
                        id="reg-password"
                        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-confirm-password">Xác nhận mật khẩu *</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input
                        type="password"
                        id="reg-confirm-password"
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-auth-submit"
                disabled={submitting}
              >
                {submitting
                  ? 'Đang xử lý...'
                  : (authMode === 'login' ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản')
                }
              </button>

              {authMode === 'register' && (
                <p className="privacy-terms-note" style={{ fontSize: '0.78rem', color: '#666', textAlign: 'center', marginTop: '12px' }}>
                  Bằng việc bấm Đăng Ký, bạn đồng ý với{' '}
                  <Link to="/privacy" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'underline' }}>
                    Điều Khoản & Chính Sách Quyền Riêng Tư
                  </Link>{' '}
                  của Phúc Long.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
