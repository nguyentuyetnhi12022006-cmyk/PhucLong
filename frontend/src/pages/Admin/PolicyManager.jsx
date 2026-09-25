import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, RefreshCw, Save, CheckCircle, ExternalLink } from 'lucide-react';
import './PolicyManager.css';

const PolicyManager = () => {
  const [activeTab, setActiveTab] = useState('privacy');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const defaultPolicies = {
    privacy: {
      title: 'Chính Sách Bảo Mật Dữ Liệu',
      subtitle: 'Quy định thu thập, mã hóa và bảo vệ thông tin khách hàng',
      sections: [
        {
          heading: '1. Thu thập & Mục đích sử dụng thông tin',
          content: 'Chúng tôi chỉ thu thập thông tin cần thiết nhằm xử lý đơn hàng và giao hàng: Họ tên, Số điện thoại, Địa chỉ giao nhận và Email. Dữ liệu chỉ dùng để xác nhận đơn và tư vấn khách hàng.'
        },
        {
          heading: '2. Bảo mật Giao dịch Thanh toán',
          content: 'Mọi hình thức thanh toán trực tuyến qua mã VietQR (MBBank) hoặc COD được mã hóa an toàn. Hệ thống không lưu trữ thông tin số thẻ hay mật khẩu ngân hàng của khách hàng.'
        },
        {
          heading: '3. Quy định Tra cứu & Quyền riêng tư',
          content: 'Khách hàng chưa đăng nhập được phép đặt hàng tự do và tra cứu tiến trình giao hàng trực tiếp bằng Số điện thoại hoặc Mã đơn hàng.'
        },
        {
          heading: '4. Cam kết không chia sẻ thông tin',
          content: 'Dữ liệu khách hàng được bảo mật tuyệt đối, không chia sẻ hay bán cho bất kỳ bên thứ ba nào ngoại trừ đơn vị đối tác vận chuyển giao hàng.'
        }
      ]
    },
    terms: {
      title: 'Điều Khoản Sử Dụng Dịch Vụ',
      subtitle: 'Quy định quyền hạn và trách nhiệm khi sử dụng website đặt hàng',
      sections: [
        {
          heading: '1. Trách nhiệm người dùng',
          content: 'Khách hàng cam kết cung cấp chính xác thông tin giao hàng và kiểm tra sản phẩm trước khi nhận món từ nhân viên giao hàng.'
        },
        {
          heading: '2. Quy định Đặt hàng & Hủy đơn',
          content: 'Đơn hàng sau khi đặt thành công sẽ được nhà bếp chế biến. Khách hàng chỉ có thể yêu cầu hủy đơn khi đơn hàng chưa chuyển sang trạng thái "Đang giao".'
        }
      ]
    },
    returns: {
      title: 'Chính Sách Đổi Trả & Hoàn Tiền',
      subtitle: 'Đảm bảo quyền lợi khách hàng khi gặp sự cố sản phẩm',
      sections: [
        {
          heading: '1. Điều kiện hỗ trợ đổi trả',
          content: 'Hỗ trợ đổi món mới hoặc hoàn tiền 100% nếu giao sai sản phẩm, thiếu món hoặc món ăn/đồ uống bị đổ vỡ hư hỏng do vận chuyển.'
        },
        {
          heading: '2. Thời gian phản hồi',
          content: 'Khách hàng vui lòng liên hệ Hotline hoặc nhắn tin hỗ trợ trong vòng 30 phút kể từ khi nhận hàng để được giải quyết ngay.'
        }
      ]
    }
  };

  // Initial Policy Content State
  const [policies, setPolicies] = useState(() => {
    try {
      const saved = localStorage.getItem('milktea_custom_policies');
      return saved ? JSON.parse(saved) : defaultPolicies;
    } catch {
      return defaultPolicies;
    }
  });

  const handleSectionChange = (tabKey, index, field, value) => {
    setPolicies(prev => {
      const updatedTab = { ...prev[tabKey] };
      const updatedSections = [...updatedTab.sections];
      updatedSections[index] = { ...updatedSections[index], [field]: value };
      updatedTab.sections = updatedSections;
      return { ...prev, [tabKey]: updatedTab };
    });
  };

  const handleSave = () => {
    // Save to local storage for persistence across reloads
    localStorage.setItem('milktea_custom_policies', JSON.stringify(policies));
    window.dispatchEvent(new Event('policy_updated'));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const currentPolicy = policies[activeTab];

  return (
    <div className="policy-manager-container">
      {/* Header Banner */}
      <div className="policy-manager-header">
        <div className="header-info">
          <div className="policy-badge">
            <ShieldCheck size={18} /> Quản Lý Hệ Thống
          </div>
          <h2>Quản Lý Chính Sách & Điều Khoản</h2>
          <p>Chỉnh sửa, cập nhật và xem trước các quy định bảo mật hiển thị cho khách hàng</p>
        </div>

        <div className="header-actions">
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-preview-customer">
            <ExternalLink size={16} /> Xem Giao Diện Khách
          </a>
          <button className="btn btn-primary btn-save-policy" onClick={handleSave}>
            <Save size={18} /> Lưu Cập Nhật
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="save-success-alert animate-slide-down">
          <CheckCircle size={20} />
          <span>Cập nhật chính sách & điều khoản thành công! Dữ liệu đã được lưu trữ.</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="policy-tabs-bar">
        <button
          className={`policy-tab-item ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <Lock size={18} />
          <span>Chính Sách Bảo Mật</span>
        </button>
        <button
          className={`policy-tab-item ${activeTab === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          <FileText size={18} />
          <span>Điều Khoản Sử Dụng</span>
        </button>
        <button
          className={`policy-tab-item ${activeTab === 'returns' ? 'active' : ''}`}
          onClick={() => setActiveTab('returns')}
        >
          <RefreshCw size={18} />
          <span>Đổi Trả & Hoàn Tiền</span>
        </button>
      </div>

      {/* Content Editor */}
      <div className="policy-editor-card">
        <div className="editor-card-header">
          <h3>{currentPolicy.title}</h3>
          <p className="editor-subtitle">{currentPolicy.subtitle}</p>
        </div>

        <div className="policy-sections-list">
          {currentPolicy.sections.map((sec, idx) => (
            <div key={idx} className="policy-section-editor-item">
              <div className="section-header-num">Mục {idx + 1}</div>
              
              <div className="form-group mb-3">
                <label className="form-label">Tiêu đề mục:</label>
                <input
                  type="text"
                  className="form-control policy-input-heading"
                  value={sec.heading}
                  onChange={(e) => handleSectionChange(activeTab, idx, 'heading', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nội dung chi tiết:</label>
                <textarea
                  rows={4}
                  className="form-control policy-textarea-content"
                  value={sec.content}
                  onChange={(e) => handleSectionChange(activeTab, idx, 'content', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PolicyManager;
