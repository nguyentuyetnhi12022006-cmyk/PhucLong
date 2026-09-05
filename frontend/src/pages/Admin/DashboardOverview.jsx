import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Users, Award, Clock } from 'lucide-react';
import api from '../../services/api';
import './DashboardOverview.css';

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Không thể tải thống kê.');
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Đang tổng hợp dữ liệu báo cáo...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="dashboard-error">
        <p>{error || 'Đã xảy ra lỗi khi tải dữ liệu.'}</p>
        <button onClick={fetchStats} className="btn btn-primary">Thử Lại</button>
      </div>
    );
  }

  const { summary, dailyRevenueTrend, topProducts, categorySales, recentOrders } = stats;

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...dailyRevenueTrend.map(d => d.revenue), 100000);
  const totalCategorySales = categorySales.reduce((acc, c) => acc + c.value, 0);

  // SVG Chart Dimensions
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  // Calculate chart coordinates for line path
  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const points = dailyRevenueTrend.map((d, index) => {
    const x = paddingLeft + (index / (dailyRevenueTrend.length - 1)) * graphWidth;
    const y = paddingTop + graphHeight - (d.revenue / maxRevenue) * graphHeight;
    return { x, y, date: d.date, revenue: d.revenue };
  });

  const pathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`
    : '';

  return (
    <div className="admin-dashboard-overview animate-fade-in">
      {/* 4 KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon revenue-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-title">Tổng Doanh Thu</span>
            <span className="stat-card-value">{formatPrice(summary.totalRevenue)}</span>
            <span className="stat-card-sub text-success">Đơn hàng hoàn tất</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon orders-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-title">Tổng Đơn Hàng</span>
            <span className="stat-card-value">{summary.totalOrdersCount}</span>
            <span className="stat-card-sub text-info">
              {summary.completedOrdersCount} Thành công | {summary.cancelledOrdersCount} Hủy
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon ticket-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-title">Đơn Giá Trung Bình</span>
            <span className="stat-card-value">{formatPrice(summary.avgOrderValue)}</span>
            <span className="stat-card-sub text-secondary">Tỷ suất mua hàng</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon members-icon">
            <Users size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-title">Thành Viên</span>
            <span className="stat-card-value">{summary.totalUsersCount}</span>
            <span className="stat-card-sub text-warning">Tài khoản khách hàng</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="dashboard-charts-grid">
        {/* Left: Revenue Trend Chart */}
        <div className="dashboard-chart-card">
          <div className="chart-card-header">
            <h3><TrendingUp size={18} className="card-icon-title" /> Xu Hướng Doanh Thu (30 Ngày Qua)</h3>
            <span className="chart-subtitle">Đơn vị: VND (Chỉ tính đơn Completed)</span>
          </div>
          <div className="chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-chart">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = paddingTop + graphHeight * ratio;
                const value = Math.round(maxRevenue * (1 - ratio));
                return (
                  <g key={index} className="chart-grid-line">
                    <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#f0f0f0" strokeDasharray="4 4" />
                    <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#999">
                      {value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value / 1000}k`}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels (First, middle, last date) */}
              {points.length > 1 && (
                <>
                  <text x={points[0].x} y={paddingTop + graphHeight + 20} textAnchor="middle" fontSize="10" fill="#888">
                    {points[0].date.split('-').slice(1).reverse().join('/')}
                  </text>
                  <text x={points[Math.floor(points.length / 2)].x} y={paddingTop + graphHeight + 20} textAnchor="middle" fontSize="10" fill="#888">
                    {points[Math.floor(points.length / 2)].date.split('-').slice(1).reverse().join('/')}
                  </text>
                  <text x={points[points.length - 1].x} y={paddingTop + graphHeight + 20} textAnchor="middle" fontSize="10" fill="#888">
                    {points[points.length - 1].date.split('-').slice(1).reverse().join('/')}
                  </text>
                </>
              )}

              {/* Area under the line */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" opacity="0.15" />}

              {/* Line path */}
              {pathD && <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />}

              {/* Data points */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={i === points.length - 1 || pt.revenue === maxRevenue ? 4 : 2}
                  fill="var(--color-primary)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="chart-dot-marker"
                >
                  <title>{`${pt.date}: ${formatPrice(pt.revenue)}`}</title>
                </circle>
              ))}

              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Right: Category Sales Breakdown */}
        <div className="dashboard-chart-card category-card">
          <div className="chart-card-header">
            <h3><ShoppingBag size={18} className="card-icon-title" /> Phân Bổ Doanh Số Theo Danh Mục</h3>
            <span className="chart-subtitle">Tổng: {formatPrice(totalCategorySales)}</span>
          </div>
          <div className="category-list-breakdown">
            {categorySales.map((cat, idx) => {
              const percentage = totalCategorySales > 0 ? Math.round((cat.value / totalCategorySales) * 100) : 0;
              const colorClass = `cat-bar-fill-${idx}`;
              return (
                <div key={cat.category} className="category-breakdown-item">
                  <div className="category-item-meta">
                    <span className="cat-name">{cat.category}</span>
                    <span className="cat-value">{formatPrice(cat.value)} ({percentage}%)</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className={`progress-bar-fill ${colorClass}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Top Products & Recent Orders */}
      <div className="dashboard-details-grid">
        {/* Top 5 Products */}
        <div className="details-card">
          <div className="details-card-header">
            <h3><Award size={18} className="card-icon-title text-warning" /> Top 5 Sản Phẩm Bán Chạy</h3>
          </div>
          <div className="details-card-body">
            <div className="table-responsive">
              <table className="admin-table simple-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Danh mục</th>
                    <th className="text-center">Số lượng</th>
                    <th className="text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">Chưa có dữ liệu sản phẩm đã bán.</td>
                    </tr>
                  ) : (
                    topProducts.map((p, index) => (
                      <tr key={index}>
                        <td>
                          <div className="product-rank-name">
                            <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                            <span className="p-name font-semibold">{p.name}</span>
                          </div>
                        </td>
                        <td><span className="badge category-badge-simple">{p.category}</span></td>
                        <td className="text-center font-semibold">{p.quantity} ly</td>
                        <td className="text-right font-semibold text-primary-dark">{formatPrice(p.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="details-card">
          <div className="details-card-header">
            <h3><Clock size={18} className="card-icon-title text-info" /> Đơn Hàng Gần Đây</h3>
          </div>
          <div className="details-card-body">
            <div className="table-responsive">
              <table className="admin-table simple-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Khách hàng</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">Chưa có đơn hàng nào được tạo.</td>
                    </tr>
                  ) : (
                    recentOrders.map((o) => (
                      <tr key={o._id}>
                        <td className="font-mono text-sm highlight-id">#{o._id.slice(-6).toUpperCase()}</td>
                        <td>
                          <div className="customer-info-simple">
                            <p className="cust-name font-semibold">{o.customerName}</p>
                            <p className="cust-phone text-xs text-muted">{o.customerPhone}</p>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${o.status.toLowerCase()}`}>
                            {o.status === 'Pending' && 'Chờ duyệt'}
                            {o.status === 'Processing' && 'Đang làm'}
                            {o.status === 'Delivering' && 'Đang giao'}
                            {o.status === 'Completed' && 'Đã giao'}
                            {o.status === 'Cancelled' && 'Đã hủy'}
                          </span>
                        </td>
                        <td className="text-right font-semibold text-primary-dark">{formatPrice(o.totalAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
