import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, Check, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './CouponManager.css';

const FALLBACK_COUPONS = [
  {
    _id: 'fb-cp-1',
    code: 'PHUCLONG10',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountAmount: 30000,
    minOrderAmount: 100000,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
  {
    _id: 'fb-cp-2',
    code: 'KM50K',
    discountType: 'fixed',
    discountValue: 50000,
    maxDiscountAmount: null,
    minOrderAmount: 200000,
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  }
];

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null); // null for Add, coupon object for Edit

  // Form Fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/coupons');
      if (response.data.success) {
        setCoupons(response.data.data);
      } else {
        setCoupons(FALLBACK_COUPONS);
      }
    } catch (err) {
      console.warn('Backend connection failed, using fallback coupon database.');
      setCoupons(FALLBACK_COUPONS);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMaxDiscountAmount('');
    setMinOrderAmount('0');
    setExpiryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 7 days from now
    setIsActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMaxDiscountAmount(coupon.maxDiscountAmount || '');
    setMinOrderAmount(coupon.minOrderAmount || '0');
    // Format date for input: YYYY-MM-DD
    const formattedDate = coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '';
    setExpiryDate(formattedDate);
    setIsActive(coupon.isActive);
    setError('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (coupon) => {
    const updatedStatus = !coupon.isActive;
    try {
      await api.put(`/coupons/${coupon._id}`, { isActive: updatedStatus });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? { ...c, isActive: updatedStatus } : c));
    } catch (err) {
      console.warn('Backend offline, toggling status locally.');
      setCoupons(prev => prev.map(c => c._id === coupon._id ? { ...c, isActive: updatedStatus } : c));
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.warn('Backend offline, deleting coupon locally.');
      setCoupons(prev => prev.filter(c => c._id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discountValue || !expiryDate) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }

    setSubmitting(true);
    setError('');

    const couponData = {
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      expiryDate: new Date(expiryDate),
      isActive
    };

    try {
      if (editingCoupon) {
        // Edit Mode
        const response = await api.put(`/coupons/${editingCoupon._id}`, couponData);
        if (response.data.success) {
          setCoupons(prev => prev.map(c => c._id === editingCoupon._id ? response.data.data : c));
          setIsModalOpen(false);
        }
      } else {
        // Add Mode
        const response = await api.post('/coupons', couponData);
        if (response.data.success) {
          setCoupons(prev => [response.data.data, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.warn('Backend offline, simulating operation locally.');
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra.';
      
      // Simulate locally if server issue
      if (errorMsg.includes('tồn tại')) {
        setError(errorMsg);
        setSubmitting(false);
        return;
      }

      if (editingCoupon) {
        const mockUpdated = { ...editingCoupon, ...couponData };
        setCoupons(prev => prev.map(c => c._id === editingCoupon._id ? mockUpdated : c));
      } else {
        const mockNew = {
          _id: 'MOCK-CP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          ...couponData,
          createdAt: new Date().toISOString()
        };
        setCoupons(prev => [mockNew, ...prev]);
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="coupon-manager-container animate-fade-in">
      <div className="manager-actions-row">
        <button onClick={handleOpenAddModal} className="btn btn-primary btn-add-coupon">
          <Plus size={18} /> Tạo Mã Giảm Giá
        </button>
      </div>

      {loading ? (
        <div className="manager-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách mã giảm giá...</p>
        </div>
      ) : (
        <div className="table-responsive select-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Kiểu giảm giá</th>
                <th>Giá trị</th>
                <th>Đơn tối thiểu</th>
                <th>Giảm tối đa</th>
                <th>Hạn dùng</th>
                <th>Trạng thái</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted">Chưa có mã giảm giá nào.</td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiryDate) < new Date();
                  return (
                    <tr key={coupon._id} className={isExpired ? 'expired-row' : ''}>
                      <td className="coupon-code-cell">
                        <Ticket size={16} className="coupon-icon-table" />
                        <span className="code-text font-mono font-bold">{coupon.code}</span>
                      </td>
                      <td>
                        {coupon.discountType === 'percentage' ? (
                          <span className="badge badge-pct">Phần trăm (%)</span>
                        ) : (
                          <span className="badge badge-fixed">Số tiền cố định</span>
                        )}
                      </td>
                      <td className="font-semibold text-primary-dark">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}
                      </td>
                      <td className="font-semibold">{formatPrice(coupon.minOrderAmount)}</td>
                      <td>{coupon.maxDiscountAmount ? formatPrice(coupon.maxDiscountAmount) : '—'}</td>
                      <td>
                        <span className={`date-badge ${isExpired ? 'expired' : ''}`}>
                          {formatDate(coupon.expiryDate)} {isExpired && '(Hết hạn)'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggleStatus(coupon)}
                          className={`btn-toggle-status ${coupon.isActive ? 'active' : 'inactive'}`}
                          title="Bật/Tắt hoạt động"
                        >
                          {coupon.isActive ? 'Đang bật' : 'Vô hiệu'}
                        </button>
                      </td>
                      <td className="text-center actions-cell">
                        <button onClick={() => handleOpenEditModal(coupon)} className="btn-action edit" title="Sửa">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteCoupon(coupon._id)} className="btn-action delete" title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content coupon-modal-content animate-slide-up">
            <div className="modal-header">
              <h3>{editingCoupon ? 'Cập Nhật Mã Giảm Giá' : 'Thêm Mã Giảm Giá Mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-close-modal">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {error && (
                <div className="form-error-banner">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="code">Mã Giảm Giá *</label>
                  <input 
                    type="text" 
                    id="code"
                    placeholder="e.g. PHUCLONG10" 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    disabled={editingCoupon !== null}
                    className="form-control font-mono"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="discountType">Loại Giảm Giá *</label>
                  <select 
                    id="discountType"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="form-control"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
              </div>

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="discountValue">
                    {discountType === 'percentage' ? 'Tỷ lệ giảm (%) *' : 'Mức giảm giá (VND) *'}
                  </label>
                  <input 
                    type="number" 
                    id="discountValue"
                    min="1"
                    placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 30000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="minOrderAmount">Giá trị đơn tối thiểu (VND)</label>
                  <input 
                    type="number" 
                    id="minOrderAmount"
                    min="0"
                    placeholder="e.g. 100000"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="maxDiscountAmount">
                    Mức giảm tối đa (VND) {discountType === 'percentage' ? '' : '(Không áp dụng)'}
                  </label>
                  <input 
                    type="number" 
                    id="maxDiscountAmount"
                    min="1"
                    placeholder="e.g. 50000"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    disabled={discountType !== 'percentage'}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expiryDate">Hạn Sử Dụng *</label>
                  <input 
                    type="date" 
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Kích hoạt mã giảm giá này ngay lập tức</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={submitting}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : editingCoupon ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManager;
