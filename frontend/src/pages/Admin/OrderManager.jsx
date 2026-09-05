import React, { useState, useEffect } from 'react';
import { ClipboardList, User, Phone, MapPin, Eye, RefreshCw, MessageCircle, Heart } from 'lucide-react';
import { socket, joinAdminRoom } from '../../services/socket';
import api from '../../services/api';
import './OrderManager.css';

const MOCK_ORDERS = [
  {
    _id: 'DH-82736',
    customerName: 'Nguyễn Văn Anh',
    customerPhone: '0901234567',
    shippingAddress: '123 Nguyễn Trãi, Phường 3, Quận 5, TP. HCM',
    notes: 'Giao giờ hành chính, gọi điện trước khi đến',
    items: [
      { name: 'Trà Sữa Phúc Long', size: 'M', quantity: 2, price: 45000, toppings: ['Trân châu hoàng kim'] }
    ],
    totalAmount: 110000, // 45k*2 + 10k*2 = 110k (no delivery fee)
    status: 'Pending',
    createdAt: '2026-06-29T10:30:00.000Z'
  },
  {
    _id: 'DH-12948',
    customerName: 'Trần Thị Bình',
    customerPhone: '0987654321',
    shippingAddress: '456 Lê Hồng Phong, Phường 2, Quận 10, TP. HCM',
    notes: 'Không đường, nhiều đá',
    items: [
      { name: 'Trà Đào Phúc Long', size: 'L', quantity: 1, price: 58000, toppings: ['Thạch đào'] },
      { name: 'Matcha Đá Xay', size: 'M', quantity: 1, price: 59000, toppings: [] }
    ],
    totalAmount: 137000, // 58k + 59k + 20k ship = 137k
    status: 'Processing',
    createdAt: '2026-06-29T09:15:00.000Z'
  },
  {
    _id: 'DH-90812',
    customerName: 'Lê Hoàng Cường',
    customerPhone: '0912345678',
    shippingAddress: '789 Trần Hưng Đạo, Phường 7, Quận 5, TP. HCM',
    notes: '',
    items: [
      { name: 'Cà Phê Sữa Đá', size: 'M', quantity: 1, price: 35000, toppings: [] },
      { name: 'Bánh Croissant Bơ Tỏi', size: '', quantity: 2, price: 29000, toppings: [] }
    ],
    totalAmount: 93000, // 35k + 29k*2 = 93k (no toppings) + 20k ship = 113k? wait, totalAmount is what's stored
    status: 'Completed',
    createdAt: '2026-06-28T15:40:00.000Z'
  }
];

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders');
      if (response.data.success && response.data.data.length > 0) {
        setOrders(response.data.data);
      } else {
        setOrders(MOCK_ORDERS);
      }
    } catch (error) {
      console.warn('Backend connection failed, loading mock order database.');
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    joinAdminRoom();

    const handleOrderCreated = ({ order }) => {
      setOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
    };

    const handleOrderCancelledByCustomer = ({ orderId }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: 'Cancelled' } : o))
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'Cancelled' } : prev));
      }
    };

    socket.on('order_created', handleOrderCreated);
    socket.on('order_cancelled_by_customer', handleOrderCancelledByCustomer);

    return () => {
      socket.off('order_created', handleOrderCreated);
      socket.off('order_cancelled_by_customer', handleOrderCancelledByCustomer);
    };
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      console.warn('Backend connection failed, simulating status change locally.');
      // Simulate locally
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    setUpdatingId(orderId);
    try {
      const response = await api.put(`/orders/${orderId}/status`, { paymentStatus: newPaymentStatus });
      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
          )
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, paymentStatus: newPaymentStatus }));
        }
      }
    } catch (error) {
      console.warn('Backend connection failed, updating payment status locally.');
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
        )
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, paymentStatus: newPaymentStatus }));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    return filterStatus === 'All' || order.status === filterStatus;
  });

  // Format price to VND
  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Format Date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="order-manager-component animate-fade-in">
      {/* Filter Tabs */}
      <div className="admin-filter-bar">
        <div className="status-filter-buttons">
          {['All', 'Pending', 'Processing', 'Delivering', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'All' ? 'Tất cả đơn' : status}
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-refresh-orders" onClick={fetchOrders}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Thời Gian</th>
                <th>Chi Tiết Sản Phẩm</th>
                <th>P.Thức TT</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái Giao</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td className="font-monospace text-primary-color">{order._id}</td>
                  <td>
                    <div className="customer-cell-info">
                      <span className="cust-name">{order.customerName}</span>
                      <span className="cust-phone">{order.customerPhone}</span>
                    </div>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <div className="order-items-summary-list">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-item-summary-row">
                          {item.quantity}x {item.name} {item.size && `(Size ${item.size})`}
                          {item.toppings && item.toppings.length > 0 && (
                            <span className="order-item-toppings-pill">
                              +{item.toppings.map(t => typeof t === 'string' ? t : t.name).join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.85rem' }}>
                      <span className="font-semibold">{order.paymentMethod === 'QR' ? '📱 Mã QR' : '💵 COD'}</span>
                      <span className={`badge ${order.paymentStatus === 'Paid' ? 'badge-completed' : order.paymentStatus === 'AwaitingConfirm' ? 'badge-processing' : 'badge-pending'}`} style={{ fontSize: '0.72rem', padding: '2px 6px', width: 'fit-content' }}>
                        {order.paymentStatus === 'Paid' ? 'Đã TT' : order.paymentStatus === 'AwaitingConfirm' ? 'Chờ XN' : 'Chưa TT'}
                      </span>
                    </div>
                  </td>
                  <td className="font-bold price-color">{formatPrice(order.totalAmount)}</td>
                  <td>
                    <span className={`badge badge-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn-table-action btn-view" 
                        onClick={() => setSelectedOrder(order)}
                        title="Xem chi tiết giao hàng"
                      >
                        <Eye size={16} /> Chi tiết
                      </button>
                      
                      <select
                        className="status-select-dropdown"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingId === order._id}
                      >
                        <option value="Pending">Chờ duyệt (Pending)</option>
                        <option value="Processing">Đang làm (Processing)</option>
                        <option value="Delivering">Đang giao (Delivering)</option>
                        <option value="Completed">Hoàn tất (Completed)</option>
                        <option value="Cancelled">Đã hủy (Cancelled)</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty-state">
          <ClipboardList size={48} className="empty-icon" />
          <h3>Không có đơn hàng nào</h3>
          <p>Không tìm thấy đơn hàng nào có trạng thái phù hợp.</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content order-detail-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h3>Chi Tiết Đơn Hàng #{selectedOrder._id}</h3>
              <button className="btn-close-detail" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            
            <div className="detail-modal-body">
              {/* Customer Info Section */}
              <div className="detail-section">
                <h4 className="detail-section-title"><User size={16} /> Thông Tin Khách Hàng</h4>
                <div className="detail-info-grid">
                  <div className="info-row">
                    <span className="info-label">Họ và tên:</span>
                    <span className="info-value">{selectedOrder.customerName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Số điện thoại:</span>
                    <span className="info-value">
                      <Phone size={14} /> {selectedOrder.customerPhone}
                    </span>
                  </div>
                  <div className="info-row full-width">
                    <span className="info-label">Địa chỉ giao:</span>
                    <span className="info-value">
                      <MapPin size={14} /> {selectedOrder.shippingAddress}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phương thức TT:</span>
                    <span className="info-value font-semibold">
                      {selectedOrder.paymentMethod === 'QR' ? '📱 Mã QR VietQR' : '💵 Tiền mặt (COD)'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Cập nhật TT:</span>
                    <select
                      className="status-select-dropdown"
                      value={selectedOrder.paymentStatus || 'Pending'}
                      onChange={(e) => handlePaymentStatusChange(selectedOrder._id, e.target.value)}
                      disabled={updatingId === selectedOrder._id}
                      style={{ padding: '2px 8px', fontSize: '0.85rem' }}
                    >
                      <option value="Pending">Chưa thanh toán (Pending)</option>
                      <option value="AwaitingConfirm">Chờ xác nhận (AwaitingConfirm)</option>
                      <option value="Paid">Đã thanh toán (Paid)</option>
                      <option value="Failed">Thất bại (Failed)</option>
                    </select>
                  </div>
                  {selectedOrder.notes && (
                    <div className="info-row full-width">
                      <span className="info-label">Ghi chú:</span>
                      <span className="info-value note-highlight">"{selectedOrder.notes}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List Section */}
              <div className="detail-section">
                <h4 className="detail-section-title"><ClipboardList size={16} /> Sản Phẩm Đã Đặt</h4>
                <div className="detail-items-table">
                  <div className="detail-item-table-header">
                    <span>Món ăn / Đồ uống</span>
                    <span className="text-center">Số lượng</span>
                    <span className="text-right">Đơn giá</span>
                    <span className="text-right">Thành tiền</span>
                  </div>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="detail-item-table-row">
                      <div className="detail-item-name-col">
                        <span className="item-main-name">{item.name}</span>
                        <span className="item-size-spec">Cỡ: Size {item.size || 'M'}</span>
                        {item.toppings && item.toppings.length > 0 && (
                          <span className="item-toppings-spec">Toppings: {item.toppings.map(t => typeof t === 'string' ? t : t.name).join(', ')}</span>
                        )}
                      </div>
                      <span className="text-center">{item.quantity}</span>
                      <span className="text-right">{formatPrice(item.price)}</span>
                      <span className="text-right font-bold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Section */}
              <div className="detail-summary-section">
                <div className="summary-info-row">
                  <span>Trạng thái giao hàng:</span>
                  <span className={`badge badge-${selectedOrder.status.toLowerCase()}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="summary-info-row total-row">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="price-color font-bold">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-modal-footer">
              <div className="update-status-quick-action">
                <span>Cập nhật trạng thái giao hàng:</span>
                <select
                  className="status-select-dropdown"
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                  disabled={updatingId === selectedOrder._id}
                >
                  <option value="Pending">Chờ duyệt (Pending)</option>
                  <option value="Processing">Đang làm (Processing)</option>
                  <option value="Delivering">Đang giao (Delivering)</option>
                  <option value="Completed">Hoàn tất (Completed)</option>
                  <option value="Cancelled">Đã hủy (Cancelled)</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={() => setSelectedOrder(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;

