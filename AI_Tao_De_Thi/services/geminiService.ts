import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, StudentAnswers } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

export async function generateQuiz(
  subject: string,
  grade: string,
  topic: string,
  quizType: 'Trắc nghiệm' | 'Tự luận',
  numQuestions: number
): Promise<QuizQuestion[]> {

  const isMultipleChoice = quizType === 'Trắc nghiệm';

  const schema = {
    type: Type.OBJECT,
    properties: {
      quiz: {
        type: Type.ARRAY,
        description: `Một danh sách gồm ${numQuestions} câu hỏi.`,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'ID duy nhất cho câu hỏi, ví dụ: "q1", "q2".' },
            skill: { type: Type.STRING, description: 'Kỹ năng hoặc chủ đề cụ thể mà câu hỏi này kiểm tra.' },
            questionText: { type: Type.STRING, description: 'Nội dung đầy đủ của câu hỏi.' },
            options: {
              type: Type.ARRAY,
              description: isMultipleChoice ? 'Một mảng gồm 4 chuỗi đáp án lựa chọn.' : 'Để trống mảng này nếu là câu hỏi tự luận.',
              items: { type: Type.STRING }
            },
            correctAnswer: {
              type: Type.STRING,
              description: isMultipleChoice
                ? 'Đáp án đúng chính xác từ danh sách lựa chọn.'
                : 'Mô tả chi tiết câu trả lời hoặc dàn ý chấm điểm cho câu hỏi tự luận.'
            },
          }
        }
      }
    }
  };

  const systemInstruction = `Bạn là một chuyên gia thiết kế chương trình giảng dạy và ra đề thi tại Việt Nam. Nhiệm vụ của bạn là tạo ra một bài kiểm tra chất lượng cao dựa trên các yêu cầu được cung cấp.`;
  const userPrompt = `Hãy tạo một bài kiểm tra gồm ${numQuestions} câu hỏi dạng ${quizType} cho môn ${subject}, lớp ${grade}, tập trung vào chủ đề: "${topic}". Đảm bảo các câu hỏi có độ khó phù hợp và bao quát các khía cạnh quan trọng của chủ đề.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.quiz || [];
  } catch (error) {
    console.error("Error generating quiz from Gemini API:", error);
    throw new Error("Không thể tạo đề thi. Vui lòng kiểm tra console để biết chi tiết.");
  }
}


export async function evaluateQuiz(
  questions: QuizQuestion[],
  answers: StudentAnswers,
  subject: string,
  grade: string,
): Promise<string> {
  const studentSubmission = questions.map(q => ({
    question: q.questionText,
    skill: q.skill,
    options: q.options,
    correctAnswer: q.correctAnswer,
    studentAnswer: answers[q.id] || "Chưa trả lời",
    isEssay: !q.options || q.options.length === 0,
  }));

  const systemInstruction = `Bạn là một giáo viên ${subject} ${grade} giàu kinh nghiệm và tâm lý tại Việt Nam. Nhiệm vụ của bạn là xem xét bài kiểm tra của một học sinh và đưa ra đánh giá chi tiết, sâu sắc. Luôn sử dụng giọng văn thân thiện, khích lệ và trình bày kết quả bằng Markdown với các tiêu đề, in đậm và danh sách để làm nổi bật các phần quan trọng.`;

  const userPrompt = `
**ĐỀ BÀI VÀ BÀI LÀM CỦA HỌC SINH:**
${JSON.stringify(studentSubmission, null, 2)}

**YÊU CẦU ĐÁNH GIÁ:**
Dựa vào bài làm trên, hãy thực hiện đầy đủ các việc sau:

1.  **Phân tích tổng quan:** Bắt đầu bằng một nhận xét chung về bài làm của học sinh. Khen ngợi nỗ lực của em ấy.
2.  **Đánh giá theo từng kỹ năng:** Với mỗi kỹ năng có trong bài kiểm tra, hãy:
    -   Tính toán số câu đúng trên tổng số câu cho kỹ năng đó (bỏ qua câu tự luận khi tính toán tỷ lệ này).
    -   Dựa vào kết quả, đánh giá mức độ thành thạo của học sinh (ví dụ: "Cần cố gắng thêm", "Nắm khá vững", "Làm rất tốt!").
    -   Đưa ra nhận xét ngắn gọn về điểm mạnh hoặc điểm cần cải thiện.
3.  **Phân tích lỗi sai và Lời giải chi tiết:**
    -   Đối với **từng câu** học sinh làm sai (cả trắc nghiệm và tự luận), hãy thực hiện:
        a.  **Chỉ ra câu sai:** Nêu rõ đó là câu nào.
        b.  **Giải thích cặn kẽ VÌ SAO SAI:** Phân tích câu trả lời của học sinh và giải thích gốc rễ của lỗi sai một cách chi tiết, dễ hiểu. Đối với câu tự luận, hãy so sánh câu trả lời của học sinh với dàn ý/đáp án và chỉ ra các điểm còn thiếu hoặc chưa chính xác.
        c.  **Cung cấp LỜI GIẢI CHI TIẾT:** Trình bày lời giải đúng từng bước một. Đối với câu tự luận, hãy đưa ra một bài làm mẫu hoàn chỉnh.
4.  **Kế hoạch học tập đề xuất:** Dựa vào các kỹ năng học sinh còn yếu, hãy đề xuất một kế hoạch học tập cấp cao cho 7 ngày tới. Kế hoạch này nên tập trung vào 2-3 kỹ năng cần cải thiện nhất.
5.  **Lời khuyên và động viên:** Kết thúc bài đánh giá bằng một vài lời khuyên cụ thể và một lời động viên chân thành.
`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    throw new Error("Không thể tạo đánh giá. Vui lòng kiểm tra console để biết chi tiết.");
  }
}