import React, { useState, useEffect } from 'react';
import { Lock, Save, Link as LinkIcon, X, LogOut, Database, Activity, RefreshCw } from 'lucide-react';
import { getAppConfig, saveAppConfig, getDatabaseUrl, setDatabaseUrl } from '../services/configService';
import { AppConfig } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Data State
  const [redirectUrl, setRedirectUrl] = useState('');
  const [dbUrl, setDbUrl] = useState('');
  const [stats, setStats] = useState<number>(0);
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simple hardcoded password for client-side demo
  const ADMIN_PASSWORD = 'Trieu@123'; 

  // Load data on mount or auth
  useEffect(() => {
    if (isAuthenticated) {
        loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
      setIsLoading(true);
      // Load DB URL from local
      setDbUrl(getDatabaseUrl());
      
      // Load Config (Remote or Local)
      const config = await getAppConfig();
      setRedirectUrl(config.redirectUrl || '');
      setStats(config.clickCount || 0);
      setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setMessage('');
    } else {
      setMessage('Mật khẩu không đúng');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // 1. Save DB URL locally first (so we know where to push data)
    setDatabaseUrl(dbUrl.trim());

    // 2. Create Config Object
    const newConfig: AppConfig = {
        redirectUrl: redirectUrl.trim(),
        clickCount: stats, // Preserve current stats
        lastUpdated: Date.now()
    };

    // 3. Save to Cloud/Local
    const success = await saveAppConfig(newConfig);
    
    setIsLoading(false);
    if (success) {
        setMessage('Đã lưu cấu hình thành công!');
        if (dbUrl.trim()) {
            setMessage('Đã đồng bộ dữ liệu lên Cloud!');
        }
    } else {
        setMessage('Lưu thất bại. Kiểm tra đường dẫn Database.');
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const handleResetStats = async () => {
      if(!window.confirm("Bạn có chắc muốn đặt lại bộ đếm về 0?")) return;
      
      const newConfig: AppConfig = {
          redirectUrl: redirectUrl.trim(),
          clickCount: 0,
          lastUpdated: Date.now()
      };
      setStats(0);
      await saveAppConfig(newConfig);
  }

  const handleLogout = () => {
      setIsAuthenticated(false);
      setPassword('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-lg rounded-2xl shadow-2xl relative my-auto">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
            <X className="w-6 h-6" />
        </button>

        <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-900/30 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-100">Quản Trị Hệ Thống</h2>
            </div>

            {!isAuthenticated ? (
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Nhập mật khẩu quản trị</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 focus:border-amber-500 focus:outline-none transition-colors"
                            placeholder="Mật khẩu (mặc định: admin)"
                            autoFocus
                        />
                    </div>
                    {message && <p className="text-red-400 text-sm">{message}</p>}
                    <button 
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        Đăng Nhập
                    </button>
                </form>
            ) : (
                <div className="space-y-8">
                    
                    {/* Section 1: Database Connection */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Database className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-bold text-blue-100 uppercase tracking-wider">Kết nối Database (Backend)</h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 text-justify">
                            Để đồng bộ link cho mọi người dùng, hãy nhập URL của Firebase Realtime Database (hoặc JSON API bất kỳ hỗ trợ PUT).
                            <br/><span className="italic opacity-70">Ví dụ: https://my-project.firebaseio.com/config.json</span>
                        </p>
                        <input 
                            type="url" 
                            value={dbUrl}
                            onChange={(e) => setDbUrl(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none mb-1"
                            placeholder="https://..."
                        />
                        {!dbUrl && <p className="text-xs text-yellow-500 mt-1">⚠️ Chưa có Database. Chỉ hoạt động trên máy này.</p>}
                    </div>

                    {/* Section 2: Redirect Link */}
                    <div>
                        <label className="block text-sm font-medium text-amber-200 mb-2">Link Đích (Direct)</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                            <input 
                                type="url" 
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-slate-100 focus:border-amber-500 focus:outline-none transition-colors"
                                placeholder="https://example.com/san-pham..."
                            />
                        </div>
                    </div>

                    {/* Section 3: Statistics */}
                    <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-600">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold">Lượt truy cập</p>
                                <p className="text-2xl font-bold text-white">{isLoading ? '...' : stats}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={loadData}
                                className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                                title="Làm mới"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={handleResetStats}
                                className="text-xs bg-slate-700 hover:bg-red-900/50 hover:text-red-400 text-slate-300 px-3 py-1 rounded border border-slate-600 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="space-y-3">
                        {message && <p className={`text-sm text-center ${message.includes('thất bại') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}

                        <div className="flex gap-3">
                            <button 
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {dbUrl ? 'Lưu & Đồng Bộ' : 'Lưu Tại Máy'}
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-lg transition-colors"
                                title="Đăng xuất"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;