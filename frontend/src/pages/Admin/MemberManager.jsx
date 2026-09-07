import React, { useState, useEffect } from 'react';
import { Shield, User, Trash2, ArrowUp, ArrowDown, Users, AlertCircle, Check, MessageCircle, Search, KeyRound } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './MemberManager.css';

const FALLBACK_USERS = [
  {
    _id: 'fb-us-1',
    username: 'admin',
    email: 'admin@phuclong.vn',
    phone: '0901234567',
    role: 'admin',
    isMasterAdmin: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'fb-us-2',
    username: 'Nguyễn Văn An',
    email: 'an.nguyen@gmail.com',
    phone: '0908123456',
    role: 'user',
    isMasterAdmin: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'fb-us-3',
    username: 'Trần Thị Bình',
    email: 'binh.tran@gmail.com',
    phone: '0912345678',
    role: 'user',
    isMasterAdmin: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'fb-us-4',
    username: 'Lê Hoàng Long',
    email: 'long.le@gmail.com',
    phone: '0938765432',
    role: 'user',
    isMasterAdmin: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const MemberManager = ({ onContactUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleTabFilter, setRoleTabFilter] = useState('admin'); // 'admin' | 'user' | 'all'

  const checkIsMasterAdmin = (u) => {
    if (!u) return false;
    return !!(
      u.isMasterAdmin ||
      u.username === 'admin' ||
      u.email === 'admin@phuclong.vn' ||
      u.email === 'admin@phuclong.com'
    );
  };

  const isCurrentMasterAdmin = checkIsMasterAdmin(currentUser);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/users');
      if (response.data && response.data.success) {
        setUsers(response.data.data);
      } else {
        setUsers(FALLBACK_USERS);
      }
    } catch (err) {
      console.warn('Backend connection failed, using fallback user database.');
      setUsers(FALLBACK_USERS);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (!isCurrentMasterAdmin) {
      alert('Chỉ tài khoản Admin gốc (Master Admin) mới có quyền cấp hoặc thu hồi quyền quản trị viên!');
      return;
    }

    const actionText = newRole === 'admin' ? 'CẤP QUYỀN ADMIN' : 'THU HỒI QUYỀN ADMIN';
    if (!window.confirm(`XÁC NHẬN PHÂN QUYỀN:\nBạn có chắc chắn muốn ${actionText} cho thành viên "${targetUser.username}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/admin/users/${targetUser._id}`, { role: newRole });
      if (response.data && response.data.success) {
        setUsers(prev => prev.map(u => u._id === targetUser._id ? response.data.data : u));
        setSuccess(`Đã ${actionText.toLowerCase()} cho thành viên "${targetUser.username}" thành công.`);
        setTimeout(() => setSuccess(''), 3500);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể cập nhật quyền.';
      setError(msg);
      setTimeout(() => setError(''), 4000);

      if (msg.includes('đăng nhập') || msg.includes('Không thể hạ quyền') || msg.includes('Master Admin')) {
        return;
      }

      console.warn('Backend offline, updating role locally.');
      setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, role: newRole } : u));
      setSuccess(`[Local Demo] Đã đổi quyền "${targetUser.username}" thành ${newRole}.`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!isCurrentMasterAdmin) {
      alert('Chỉ tài khoản Admin gốc (Master Admin) mới có quyền xóa tài khoản thành viên!');
      return;
    }

    const isMe = targetUser._id?.toString() === currentUser?._id?.toString() || targetUser.username === currentUser?.username;
    if (isMe || checkIsMasterAdmin(targetUser)) {
      alert('Bạn không thể xóa tài khoản Admin tối cao hoặc tài khoản đang sử dụng!');
      return;
    }

    if (!window.confirm(`HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC!\nBạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${targetUser.username}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/admin/users/${targetUser._id}`);
      if (response.data && response.data.success) {
        setUsers(prev => prev.filter(u => u._id !== targetUser._id));
        setSuccess(`Xóa thành viên "${targetUser.username}" thành công.`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa thành viên.';
      setError(msg);
      setTimeout(() => setError(''), 4000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '—';
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!u) return false;

    // Filter by role sub-tab
    if (roleTabFilter === 'admin' && u.role !== 'admin') return false;
    if (roleTabFilter === 'user' && u.role === 'admin') return false;

    // Filter by search query
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone?.toLowerCase().includes(query) ||
      u._id?.toString().toLowerCase().includes(query)
    );
  });

  return (
    <div className="member-manager-container animate-fade-in">
      {/* Sub-Tab Role Filters */}
      <div className="member-role-filter-bar" style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className={`filter-btn ${roleTabFilter === 'admin' ? 'active' : ''}`}
          onClick={() => setRoleTabFilter('admin')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '600',
            border: '1.5px solid #0c513f',
            backgroundColor: roleTabFilter === 'admin' ? '#0c513f' : '#ffffff',
            color: roleTabFilter === 'admin' ? '#ffffff' : '#0c513f',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <Shield size={15} />
          <span>Tài Khoản Admin Đã Phân Quyền ({users.filter(u => u.role === 'admin').length})</span>
        </button>

        <button
          className={`filter-btn ${roleTabFilter === 'user' ? 'active' : ''}`}
          onClick={() => setRoleTabFilter('user')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '600',
            border: '1.5px solid #cbd5e1',
            backgroundColor: roleTabFilter === 'user' ? '#0c513f' : '#ffffff',
            color: roleTabFilter === 'user' ? '#ffffff' : '#475569',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <User size={15} />
          <span>Tài Khoản Khách Hàng ({users.filter(u => u.role !== 'admin').length})</span>
        </button>

        <button
          className={`filter-btn ${roleTabFilter === 'all' ? 'active' : ''}`}
          onClick={() => setRoleTabFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '600',
            border: '1.5px solid #cbd5e1',
            backgroundColor: roleTabFilter === 'all' ? '#0c513f' : '#ffffff',
            color: roleTabFilter === 'all' ? '#ffffff' : '#475569',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <Users size={15} />
          <span>Tất Cả ({users.length})</span>
        </button>
      </div>

      {/* Search Header Bar */}
      <div className="member-manager-toolbar" style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="search-conv-box" style={{ flexGrow: 1, maxWidth: '400px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT hoặc mã thành viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
        </div>
        <span className="text-muted text-xs">
          Hiển thị <strong>{filteredUsers.length}</strong> kết quả
        </span>
      </div>

      {!isCurrentMasterAdmin && (
        <div className="alert-message info-alert" style={{ backgroundColor: '#e3f2fd', border: '1px solid #bbdefb', color: '#1565c0', marginBottom: '12px' }}>
          <KeyRound size={18} />
          <span>Bạn đang đăng nhập bằng <strong>Tài khoản Admin được nâng cấp</strong>. Chỉ <strong>Tài khoản Admin gốc (Master Admin)</strong> mới có quyền cấp hoặc thu hồi quyền quản trị đối với người dùng khác.</span>
        </div>
      )}

      {error && (
        <div className="alert-message danger-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert-message success-alert">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="manager-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách thành viên...</p>
        </div>
      ) : (
        <div className="table-responsive select-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Mã tài khoản</th>
                <th>Quyền hạn</th>
                <th>Ngày đăng ký</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-muted">
                    Không tìm thấy thành viên nào phù hợp với từ khóa "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  if (!u || !u._id) return null;
                  const isMe = u._id?.toString() === currentUser?._id?.toString() || u.username === currentUser?.username;
                  const targetIsMaster = checkIsMasterAdmin(u);
                  const targetIsAdmin = u.role === 'admin';

                  return (
                    <tr key={u._id} className={isMe ? 'current-user-row' : ''}>
                      <td>
                        <div className="user-profile-cell">
                          <div className={`user-avatar-badge ${targetIsAdmin ? 'admin-avatar' : 'user-avatar'}`}>
                            {targetIsAdmin ? <Shield size={16} /> : <User size={16} />}
                          </div>
                          <div className="user-profile-info">
                            <span className="username-text font-bold">
                              {u.username} {isMe && <span className="current-user-tag">(Bạn)</span>}
                              {targetIsMaster && (
                                <span className="master-admin-badge" style={{ marginLeft: '6px', fontSize: '0.68rem', backgroundColor: '#0c513f', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  ★ Gốc
                                </span>
                              )}
                            </span>
                            {(u.email || u.phone) && (
                              <div className="text-xs text-muted">
                                {u.email} {u.phone ? `• ${u.phone}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-muted">#{u._id}</td>
                      <td>
                        <span className={`role-badge ${targetIsAdmin ? 'admin' : 'user'}`}>
                          {targetIsMaster ? 'Master Admin' : targetIsAdmin ? 'Quản trị viên' : 'Khách hàng'}
                        </span>
                      </td>
                      <td>
                        <span className="date-joined-text">{formatDate(u.createdAt)}</span>
                      </td>
                      <td className="text-center actions-cell">
                        {isMe ? (
                          <span className="text-muted text-xs font-semibold">Đang sử dụng</span>
                        ) : (
                          <div style={{ display: 'inline-grid', gridTemplateColumns: '100px 105px 40px', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Cột 1: Nút Nhắn tin liên hệ với khách hàng */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              {!targetIsAdmin && onContactUser && (
                                <button
                                  onClick={() => onContactUser(u)}
                                  className="btn-action-member contact"
                                  title="Nhắn tin liên hệ với khách hàng này"
                                  style={{
                                    backgroundColor: '#0c513f',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    boxShadow: '0 2px 4px rgba(12, 81, 63, 0.12)',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <MessageCircle size={14} /> Liên hệ
                                </button>
                              )}
                            </div>

                            {/* Cột 2: Nút Promote / Demote dành cho Admin gốc */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              {isCurrentMasterAdmin ? (
                                targetIsMaster ? (
                                  <span className="text-muted text-xs font-semibold" style={{ color: '#0c513f', whiteSpace: 'nowrap' }}>
                                    Tài khoản gốc
                                  </span>
                                ) : !targetIsAdmin ? (
                                  <button
                                    onClick={() => handleRoleChange(u, 'admin')}
                                    className="btn-action-member promote"
                                    title="Cấp quyền Admin cho tài khoản này"
                                    style={{
                                      backgroundColor: '#e6f4ea',
                                      color: '#1e7e46',
                                      border: '1px solid #ceebd6',
                                      padding: '6px 12px',
                                      borderRadius: '20px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.8rem',
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <ArrowUp size={14} /> Promote
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRoleChange(u, 'user')}
                                    className="btn-action-member demote"
                                    title="Thu hồi quyền Admin của tài khoản này"
                                    style={{
                                      backgroundColor: '#fef3c7',
                                      color: '#b45309',
                                      border: '1px solid #fde68a',
                                      padding: '6px 12px',
                                      borderRadius: '20px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.8rem',
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <ArrowDown size={14} /> Demote
                                  </button>
                                )
                              ) : (
                                targetIsAdmin && (
                                  <span className="text-muted text-xs font-semibold" style={{ whiteSpace: 'nowrap' }}>Quản trị viên</span>
                                )
                              )}
                            </div>

                            {/* Cột 3: Nút Thùng Rác (Xóa) - Luôn nằm ở Cột 3 thẳng hàng 100% */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              {isCurrentMasterAdmin && !targetIsMaster && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="btn-action delete-member"
                                  title="Xóa tài khoản"
                                  style={{
                                    backgroundColor: '#ffffff',
                                    color: '#ef4444',
                                    border: '1px solid #fee2e2',
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    margin: 0,
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MemberManager;
