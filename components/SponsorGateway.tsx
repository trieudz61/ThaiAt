import React from 'react';
import { ExternalLink, Lock, Sparkles, X } from 'lucide-react';

interface SponsorGatewayProps {
  onUnlock: () => void;
  onCancel: () => void;
  sponsorUrl: string;
}

const SponsorGateway: React.FC<SponsorGatewayProps> = ({ onUnlock, onCancel, sponsorUrl }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-800 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Decorative Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-12 h-12 bg-slate-900/30 rounded-full flex items-center justify-center border border-amber-300/50 mb-3 text-amber-200">
                <Lock className="w-6 h-6" />
             </div>
             <h3 className="text-xl md:text-2xl font-serif font-bold text-white">Thiên Cơ Đã Định</h3>
             <p className="text-amber-100 text-sm mt-1">Kết quả luận giải đã sẵn sàng</p>
          </div>
          
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 text-amber-200/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 text-center space-y-6">
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Để duy trì hệ thống miễn phí, chúng tôi cần sự hỗ trợ từ nhà tài trợ. 
            <br className="hidden md:block" />
            Vui lòng ghé thăm trang của họ để <b>Mở Khóa</b> kết quả ngay lập tức.
          </p>

          <button
            onClick={onUnlock}
            className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95"
          >
             <Sparkles className="w-5 h-5 animate-pulse" />
             <span>Mở Khóa & Xem Kết Quả</span>
             <ExternalLink className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
             
             {/* Shine effect */}
             <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 rounded-xl" />
          </button>

          <p className="text-xs text-slate-500 italic">
            *Tab mới sẽ mở ra, vui lòng quay lại đây sau khi trang tải xong.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SponsorGateway;