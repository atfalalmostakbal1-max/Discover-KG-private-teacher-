
import React, { useState, useRef, useEffect } from 'react';
import { Language, KGLevel, AppState, Theme, Lesson } from './types';
import { CURRICULUM_DATA } from './constants';
import { getLessonExplanation, getLessonStory, getLessonSong, processVoiceQuestion, generateColoringPage, generateSpeech, evaluateColoring, getTeacherQuestion, evaluateChildAnswer } from './services/geminiService';
import AudioPlayer, { AudioPlayerHandle } from './components/AudioPlayer';
import ColoringCanvas from './components/ColoringCanvas';

const TeacherAvatar = ({ isSpeaking, size = "md", isListening = false }: { isSpeaking: boolean, size?: "sm" | "md" | "lg", isListening?: boolean }) => {
  const sizeClasses = {
    sm: "w-12 h-12 text-2xl",
    md: "w-20 h-20 text-4xl",
    lg: "w-32 h-32 text-6xl"
  };

  return (
    <div className={`relative ${sizeClasses[size]} bg-white rounded-full flex items-center justify-center border-4 ${isListening ? 'border-green-400 animate-pulse' : 'border-indigo-200'} shadow-xl overflow-hidden transition-all duration-300 ${isSpeaking ? 'scale-110 border-pink-400' : ''}`}>
      <div className={`relative z-10 ${isSpeaking ? 'animate-pulse' : ''} ${isListening ? 'grayscale-[0.5]' : ''}`}>
        👩‍🏫
      </div>
      {isSpeaking && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
           <div className="w-4 h-2 bg-pink-500 rounded-full animate-[mouth-bounce_0.3s_infinite] opacity-80"></div>
           <div className="absolute inset-0 bg-pink-100/30 animate-pulse"></div>
        </div>
      )}
      {isListening && (
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-full h-full bg-green-100/40 animate-ping absolute"></div>
           <div className="text-xs font-bold text-green-600 absolute bottom-1">👂</div>
        </div>
      )}
      <style>{`
        @keyframes mouth-bounce {
          0%, 100% { transform: scaleX(1) scaleY(1); }
          50% { transform: scaleX(1.3) scaleY(0.4); }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    language: Language.AR,
    level: null,
    currentTheme: null,
    currentLesson: null,
    step: 'welcome',
  });

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [childQuestionText, setChildQuestionText] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [viewType, setViewType] = useState<'explanation' | 'story' | 'song' | 'ask' | 'quiz'>('explanation');
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState<string | null>(null);
  
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const t = (ar: string, en: string) => (state.language === Language.AR ? ar : en);

  const handleLessonSelect = async (lesson: Lesson) => {
    setState(prev => ({ ...prev, currentLesson: lesson, step: 'lesson' }));
    setViewType('explanation');
    resetLessonStates();
    setLoading(true);
    
    try {
      const explanation = await getLessonExplanation(lesson.title[state.language], state.language, state.level === KGLevel.KG1 ? 4 : 5);
      setAiResponse(explanation?.replace(/\n\s*\n/g, '\n').trim() || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSpeech = async () => {
    if (!aiResponse) return;
    setLoading(true);
    try {
      const audio = await generateSpeech(aiResponse);
      setAudioData(audio || null);
    } catch (e) {
      console.error("Speech generation failed", e);
    } finally {
      setLoading(false);
    }
  };

  const resetLessonStates = () => {
    setAiResponse(null);
    setChildQuestionText(null);
    setImageResult(null);
    setAudioData(null);
    setIsSpeaking(false);
    setIsPaused(false);
    setShowCanvas(false);
    setCurrentQuizQuestion(null);
  };

  const handleRequestQuiz = async () => {
    if (!state.currentLesson) return;
    setLoading(true);
    resetLessonStates();
    setViewType('quiz');
    try {
      const question = await getTeacherQuestion(state.currentLesson.title[state.language], state.language, state.level === KGLevel.KG1 ? 4 : 5);
      setAiResponse(question);
      setCurrentQuizQuestion(question);
      const audio = await generateSpeech(question);
      setAudioData(audio || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) { setIsRecording(false); return; }
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          if (viewType === 'quiz' && currentQuizQuestion) {
            await handleProcessQuizAnswer(base64Audio);
          } else {
            await handleSendVoiceQuestion(base64Audio);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert(t("من فضلك اسمح بالميكروفون", "Please allow microphone"));
    }
  };

  const handleProcessQuizAnswer = async (base64Audio: string) => {
    setLoading(true);
    try {
      const result = await evaluateChildAnswer(base64Audio, currentQuizQuestion!, state.currentLesson!.title[state.language], state.language, state.level === KGLevel.KG1 ? 4 : 5);
      setChildQuestionText(result.childTranscript);
      setAiResponse(result.teacherFeedback);
      const audio = await generateSpeech(result.teacherFeedback);
      setAudioData(audio || null);
      setCurrentQuizQuestion(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendVoiceQuestion = async (base64Audio: string) => {
    setLoading(true);
    setAiResponse(null);
    setChildQuestionText(null);
    setAudioData(null);
    setViewType('ask');
    try {
      const response = await processVoiceQuestion(base64Audio, state.language, state.level === KGLevel.KG1 ? 4 : 5);
      setChildQuestionText(response.childQuestion);
      setAiResponse(response.teacherAnswer);
      const audio = await generateSpeech(response.teacherAnswer);
      setAudioData(audio || null);
    } catch (e) {
      setAiResponse(t("لم أسمعك جيداً يا بطل!", "I didn't hear you well!"));
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = () => { if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); } };
  const cancelRecording = () => { if (mediaRecorderRef.current) { audioChunksRef.current = []; mediaRecorderRef.current.stop(); setIsRecording(false); } };

  const handleRequestStory = async () => {
    if (!state.currentLesson) return;
    setLoading(true);
    resetLessonStates();
    setViewType('story');
    try {
      const story = await getLessonStory(state.currentLesson.title[state.language], state.language, state.level === KGLevel.KG1 ? 4 : 5);
      setAiResponse(story);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleRequestSong = async () => {
    if (!state.currentLesson) return;
    setLoading(true);
    resetLessonStates();
    setViewType('song');
    try {
      const song = await getLessonSong(state.currentLesson.title[state.language], state.language, state.level === KGLevel.KG1 ? 4 : 5);
      setAiResponse(song);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const togglePause = () => {
    if (!audioData) return;
    if (isPaused) { audioPlayerRef.current?.resume(); setIsSpeaking(true); setIsPaused(false); }
    else { audioPlayerRef.current?.pause(); setIsSpeaking(false); setIsPaused(true); }
  };

  const handleDraw = async () => {
    if (!state.currentLesson) return;
    setLoading(true);
    try {
      const img = await generateColoringPage(state.currentLesson.title[state.language]);
      setImageResult(img);
      setShowCanvas(true);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleColoringFinish = async (canvasDataUrl: string) => {
    setLoading(true);
    try {
      const evaluation = await evaluateColoring(canvasDataUrl, state.currentLesson!.title[state.language], state.language);
      setAiResponse(evaluation);
      const audio = await generateSpeech(evaluation);
      setAudioData(audio);
      setShowCanvas(false);
      setViewType('explanation');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className={`flex flex-col min-h-screen ${state.language === Language.AR ? 'rtl' : 'ltr'}`}>
      {isRecording && (
        <div className="fixed inset-0 z-[100] bg-indigo-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-300">
           <TeacherAvatar isSpeaking={false} size="lg" isListening={true} />
           <h2 className="text-3xl md:text-4xl font-black mb-4 mt-8 text-center text-green-400">{t('أنا أسمعك الآن.. 👂', 'I am listening now.. 👂')}</h2>
           <p className="text-lg md:text-xl mb-12 opacity-90 text-center">{t('قل إجابتك أو سؤالك بوضوح!', 'Speak clearly now!')}</p>
           <div className="flex gap-4 h-24 items-center mb-16">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-3 bg-green-400 rounded-full animate-wave" style={{ animationDelay: `${i * 0.05}s`, height: `${30 + Math.random() * 70}%` }}></div>
              ))}
           </div>
           <div className="flex flex-col gap-4 w-full max-w-xs">
              <button onClick={stopRecording} className="bg-green-500 hover:bg-green-600 text-white text-xl md:text-2xl font-black py-6 rounded-3xl shadow-[0_10px_0_0_#15803d] active:translate-y-2 active:shadow-none flex items-center justify-center gap-3">
                <span>✅</span> {t('إنهاء الإجابة', 'Finish Answer')}
              </button>
              <button onClick={cancelRecording} className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl">
                {t('إلغاء ❌', 'Cancel ❌')}
              </button>
           </div>
        </div>
      )}

      <header className="p-4 bg-white/90 backdrop-blur-md shadow-md sticky top-0 z-50 flex justify-between items-center border-b-2 border-indigo-100">
        <div className="flex items-center gap-3">
          <TeacherAvatar isSpeaking={isSpeaking} size="sm" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] md:text-xs font-bold text-indigo-300 leading-none mb-1">
              {t('المعلمة الخاصة', 'Private Teacher')}
            </span>
            <span className="text-lg md:text-xl font-black text-indigo-600 leading-none tracking-tight">
              DISCOVER
            </span>
          </div>
        </div>
        <button onClick={() => setState(s => ({ ...s, language: s.language === Language.AR ? Language.EN : Language.AR }))} className="bg-indigo-50 text-indigo-600 px-4 md:px-6 py-1.5 rounded-full text-xs md:text-sm font-bold border-2 border-indigo-100">
          {state.language === Language.AR ? 'English Mode' : 'الوضع العربي'}
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto w-full">
        {state.step === 'welcome' && (
          <div className="text-center mt-6 space-y-6 max-w-md w-full">
            {/* Logo/Brand Area in Welcome Screen */}
            <div className="flex flex-col items-center mb-4">
              <span className="text-xl font-bold text-indigo-500 opacity-80">{t('المعلمة الخاصة', 'Private Teacher')}</span>
              <h1 className="text-5xl md:text-6xl font-black text-indigo-700 tracking-tighter drop-shadow-sm">DISCOVER</h1>
            </div>

            <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl border-4 border-yellow-400 relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <TeacherAvatar isSpeaking={isSpeaking} size="lg" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-indigo-700 mb-4 mt-12">{t('أهلاً يا ذكي!', 'Hello, Genius!')}</h2>
              <p className="text-lg text-gray-600">{t('اختر مستواك الدراسي لنبدأ الرحلة!', 'Pick your level to start!')}</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
               <button onClick={() => setState(s => ({ ...s, level: KGLevel.KG1, step: 'curriculum' }))} className="bg-pink-400 text-white text-2xl font-black py-8 rounded-3xl shadow-xl border-b-8 border-pink-700 active:translate-y-2 active:shadow-none transition-all">KG 1</button>
               <button onClick={() => setState(s => ({ ...s, level: KGLevel.KG2, step: 'curriculum' }))} className="bg-blue-400 text-white text-2xl font-black py-8 rounded-3xl shadow-xl border-b-8 border-blue-700 active:translate-y-2 active:shadow-none transition-all">KG 2</button>
            </div>
          </div>
        )}

        {state.step === 'curriculum' && state.level && (
          <div className="w-full space-y-6">
            <div className="flex justify-start">
              <button onClick={() => setState(s => ({ ...s, step: 'welcome' }))} className="bg-white px-6 py-3 rounded-2xl text-indigo-600 font-black border-2 border-indigo-100 shadow-sm active:scale-95 transition-transform">
                 {t('⬅️ العودة', '⬅️ Back')}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {CURRICULUM_DATA[state.level].map(theme => (
                <div key={theme.id} className={`${theme.color} p-4 sm:p-6 rounded-[32px] shadow-xl flex flex-col h-auto`}>
                  <h3 className="text-xl md:text-2xl font-black text-white mb-4 md:mb-6 flex items-center gap-2">
                    <span className="bg-white/20 p-2 rounded-xl text-lg">📚</span>
                    {theme.title[state.language]}
                  </h3>
                  
                  <div className="space-y-4">
                    {theme.chapters.map(chapter => (
                      <div key={chapter.id} className="bg-white/95 rounded-2xl p-4 shadow-sm border border-black/5">
                        <h4 className="font-bold text-indigo-600 mb-3 border-b border-indigo-50 pb-2 text-sm md:text-base">
                          {chapter.title[state.language]}
                        </h4>
                        <div className="space-y-2">
                          {chapter.lessons.map(lesson => (
                            <button 
                              key={lesson.id} 
                              onClick={() => handleLessonSelect(lesson)} 
                              className="w-full text-right bg-white hover:bg-indigo-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center transition-all group active:scale-[0.98]"
                            >
                              <div className="flex flex-col text-right">
                                <span className="font-bold text-gray-700 text-xs md:text-sm">{lesson.title[state.language]}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{lesson.description[state.language]}</span>
                              </div>
                              <span className="text-indigo-200 group-hover:text-indigo-500 transition-colors mr-2">➜</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.step === 'lesson' && state.currentLesson && (
          <div className="w-full max-w-2xl bg-white p-6 sm:p-8 rounded-[40px] shadow-2xl relative border-b-[12px] border-indigo-100">
            {/* Dedicated Back Button at top left for lesson view */}
            <div className="absolute top-4 left-4 z-10">
              <button 
                onClick={() => setState(s => ({ ...s, step: 'curriculum', currentLesson: null }))}
                className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-2xl text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition shadow-sm active:scale-90"
              >
                <span className="text-2xl">⬅️</span>
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xl font-bold text-indigo-600 animate-pulse">{t('المعلمة تجهز لك مفاجأة...', 'Teacher is preparing a surprise...')}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {showCanvas && imageResult ? (
                  <div className="relative">
                    {/* Back Button for Canvas specifically */}
                    <button 
                      onClick={() => setShowCanvas(false)}
                      className="absolute -top-4 -left-4 w-12 h-12 bg-white flex items-center justify-center rounded-2xl text-gray-500 shadow-xl z-20"
                    >
                      <span>❌</span>
                    </button>
                    <ColoringCanvas imageSrc={imageResult} language={state.language} onFinish={handleColoringFinish} />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center">
                      <TeacherAvatar isSpeaking={isSpeaking} size="lg" />
                      <h2 className="text-2xl font-black text-indigo-800 mt-4 text-center">{state.currentLesson.title[state.language]}</h2>
                    </div>

                    <div className="space-y-4">
                      {childQuestionText && (
                        <div className="bg-indigo-50 p-5 rounded-3xl rounded-br-none border-2 border-indigo-100 text-lg italic text-indigo-800">
                           🧒 {t('إجابتك / سؤالك:', 'Your answer / question:')} "{childQuestionText}"
                        </div>
                      )}
                      {aiResponse && (
                        <div className={`bg-white p-6 rounded-[32px] ${childQuestionText ? 'rounded-tl-none' : ''} border-4 border-indigo-50 text-xl md:text-2xl text-gray-800 shadow-inner relative`}>
                           <div className="whitespace-pre-line leading-relaxed">{aiResponse}</div>
                        </div>
                      )}
                    </div>

                    {/* أزرار التحكم بالترتيب المطلوب من المستخدم */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                      {/* 1. اسمعني */}
                      <div className="flex flex-col">
                        {audioData ? (
                          <button onClick={togglePause} className={`flex flex-col items-center justify-center gap-1 ${isPaused ? 'bg-green-400' : 'bg-pink-500'} p-4 md:p-5 rounded-3xl text-white shadow-lg transform transition active:scale-95 h-full`}>
                            <span className="text-xl md:text-2xl">{isPaused ? '▶️' : '⏸️'}</span>
                            <span className="font-bold text-[10px] md:text-xs">{isPaused ? t('استكمال', 'Resume') : t('إيقاف', 'Pause')}</span>
                          </button>
                        ) : (
                          <button onClick={handleRequestSpeech} className="flex flex-col items-center justify-center gap-1 bg-yellow-400 p-4 md:p-5 rounded-3xl text-white shadow-lg transform transition active:scale-95 h-full">
                            <span className="text-xl md:text-2xl">🎧</span>
                            <span className="font-bold text-[10px] md:text-xs">{t('اسمعني', 'Listen')}</span>
                          </button>
                        )}
                      </div>

                      {/* 2. قصة الدرس */}
                      <button onClick={handleRequestStory} className="flex flex-col items-center justify-center gap-1 bg-purple-400 p-4 md:p-5 rounded-3xl text-white shadow-lg transform transition active:scale-95 h-full">
                        <span className="text-xl md:text-2xl">📖</span>
                        <span className="font-bold text-[10px] md:text-xs text-center">{t('قصة الدرس', 'Lesson Story')}</span>
                      </button>

                      {/* 3. أغنية الدرس */}
                      <button onClick={handleRequestSong} className="flex flex-col items-center justify-center gap-1 bg-teal-400 p-4 md:p-5 rounded-3xl text-white shadow-lg transform transition active:scale-95 h-full">
                        <span className="text-xl md:text-2xl">🎵</span>
                        <span className="font-bold text-[10px] md:text-xs text-center">{t('أغنية الدرس', 'Lesson Song')}</span>
                      </button>

                      {/* 4. تلوين */}
                      <button onClick={handleDraw} className="flex flex-col items-center justify-center gap-1 bg-indigo-400 p-4 md:p-5 rounded-3xl text-white shadow-lg transform transition active:scale-95 h-full">
                        <span className="text-xl md:text-2xl">🖍️</span>
                        <span className="font-bold text-[10px] md:text-xs text-center">{t('تلوين', 'Coloring')}</span>
                      </button>

                      {/* 5. الميكروفون (أسأل / أجب) */}
                      <button onClick={startRecording} className="flex flex-col items-center justify-center gap-1 bg-green-500 p-4 md:p-5 rounded-3xl text-white shadow-lg transform transition active:scale-95 animate-bounce-subtle h-full">
                        <span className="text-xl md:text-2xl">🎙️</span>
                        <span className="font-bold text-[10px] md:text-xs text-center leading-tight">{t('أسأل / أجب', 'Ask / Answer')}</span>
                      </button>

                      {/* 6. اسأليني */}
                      <button onClick={handleRequestQuiz} className="flex flex-col items-center justify-center gap-1 bg-orange-400 p-4 md:p-5 rounded-3xl text-white shadow-lg transform transition active:scale-95 h-full">
                        <span className="text-xl md:text-2xl">🧠</span>
                        <span className="font-bold text-[10px] md:text-xs text-center">{t('اسأليني', 'Ask Me')}</span>
                      </button>
                    </div>

                    <div className="flex justify-center mt-6">
                      <button onClick={() => setState(s => ({ ...s, step: 'curriculum', currentLesson: null }))} className="flex items-center gap-2 bg-gray-100 text-gray-500 px-6 py-3 rounded-2xl hover:bg-red-50 hover:text-red-500 transition font-bold shadow-sm active:scale-95 text-sm md:text-base">
                        <span className="text-lg md:text-xl">🚪</span>
                        <span>{t('خروج من الدرس', 'Exit Lesson')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {audioData && (
        <AudioPlayer 
          ref={audioPlayerRef}
          base64Audio={audioData} 
          isPlaying={isSpeaking}
          onEnded={() => { setIsSpeaking(false); setIsPaused(false); setAudioData(null); }} 
          onStart={() => { setIsSpeaking(true); setIsPaused(false); }} 
        />
      )}
      <style>{`
        @keyframes wave { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1.5); } }
        .animate-wave { animation: wave 0.6s ease-in-out infinite; }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-subtle { animation: bounce-subtle 2s infinite; }
        .rtl { direction: rtl; }
        .ltr { direction: ltr; }
      `}</style>
    </div>
  );
};

export default App;
