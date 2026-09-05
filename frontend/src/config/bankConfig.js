// Cấu hình tài khoản Ngân hàng nhận tiền thanh toán qua Mã QR VietQR
export const BANK_CONFIG = {
  // Mã ngân hàng theo chuẩn VietQR
  bankId: 'MB', 

  // Tên hiển thị ngân hàng
  bankName: 'MBBank (Ngân hàng TMCP Quân Đội)', 

  // Số tài khoản ngân hàng của bạn
  accountNo: '7149701450334', 

  // Tên chủ tài khoản (Viết hoa không dấu)
  accountName: 'NGUYEN TUYET NHI', 

  // Mẫu VietQR template
  template: 'compact2',
};

/**
 * Hàm tạo URL mã QR VietQR nhúng sẵn chính xác số tiền cần thanh toán
 * @param {number} amount - Số tiền đơn hàng (VND)
 * @param {string} orderInfo - Nội dung chuyển khoản (SĐT hoặc Mã đơn)
 * @returns {string} Image URL của mã VietQR
 */
export const generateVietQRUrl = (amount, orderInfo = 'THANH TOAN') => {
  const cleanInfo = encodeURIComponent(orderInfo.trim());
  const cleanName = encodeURIComponent(BANK_CONFIG.accountName.trim());
  return `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${amount}&addInfo=${cleanInfo}&accountName=${cleanName}`;
};
