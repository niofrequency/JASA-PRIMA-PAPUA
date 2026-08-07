import React, { useState } from 'react';
import { Course, CourseModule, QuizQuestion, AICourseGenerationInput } from '../../types';
import { generateCourseWithAI, GeneratedCourseData } from '../../services/aiService';
import { Sparkles, Loader2, CheckCircle, Edit3, Trash2, Plus, Save, ArrowRight, Eye, BookOpen, HelpCircle, Check, AlertCircle, LayoutTemplate, FileText } from 'lucide-react';

interface AICourseCreatorProps {
  onPublishCourse: (course: Course) => void;
}
 
// Predefined mock SafetyCulture templates for quick selection
const SAFETY_CULTURE_TEMPLATES = [
  { id: 'custom', name: 'Paste Custom SafetyCulture Export (JSON/Text)...', content: '' },
  { id: 'sc-hazard', name: 'Standard Hazard ID (SafetyCulture)', content: 'SafetyCulture Template: Hazard Identification. Section 1: Site conditions. Section 2: Risk Assessment Matrix. Section 3: Hierarchy of Controls.' },
  { id: 'sc-prestart', name: 'Pre-Start Equipment Checklist (SafetyCulture)', content: 'SafetyCulture Template: Pre-Start Inspection. Steps: 1. Fluid Levels (Hydraulic, Oil, Coolant). 2. Visual Damage Inspection. 3. Brake & Steering Test.' },
];

