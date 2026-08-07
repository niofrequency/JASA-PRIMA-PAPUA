import React, { useState, useEffect, useRef } from 'react';
import { Course, CourseModule, Lesson, StudentCourseProgress, Quiz, QuizQuestion, QuizSubmission } from '../../types';
import { askCourseChatbot } from '../../services/aiService';
import { 
  ArrowLeft, CheckCircle, Circle, BookOpen, FileText, 
  HelpCircle, RotateCcw, MessageCircle, Send, 
  Bot, X, Lightbulb, User
} from 'lucide-react';
 
interface CourseViewerProps {
  course: Course;
  progress: StudentCourseProgress;
  initialLessonId?: string;
  onBack: () => void;
  onUpdateLessonComplete: (courseId: string, lessonId: string) => void;
  onSubmitQuiz: (courseId: string, quizId: string, answers: number[], passed: boolean, score: number) => void;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({
  course,
  progress,
  initialLessonId,
  onBack,
  onUpdateLessonComplete,
  onSubmitQuiz,
}) => {
  // Defensive fallbacks for dynamic AI/Firebase data
  const safeModules = course?.modules || [];
  const firstLesson = safeModules[0]?.lessons?.[0];
  
  // Determine active lesson
  const [activeLessonId, setActiveLessonId] = useState<string>(
    initialLessonId || progress?.lastAccessedLessonId || firstLesson?.id || ''
  );

  // Active Tab in Lesson Pane
  const [activePaneTab, setActivePaneTab] = useState<'video' | 'reading' | 'quiz'>('video');

  // Video State

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);

  // AI Tutor Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: 'Hello! I am your AI safety tutor. Need clarification on this lesson?' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Find active lesson object and parent module safely
  let activeLesson: Lesson | null = null;
  let activeModule: CourseModule | null = null;

  for (const mod of safeModules) {
    const found = (mod.lessons || []).find((l) => l.id === activeLessonId);
    if (found) {
      activeLesson = found;
      activeModule = mod;
      break;
    }
  }

  // Fallback if activeLessonId is completely invalid
  if (!activeLesson && firstLesson) {
    activeLesson = firstLesson;
    activeModule = safeModules[0];
  }

  const completedLessons = progress?.completedLessonIds || [];
  const isLessonCompleted = completedLessons.includes(activeLesson?.id || '');
  const overallProgress = progress?.overallPercent || 0;

  // Sync quiz state with global progress on module change
  useEffect(() => {
    if (activeModule?.quiz) {
      const submission = progress?.quizSubmissions?.[activeModule.quiz.id];
      if (submission) {
        setQuizSubmitted(true);
        setQuizResult({ score: submission.score, passed: submission.passed });
        
        // Re-populate the user's previous answers
        const answers: Record<string, number> = {};
        activeModule.quiz.questions.forEach((q, idx) => {
          if (submission.userAnswers[idx] !== undefined) {
            answers[q.id] = submission.userAnswers[idx];
          }
        });
        setQuizAnswers(answers);
      } else {
        setQuizSubmitted(false);
        setQuizResult(null);
        setQuizAnswers({});
      }
    }
  }, [activeModule?.quiz, progress?.quizSubmissions]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setActivePaneTab('video');
    setIsPlaying(false);
    // Reset AI tutor context for the new lesson
    setChatMessages([{ role: 'ai', text: 'Lesson changed. What questions do you have about this new topic?' }]);
  };

  const handleMarkCompleteToggle = () => {
    if (!activeLesson) return;
    onUpdateLessonComplete(course.id, activeLesson.id);
  };

