export interface UserInput {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // Time range string (e.g., "Giờ Tý (23h-01h)")
  gender: 'male' | 'female' | 'other';
}

export interface LifeStage {
  ageRange: string;
  summary: string;
  details: string;
  type: 'past' | 'present' | 'future';
}

export interface YearlyAdvice {
  do: string;   // Việc nên làm, nên tiến
  avoid: string; // Việc nên tránh, nên lùi
}

export interface YearlyPrediction {
  year: number;
  overview: string;
  career: string;
  health: string;
  love: string;
  advice: YearlyAdvice;
}

export interface CareerAdvice {
  suitableCareers: string[];
  analysis: string;
  potentialSuccess: string;
}

// New interface for specific Thai At / I Ching details
export interface ThaiAtInfo {
  lunarDate: string; // Ngày âm lịch
  canChi: string; // Ví dụ: Giáp Thìn - Bính Dần...
  rulingStar: string; // Sao chủ mệnh (Ví dụ: Tử Vi, Thiên Phủ...)
}

export interface HexagramDetail {
  code: string;
  name: string;
  meaning: string;
}

export interface ReadingResult {
  // Main Hexagram (Quẻ Chủ)
  hexagramName: string;
  hexagramCode: string;
  
  // Transformed Hexagram (Quẻ Biến) - Crucial for decisive outcome
  transformedHexagram: HexagramDetail;

  thaiAtInfo: ThaiAtInfo; // Celestial details

  // Deep analysis based on Subject (Thế) vs Object (Ứng)
  theUngAnalysis: string; 

  generalAnalysis: string;
  elementalBalance: string;
  careerAdvice: CareerAdvice;
  poem: string;
  lifeStages: LifeStage[];
  yearlyPredictions: YearlyPrediction[];
  suggestedQuestions: string[];
}

export interface ChatExchange {
  question: string;
  answer: string;
}

// Configuration interface for Redirect and Database
export interface AppConfig {
  redirectUrl: string;
  clickCount: number;
  lastUpdated?: number;
}

export const INITIAL_INPUT: UserInput = {
  fullName: '',
  birthDate: '',
  birthTime: '',
  gender: 'male',
};