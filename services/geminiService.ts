import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserInput, ReadingResult } from "../types";
import { getYearCanChi, getDayCanChi, parseInputDate, getDayCanIndex } from "../utils/dateUtils";

// Define the response schema strictly to ensure UI consistency
const readingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hexagramName: {
      type: Type.STRING,
      description: "Tên Quẻ Chủ (Ví dụ: Thuần Càn).",
    },
    hexagramCode: {
      type: Type.STRING,
      description: "Mã nhị phân 6 ký tự Quẻ Chủ (1=Dương, 0=Âm).",
    },
    transformedHexagram: {
      type: Type.OBJECT,
      description: "Quẻ Biến (Quẻ kết quả sau khi hào động).",
      properties: {
        code: { type: Type.STRING, description: "Mã nhị phân 6 ký tự Quẻ Biến" },
        name: { type: Type.STRING, description: "Tên Quẻ Biến (Ví dụ: Thiên Phong Cấu)" },
        meaning: { type: Type.STRING, description: "Ý nghĩa ngắn gọn của quẻ biến (Kết quả cuối cùng)." }
      },
      required: ["code", "name", "meaning"]
    },
    thaiAtInfo: {
      type: Type.OBJECT,
      description: "Thông tin Thiên Can, Địa Chi, Ngày Âm theo Thái Ất.",
      properties: {
        lunarDate: { type: Type.STRING, description: "Ngày tháng năm Âm lịch chính xác." },
        canChi: { type: Type.STRING, description: "Bát tự (Giờ/Ngày/Tháng/Năm can chi)." },
        rulingStar: { type: Type.STRING, description: "Sao chủ mệnh chiếu vào giờ sinh." }
      },
      required: ["lunarDate", "canChi", "rulingStar"]
    },
    theUngAnalysis: {
      type: Type.STRING,
      description: "Luận giải sự tương tác giữa Hào Thế (Bản thân) và Hào Ứng (Môi trường/Người khác). Phải chỉ rõ là Sinh hay Khắc, Tốt hay Xấu, ai thắng ai thua.",
    },
    generalAnalysis: {
      type: Type.STRING,
      description: "Luận giải tổng quan vận mệnh. Phải quyết đoán, không dùng từ ngữ nước đôi.",
    },
    elementalBalance: {
      type: Type.STRING,
      description: "Phân tích ngũ hành bản mệnh.",
    },
    careerAdvice: {
      type: Type.OBJECT,
      properties: {
        suitableCareers: { type: Type.ARRAY, items: { type: Type.STRING } },
        analysis: { type: Type.STRING },
        potentialSuccess: { type: Type.STRING }
      },
      required: ["suitableCareers", "analysis", "potentialSuccess"]
    },
    poem: { type: Type.STRING },
    lifeStages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ageRange: { type: Type.STRING },
          summary: { type: Type.STRING },
          details: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["past", "present", "future"] }
        },
        required: ["ageRange", "summary", "details", "type"]
      }
    },
    yearlyPredictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.INTEGER },
          overview: { type: Type.STRING },
          career: { type: Type.STRING },
          health: { type: Type.STRING },
          love: { type: Type.STRING },
          advice: {
            type: Type.OBJECT,
            properties: {
              do: { type: Type.STRING },
              avoid: { type: Type.STRING }
            },
            required: ["do", "avoid"]
          }
        },
        required: ["year", "overview", "career", "health", "love", "advice"]
      }
    },
    suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["hexagramName", "hexagramCode", "transformedHexagram", "thaiAtInfo", "theUngAnalysis", "generalAnalysis", "elementalBalance", "careerAdvice", "poem", "lifeStages", "yearlyPredictions", "suggestedQuestions"]
};

const getAIClient = () => {
    // Kiểm tra kỹ hơn để báo lỗi rõ ràng cho người dùng
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("CHƯA CẤU HÌNH API KEY. Hãy kiểm tra file .env ở thư mục gốc (không phải trong thư mục con) và đảm bảo có dòng: API_KEY=... hoặc GEMINI_API_KEY=...");
    }
    return new GoogleGenAI({ apiKey });
}

