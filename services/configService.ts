import { AppConfig } from "../types";

// ==================================================================================
// BƯỚC QUAN TRỌNG: ĐỂ APP CHẠY ĐƯỢC TRÊN MỌI MÁY
// Hãy dán đường dẫn Firebase Realtime Database của bạn vào giữa 2 dấu nháy bên dưới.
// Nhớ phải có đuôi .json ở cuối (nếu dùng Firebase).
// Ví dụ: "https://thai-at-than-kinh-default-rtdb.firebaseio.com/config.json"
const PUBLIC_DATABASE_URL = "https://thai-at-backend-default-rtdb.asia-southeast1.firebasedatabase.app/config.json"; 
// ==================================================================================

const DB_URL_KEY = 'destiny_db_url';
const LOCAL_CONFIG_KEY = 'destiny_local_config';

// Mặc định config rỗng
const DEFAULT_CONFIG: AppConfig = {
    redirectUrl: '',
    clickCount: 0
};

/**
 * Helper để kiểm tra URL hợp lệ
 */
const isValidUrl = (urlString: string) => {
    try { 
        if (!urlString) return false;
        return Boolean(new URL(urlString)); 
    }
    catch(e){ 
        return false; 
    }
}

/**
 * Lấy URL database.
 * Thứ tự ưu tiên:
 * 1. LocalStorage (Nếu Admin đang test link khác trên máy họ)
 * 2. PUBLIC_DATABASE_URL (Cấu hình chung cho mọi người dùng)
 */
export const getDatabaseUrl = (): string => {
    const local = localStorage.getItem(DB_URL_KEY);
    if (local && isValidUrl(local)) {
        return local;
    }
    return PUBLIC_DATABASE_URL;
};

/**
 * Lưu URL database (Chỉ lưu vào LocalStorage để admin switch qua lại nếu cần)
 */
export const setDatabaseUrl = (url: string) => {
    if (url) {
        localStorage.setItem(DB_URL_KEY, url);
    } else {
        localStorage.removeItem(DB_URL_KEY);
    }
};

/**
 * Lấy cấu hình hiện tại (Ưu tiên Cloud nếu có DB URL, ngược lại dùng LocalStorage)
 */
export const getAppConfig = async (): Promise<AppConfig> => {
    const dbUrl = getDatabaseUrl();
    
    // 1. Nếu có DB URL (từ code hoặc local), cố gắng lấy từ Cloud
    if (dbUrl && isValidUrl(dbUrl)) {
        try {
            const response = await fetch(dbUrl);
            if (response.ok) {
                const data = await response.json();
                // API JSON thường trả về null nếu chưa có dữ liệu
                return data ? { ...DEFAULT_CONFIG, ...data } : DEFAULT_CONFIG;
            }
        } catch (error) {
            console.warn("Không thể kết nối Database, sử dụng dữ liệu offline.", error);
            // Fallback xuống local nếu lỗi mạng
        }
    }

    // 2. Nếu không có DB URL hoặc lỗi, dùng LocalStorage
    const localData = localStorage.getItem(LOCAL_CONFIG_KEY);
    return localData ? JSON.parse(localData) : DEFAULT_CONFIG;
};

/**
 * Lưu cấu hình (Lưu cả Cloud và Local)
 */
export const saveAppConfig = async (config: AppConfig): Promise<boolean> => {
    // Luôn lưu local để làm cache
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
    
    const dbUrl = getDatabaseUrl();
    if (dbUrl && isValidUrl(dbUrl)) {
        try {
            // Sử dụng PUT để ghi đè cấu hình tại URL đó (Firebase Realtime DB hỗ trợ PUT)
            // keepalive: true giúp request không bị hủy khi tab đóng hoặc chuyển trang
            const response = await fetch(dbUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
                keepalive: true 
            });
            return response.ok;
        } catch (error) {
            console.error("Lỗi lưu lên Database:", error);
            return false;
        }
    }
    return true; // Lưu local thành công coi như true
};

/**
 * Tăng số lượt click (Transaction đơn giản)
 */
export const trackClick = async (): Promise<void> => {
    try {
        // 1. Lấy config mới nhất
        const currentConfig = await getAppConfig();
        
        // 2. Tăng count
        const newConfig = {
            ...currentConfig,
            clickCount: (currentConfig.clickCount || 0) + 1,
            lastUpdated: Date.now()
        };

        // 3. Lưu lại
        await saveAppConfig(newConfig);
        console.log("Đã ghi nhận click:", newConfig.clickCount);
    } catch (error) {
        console.error("Lỗi track click:", error);
    }
};