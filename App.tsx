import React, { useState, useEffect, useRef } from 'react';
import InputForm from './components/InputForm';
import ReadingResult from './components/ReadingResult';
import AdminPanel from './components/AdminPanel';
import { UserInput, ReadingResult as ReadingResultType } from './types';
import { getGeminiReading } from './services/geminiService';
import { getAppConfig, trackClick } from './services/configService';

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [reading, setReading] = useState<ReadingResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Secret Gesture State
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // State for dynamic config (redirect url)
  const [redirectUrl, setRedirectUrl] = useState<string>('');

  // Refs for parallax background elements
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const textureRef = useRef<HTMLDivElement>(null);

  // Load configuration (Link & DB connection) on startup
  useEffect(() => {
    const fetchConfig = async () => {
        const config = await getAppConfig();
        if (config.redirectUrl) {
            setRedirectUrl(config.redirectUrl);
            console.log("Loaded Redirect URL:", config.redirectUrl);
        }
    };
    fetchConfig();

    // Check URL for admin access (hidden link mechanism)
    // Usage: Add ?panel=admin to your URL to access the admin panel
    // Example: https://your-site.com/?panel=admin
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('panel') === 'admin') {
        setShowAdmin(true);
    }
  }, [showAdmin]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (blob1Ref.current) blob1Ref.current.style.transform = `translateY(${scrollY * 0.15}px)`;
      if (blob2Ref.current) blob2Ref.current.style.transform = `translateY(-${scrollY * 0.1}px)`;
      if (textureRef.current) textureRef.current.style.transform = `translate(-50%, -50%) translateY(${scrollY * 0.05}px)`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFormSubmit = async (data: UserInput) => {
    // 1. CHECK FOR REDIRECT URL
    if (redirectUrl && redirectUrl.trim() !== '') {
        // Track the click (Fire and forget, or wait slightly)
        trackClick().catch(e => console.error("Tracking error", e));
        
        // Open link in new tab
        window.open(redirectUrl, '_blank');
        // Continue flow in current tab...
    }

    // 2. PROCEED WITH FORTUNE TELLING
    setLoading(true);
    setError(null);
    setUserInput(data); // Save context
    try {
      const result = await getGeminiReading(data);
      setReading(result);
    } catch (err: any) {
      console.error("Full Error Details:", err);
      
      // Hiển thị lỗi chi tiết để debug
      let displayMessage = "Có lỗi xảy ra khi kết nối với thiên cơ.";
      
      if (err.message) {
         if (err.message.includes("API KEY") || err.message.includes(".env")) {
             displayMessage = err.message;
         } else if (err.message.includes("400")) {
             displayMessage = "Lỗi Dữ Liệu (400): Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
         } else if (err.message.includes("403")) {
             displayMessage = "Lỗi Quyền Truy Cập (403): API Key không hợp lệ hoặc bị từ chối.";
         } else if (err.message.includes("429")) {
             displayMessage = "Lỗi Quá Tải (429): Hệ thống đang bận, vui lòng chờ vài giây rồi thử lại.";
         } else {
             displayMessage = `Lỗi hệ thống: ${err.message}`;
         }
      }
      
      setError(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReading(null);
    setUserInput(null);
    setError(null);
  };

  // Handle Secret Gesture (5 clicks on Logo)
  const handleLogoClick = () => {
      setLogoClicks(prev => {
          const newCount = prev + 1;
          if (newCount >= 5) {
              setShowAdmin(true);
              return 0;
          }
          return newCount;
      });

      // Reset count if idle for 1 second
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => {
          setLogoClicks(0);
      }, 1000);
  };

  return (
    <div className="min-h-screen mystic-gradient overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200 relative">
      
      {/* Background Ambience with Parallax */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          ref={blob1Ref}
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] will-change-transform"
        ></div>
        <div 
          ref={blob2Ref}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] will-change-transform"
        ></div>
        <div 
          ref={textureRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 will-change-transform"
        ></div>
      </div>

      <header className="relative z-10 p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-3 select-none cursor-pointer group" onClick={handleLogoClick}>
             <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-slate-900 font-bold font-serif text-xl shadow-lg shadow-amber-500/20 group-active:scale-95 transition-transform">
               K
             </div>
             <h1 className="text-xl md:text-2xl font-serif font-bold text-slate-100 tracking-wide">
               <span className="text-amber-400">Nguyễn Bỉnh Khiêm</span>
             </h1>
           </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-center backdrop-blur-md shadow-lg animate-pulse">
            <span className="font-bold block mb-1">⚠️ Lỗi Thiên Cơ:</span>
            {error}
          </div>
        )}

        {!reading || !userInput ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
             <div className="text-center mb-10 max-w-2xl">
               <h2 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 mb-4 drop-shadow-sm">
                 Tiên Tri Vận Mệnh
               </h2>
               <p className="text-slate-400 text-lg">
                 Khám phá bức tranh cuộc đời qua lăng kính Kinh Dịch và tinh hoa Lý Số truyền thống.
               </p>
             </div>
             <InputForm onSubmit={handleFormSubmit} isLoading={loading} />
          </div>
        ) : (
          <ReadingResult 
            data={reading} 
            userInfo={userInput}
            onReset={handleReset} 
          />
        )}
      </main>

      {/* Footer without Admin Button */}
      <footer className="relative z-10 py-8 text-center text-slate-600 text-sm border-t border-white/5 mt-auto">
        <p>© {new Date().getFullYear()} Minh Triết Phương Đông. Inspired by Trang Trinh Nguyen Binh Khiem.</p>
      </footer>

      {/* Admin Panel Overlay */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default App;