export const AICourseCreator: React.FC<AICourseCreatorProps> = ({ onPublishCourse }) => {
  // Input State
  const [creationMode, setCreationMode] = useState<'scratch' | 'template'>('scratch');
  const [selectedTemplateId, setSelectedTemplateId] = useState('custom');
  const [templateContent, setTemplateContent] = useState('');
  
  const [subject, setSubject] = useState('Heavy Machinery Hydraulics & High-Pressure Valve Safety');
  const [targetAudience, setTargetAudience] = useState('Certified Heavy Equipment Operators');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [moduleCount, setModuleCount] = useState(3);
  const [papuaContext, setPapuaContext] = useState(true);

  // Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourseData | null>(null);

  // Editor Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'quizzes'>('overview');
  const [publishedSuccessMsg, setPublishedSuccessMsg] = useState(false);

  const generationSteps = [
    'Analyzing Context & Processing Source Data...',
    'Synthesizing Technical Lesson Modules & Field Protocols...',
    'Drafting In-Depth Reading Notes & Safety Guidelines...',
    'Formulating Multiple-Choice Quizzes & Answer Explanations...',
  ];

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    const tmpl = SAFETY_CULTURE_TEMPLATES.find(t => t.id === id);
    if (tmpl) {
      setTemplateContent(tmpl.content);
    }
  };

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    if (creationMode === 'template' && !templateContent.trim()) return;

    setIsGenerating(true);
    setGenerationStep(0);
    setGeneratedCourse(null);
    setPublishedSuccessMsg(false);

    // Animate progress steps for high visual feedback
    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < generationSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 900);

    // Extend the input object to include template data if applicable
    const input = {
      subject,
      targetAudience,
      difficulty,
      moduleCount,
      papuaContext,
      ...(creationMode === 'template' && { safetyCultureData: templateContent })
    } as AICourseGenerationInput & { safetyCultureData?: string };

    try {
      const courseData = await generateCourseWithAI(input);
      clearInterval(interval);
      setGenerationStep(generationSteps.length - 1);
      setTimeout(() => {
        setGeneratedCourse(courseData);
        setIsGenerating(false);
      }, 600);
    } catch (err) {
      console.error('AI generation error:', err);
      setIsGenerating(false);
    }
  };

  const handlePublish = () => {
    if (!generatedCourse) return;

    const newCourse: Course = {
      id: `course-ai-${Date.now()}`,
      title: generatedCourse.title,
      category: generatedCourse.category,
      description: generatedCourse.description,
      instructorName: 'Ir. Budi Santoso, M.T.',
      instructorRole: 'Head of Industrial Curriculum',
      thumbnailUrl: getThumbnailForCategory(generatedCourse.category),
      estimatedHours: generatedCourse.estimatedHours,
      prerequisites: generatedCourse.prerequisites,
      isPublished: true,
      createdAt: new Date().toISOString().split('T')[0],
      modules: generatedCourse.modules,
      tags: ['AI Generated', 'PT JPP Certified', generatedCourse.category],
      enrolledStudentsCount: 1,
      completionRatePercent: 0,
    };

    onPublishCourse(newCourse);
    setPublishedSuccessMsg(true);
  };

  const getThumbnailForCategory = (category: string) => {
    if (category.includes('Heavy') || category.includes('Mining')) {
      return 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800';
    }
    if (category.includes('Electrical')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800';
    }
    if (category.includes('Renewable') || category.includes('Solar')) {
      return 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&q=80&w=800';
    }
    return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800';
  };

  // Content edit handlers
  const handleUpdateCourseOverview = (field: keyof GeneratedCourseData, value: any) => {
    if (!generatedCourse) return;
    setGeneratedCourse({ ...generatedCourse, [field]: value });
  };

  const handleUpdateLessonContent = (modIdx: number, lesIdx: number, field: string, val: string) => {
    if (!generatedCourse) return;
    const updated = { ...generatedCourse };
    const lesson = updated.modules[modIdx].lessons[lesIdx] as any;
    lesson[field] = val;
    setGeneratedCourse(updated);
  };

  const handleUpdateQuizQuestion = (modIdx: number, qIdx: number, field: string, val: any) => {
    if (!generatedCourse || !generatedCourse.modules[modIdx].quiz) return;
    const updated = { ...generatedCourse };
    const q = updated.modules[modIdx].quiz!.questions[qIdx] as any;
    q[field] = val;
    setGeneratedCourse(updated);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      
      {/* Workspace Banner */}
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#0EA5E9] bg-cyan-50 border border-cyan-100 px-3 py-1 rounded-full">
            <Sparkles className="w-4 h-4 text-[#0EA5E9]"/>
            <span>Industrial Curriculum Generator Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">Automated Industrial Curriculum Generator</h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Specify a technical subject or feed an existing SafetyCulture template into the engine. The system will construct lesson modules, technical reading notes, and multiple-choice quizzes automatically.
          </p>
        </div>
      </div>

      {/* Input Workspace Card */}
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl space-y-6 shadow-sm">
        
        <div className="border-b border-[#E2E8F0] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-[#0F172A]">1. Course Generation Parameters</h2>
            <p className="text-xs text-slate-500">Configure topic parameters to generate custom curriculum.</p>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setCreationMode('scratch')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                creationMode === 'scratch' ? 'bg-white text-[#0EA5E9] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4"/>
              <span>From Scratch</span>
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('template')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                creationMode === 'template' ? 'bg-white text-[#0EA5E9] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutTemplate className="w-4 h-4"/>
              <span>SafetyCulture Import</span>
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleStartGeneration} className="space-y-5 pt-2">
          
          {creationMode === 'template' && (
            <div className="space-y-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] flex items-center space-x-1">
                  <FileText className="w-4 h-4 text-[#0EA5E9]"/>
                  <span>Select SafetyCulture Template Source</span>
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={handleTemplateSelect}
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0EA5E9] font-medium"
                >
                  {SAFETY_CULTURE_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A]">SafetyCulture Export Data (JSON/Text) *</label>
                <textarea
                  required
                  rows={4}
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="Paste your SafetyCulture template export data here..."
                  className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 font-mono"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0F172A]">Course Subject / Topic Title *</label>
            <input
              id="ai-creator-subject-input"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Caterpillar Excavator Valve Repair"
              className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Difficulty Level</label>
              <select
                id="ai-creator-difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0EA5E9] font-medium"
              >
                <option value="Beginner">Beginner Level</option>
                <option value="Intermediate">Intermediate Level</option>
                <option value="Advanced">Advanced Level</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Target Modules Count</label>
              <select
                id="ai-creator-modules-select"
                value={moduleCount}
                onChange={(e) => setModuleCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0EA5E9] font-medium"
              >
                <option value={2}>2 Modules</option>
                <option value={3}>3 Modules (Recommended)</option>
                <option value={4}>4 Modules</option>
                <option value={5}>5 Modules</option>
              </select>
            </div>

          </div>

          <button
            id="ai-creator-generate-btn"
            type="submit"
            disabled={isGenerating || (creationMode === 'template' && !templateContent.trim())}
            className="w-full py-3.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-extrabold text-sm shadow-lg shadow-[#0EA5E9]/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin"/>
                <span>Generating Course via Gemini Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5"/>
                <span>Generate Complete Course Outline & Quizzes</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Generation Loading Pipeline Modal / Section */}
      {isGenerating && (
        <div className="p-8 bg-white border border-[#0EA5E9] rounded-2xl space-y-6 text-center shadow-lg shadow-cyan-900/5">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-[#0EA5E9] flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 animate-spin"/>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-extrabold text-[#0F172A]">AI Course Generator Active</h3>
            <p className="text-xs text-[#0EA5E9] font-bold">{generationSteps[generationStep]}</p>
          </div>

          {/* Step Progress indicators */}
          <div className="max-w-md mx-auto grid grid-cols-4 gap-2 pt-2">
            {generationSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx <= generationStep ? 'bg-[#0EA5E9]' : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Generated Course Review & Edit Workspace */}
      {generatedCourse && !isGenerating && (
        <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl space-y-6 shadow-sm">
          
          {/* Header & Publish Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-[#0EA5E9] border border-cyan-100 text-[10px] font-extrabold uppercase">
                  Generated & Editable
                </span>
                <span className="text-xs text-slate-500">{generatedCourse.estimatedHours} • {generatedCourse.modules.length} Modules</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#0F172A] mt-1">{generatedCourse.title}</h2>
              <p className="text-xs text-slate-500">{generatedCourse.description}</p>
            </div>

            <button
              id="ai-creator-publish-btn"
              onClick={handlePublish}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4"/>
              <span>Publish Course to Student Portal</span>
            </button>
          </div>

          {publishedSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-800 text-xs font-semibold">
              <Check className="w-5 h-5 text-emerald-600"/>
              <span>Course successfully published to the PT. JASA PRIMA PAPUA Student Portal! Enrolled students can now view modules and take quizzes.</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex space-x-2 border-b border-[#E2E8F0] pb-1">
            <button
              id="tab-edit-overview"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              Course Details
            </button>
            <button
              id="tab-edit-modules"
              onClick={() => setActiveTab('modules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'modules'
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              Lesson Modules ({generatedCourse.modules.length})
            </button>
            <button
              id="tab-edit-quizzes"
              onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'quizzes'
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              Generated Quizzes
            </button>
          </div>

          {/* TAB 1: Course Overview Edit */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Title</label>
                <input
                  type="text"
                  value={generatedCourse.title}
                  onChange={(e) => handleUpdateCourseOverview('title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Description</label>
                <textarea
                  rows={3}
                  value={generatedCourse.description}
                  onChange={(e) => handleUpdateCourseOverview('description', e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Category</label>
                  <input
                    type="text"
                    value={generatedCourse.category}
                    onChange={(e) => handleUpdateCourseOverview('category', e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Estimated Duration</label>
                  <input
                    type="text"
                    value={generatedCourse.estimatedHours}
                    onChange={(e) => handleUpdateCourseOverview('estimatedHours', e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Modules & Lessons Review / Edit */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              {generatedCourse.modules.map((mod, modIdx) => (
                <div key={mod.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="text-xs font-extrabold text-[#0EA5E9]">{mod.title}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{mod.lessons.length} Lessons</span>
                  </div>

                  <p className="text-xs text-slate-600 italic">{mod.summary}</p>

                  <div className="space-y-3 pl-2">
                    {mod.lessons.map((les, lesIdx) => (
                      <div key={les.id} className="p-3 bg-white border border-[#E2E8F0] rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0F172A]">{les.title} ({les.duration})</span>
                          <span className="text-[10px] font-bold text-[#0EA5E9]">Lesson {modIdx + 1}.{lesIdx + 1}</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Lesson Guide Text:</label>
                          <textarea
                            rows={3}
                            value={les.content}
                            onChange={(e) => handleUpdateLessonContent(modIdx, lesIdx, 'content', e.target.value)}
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A]"
                          />
                        </div>

                        {les.readingMaterial && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Technical Reading Material & SOG Notes:</label>
                            <textarea
                              rows={2}
                              value={les.readingMaterial}
                              onChange={(e) => handleUpdateLessonContent(modIdx, lesIdx, 'readingMaterial', e.target.value)}
                              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-slate-700"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Quizzes Review / Edit */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6">
              {generatedCourse.modules.map((mod, modIdx) => (
                <div key={`quiz-mod-${mod.id}`} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
                  <h3 className="text-xs font-extrabold text-[#0EA5E9]">{mod.quiz?.title || `Module ${modIdx + 1} Assessment`}</h3>

                  {mod.quiz?.questions.map((q, qIdx) => (
                    <div key={q.id} className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Question {qIdx + 1}:</label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => handleUpdateQuizQuestion(modIdx, qIdx, 'question', e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${mod.id}-${q.id}`}
                              checked={q.correctIndex === optIdx}
                              onChange={() => handleUpdateQuizQuestion(modIdx, qIdx, 'correctIndex', optIdx)}
                              className="text-[#0EA5E9] focus:ring-[#0EA5E9]"
                            />
                            <span className="text-xs text-slate-700">{optIdx + 1}. {opt}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Explanation for Correct Answer:</label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => handleUpdateQuizQuestion(modIdx, qIdx, 'explanation', e.target.value)}
                          className="w-full px-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
