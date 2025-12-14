import React, { useState, useRef, useEffect } from 'react';
import { ReadingResult as ReadingResultType, UserInput, ChatExchange } from '../types';
import HexagramVisual from './HexagramVisual';
import { Briefcase, Heart, Activity, RefreshCcw, Send, Sparkles, MessageCircleQuestion, TrendingUp, ArrowUpCircle, AlertOctagon, ArrowRight, Star, Calendar, Moon, Volume2, StopCircle } from 'lucide-react';
import { askFollowUpQuestion } from '../services/geminiService';

interface ReadingResultProps {
  data: ReadingResultType;
  userInfo: UserInput;
  onReset: () => void;
}

const DEFAULT_SUGGESTIONS = [
    "Cách tu dưỡng để cải biến vận mệnh?",
    "Chi tiết về tình duyên, gia đạo?",
    "Nên đầu tư vào lĩnh vực nào?",
    "Vận hạn năm nay cần tránh gì?",
    "Màu sắc nào hợp với bản mệnh?"
];

const ReadingResult: React.FC<ReadingResultProps> = ({ data, userInfo, onReset }) => {
  const [chatHistory, setChatHistory] = useState<ChatExchange[]>([]);
  const [question, setQuestion] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  // Ref to hold utterances to prevent garbage collection bugs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load available voices with aggressive filtering for Vietnamese
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // 1. Tìm giọng Google Tiếng Việt (Android/Chrome/PC thường có)
      let bestVoice = voices.find(v => v.name === "Google Tiếng Việt");

      // 2. Nếu không có, tìm giọng có mã vi-VN
      if (!bestVoice) {
          bestVoice = voices.find(v => v.lang === "vi-VN");
      }

      // 3. Nếu vẫn không có, tìm giọng bắt đầu bằng 'vi' (ví dụ vi_VN)
      if (!bestVoice) {
          bestVoice = voices.find(v => v.lang.startsWith("vi"));
      }

      // 4. Tìm theo tên có chữ Viet/Việt (iOS thường tên là Linh, An...)
      if (!bestVoice) {
          bestVoice = voices.find(v => v.name.includes("Viet") || v.name.includes("Việt"));
      }

      if (bestVoice) {
        setPreferredVoice(bestVoice);
        console.log("Đã chọn giọng đọc:", bestVoice.name, bestVoice.lang);
      } else {
        console.warn("Không tìm thấy giọng tiếng Việt trong hệ thống.");
      }
    };

    // Chrome load voice async
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleAsk = async (q: string) => {
      if (!q.trim() || isChatLoading) return;
      
      const currentQ = q;
      setQuestion(""); 
      setIsChatLoading(true);
      
      try {
          const answer = await askFollowUpQuestion(currentQ, data, userInfo);
          setChatHistory(prev => [...prev, { question: currentQ, answer }]);
      } catch (error) {
          console.error(error);
          setChatHistory(prev => [...prev, { question: currentQ, answer: "Thiên cơ bất khả lộ, xin tín chủ thử lại sau." }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleAsk(question);
      }
  }

  // Handle Text-to-Speech
  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Cancel previous
      window.speechSynthesis.cancel();
      setIsSpeaking(true);

      const textToRead = `
        Thái Ất Thần Kinh xin luận giải cho tín chủ ${userInfo.fullName}.
        Quẻ chủ của bạn là ${data.hexagramName}.
        Biến sang quẻ ${data.transformedHexagram.name}.
        Ý nghĩa quẻ biến là: ${data.transformedHexagram.meaning}.
        Thánh nhân có thơ rằng: ${data.poem}.
        Về tổng quan vận mệnh: ${data.generalAnalysis}.
        Về tương quan Thế và Ứng: ${data.theUngAnalysis}.
        Lời khuyên sự nghiệp: ${data.careerAdvice.analysis}.
        Mong tín chủ chân cứng đá mềm, cải vận hanh thông.
      `;

      // Chunking strategy: Split by sentence delimiters (. ? ! or newline)
      const chunks = textToRead.match(/[^.!?\n]+[.!?\n]+/g) || [textToRead];

      let currentChunkIndex = 0;

      const speakNextChunk = () => {
          if (currentChunkIndex >= chunks.length) {
              setIsSpeaking(false);
              return;
          }

          const chunkText = chunks[currentChunkIndex].trim();
          if (!chunkText) {
              currentChunkIndex++;
              speakNextChunk();
              return;
          }

          const utterance = new SpeechSynthesisUtterance(chunkText);
          
          // CẤU HÌNH NGÔN NGỮ CỰC KỲ QUAN TRỌNG
          utterance.lang = 'vi-VN'; // Luôn set cứng mã này trước
          
          if (preferredVoice) {
              utterance.voice = preferredVoice;
              // Update lại lang theo voice tìm được để đảm bảo khớp
              utterance.lang = preferredVoice.lang; 
          }

          utterance.rate = 1.0; 
          utterance.pitch = 1.0;
          
          utterance.onend = () => {
              currentChunkIndex++;
              speakNextChunk();
          };

          utterance.onerror = (e) => {
              // Ignore intentional stops
              if (e.error !== 'canceled' && e.error !== 'interrupted') {
                  console.warn("TTS Error:", e);
              }
              // If error, try to skip to next chunk or stop if critical
              if (e.error === 'canceled') {
                  setIsSpeaking(false);
              } else {
                  currentChunkIndex++;
                  speakNextChunk();
              }
          };

          // Keep ref to prevent garbage collection
          utteranceRef.current = utterance;
          
          window.speechSynthesis.speak(utterance);
      };

      // Start reading
      speakNextChunk();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const suggestions = (data.suggestedQuestions && data.suggestedQuestions.length > 0) 
    ? data.suggestedQuestions 
    : DEFAULT_SUGGESTIONS;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in-up pb-12">
      
      {/* Header Section */}
      <div className="relative text-center space-y-4 pt-8">
        <button 
            onClick={onReset}
            className="absolute left-0 top-8 text-slate-400 hover:text-amber-400 flex items-center gap-2 transition-colors text-sm"
        >
            <RefreshCcw className="w-4 h-4" /> <span className="hidden md:inline">Luận giải lại</span>
        </button>

        {/* Read Aloud Button */}
        <button 
            onClick={toggleSpeech}
            className={`absolute right-0 top-8 flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm ${
              isSpeaking 
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-200'
            }`}
        >
            {isSpeaking ? (
              <>
                <StopCircle className="w-4 h-4" /> 
                <span className="hidden md:inline">Dừng đọc</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" /> 
                <span className="hidden md:inline">Đọc kết quả</span>
              </>
            )}
        </button>

        <h2 className="text-4xl md:text-5xl font-bold font-serif gold-text tracking-tight">Thái Ất Thần Kinh</h2>
        <div className="w-24 h-1 bg-amber-500/50 mx-auto rounded-full"></div>
      </div>

      {/* Thai At Info Bar */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-8 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">{data.thaiAtInfo.lunarDate}</span>
          </div>
          <div className="w-px h-6 bg-slate-700 hidden md:block"></div>
          <div className="flex items-center gap-2 text-slate-300">
              <Moon className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Bát Tự: <span className="text-amber-200">{data.thaiAtInfo.canChi}</span></span>
          </div>
          <div className="w-px h-6 bg-slate-700 hidden md:block"></div>
          <div className="flex items-center gap-2 text-slate-300">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Sao Chủ: <span className="text-amber-200">{data.thaiAtInfo.rulingStar}</span></span>
          </div>
      </div>

      {/* Hexagram Transformation & Analysis */}
      <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center justify-center">
            {/* Main Hexagram */}
            <div className="md:col-span-3 flex flex-col items-center">
                <span className="text-slate-400 text-sm uppercase tracking-widest mb-2">Quẻ Chủ (Hiện Tại)</span>
                <HexagramVisual code={data.hexagramCode} name={data.hexagramName} className="shadow-2xl shadow-amber-900/20 w-full max-w-[200px]" />
            </div>

            {/* Transition Arrow */}
            <div className="md:col-span-1 flex flex-col items-center justify-center py-4 md:py-0">
                <div className="p-3 rounded-full bg-slate-800 border border-slate-700 text-amber-500/80">
                    <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <span className="text-xs text-slate-500 mt-2">Biến Hóa</span>
            </div>

            {/* Transformed Hexagram */}
            <div className="md:col-span-3 flex flex-col items-center">
                <span className="text-slate-400 text-sm uppercase tracking-widest mb-2">Quẻ Biến (Kết Quả)</span>
                <HexagramVisual code={data.transformedHexagram.code} name={data.transformedHexagram.name} className="shadow-2xl shadow-indigo-900/20 border-indigo-500/30 w-full max-w-[200px]" />
                <p className="mt-2 text-xs text-indigo-300 text-center max-w-[200px]">{data.transformedHexagram.meaning}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-indigo-900/30 rounded-lg border border-indigo-500/30 w-full text-center max-w-2xl mx-auto">
                <p className="text-amber-200 font-serif italic text-lg leading-relaxed">
                    "{data.poem}"
                </p>
          </div>
      </div>

      {/* Deep Analysis Section */}
      <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-4">
                <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
                    Luận Thế & Ứng (Tương Quan)
                </h3>
                <p className="text-slate-200 leading-7 text-justify whitespace-pre-line border-l-2 border-amber-500/20 pl-4">
                    {data.theUngAnalysis}
                </p>
                <div className="h-px bg-slate-700/50 w-full my-4"></div>
                <h4 className="font-bold text-slate-300">Tổng Quan Vận Mệnh</h4>
                <p className="text-slate-300 leading-relaxed text-justify">
                    {data.generalAnalysis}
                </p>
            </div>
            
            <div className="space-y-6">
                 {/* Elemental */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold text-teal-400 mb-3 flex items-center gap-2">
                        <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
                        Ngũ Hành Bản Mệnh
                    </h3>
                    <p className="text-slate-200 leading-7 text-justify">{data.elementalBalance}</p>
                </div>
                
                {/* Career Advice */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex flex-col h-full">
                    <h3 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
                        <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
                        Thiên Cơ Về Sự Nghiệp
                    </h3>
                    <div className="mb-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {data.careerAdvice.suitableCareers.map((career, idx) => (
                                <span key={idx} className="bg-cyan-900/40 text-cyan-200 border border-cyan-500/30 px-3 py-1 rounded-full text-sm font-medium">
                                    {career}
                                </span>
                            ))}
                        </div>
                        <p className="text-slate-200 text-sm leading-relaxed mb-3 text-justify">{data.careerAdvice.analysis}</p>
                        <div className="flex items-start gap-2 text-sm text-cyan-300 bg-cyan-900/20 p-3 rounded-lg border border-cyan-500/20 mt-auto">
                            <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
                            <p className="font-medium">{data.careerAdvice.potentialSuccess}</p>
                        </div>
                    </div>
                </div>
            </div>
      </div>

      {/* Life Stages Timeline */}
      <div>
        <h3 className="text-3xl font-serif text-center text-slate-100 mb-10">Đường Đời Bình Giải</h3>
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-600 before:to-transparent">
            {data.lifeStages.map((stage, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    
                    {/* Icon / Dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-600 bg-slate-900 group-hover:border-amber-500 group-hover:scale-110 transition-all shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <div className={`w-3 h-3 rounded-full ${stage.type === 'past' ? 'bg-slate-500' : stage.type === 'present' ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'}`}></div>
                    </div>

                    {/* Content Card */}
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl bg-slate-800/80 border border-slate-700 shadow-xl backdrop-blur-sm hover:border-amber-500/30 transition-all">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-amber-400 text-lg">{stage.ageRange}</span>
                            <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider ${
                                stage.type === 'past' ? 'bg-slate-700 text-slate-400' : 
                                stage.type === 'present' ? 'bg-amber-900/50 text-amber-200 border border-amber-500/30' : 
                                'bg-indigo-900/50 text-indigo-300'
                            }`}>
                                {stage.type === 'past' ? 'Đã qua' : stage.type === 'present' ? 'Hiện tại' : 'Tương lai'}
                            </span>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-100 mb-2">{stage.summary}</h4>
                        <p className="text-slate-300 text-sm leading-relaxed text-justify">{stage.details}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Yearly Predictions */}
      <div className="space-y-6">
        <h3 className="text-3xl font-serif text-center text-slate-100 mb-6">Niên Hạn 5 Năm Tới</h3>
        <div className="grid md:grid-cols-2 gap-6">
            {data.yearlyPredictions.map((year, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-700 p-6 rounded-xl hover:border-amber-500/50 transition-colors group flex flex-col h-full">
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-bold text-amber-500">{year.year}</span>
                        <span className="text-sm text-slate-500 uppercase tracking-widest">Dương Lịch</span>
                    </div>
                    <p className="text-slate-300 mb-4 border-b border-slate-800 pb-4 min-h-[3rem] text-justify">{year.overview}</p>
                    
                    <div className="space-y-3 mb-6 flex-grow">
                        <div className="flex gap-3">
                            <Briefcase className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                            <div>
                                <span className="text-xs text-teal-400 font-bold uppercase block mb-0.5">Sự nghiệp</span>
                                <p className="text-sm text-slate-400">{year.career}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Heart className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <span className="text-xs text-rose-400 font-bold uppercase block mb-0.5">Tình cảm</span>
                                <p className="text-sm text-slate-400">{year.love}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Activity className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <span className="text-xs text-emerald-400 font-bold uppercase block mb-0.5">Sức khỏe</span>
                                <p className="text-sm text-slate-400">{year.health}</p>
                            </div>
                        </div>
                    </div>

                    {/* Do's and Don'ts Section */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 mt-auto">
                        <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1">
                                <ArrowUpCircle className="w-4 h-4" />
                                <span>Tiến (Cát)</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed text-justify">{year.advice.do}</p>
                        </div>
                        <div className="bg-rose-900/10 border border-rose-500/20 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase mb-1">
                                <AlertOctagon className="w-4 h-4" />
                                <span>Lùi (Hung)</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed text-justify">{year.advice.avoid}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Follow-up Q&A Section */}
      <div className="pt-12 border-t border-slate-700">
          <div className="text-center mb-8">
              <h3 className="text-3xl font-serif text-amber-200 mb-2 flex items-center justify-center gap-3">
                  <MessageCircleQuestion className="w-8 h-8" />
                  Hỏi Thêm Trạng Trình
              </h3>
              <p className="text-slate-400">Thiên cơ ở ngay trước mắt. Hỏi để sáng tỏ lòng mình.</p>
          </div>

          {/* Chat History */}
          <div className="space-y-6 mb-8">
              {chatHistory.map((chat, idx) => (
                  <div key={idx} className="space-y-4 animate-fade-in">
                      {/* User Question */}
                      <div className="flex justify-end">
                          <div className="bg-indigo-900/60 text-indigo-100 px-5 py-3 rounded-2xl rounded-tr-none border border-indigo-500/30 max-w-[90%] md:max-w-[70%]">
                              <p>{chat.question}</p>
                          </div>
                      </div>
                      
                      {/* AI Answer */}
                      <div className="flex justify-start">
                          <div className="flex gap-3 max-w-[90%] md:max-w-[80%]">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-amber-500 flex items-center justify-center text-amber-500 font-serif font-bold shrink-0">
                                  K
                              </div>
                              <div className="bg-slate-800/80 text-slate-200 px-6 py-4 rounded-2xl rounded-tl-none border border-amber-500/20 shadow-lg">
                                  <p className="leading-relaxed whitespace-pre-line text-justify">{chat.answer}</p>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
              
              {isChatLoading && (
                  <div className="flex justify-start animate-pulse">
                       <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-amber-500 flex items-center justify-center text-amber-500 font-serif font-bold shrink-0">
                                  K
                          </div>
                          <div className="bg-slate-800/80 px-6 py-4 rounded-2xl rounded-tl-none border border-slate-700 flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                          </div>
                       </div>
                  </div>
              )}
              <div ref={chatEndRef} />
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
              {suggestions.map((suggestion, idx) => (
                  <button
                      key={idx}
                      onClick={() => handleAsk(suggestion)}
                      disabled={isChatLoading}
                      className="text-xs md:text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-amber-500 text-slate-300 hover:text-amber-300 px-4 py-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {suggestion}
                  </button>
              ))}
          </div>

          {/* Input Area */}
          <div className="relative max-w-2xl mx-auto">
              <input 
                  type="text" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu hỏi của bạn tại đây..."
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-full pl-6 pr-14 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-lg"
                  disabled={isChatLoading}
              />
              <button 
                  onClick={() => handleAsk(question)}
                  disabled={!question.trim() || isChatLoading}
                  className="absolute right-2 top-2 p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-full transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                  {isChatLoading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
          </div>
      </div>
      
      <div className="text-center text-slate-500 text-sm mt-12 pb-4">
        <p>Kết quả mang tính tham khảo. Đức trọng quỷ thần kinh.</p>
      </div>
    </div>
  );
};

export default ReadingResult;