import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Clock, RefreshCw, Copy, Check, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { BANK_CONFIG, generateVietQRUrl } from '../config/bankConfig';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './QRPaymentModal.css';

const QRPaymentModal = ({ amount, orderId, customerPhone, onClose, isInline = false, initialPaymentStatus = 'Pending' }) => {
  // 10 minutes = 600 seconds
  const [timeLeft, setTimeLeft] = useState(600);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0 || paymentStatus === 'Paid') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, paymentStatus]);

  const handleResetTimer = () => {
    setTimeLeft(600);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const transferContent = customerPhone ? `${customerPhone} PL` : orderId ? `PL ${orderId.slice(-6).toUpperCase()}` : 'PL THANH TOAN';
  const qrUrl = generateVietQRUrl(amount, transferContent);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const handlePaymentConfirmation = async () => {
    if (!orderId) return;

    // Notify the backend that the customer has transferred money so the
    // tracking page shows "ĐÃ CHUYỂN KHOẢN — CHỜ XÁC NHẬN" instead of
    // "CHƯA THANH TOÁN" until an admin confirms the payment.
    if (isAuthenticated && paymentStatus !== 'Paid' && paymentStatus !== 'AwaitingConfirm') {
      setConfirming(true);
      try {
        await api.post(`/orders/${orderId}/mark-sent-money`);
      } catch (err) {
        console.warn('Could not notify admin of transfer:', err.message);
      } finally {
        setConfirming(false);
      }
    }

    navigate(`/profile?tab=track&id=${orderId}`);
  };

  const isExpired = timeLeft <= 0;
  const isPaid = paymentStatus === 'Paid';

  const content = (
    <div className={`qr-payment-card ${isInline ? 'inline-card' : 'modal-card'} ${isPaid ? 'qr-paid-state' : ''} animate-fade-in`}>
      {/* Header */}
      <div className="qr-card-header">
        <div className="qr-header-title">
          <QrCode size={24} className="qr-header-icon" />
          <div>
            <h3>Thanh Toán Qua Mã QR VietQR</h3>
            <p className="qr-header-sub">Quét mã bằng App Ngân hàng hoặc Ví điện tử (Momo, ZaloPay...)</p>
          </div>
        </div>
        {onClose && !isInline && (
          <button className="btn-close-qr-modal" onClick={onClose} title="Đóng cửa sổ">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Payment Status Banner */}
      {isPaid ? (
        <div className="qr-paid-success-banner">
          <CheckCircle2 size={24} />
          <div>
            <strong>🟢 THANH TOÁN THÀNH CÔNG!</strong>
            <p>Hệ thống đã ghi nhận số tiền {formatPrice(amount)}. Đơn hàng đang được chuẩn bị.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="qr-waiting-status">
            <Clock size={16} />
            <span>
              🟡 <strong>Chưa thanh toán</strong> — quản trị viên sẽ kiểm tra giao dịch và cập nhật thủ công.
            </span>
          </div>
          <div className={`qr-timer-banner ${isExpired ? 'timer-expired' : 'timer-active'}`}>
            <div className="timer-info-left">
              <Clock size={18} className={!isExpired ? 'animate-spin-slow' : ''} />
              <span>{isExpired ? 'Mã QR đã hết hạn thanh toán' : 'Thời gian đếm ngược thanh toán:'}</span>
            </div>
            <div className="timer-digits">
              {isExpired ? '00:00' : formatTimer(timeLeft)}
            </div>
          </div>
        </>
      )}

      {/* Main Content Body */}
      <div className="qr-card-body">
        {/* Left: Large QR Image Display */}
        <div className="qr-image-column">
          <div className={`qr-large-frame ${isExpired && !isPaid ? 'frame-expired' : ''} ${isPaid ? 'frame-paid' : ''}`}>
            <img 
              src={qrUrl} 
              alt="Mã VietQR Thanh Toán" 
              className="qr-large-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=` + encodeURIComponent(`STK: ${BANK_CONFIG.accountNo} - ${BANK_CONFIG.bankId} - NGUYEN TUYET NHI - So tien: ${amount}d - ND: ${transferContent}`);
              }}
            />
            {isPaid && (
              <div className="qr-paid-overlay-badge">
                <CheckCircle2 size={42} color="#10b981" />
                <span>ĐÃ THANH TOÁN</span>
              </div>
            )}
            {isExpired && !isPaid && (
              <div className="qr-expired-overlay">
                <p>⚠️ Hết thời gian 10 phút</p>
                <button className="btn-refresh-qr" onClick={handleResetTimer}>
                  <RefreshCw size={16} /> Tạo lại mã QR mới
                </button>
              </div>
            )}
          </div>
          <div className="qr-scan-badge">
            <ShieldCheck size={16} />
            <span>{isPaid ? 'Đã thanh toán đủ' : 'Đã khóa sẵn số tiền'} <strong>{formatPrice(amount)}</strong></span>
          </div>
        </div>

        {/* Right: Bank Details & Instructions */}
        <div className="qr-details-column">
          <div className="bank-info-box">
            <div className="bank-info-row">
              <span className="lbl">Ngân hàng nhận:</span>
              <strong className="val text-primary">{BANK_CONFIG.bankName}</strong>
            </div>

            <div className="bank-info-row highlighted-row">
              <span className="lbl">Số tài khoản:</span>
              <div className="val-copy-group">
                <strong className="acc-number">{BANK_CONFIG.accountNo}</strong>
                <button 
                  type="button"
                  className="btn-copy-mini" 
                  onClick={() => handleCopy(BANK_CONFIG.accountNo, 'acc')}
                >
                  {copiedAcc ? <Check size={14} /> : <Copy size={14} />}
                  {copiedAcc ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <div className="bank-info-row">
              <span className="lbl">Chủ tài khoản:</span>
              <strong className="val">{BANK_CONFIG.accountName}</strong>
            </div>

            <div className="bank-info-row highlighted-row">
              <span className="lbl">Số tiền chính xác:</span>
              <strong className="val amount-text">{formatPrice(amount)}</strong>
            </div>

            <div className="bank-info-row highlighted-row">
              <span className="lbl">Nội dung CK:</span>
              <div className="val-copy-group">
                <strong className="content-code">{transferContent}</strong>
                <button 
                  type="button"
                  className="btn-copy-mini" 
                  onClick={() => handleCopy(transferContent, 'content')}
                >
                  {copiedContent ? <Check size={14} /> : <Copy size={14} />}
                  {copiedContent ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          </div>

          {!isPaid ? (
            <div className="qr-action-box">
              <button
                type="button"
                className="qr-payment-confirm-button"
                onClick={handlePaymentConfirmation}
                disabled={!orderId || confirming}
              >
                {confirming ? 'Đang ghi nhận...' : 'Tôi đã thanh toán'}
              </button>
            </div>
          ) : (
            <div className="qr-success-confirmed-msg">
              <CheckCircle2 size={20} color="#10b981" />
              <span>Trạng thái: <strong>🟢 THANH TOÁN THÀNH CÔNG</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-container" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
};

export default QRPaymentModal;