  // Quiz submission handler
  const handleAnswerSelect = (qId: string, optionIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleQuizSubmit = (quiz: Quiz) => {
    const safeQuestions = quiz.questions || [];
    const total = safeQuestions.length;
    if (total === 0) return; // Prevent NaN on empty AI generated quizzes

    let correctCount = 0;
    const userAnswersList: number[] = [];

    safeQuestions.forEach((q) => {
      const selected = quizAnswers[q.id];
      userAnswersList.push(selected !== undefined ? selected : -1);
      if (selected === q.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / total) * 100);
    const passingThreshold = quiz.passingScorePercent || 75;
    const passed = score >= passingThreshold;

    setQuizResult({ score, passed });
    setQuizSubmitted(true);

    onSubmitQuiz(course.id, quiz.id, userAnswersList, passed, score);
  };

  // AI Chat Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    const userText = chatInput.trim();
    const historySnapshot = chatMessages; // history BEFORE this new question
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const answer = await askCourseChatbot(
        activeLesson?.title || 'This lesson',
        activeLesson?.content || '',
        userText,
        historySnapshot
      );
      setChatMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      console.error('AI tutor chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: "Sorry, I couldn't reach the AI tutor just now. Please try again in a moment, or ask your supervisor if it's urgent.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Content Parser: Extract Key Takeaways generated by Gemini
  const parseLessonContent = (rawContent: string) => {
    let mainText = rawContent || 'No text content provided for this lesson.';
    let takeawaysText = '';

    // Regex to split content if Gemini appended "### Key Takeaways" or similar
    const splitRegex = /(?:### |\*\*|)Key Takeaways(?:[:\*\*]*)\s*([\s\S]*)/i;
    const match = mainText.match(splitRegex);

    if (match) {
      takeawaysText = match[1].trim();
      mainText = mainText.substring(0, match.index).trim();
    }

    return { mainText, takeawaysText };
  };

  const parsedContent = activeLesson ? parseLessonContent(activeLesson.content) : { mainText: '', takeawaysText: '' };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#0EA5E9] selection:text-white">
      
      {/* Top Header Navigation */}
      <header className="h-16 bg-[#E2E8F0] text-[#0F172A] border-b border-[#CBD5E1] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            id="course-viewer-back-btn"
            onClick={onBack}
            className="p-2 text-slate-700 hover:text-[#0F172A] rounded-xl hover:bg-slate-200 transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">Back to Portal</span>
          </button>
          <div className="h-5 w-px bg-[#CBD5E1] hidden sm:block" />
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[#0F172A] truncate max-w-xs sm:max-w-md">{course.title || 'Course Viewer'}</p>
            <p className="text-[10px] text-[#0EA5E9] font-bold truncate max-w-xs sm:max-w-md">
              {activeModule?.title || 'Module'} • {activeLesson?.title || 'Lesson'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-xs">
            <span className="text-slate-600 font-semibold">Progress:</span>
            <span className="font-extrabold text-[#0EA5E9]">{overallProgress}%</span>
            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden border border-[#CBD5E1]">
              <div
                className="h-full bg-[#0EA5E9] transition-all duration-500 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <button
            id="course-viewer-mark-complete-btn"
            onClick={handleMarkCompleteToggle}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              isLessonCompleted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-md shadow-[#0EA5E9]/20'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isLessonCompleted ? 'Completed' : 'Mark Completed'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Pane: Video & Text Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Video Player — only rendered when a real video URL exists.
              Previously this always rendered a fully simulated player
              (fake "HD Video Lecture" badge, fake play button, fake
              "Simulated Technical Video Stream" text) even when no video
              existed for the lesson, which is misleading. */}
          {activeLesson?.videoUrl ? (
            <div className="relative aspect-video bg-[#0F172A] border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xl">
              <video
                key={activeLesson.videoUrl}
                src={activeLesson.videoUrl}
                controls
                className="w-full h-full object-contain bg-black"
              >
                Your browser doesn't support embedded video.
              </video>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 bg-cyan-50 text-[#0EA5E9] rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-cyan-100">
                  {activeLesson?.duration || 'Reading'}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {activeLesson?.title || 'Select a Lesson'}
              </h2>
            </div>
          )}

          {/* Lesson Content Tab Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-sm">
            
            <div className="flex space-x-2 border-b border-[#E2E8F0] pb-3 overflow-x-auto">
              <button
                id="tab-pane-video"
                onClick={() => setActivePaneTab('video')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activePaneTab === 'video'
                    ? 'bg-[#0EA5E9] text-white'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Lesson Guide & Text</span>
              </button>

              <button
                id="tab-pane-reading"
                onClick={() => setActivePaneTab('reading')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activePaneTab === 'reading'
                    ? 'bg-[#0EA5E9] text-white'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Reading Notes & SOG</span>
              </button>

              {activeModule?.quiz && (
                <button
                  id="tab-pane-quiz"
                  onClick={() => setActivePaneTab('quiz')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activePaneTab === 'quiz'
                      ? 'bg-[#0EA5E9] text-white'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Module Assessment Quiz</span>
                </button>
              )}
            </div>

            {/* TAB 1: Lesson Text (Enhanced with Key Takeaways Banner) */}
            {activePaneTab === 'video' && activeLesson && (
              <div className="space-y-6 text-xs leading-relaxed text-slate-700 whitespace-pre-line animate-fadeIn">
                <h3 className="text-base font-extrabold text-[#0F172A]">{activeLesson.title}</h3>
                
                {/* Gemini Parsed Main Content */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-[11px] text-slate-800 leading-relaxed shadow-inner">
                  {parsedContent.mainText}
                </div>

                {/* Gemini Parsed Key Takeaways Banner */}
                {parsedContent.takeawaysText && (
                  <div className="mt-6 border border-[#0EA5E9]/30 bg-gradient-to-br from-cyan-50 to-blue-50/30 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="p-1.5 bg-[#0EA5E9]/10 rounded-lg text-[#0EA5E9]">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-[#0EA5E9] text-sm">Key Takeaways</h4>
                    </div>
                    <div className="text-slate-700 font-medium pl-2 leading-relaxed space-y-1">
                      {parsedContent.takeawaysText}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Reading Material */}
            {activePaneTab === 'reading' && activeLesson && (
              <div className="space-y-4 text-xs leading-relaxed text-slate-700 whitespace-pre-line animate-fadeIn">
                <h3 className="text-base font-extrabold text-[#0F172A]">Technical Reference Standard & Operating Guideline</h3>
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-sans text-xs text-slate-800 space-y-2 shadow-inner">
                  {activeLesson.readingMaterial || 'No additional reading notes or operating guidelines required for this module.'}
                </div>
              </div>
            )}

            {/* TAB 3: Embedded Quiz Runner */}
            {activePaneTab === 'quiz' && activeModule?.quiz && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">{activeModule.quiz.title}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {(activeModule.quiz.questions || []).length} Questions • Passing Score: {activeModule.quiz.passingScorePercent || 75}%
                    </p>
                  </div>
                  {quizResult && (
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${
                      quizResult.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {quizResult.passed ? `PASSED (${quizResult.score}%)` : `FAILED (${quizResult.score}%)`}
                    </span>
                  )}
                </div>

                {(activeModule.quiz.questions || []).map((q, qIdx) => {
                  const selectedOpt = quizAnswers[q.id];
                  return (
                    <div key={q.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4 shadow-sm">
                      <p className="text-xs font-extrabold text-[#0F172A] leading-relaxed">
                        <span className="text-[#0EA5E9] mr-1">Q{qIdx + 1}.</span> {q.question}
                      </p>

                      <div className="space-y-2.5">
                        {(q.options || []).map((opt, optIdx) => {
                          let optStyle = 'bg-white border-[#E2E8F0] text-slate-700 hover:border-slate-300';
                          let indicatorStyle = 'border-slate-300';

                          if (selectedOpt === optIdx) {
                            optStyle = 'bg-cyan-50 border-[#0EA5E9] text-[#0EA5E9] font-bold shadow-sm';
                            indicatorStyle = 'border-[#0EA5E9] bg-[#0EA5E9]';
                          }
                          if (quizSubmitted) {
                            if (optIdx === q.correctIndex) {
                              optStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-sm';
                              indicatorStyle = 'border-emerald-500 bg-emerald-500';
                            } else if (selectedOpt === optIdx && optIdx !== q.correctIndex) {
                              optStyle = 'bg-rose-50 border-rose-400 text-rose-800 shadow-sm';
                              indicatorStyle = 'border-rose-400 bg-rose-400';
                            }
                          }

                          return (
                            <label
                              key={optIdx}
                              className={`w-full text-left p-3.5 rounded-xl text-xs border transition-all flex items-center space-x-3 cursor-pointer ${optStyle} ${
                                quizSubmitted ? 'opacity-90 pointer-events-none' : 'hover:-translate-y-0.5'
                              }`}
                            >
                              {/* Interactive Radio Button Appearance */}
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${indicatorStyle}`}>
                                {selectedOpt === optIdx && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <input 
                                type="radio" 
                                name={`question-${q.id}`} 
                                className="hidden"
                                checked={selectedOpt === optIdx}
                                onChange={() => handleAnswerSelect(q.id, optIdx)}
                                disabled={quizSubmitted}
                              />
                              <span className="flex-1">{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      {quizSubmitted && q.explanation && (
                        <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-[11px] text-slate-600 space-y-1 mt-3 animate-fadeIn">
                          <p className="font-extrabold text-[#0EA5E9] flex items-center space-x-1">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Explanation:</span>
                          </p>
                          <p className="leading-relaxed pl-4 border-l-2 border-[#E2E8F0] ml-1.5">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!quizSubmitted ? (
                  <button
                    id="embedded-quiz-submit-btn"
                    onClick={() => handleQuizSubmit(activeModule!.quiz!)}
                    disabled={Object.keys(quizAnswers).length < (activeModule.quiz?.questions?.length || 0)}
                    className="w-full py-3.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-extrabold text-xs shadow-lg shadow-[#0EA5E9]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    Submit Quiz Answers
                  </button>
                ) : (
                  <button
                    id="embedded-quiz-retake-btn"
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                      setQuizResult(null);
                    }}
                    className="w-full py-3.5 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm mt-4"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Assessment</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </main>

        {/* Right Pane: Course Outline Sidebar */}
        <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-[#E2E8F0] p-4 sm:p-5 overflow-y-auto shrink-0 space-y-4 shadow-sm z-10">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h3 className="text-sm font-extrabold text-[#0F172A]">Course Content Outline</h3>
            <p className="text-[10px] text-slate-500 font-medium">{safeModules.length} Modules • {completedLessons.length} Lessons Completed</p>
          </div>

          <div className="space-y-4">
            {safeModules.map((mod, modIdx) => (
              <div key={mod.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden space-y-1 p-2 shadow-sm">
                
                <div className="px-3 py-2 border-b border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0EA5E9]">
                    Module {modIdx + 1}: {mod.title}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  {(mod.lessons || []).map((les) => {
                    const isSelected = les.id === activeLessonId;
                    const isDone = completedLessons.includes(les.id);

                    return (
                      <button
                        key={les.id}
                        id={`select-lesson-btn-${les.id}`}
                        onClick={() => handleSelectLesson(les.id)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-50 text-[#0EA5E9] font-extrabold border border-cyan-200 shadow-sm'
                            : 'text-slate-700 hover:bg-white border border-transparent hover:border-[#E2E8F0]'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          {isDone ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{les.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0 ml-2">{les.duration}</span>
                      </button>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        </aside>

        {/* Floating AI Tutor Component */}
        <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50">
          {/* Drawer / Chat Window */}
          {isChatOpen && (
            <div className="absolute bottom-16 right-0 w-[340px] h-[450px] bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn mb-4">
              {/* Chat Header */}
              <div className="bg-[#0F172A] p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold">AI Course Tutor</h4>
                    <p className="text-[10px] text-slate-400">Context: {activeLesson?.title || 'Course'}</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={chatScrollRef}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl p-3 text-xs shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#0EA5E9] text-white rounded-br-none' 
                        : 'bg-white border border-[#E2E8F0] text-slate-700 rounded-bl-none'
                    }`}>
                      {msg.role === 'ai' && (
                        <div className="flex items-center space-x-1.5 mb-1 text-[10px] font-bold text-[#0EA5E9]">
                          <Bot className="w-3 h-3" />
                          <span>AI Tutor</span>
                        </div>
                      )}
                      {msg.role === 'user' && (
                        <div className="flex items-center justify-end space-x-1.5 mb-1 text-[10px] font-bold text-cyan-100">
                          <span>You</span>
                          <User className="w-3 h-3" />
                        </div>
                      )}
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl rounded-bl-none p-3 px-4 shadow-sm flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-[#0EA5E9] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#0EA5E9] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#0EA5E9] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#E2E8F0] shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about this lesson..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-full py-2.5 pl-4 pr-12 text-xs text-slate-700 focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-all"
                    disabled={isAiTyping}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isAiTyping}
                    className="absolute right-1.5 p-1.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Floating Toggle Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform transform hover:scale-105 cursor-pointer z-50 relative ${
              isChatOpen ? 'bg-[#0F172A] text-white' : 'bg-[#0EA5E9] text-white shadow-[#0EA5E9]/30'
            }`}
          >
            {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            
            {/* Notification Dot */}
            {!isChatOpen && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
