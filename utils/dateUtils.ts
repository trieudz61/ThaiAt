// Mảng Thiên Can
const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
// Mảng Địa Chi
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

/**
 * Tính Julian Day Number từ ngày dương lịch
 * Thuật toán thiên văn để xác định chỉ số ngày liên tục
 */
export const getJulianDay = (d: number, m: number, y: number): number => {
  if (m <= 2) {
    m += 12;
    y -= 1;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
};

/**
 * Tính Can Chi của Năm
 */
export const getYearCanChi = (year: number): string => {
  const canIndex = (year + 6) % 10;
  const chiIndex = (year + 8) % 12;
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
};

/**
 * Tính Can Chi của Ngày (Chính xác tuyệt đối dựa trên Julian Day)
 */
export const getDayCanChi = (d: number, m: number, y: number): string => {
  const jd = Math.floor(getJulianDay(d, m, y) + 0.5);
  const canIndex = (jd + 9) % 10;
  const chiIndex = (jd + 1) % 12;
  return `${CAN[canIndex]} ${CHI[chiIndex]}`;
};

/**
 * Lấy thông tin Can của Ngày để tính Can giờ (Dùng cho AI tham khảo)
 */
export const getDayCanIndex = (d: number, m: number, y: number): number => {
    const jd = Math.floor(getJulianDay(d, m, y) + 0.5);
    return (jd + 9) % 10;
}

/**
 * Parse chuỗi YYYY-MM-DD thành object số nguyên để tránh lỗi Timezone
 */
export const parseInputDate = (dateString: string) => {
    const parts = dateString.split('-');
    return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10),
        day: parseInt(parts[2], 10)
    };
}
