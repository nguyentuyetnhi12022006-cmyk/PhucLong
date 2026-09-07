/**
 * Format relative time in Vietnamese:
 * - < 30 seconds: "Vừa xong"
 * - < 60 minutes: "X phút trước"
 * - < 24 hours: "X giờ trước"
 * - >= 24 hours (over 1 day): "DD/MM/YYYY HH:mm"
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) {
    return 'Vừa xong';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes <= 0 ? 1 : diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  // Hơn 1 ngày (>= 24 giờ): Hiển thị dạng "DD/MM/YYYY HH:mm"
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format exact time for message bubbles (e.g. "12:34 SA", "04:56 CH"):
 */
export const formatExactMessageTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = String(hours % 12 || 12).padStart(2, '0');

  return `${hours12}:${minutes} ${period}`;
};

/**
 * Remove Vietnamese accents/diacritics for accent-insensitive search comparison
 */
export const removeAccents = (str = '') => {
  if (typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

/**
 * Format chat date divider (TikTok / Zalo / Messenger style):
 * - Today: "Hôm nay 04:24 AM" or "Hôm nay 02:30 PM"
 * - Yesterday: "Hôm qua 04:24 PM"
 * - Within 7 days: "Thứ Bảy 08:57 PM"
 * - Same year: "31 tháng 8, 02:30 PM"
 * - Different year: "31 tháng 8, 2025 02:30 PM"
 */
export const formatChatDividerDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = String(hours % 12 || 12).padStart(2, '0');

  const now = new Date();

  // Reset time portions for pure calendar day comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(year, date.getMonth(), day);
  const diffDays = Math.round((todayStart.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Hôm nay ${hours12}:${minutes} ${period}`;
  }

  if (diffDays === 1) {
    return `Hôm qua ${hours12}:${minutes} ${period}`;
  }

  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  if (diffDays > 1 && diffDays < 7) {
    return `${daysOfWeek[date.getDay()]} ${hours12}:${minutes} ${period}`;
  }

  const isSameYear = year === now.getFullYear();
  if (isSameYear) {
    return `${day} tháng ${month}, ${hours12}:${minutes} ${period}`;
  }
  return `${day} tháng ${month}, ${year} ${hours12}:${minutes} ${period}`;
};

/**
 * Check if a date divider should be displayed before currDate relative to prevDate:
 * - Returns true for the FIRST message in a chat (!prevDate)
 * - Returns true if there is a > 30 minutes time gap OR a calendar day change between messages
 */
export const shouldShowDateDivider = (prevDate, currDate) => {
  if (!currDate) return false;
  if (!prevDate) return true; // FIRST message ALWAYS shows a date divider!

  const d1 = new Date(prevDate);
  const d2 = new Date(currDate);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;

  // Calendar day change
  if (
    d1.getDate() !== d2.getDate() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getFullYear() !== d2.getFullYear()
  ) {
    return true;
  }

  // Time gap >= 30 minutes on same day
  const diffMs = d2.getTime() - d1.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes >= 30;
};
