
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getLessonExplanation = async (lessonTitle: string, language: string, age: number) => {
  const ai = getAI();
  const prompt = `
    أنتِ معلمة رياض أطفال محبة وصبورة لمنهج Discover في مصر.
    اشرحي النشاط التالي: "${lessonTitle}" لطفل عمره ${age} سنوات بلغة ${language === 'ar' ? 'بسيطة وودودة جداً' : 'simple and very friendly English'}.
    
    قواعد هامة جداً للتفاعل البصري:
    1. استخدمي جمل قصيرة جداً وملونة.
    2. كلما ذكرتِ اسماً لشيء مادي، ضعي الرمز التعبيري (Emoji) المناسب له.
    3. اجعلي النص يبدو وكأنه قصة تفاعلية.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  
  return response.text;
};

export const getTeacherQuestion = async (lessonTitle: string, language: string, age: number) => {
  const ai = getAI();
  const prompt = `
    أنتِ معلمة رياض أطفال في منهج Discover. الدرس الحالي هو "${lessonTitle}".
    وجهي سؤالاً واحداً بسيطاً ومرحاً للطفل (عمره ${age} سنوات) لتختبري فهمه بطريقة تفاعلية.
    لغة السؤال: ${language === 'ar' ? 'عربية بسيطة جداً ومحببة' : 'very simple and playful English'}.
    - اجعلي السؤال يبدأ بـ "يا بطل.." أو "يا ذكي..".
    - السؤال يجب أن يكون عن محتوى الدرس.
    - استخدمي الكثير من الإيموجي.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  
  return response.text;
};

export const evaluateChildAnswer = async (audioBase64: string, question: string, lessonTitle: string, language: string, age: number) => {
  const ai = getAI();
  const prompt = `
    أنتِ معلمة رياض أطفال. لقد وجهتِ للطفل سؤالاً: "${question}" حول درس "${lessonTitle}".
    استمعي لإجابة الطفل الصوتية المرفقة وقيميها.
    
    المطلوب:
    1. كتابة ما قاله الطفل (Transcription).
    2. كتابة رد المعلمة:
       - إذا كانت الإجابة صحيحة: امدحيه بحماس شديد (أنت عبقري!، إجابة مذهلة!).
       - إذا كانت الإجابة ناقصة أو خاطئة: صححي له المعلومة بلطف شديد وبدون إشعاره بالخطأ (مثلاً: "قربت جداً يا بطل! والحقيقة هي...").
    
    لغة الرد: ${language === 'ar' ? 'عربية بسيطة ودافئة' : 'simple and warm English'}.
  `;

  const audioPart = {
    inlineData: {
      mimeType: 'audio/pcm',
      data: audioBase64,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [audioPart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          childTranscript: { type: Type.STRING },
          teacherFeedback: { type: Type.STRING }
        },
        required: ["childTranscript", "teacherFeedback"],
      },
    },
  });

  return JSON.parse(response.text || '{}');
};

export const getLessonStory = async (lessonTitle: string, language: string, age: number) => {
  const ai = getAI();
  const prompt = `أنتِ حكواتية مبدعة. ألفي قصة قصيرة جداً ومشوقة حول: "${lessonTitle}" لطفل عمره ${age} سنوات. استخدمي الكثير من الرموز التعبيرية.`;
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
  return response.text;
};

export const getLessonSong = async (lessonTitle: string, language: string, age: number) => {
  const ai = getAI();
  const prompt = `أنتِ معلمة موسيقى. ألفي نشيداً مقفى من 4 أسطر حول: "${lessonTitle}" لطفل عمره ${age} سنوات.`;
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
  return response.text;
};

export const processVoiceQuestion = async (audioBase64: string, language: string, age: number) => {
  const ai = getAI();
  const prompt = `أنتِ معلمة رياض أطفال. استمعي لسؤال الطفل وأجيبي عليه بلطف وتشجيع.`;
  const audioPart = { inlineData: { mimeType: 'audio/pcm', data: audioBase64 } };
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [audioPart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          childQuestion: { type: Type.STRING },
          teacherAnswer: { type: Type.STRING },
        },
        required: ["childQuestion", "teacherAnswer"],
      },
    },
  });
  return JSON.parse(response.text || '{}');
};

export const evaluateColoring = async (imageDataUrl: string, lessonTitle: string, language: string) => {
  const ai = getAI();
  const base64Data = imageDataUrl.split(',')[1];
  const prompt = `
    أنتِ معلمة رياض أطفال خبيرة ومحبة لمنهج Discover. انظري إلى صورة التلوين التي قام بها الطفل لدرس "${lessonTitle}".
    المطلوب تقديم تعليق واقعي، لطيف، ومشجع يهدف لتنمية مهارات الطفل:
    1. حللي الألوان المستخدمة (مثلاً: "أرى أنك استخدمت اللون الأحمر الجميل في تلوين القلب").
    2. قيمي الدقة (إذا كان التلوين داخل الحدود، امدحي تركيزه. إذا كان خارجها، شجعيه بلطف على محاولة إبقاء الألوان "داخل البيت" في المرة القادمة لتصبح الصورة أجمل).
    3. ركزي على الإبداع والمجهود.
    4. اجعلي الرد قصيراً ومناسباً لطفل عمره 4-5 سنوات.
    5. اللغة: ${language === 'ar' ? 'عربية بسيطة جداً ومحببة' : 'very simple and warm English'}.
    6. استخدمي الكثير من الإيموجي المناسبة لما تصفينه.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: base64Data } }] }
  });
  return response.text;
};

export const generateColoringPage = async (concept: string) => {
  const ai = getAI();
  // Updated prompt to ensure ONLY English text is used on images
  const prompt = `Simple black and white outline coloring page for 4yo child. Subject: ${concept}. 
  RULES:
  1. ONLY use English for any labels or text inside the image. 
  2. ABSOLUTELY NO Arabic characters or text.
  3. Thick black outlines, high contrast, no shading.
  4. Large areas for easy coloring.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
  });
  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

export const generateSpeech = async (text: string) => {
  const ai = getAI();
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '');
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say warmly and clearly for a child: ${cleanText}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
