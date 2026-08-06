import React, { useState, useRef } from 'react';
import { Course, CourseModule, Lesson, Quiz, QuizQuestion } from '../../types';
import {
  X,
  Save,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  HelpCircle,
  Upload,
  Sparkles,
  Check,
  ImageIcon,
  Eye,
} from 'lucide-react';
import { compressImageToMaxKB, formatBytes } from '../../utils/imageCompressor';

interface CourseEditorModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCourse: Course) => void;
}

export const CourseEditorModal: React.FC<CourseEditorModalProps> = ({
  course,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !course) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'modules'>('info');

  // Basic Info Form State
  const [title, setTitle] = useState(course.title);
  const [category, setCategory] = useState(course.category);
  const [description, setDescription] = useState(course.description);
  const [estimatedHours, setEstimatedHours] = useState(course.estimatedHours);
  const [prerequisites, setPrerequisites] = useState(course.prerequisites);
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl);
  const [isPublished, setIsPublished] = useState(course.isPublished);

  // Modules & Lessons Form State
  const [modules, setModules] = useState<CourseModule[]>(course.modules || []);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(
    course.modules?.[0]?.id || null
  );

  // Image Upload State
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ orig: string; comp: string; qual: number } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Image upload handler with auto <= 500KB compression
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const result = await compressImageToMaxKB(file, 500);
      setThumbnailUrl(result.dataUrl);
      setCompressionInfo({
        orig: formatBytes(result.originalSizeBytes),
        comp: formatBytes(result.compressedSizeBytes),
        qual: result.qualityUsed,
      });
    } catch (err) {
      console.error('Failed to compress course thumbnail:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Module actions
  const handleAddModule = () => {
    const newModId = `mod-${Date.now()}`;
    const newModule: CourseModule = {
      id: newModId,
      title: `Module ${modules.length + 1}: New Industrial Topic`,
      summary: 'Brief overview of safety procedures and practical techniques.',
      lessons: [
        {
          id: `les-${Date.now()}-1`,
          title: 'Lesson 1: Introduction & Safety Checklist',
          duration: '20 mins',
          content: 'Detailed study notes regarding essential operational safety, personal protective equipment (PPE), and standard protocols.',
        },
      ],
      quiz: {
        id: `quiz-${Date.now()}`,
        title: `Module ${modules.length + 1} Assessment`,
        passingScorePercent: 80,
        questions: [
          {
            id: `q-${Date.now()}-1`,
            question: 'What is the primary safety protocol before starting inspection?',
            options: [
              'Perform visual inspection and lock-out tag-out',
              'Increase engine RPM immediately',
              'Bypass hydraulic pressure valve',
              'Skip personal protective equipment check',
            ],
            correctIndex: 0,
            explanation: 'Lock-out tag-out (LOTO) guarantees no unexpected power release occurs during inspection.',
          },
        ],
      },
    };

    setModules([...modules, newModule]);
    setExpandedModuleId(newModId);
  };

  const handleUpdateModuleTitle = (modId: string, newTitle: string) => {
    setModules(modules.map((m) => (m.id === modId ? { ...m, title: newTitle } : m)));
  };

  const handleUpdateModuleSummary = (modId: string, newSummary: string) => {
    setModules(modules.map((m) => (m.id === modId ? { ...m, summary: newSummary } : m)));
  };

  const handleDeleteModule = (modId: string) => {
    setModules(modules.filter((m) => m.id !== modId));
  };

  // Lesson actions
  const handleAddLesson = (modId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        const newLesson: Lesson = {
          id: `les-${Date.now()}`,
          title: `Lesson ${m.lessons.length + 1}: New Technical Topic`,
          duration: '15 mins',
          content: 'Add detailed operational guidelines, step-by-step procedures, and technical diagrams here.',
        };
        return { ...m, lessons: [...m.lessons, newLesson] };
      })
    );
  };

  const handleUpdateLesson = (modId: string, lessonId: string, field: keyof Lesson, value: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, [field]: value } : l)),
        };
      })
    );
  };

  const handleDeleteLesson = (modId: string, lessonId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) };
      })
    );
  };

  // Quiz Question actions
  const handleAddQuizQuestion = (modId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        const currentQuiz = m.quiz || {
          id: `quiz-${Date.now()}`,
          title: `${m.title} Assessment`,
          passingScorePercent: 80,
          questions: [],
        };
        const newQ: QuizQuestion = {
          id: `q-${Date.now()}`,
          question: 'New technical assessment question text...',
          options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
          correctIndex: 0,
          explanation: 'Explanation of why Option A is the correct industrial standard.',
        };
        return {
          ...m,
          quiz: { ...currentQuiz, questions: [...currentQuiz.questions, newQ] },
        };
      })
    );
  };

  const handleUpdateQuizQuestion = (
    modId: string,
    qId: string,
    field: keyof QuizQuestion,
    value: any
  ) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId || !m.quiz) return m;
        return {
          ...m,
          quiz: {
            ...m.quiz,
            questions: m.quiz.questions.map((q) => (q.id === qId ? { ...q, [field]: value } : q)),
          },
        };
      })
    );
  };

  const handleUpdateQuestionOption = (
    modId: string,
    qId: string,
    optIdx: number,
    optVal: string
  ) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId || !m.quiz) return m;
        return {
          ...m,
          quiz: {
            ...m.quiz,
            questions: m.quiz.questions.map((q) => {
              if (q.id !== qId) return q;
              const newOpts = [...q.options];
              newOpts[optIdx] = optVal;
              return { ...q, options: newOpts };
            }),
          },
        };
      })
    );
  };

  const handleDeleteQuizQuestion = (modId: string, qId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId || !m.quiz) return m;
        return {
          ...m,
          quiz: {
            ...m.quiz,
            questions: m.quiz.questions.filter((q) => q.id !== qId),
          },
        };
      })
    );
  };

  // Submit course update
  const handleSaveCourse = () => {
    const updatedCourse: Course = {
      ...course,
      title,
      category,
      description,
      estimatedHours,
      prerequisites,
      thumbnailUrl,
      isPublished,
      modules,
    };

    onSave(updatedCourse);
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0F172A]">Edit Course Curriculum</h2>
              <p className="text-xs text-slate-500 truncate max-w-md">{course.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher Bar */}
        <div className="px-6 pt-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer border-b-2 ${
                activeTab === 'info'
                  ? 'border-[#0EA5E9] text-[#0EA5E9] bg-cyan-50/50'
                  : 'border-transparent text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              1. General Course Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'modules'
                  ? 'border-[#0EA5E9] text-[#0EA5E9] bg-cyan-50/50'
                  : 'border-transparent text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              <span>2. Modules & Lessons ({modules.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-slate-300 text-[#0EA5E9] focus:ring-[#0EA5E9]"
              />
              <span>{isPublished ? 'Live Published' : 'Draft Mode'}</span>
            </label>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Course updated successfully! Closing editor...</span>
            </div>
          )}

          {/* TAB 1: General Info */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              
              {/* Course Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Course Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0EA5E9] font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0EA5E9] font-medium"
                  >
                    <option value="Heavy Equipment Operations">Heavy Equipment Operations</option>
                    <option value="Electrical & Power Systems">Electrical & Power Systems</option>
                    <option value="Renewable Energy">Renewable Energy</option>
                    <option value="Mining & Industrial Safety">Mining & Industrial Safety</option>
                    <option value="Industrial Operations">Industrial Operations</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Course Description *</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0EA5E9] font-medium leading-relaxed"
                />
              </div>

              {/* Hours & Prerequisites */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Estimated Duration</label>
                  <input
                    type="text"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="e.g. 12 Hours (3 Modules)"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0EA5E9] font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Prerequisites</label>
                  <input
                    type="text"
                    value={prerequisites}
                    onChange={(e) => setPrerequisites(e.target.value)}
                    placeholder="e.g. Basic Safety Certification"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0EA5E9] font-medium"
                  />
                </div>
              </div>

              {/* Thumbnail Image Picker with Auto 500KB Compression */}
              <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl space-y-3">
                <label className="text-xs font-extrabold text-[#0F172A] flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-[#0EA5E9]" />
                  <span>Course Banner / Thumbnail Image</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <img
                    src={thumbnailUrl}
                    alt="Course Preview"
                    className="w-32 h-20 rounded-xl object-cover ring-2 ring-[#0EA5E9]/30 shrink-0 shadow-sm"
                  />

                  <div className="space-y-2 flex-1 w-full">
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        disabled={isCompressing}
                        className="px-3.5 py-2 bg-white border border-[#CBD5E1] hover:border-[#0EA5E9] text-slate-700 hover:text-[#0EA5E9] font-bold text-xs rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#0EA5E9]" />
                        <span>{isCompressing ? 'Compressing Image...' : 'Upload Image (Auto < 500KB)'}</span>
                      </button>

                      <input
                        type="text"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        placeholder="Or paste image URL"
                        className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A]"
                      />
                    </div>

                    {compressionInfo && (
                      <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 w-fit">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Compressed thumbnail: {compressionInfo.orig} &rarr; <strong>{compressionInfo.comp}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Modules & Lessons */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A]">Course Curriculum Breakdown</h3>
                  <p className="text-xs text-slate-500">Add, edit or delete modules, lessons, reading notes, and quiz assessments.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddModule}
                  className="px-3.5 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Module</span>
                </button>
              </div>

              {/* List of Modules */}
              <div className="space-y-4">
                {modules.map((mod, modIdx) => {
                  const isExpanded = expandedModuleId === mod.id;

                  return (
                    <div key={mod.id} className="border border-[#CBD5E1] rounded-2xl bg-white overflow-hidden shadow-sm">
                      
                      {/* Module Header Bar */}
                      <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                          className="flex items-center space-x-3 text-left flex-1 cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-lg bg-[#0EA5E9] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                            M{modIdx + 1}
                          </span>
                          <div className="flex-1">
                            <h4 className="text-xs font-extrabold text-[#0F172A] line-clamp-1">{mod.title}</h4>
                            <p className="text-[10px] text-slate-500">{mod.lessons.length} Lessons • {mod.quiz ? `${mod.quiz.questions.length} Quiz Questions` : 'No Quiz'}</p>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteModule(mod.id)}
                          title="Delete Module"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Module Expanded Details */}
                      {isExpanded && (
                        <div className="p-5 space-y-6">
                          
                          {/* Module Title & Summary */}
                          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700">Module Title</label>
                              <input
                                type="text"
                                value={mod.title}
                                onChange={(e) => handleUpdateModuleTitle(mod.id, e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A]"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-700">Module Summary</label>
                              <input
                                type="text"
                                value={mod.summary}
                                onChange={(e) => handleUpdateModuleSummary(mod.id, e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A]"
                              />
                            </div>
                          </div>

                          {/* Lessons Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-extrabold text-[#0F172A] flex items-center space-x-1.5">
                                <FileText className="w-4 h-4 text-[#0EA5E9]" />
                                <span>Lessons ({mod.lessons.length})</span>
                              </h5>

                              <button
                                type="button"
                                onClick={() => handleAddLesson(mod.id)}
                                className="text-xs font-bold text-[#0EA5E9] hover:text-[#0284C7] flex items-center space-x-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Lesson</span>
                              </button>
                            </div>

                            <div className="space-y-3">
                              {mod.lessons.map((les, lesIdx) => (
                                <div key={les.id} className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-2 shadow-xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2 flex-1">
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md shrink-0">
                                        Lesson {lesIdx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={les.title}
                                        onChange={(e) => handleUpdateLesson(mod.id, les.id, 'title', e.target.value)}
                                        className="flex-1 px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#0F172A]"
                                      />
                                    </div>

                                    <input
                                      type="text"
                                      value={les.duration}
                                      onChange={(e) => handleUpdateLesson(mod.id, les.id, 'duration', e.target.value)}
                                      placeholder="Duration"
                                      className="w-24 px-2 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-medium text-slate-700"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLesson(mod.id, les.id)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div>
                                    <textarea
                                      rows={3}
                                      value={les.content}
                                      onChange={(e) => handleUpdateLesson(mod.id, les.id, 'content', e.target.value)}
                                      placeholder="Lesson study notes and content..."
                                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A]"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quiz Questions Section */}
                          <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-extrabold text-[#0F172A] flex items-center space-x-1.5">
                                <HelpCircle className="w-4 h-4 text-purple-600" />
                                <span>Quiz Questions ({mod.quiz?.questions.length || 0})</span>
                              </h5>

                              <button
                                type="button"
                                onClick={() => handleAddQuizQuestion(mod.id)}
                                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center space-x-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Quiz Question</span>
                              </button>
                            </div>

                            <div className="space-y-4">
                              {mod.quiz?.questions.map((q, qIdx) => (
                                <div key={q.id} className="p-3.5 bg-purple-50/40 border border-purple-200/80 rounded-xl space-y-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md shrink-0">
                                      Q{qIdx + 1}
                                    </span>

                                    <input
                                      type="text"
                                      value={q.question}
                                      onChange={(e) => handleUpdateQuizQuestion(mod.id, q.id, 'question', e.target.value)}
                                      className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-[#0F172A]"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQuizQuestion(mod.id, q.id)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Options */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {q.options.map((opt, optIdx) => (
                                      <div key={optIdx} className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          name={`q-correct-${q.id}`}
                                          checked={q.correctIndex === optIdx}
                                          onChange={() => handleUpdateQuizQuestion(mod.id, q.id, 'correctIndex', optIdx)}
                                          className="text-purple-600 focus:ring-purple-500"
                                          title="Mark as correct option"
                                        />
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => handleUpdateQuestionOption(mod.id, q.id, optIdx, e.target.value)}
                                          className={`flex-1 px-2.5 py-1 bg-white border rounded-lg text-xs ${
                                            q.correctIndex === optIdx ? 'border-emerald-500 font-bold text-emerald-900 bg-emerald-50/50' : 'border-slate-200 text-slate-700'
                                          }`}
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  {/* Explanation */}
                                  <div>
                                    <input
                                      type="text"
                                      value={q.explanation}
                                      onChange={(e) => handleUpdateQuizQuestion(mod.id, q.id, 'explanation', e.target.value)}
                                      placeholder="Explanation for correct answer..."
                                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E8F0] font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveCourse}
            className="px-6 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-extrabold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-[#0EA5E9]/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Course Changes</span>
          </button>
        </div>

      </div>
    </div>
  );
};
