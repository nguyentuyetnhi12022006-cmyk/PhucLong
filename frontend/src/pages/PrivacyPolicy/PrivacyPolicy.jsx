import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, FileText, Truck, CreditCard, UserCheck, HelpCircle, CheckCircle2, Phone, Mail, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const { user } = useAuth();
  const isCustomer = user && user.role !== 'admin';
  const [activeTab, setActiveTab] = useState('privacy');

  return (
    <div className="privacy-page animate-fade-in">
      <div className="privacy-hero">
        <div className="container hero-content">
          <div className="hero-badge">
            <ShieldCheck size={28} />
            <span>Trung Tâm An Toàn & Bảo Mật</span>
          </div>
          <h1 className="hero-title">Chính Sách Quyền Riêng Tư & Điều Khoản</h1>
          <p className="hero-subtitle">
            Phúc Long Tea & Coffee cam kết bảo vệ tuyệt đối thông tin cá nhân của bạn. 
            Bạn có thể dễ dàng duyệt menu, đặt hàng và theo dõi đơn hàng mà không bắt buộc phải đăng nhập phức tạp.
          </p>
        </div>
      </div>

      <div className="container privacy-container">
        {/* Navigation Tabs */}
        <div className="privacy-tabs-bar">
          <button
            className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Lock size={18} />
            <span>Chính Sách Bảo Mật</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            <FileText size={18} />
            <span>Điều Khoản Sử Dụng</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'guest' ? 'active' : ''}`}
            onClick={() => setActiveTab('guest')}
          >
            <UserCheck size={18} />
            <span>Khách Hàng Chưa Đăng Nhập</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            <HelpCircle size={18} />
            <span>Câu Hỏi Thường Gặp</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="privacy-content-card">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="tab-pane animate-fade-in">
              <h2 className="section-heading"><Lock className="icon-heading" /> 1. Thu Thập & Sử Dụng Thông Tin Cá Nhân</h2>
              <p className="lead-text">
                Chúng tôi hiểu rằng thông tin cá nhân của bạn là tài sản quý giá. Khi sử dụng dịch vụ đặt trà sữa trực tuyến tại Phúc Long, thông tin bạn cung cấp được bảo vệ theo các tiêu chuẩn cao nhất.
              </p>

              <div className="info-grid-boxes">
                <div className="info-box">
                  <h4 className="box-title">📲 Thông tin thu thập khi đặt hàng</h4>
                  <ul>
                    <li><strong>Họ và tên:</strong> Để shipper và nhân viên xác nhận đúng người nhận trà sữa.</li>
                    <li><strong>Số điện thoại:</strong> Để liên hệ giao hàng và làm mã tra cứu trạng thái đơn hàng.</li>
                    <li><strong>Địa chỉ giao hàng:</strong> Để giao đồ uống tận nơi theo yêu cầu của bạn.</li>
                    <li><strong>Ghi chú đơn hàng:</strong> Tùy chọn lượng đường, đá, topping hoặc thời gian giao.</li>
                  </ul>
                </div>

                <div className="info-box">
                  <h4 className="box-title">🔒 Mục đích sử dụng thông tin</h4>
                  <ul>
                    <li>Xử lý và hoàn tất các đơn hàng trà sữa & cà phê của bạn.</li>
                    <li>Cập nhật tiến trình giao hàng (Chờ duyệt ➔ Chuẩn bị món ➔ Đang giao ➔ Đã giao).</li>
                    <li>Giải quyết khiếu nại, hỗ trợ đổi trả hoặc hoàn tiền nếu có sự cố.</li>
                    <li>Tuyệt đối <strong>KHÔNG</strong> bán, chia sẻ thông tin cho bên thứ ba vì mục đích quảng cáo.</li>
                  </ul>
                </div>
              </div>

              <h2 className="section-heading spacing-top"><ShieldCheck className="icon-heading" /> 2. Cam Kết Bảo Mật Dữ Liệu Thanh Toán</h2>
              <p>
                Dịch vụ thanh toán bằng **Mã QR VietQR (MBBank)** của chúng tôi là dịch vụ chuyển khoản ngân hàng tự động trực tiếp. Hệ thống không lưu trữ mật khẩu ngân hàng, OTP hay thông tin thẻ tín dụng của khách hàng. Số tiền thanh toán được khóa chính xác để đảm bảo bạn không bị chuyển nhầm số tiền.
              </p>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="tab-pane animate-fade-in">
              <h2 className="section-heading"><FileText className="icon-heading" /> 1. Quy Định Đặt Hàng & Thanh Toán</h2>
              <p className="lead-text">
                Khi thực hiện giao dịch tại Phúc Long trực tuyến, khách hàng đồng ý với các điều khoản mua hàng dưới đây:
              </p>

              <div className="terms-list">
                <div className="term-item">
                  <CheckCircle2 size={20} className="check-icon" />
                  <div>
                    <strong>Chất lượng sản phẩm:</strong> Đồ uống được pha chế tươi mới tại cửa hàng ngay sau khi đơn hàng được xác nhận.
                  </div>
                </div>

                <div className="term-item">
                  <CheckCircle2 size={20} className="check-icon" />
                  <div>
                    <strong>Phương thức thanh toán:</strong> Hỗ trợ thanh toán bằng **Tiền mặt (COD)** khi nhận hàng hoặc **Quét mã QR VietQR** qua ứng dụng ngân hàng / ví điện tử.
                  </div>
                </div>

                <div className="term-item">
                  <CheckCircle2 size={20} className="check-icon" />
                  <div>
                    <strong>Hủy đơn hàng:</strong> Khách hàng chỉ có thể tự hủy đơn hàng khi đơn ở trạng thái "Đang chờ duyệt". Khi đơn đã chuyển sang "Chuẩn bị món", vui lòng liên hệ hotline **1800 6179** để hỗ trợ.
                  </div>
                </div>

                <div className="term-item">
                  <CheckCircle2 size={20} className="check-icon" />
                  <div>
                    <strong>Mã giảm giá (Coupon):</strong> Mỗi đơn hàng chỉ áp dụng 1 mã giảm giá hợp lệ thỏa mãn giá trị đơn hàng tối thiểu.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GUEST USERS POLICY */}
          {activeTab === 'guest' && (
            <div className="tab-pane animate-fade-in">
              <h2 className="section-heading"><UserCheck className="icon-heading" /> Quy Định Khách Hàng Chưa Đăng Nhập (Khách Vãng Lai)</h2>
              <p className="lead-text">
                Chúng tôi tạo điều kiện thuận lợi nhất để bạn mua sắm. Khách chưa đăng nhập có thể thoải mái chọn món và **Đặt hàng bình thường**!
              </p>

              <div className="highlight-banner-guest">
                <div className="banner-icon"><UserCheck size={32} /></div>
                <div className="banner-text">
                  <h3>Đặt hàng dễ dàng - Không bắt buộc tạo tài khoản!</h3>
                  <p>Chỉ cần nhập Tên, Số điện thoại và Địa chỉ khi Thanh toán. Đơn hàng sẽ được tạo và gửi tới cửa hàng lập tức.</p>
                </div>
              </div>

              <h3 className="sub-heading">Quy định về Xem & Theo dõi trạng thái đơn hàng:</h3>
              <ol className="step-guide-list">
                <li>
                  <span className="step-num">1</span>
                  <span><strong>Đặt hàng:</strong> Khách vãng lai (chưa đăng nhập) được phép đặt món, áp mã giảm giá và thanh toán COD hoặc mã QR VietQR.</span>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <span><strong>Theo dõi trạng thái:</strong> Khách vãng lai có thể tra cứu chi tiết trạng thái đơn hàng (Chờ xác nhận ➔ Đang pha chế ➔ Đang giao ➔ Đã hoàn thành) bằng Số điện thoại hoặc Mã đơn hàng tại trang <Link to="/tracking" className="link-text">Tra Cứu Đơn Hàng</Link>.</span>
                </li>
              </ol>
            </div>
          )}

          {/* TAB 4: FAQ */}
          {activeTab === 'faq' && (
            <div className="tab-pane animate-fade-in">
              <h2 className="section-heading"><HelpCircle className="icon-heading" /> Câu Hỏi Thường Gặp (FAQ)</h2>

              <div className="faq-accordion">
                <div className="faq-item">
                  <h4 className="faq-question">❓ Tôi chưa đăng nhập có đặt hàng được không?</h4>
                  <p className="faq-answer">
                    Được! Khách hàng chưa đăng nhập hoàn toàn có thể chọn món trà sữa yêu thích, điền địa chỉ và bấm Đặt hàng bình thường.
                  </p>
                </div>

                <div className="faq-item">
                  <h4 className="faq-question">❓ Tôi chưa đăng nhập thì có xem được trạng thái đơn hàng (Đã giao / Chưa giao) không?</h4>
                  <p className="faq-answer">
                    Có! Bạn chỉ cần truy cập trang <strong>Tra Cứu Đơn Hàng</strong> và nhập Số điện thoại hoặc Mã đơn hàng để kiểm tra tiến trình giao hàng trực tiếp.
                  </p>
                </div>

                <div className="faq-item">
                  <h4 className="faq-question">❓ Quét mã QR thanh toán có an toàn không?</h4>
                  <p className="faq-answer">
                    Rất an toàn! Mã QR sử dụng chuẩn VietQR chuyển khoản trực tiếp vào tài khoản ngân hàng MBBank của Phúc Long. Số tiền và nội dung chuyển khoản được tự động khóa chính xác, bạn chỉ cần bấm xác nhận chuyển tiền trong App ngân hàng của bạn.
                  </p>
                </div>

                <div className="faq-item">
                  <h4 className="faq-question">❓ Nếu tôi nhập sai Số điện thoại khi tra cứu thì sao?</h4>
                  <p className="faq-answer">
                    Hệ thống hỗ trợ tra cứu linh hoạt bằng cả 9 số cuối điện thoại hoặc Mã đơn hàng. Nếu vẫn không tìm thấy, lịch sử đơn hàng cũng tự động lưu tạm trên trình duyệt thiết bị của bạn để tra cứu dễ dàng.
                  </p>
                </div>

                <div className="faq-item">
                  <h4 className="faq-question">❓ Tôi có cần phải nhập cả Gmail và Số điện thoại khi Đăng ký không?</h4>
                  <p className="faq-answer">
                    Không! Bạn chỉ cần chọn nhập **Số điện thoại** HOẶC **Gmail**. Không bắt buộc phải nhập cả hai.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Contact Banner inside Card */}
          <div className="privacy-contact-footer">
            <div className="contact-left">
              <h4>Bạn cần trợ giúp thêm?</h4>
              <p>Đội ngũ hỗ trợ khách hàng của Phúc Long luôn sẵn sàng giải đáp 24/7.</p>
            </div>
            <div className="contact-actions">
              <a href="tel:18006179" className="btn btn-primary btn-call">
                <Phone size={16} /> Hotline: 1800 6179
              </a>
              <Link to={isCustomer ? "/profile?tab=track" : "/tracking"} className="btn btn-outline btn-track">
                <Truck size={16} /> Tra Cứu Đơn Hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
