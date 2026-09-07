// Hiển thị thời gian tương đối kiểu "Vừa xong", "1 phút trước", "1 giờ trước",
// "Hôm qua", "X ngày trước", ... dùng cho badge "MỚI" của sản phẩm.
export const getRelativeTime = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Vừa xong';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} tuần trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Sản phẩm trong khoảng thời gian này (kể từ lúc tạo HOẶC cập nhật) được xem là "MỚI"
export const NEW_PRODUCT_WINDOW_DAYS = 14;

// Ngày "gần nhất" của sản phẩm: ưu tiên updatedAt (vừa cập nhật), fallback createdAt
export const getProductRecency = (product) => {
  return product?.updatedAt || product?.createdAt || null;
};

// Kiểm tra sản phẩm có phải là "món mới" không (mới thêm hoặc mới cập nhật)
export const isNewProduct = (product, windowDays = NEW_PRODUCT_WINDOW_DAYS) => {
  const recency = getProductRecency(product);
  if (!recency) return false;
  const ageMs = Date.now() - new Date(recency).getTime();
  if (isNaN(ageMs)) return false;
  return ageMs >= 0 && ageMs < windowDays * 24 * 60 * 60 * 1000;
};