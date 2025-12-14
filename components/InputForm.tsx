import React, { useState } from 'react';
import { UserInput, INITIAL_INPUT } from '../types';
import { Loader2, Sparkles, Scroll } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const ZODIAC_HOURS = [
  { label: 'Giờ Tý (23:00 - 01:00)', value: 'Giờ Tý (23:00 - 01:00)' },
  { label: 'Giờ Sửu (01:00 - 03:00)', value: 'Giờ Sửu (01:00 - 03:00)' },
  { label: 'Giờ Dần (03:00 - 05:00)', value: 'Giờ Dần (03:00 - 05:00)' },
  { label: 'Giờ Mão (05:00 - 07:00)', value: 'Giờ Mão (05:00 - 07:00)' },
  { label: 'Giờ Thìn (07:00 - 09:00)', value: 'Giờ Thìn (07:00 - 09:00)' },
  { label: 'Giờ Tỵ (09:00 - 11:00)', value: 'Giờ Tỵ (09:00 - 11:00)' },
  { label: 'Giờ Ngọ (11:00 - 13:00)', value: 'Giờ Ngọ (11:00 - 13:00)' },
  { label: 'Giờ Mùi (13:00 - 15:00)', value: 'Giờ Mùi (13:00 - 15:00)' },
  { label: 'Giờ Thân (15:00 - 17:00)', value: 'Giờ Thân (15:00 - 17:00)' },
  { label: 'Giờ Dậu (17:00 - 19:00)', value: 'Giờ Dậu (17:00 - 19:00)' },
  { label: 'Giờ Tuất (19:00 - 21:00)', value: 'Giờ Tuất (19:00 - 21:00)' },
  { label: 'Giờ Hợi (21:00 - 23:00)', value: 'Giờ Hợi (21:00 - 23:00)' },
];

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UserInput>(INITIAL_INPUT);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName && formData.birthDate && formData.birthTime) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/50 border border-amber-500/50 mb-4">
            <Scroll className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 font-serif mb-2">Nhập Thông Tin</h2>
          <p className="text-slate-400 text-sm">Để Trạng Trình luận giải vận mệnh của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-amber-200/80 mb-1">Họ và Tên</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              required
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-200/80 mb-1">Ngày sinh (DL)</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-200/80 mb-1">Giờ sinh</label>
              <div className="relative">
                <select
                    name="birthTime"
                    value={formData.birthTime}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                >
                    <option value="" disabled className="text-slate-500">Chọn khoảng giờ</option>
                    {ZODIAC_HOURS.map((hour) => (
                        <option key={hour.value} value={hour.value}>
                            {hour.label}
                        </option>
                    ))}
                </select>
                {/* Custom arrow for select */}
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-200/80 mb-1">Giới tính</label>
            <div className="grid grid-cols-3 gap-2">
              {(['male', 'female', 'other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    formData.gender === g
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang Luận Giải...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                Xem Vận Mệnh
              </span>
            )}
            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputForm;