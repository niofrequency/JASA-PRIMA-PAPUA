import React, { useEffect, useState } from 'react';
import { Course } from '../types';
import { fetchSafetyCultureCourses, fetchFullSafetyCultureCourse } from '../services/safetyCultureService';
import { generateCourseFromSafetyCulture } from '../services/aiService';
import { ShieldCheck, Download, RefreshCw, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface SafetyCultureLibraryProps {
  onImportCourse: (course: Course) => void;
}

export const SafetyCultureLibrary: React.FC<SafetyCultureLibraryProps> = ({ onImportCourse }) => {
  const [scCourses, setScCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track which course is currently being enhanced by Gemini
  const [importingId, setImportingId] = useState<string | null>(null);

  const loadCatalog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const courses = await fetchSafetyCultureCourses();
      setScCourses(courses);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to SafetyCulture API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleEnhanceAndImport = async (baseCourse: Course) => {
    if (importingId) return; // Prevent multiple simultaneous imports
    setImportingId(baseCourse.id);
    
    try {
      // 1. Fetch the deep raw data (lessons & slides) from SafetyCulture
      const scRawData = await fetchFullSafetyCultureCourse(baseCourse.id);
      
      // 2. Pass the raw data through Gemini AI for formatting, summaries, and quizzes
      const enhancedData = await generateCourseFromSafetyCulture(scRawData);
      
      // 3. Merge the AI-generated content with the base course metadata
      const enhancedCourse: Course = {
        ...baseCourse,
        id: `course-sc-ai-${Date.now()}`, // Generate a fresh unique ID for the platform
        title: enhancedData.title || baseCourse.title,
        description: enhancedData.description || baseCourse.description,
        estimatedHours: enhancedData.estimatedHours || baseCourse.estimatedHours,
        prerequisites: enhancedData.prerequisites || baseCourse.prerequisites,
        category: enhancedData.category || baseCourse.category,
        modules: enhancedData.modules,
        tags: [...(baseCourse.tags || []), 'SafetyCulture', 'AI Enhanced'],
      };

      // 4. Pass back to parent to save to Firestore / Review
      onImportCourse(enhancedCourse);
      
    } catch (err) {
      console.error('Failed to enhance SafetyCulture course via Gemini:', err);
      alert('Error fetching or enhancing course data. Please check your connection and try again.');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-cyan-50 text-[#0EA5E9] ring-1 ring-cyan-100 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight truncate">SafetyCulture Certified Library</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Global K3 templates — import auto-enhances content &amp; generates quizzes via Gemini.
            </p>
          </div>
        </div>
        <button
          onClick={loadCatalog}
          disabled={isLoading || importingId !== null}
          className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 flex items-center space-x-2 transition cursor-pointer disabled:opacity-40 flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 shadow-sm">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#0EA5E9] mb-3" />
          <p className="text-xs font-bold">Loading SafetyCulture catalog...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center space-x-3 text-xs font-bold shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="relative">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>
                  <div className="absolute bottom-3 left-3 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Ready</span>
                  </div>
                </div>
                
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-cyan-50 text-[#0EA5E9] rounded-md border border-cyan-200">
                      {course.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {course.estimatedHours}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => handleEnhanceAndImport(course)}
                  disabled={importingId !== null}
                  className={`w-full py-2.5 text-white text-xs font-extrabold rounded-xl flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer ${
                    importingId === course.id 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-[#0EA5E9] hover:bg-[#0284C7]'
                  }`}
                >
                  {importingId === course.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enhancing w/ Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Enhance & Import</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
