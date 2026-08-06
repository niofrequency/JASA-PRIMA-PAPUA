import React, { useEffect, useState } from 'react';
import { Course } from '../types';
import { fetchSafetyCultureCourses, fetchFullSafetyCultureCourse } from '../services/safetyCultureService';
import { generateCourseFromSafetyCulture, importSafetyCultureExport } from '../services/aiService';
import { ShieldCheck, Download, RefreshCw, AlertCircle, Loader2, Sparkles, ClipboardPaste, X } from 'lucide-react';

interface SafetyCultureLibraryProps {
  onImportCourse: (course: Course) => void;
}

export const SafetyCultureLibrary: React.FC<SafetyCultureLibraryProps> = ({ onImportCourse }) => {
  const [scCourses, setScCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track which course is currently being enhanced by Gemini
  const [importingId, setImportingId] = useState<string | null>(null);

  // Paste-a-real-export import (see lib/safetyculture/parseExport.ts) —
  // separate flow from the catalog cards above, since the catalog's "Get
  // courses" API doesn't return slide content (see client.ts notes).
  const [showPasteImport, setShowPasteImport] = useState(false);
  const [pasteJson, setPasteJson] = useState('');
  const [isPasteImporting, setIsPasteImporting] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

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

  const handlePasteImport = async () => {
    if (!pasteJson.trim() || isPasteImporting) return;
    setIsPasteImporting(true);
    setPasteError(null);

    try {
      const enhancedData = await importSafetyCultureExport(pasteJson);

      const newCourse: Course = {
        id: `course-sc-paste-${Date.now()}`,
        title: enhancedData.title,
        category: enhancedData.category,
        description: enhancedData.description,
        instructorName: 'SafetyCulture Certified',
        instructorRole: 'Global K3 Standards',
        thumbnailUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
        estimatedHours: enhancedData.estimatedHours,
        prerequisites: enhancedData.prerequisites,
        isPublished: true,
        createdAt: new Date().toISOString(),
        modules: enhancedData.modules,
        tags: ['SafetyCulture', 'AI Enhanced', 'Real Content'],
        enrolledStudentsCount: 0,
        completionRatePercent: 0,
      };

      onImportCourse(newCourse);
      setPasteJson('');
      setShowPasteImport(false);
    } catch (err: any) {
      setPasteError(err.message || 'Failed to parse or import that export.');
    } finally {
      setIsPasteImporting(false);
    }
  };

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
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowPasteImport((v) => !v)}
            className="px-3.5 py-2 text-[#0EA5E9] hover:text-[#0284C7] text-xs font-bold rounded-xl border border-cyan-200 hover:border-cyan-300 bg-cyan-50 flex items-center space-x-2 transition cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Import Real Export</span>
          </button>
          <button
            onClick={loadCatalog}
            disabled={isLoading || importingId !== null}
            className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 flex items-center space-x-2 transition cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {showPasteImport && (
        <div className="bg-white border border-cyan-200 rounded-2xl p-5 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Import a real SafetyCulture course</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                The catalog above only has course titles right now — SafetyCulture's public API doesn't return slide
                content yet. To import real content: open your course in SafetyCulture's editor, open DevTools, find
                the course-load request in the Network tab, copy its full Response, and paste it below.
              </p>
            </div>
            <button
              onClick={() => { setShowPasteImport(false); setPasteError(null); }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={pasteJson}
            onChange={(e) => setPasteJson(e.target.value)}
            placeholder="Paste the full course JSON response here"
            disabled={isPasteImporting}
            className="w-full h-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-800 focus:outline-none focus:border-[#0EA5E9] disabled:opacity-50 resize-y"
          />

          {pasteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{pasteError}</span>
            </div>
          )}

          <button
            onClick={handlePasteImport}
            disabled={!pasteJson.trim() || isPasteImporting}
            className="px-4 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-extrabold rounded-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPasteImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing & enhancing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Parse & Import</span>
              </>
            )}
          </button>
        </div>
      )}

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