export const getGeminiReading = async (input: UserInput): Promise<ReadingResult> => {
  const ai = getAIClient();
  
  // 1. Parse Date Manually to avoid Timezone issues
  const { day, month, year } = parseInputDate(input.birthDate);
  
  // 2. Pre-calculate Can Chi information
  const yearCanChi = getYearCanChi(year);
  const dayCanChi = getDayCanChi(day, month, year);
  const dayCanIndex = getDayCanIndex(day, month, year);
  const dayCanName = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"][dayCanIndex];

  // PROMPT ĐƯỢC NÂNG CẤP ĐỂ TRÁNH "BA PHẢI" VÀ ĐẢM BẢO TÍNH CHUYÊN SÂU
  const prompt = `
    Đóng vai Trạng Trình Nguyễn Bỉnh Khiêm, thực hiện phép "Thái Ất Thần Kinh" để luận giải.

    **Thông tin đương số:**
    - Tên: ${input.fullName}
    - Ngày Dương Lịch: Ngày ${day} tháng ${month} năm ${year}.
    - Giờ sinh: ${input.birthTime}
    - Giới tính: ${input.gender === 'male' ? 'Nam' : input.gender === 'female' ? 'Nữ' : 'Khác'}

    **Dữ liệu Thiên Văn đã tính toán (BẮT BUỘC DÙNG):**
    Để đảm bảo chính xác, ta đã tính toán sẵn các trụ quan trọng:
    - **Năm sinh (Tuổi):** ${yearCanChi}
    - **Ngày sinh (Trụ Ngày):** ${dayCanChi} (Đây là Can Chi ngày chính xác theo lịch vạn niên, hãy dùng nó để lập quẻ, không tự suy diễn lại).
    - **Can Ngày:** ${dayCanName} (Dùng để tính Can Giờ theo quy tắc: Giáp Kỷ khởi Giáp Tý, Ất Canh khởi Bính Tý...).

    **Quy tắc luận giải:**
    1. **Tính Bát Tự & Lập Quẻ:** 
       - Dựa vào ngày ${day}/${month}/${year} (Dương lịch) -> Chuyển sang Âm Lịch chính xác.
       - Kết hợp với Can Chi Ngày (${dayCanChi}) và Giờ sinh để lập **Quẻ Chủ** và **Quẻ Biến**.
    2. **Luận Thế - Ứng (Quan trọng):** Phân tích Hào Thế (Bản thân) và Hào Ứng (Đối phương/Hoàn cảnh). 
       - Thế khắc Ứng hay Ứng khắc Thế? 
       - Thế sinh Ứng hay Ứng sinh Thế?
       -> Từ đó kết luận dứt khoát: Là Thuận lợi (Cát) hay Khó khăn (Hung).
    3. **Thái độ:** Lời văn cổ điển, uy nghiêm, quyết đoán, thấu tận tâm can.
    4. **Nghề nghiệp:** Dựa vào Dụng Thần trong quẻ để chỉ rõ ngành nghề đắc dụng.

    **Yêu cầu đầu ra:**
    - Xác định chính xác Quẻ Chủ và Quẻ Biến.
    - Cung cấp thông tin Can Chi (đầy đủ 4 trụ Năm/Tháng/Ngày/Giờ), Sao Chủ Mệnh.
    - Dự báo 5 năm tới phải chỉ rõ: Năm nào phát, năm nào bại.
    - Lời khuyên "Tiến - Lùi" phải cụ thể hành động.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: readingSchema,
        temperature: 0.5, // Giảm thêm temperature để tăng độ chính xác của logic tính toán
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ReadingResult;
    } else {
      throw new Error("Không nhận được phản hồi từ thiên cơ.");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const askFollowUpQuestion = async (
    question: string, 
    context: ReadingResult, 
    userInfo: UserInput
): Promise<string> => {
    const ai = getAIClient();
    
    const prompt = `
      Bạn là Trạng Trình Nguyễn Bỉnh Khiêm. Đang luận giải quẻ: ${context.hexagramName} biến sang ${context.transformedHexagram.name}.
      
      Tín chủ hỏi: "${question}"

      Yêu cầu:
      - Trả lời dứt khoát dựa trên tượng quẻ và sự sinh khắc Ngũ Hành.
      - Không dùng từ ngữ ba phải, nước đôi.
      - Nếu quẻ xấu, hãy chỉ thẳng thắn và đưa cách hóa giải (nếu có).
      - Ngắn gọn, súc tích (dưới 150 chữ).
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { temperature: 0.6 }
        });
        return response.text || "Thiên cơ bất khả lộ.";
    } catch (error) {
        console.error("Follow up error", error);
        throw new Error("Mất kết nối với thiên cơ.");
    }
}