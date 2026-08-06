import React, { useState } from 'react';
import { Course } from '../../types';
import { InstructorTab } from './InstructorSidebar';
import { BookOpen, Sparkles, Eye, ToggleLeft, ToggleRight, Plus, Search, CheckCircle2, Edit3 } from 'lucide-react';

interface MyCoursesProps {
  courses: Course[];
  onSelectTab: (tab: InstructorTab) => void;
  onTogglePublishCourse: (courseId: string) => void;
  onEditCourse: (course: Course) => void;
}

export const MyCourses: React.FC<MyCoursesProps> = ({
  courses,
  onSelectTab,
  onTogglePublishCourse,
  onEditCourse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.toLowerCase();
    return c.title.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-[#0F172A]">Course Management Directory</h1>
          <p className="text-xs text-slate-500">Review all published programs and draft modules created by instructors.</p>
        </div>

        <button
          id="my-courses-create-ai-btn"
          onClick={() => onSelectTab('ai-creator')}
          className="px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-[#0EA5E9]/20 transition-all shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create New Course with AI</span>
        </button>
      </div>

      {/* Full width Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          id="my-courses-search-input"
          type="text"
          placeholder="Search courses by title, category, or topic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0EA5E9] font-medium shadow-sm transition-all"
        />
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
            <div>
              <div className="relative h-40 overflow-hidden">
                <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                  course.isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {course.isPublished ? 'Live Published' : 'Draft'}
                </span>
                <span className="absolute bottom-3 left-3 bg-white/95 text-[#0EA5E9] text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                  {course.category}
                </span>
              </div>

              <div className="p-5 space-y-2 cursor-pointer" onClick={() => onEditCourse(course)}>
                <h3 className="text-sm font-extrabold text-[#0F172A] line-clamp-2 hover:text-[#0EA5E9] transition-colors">{course.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{course.description}</p>
              </div>
            </div>

            <div className="p-5 pt-0 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-[#E2E8F0] pt-3 font-medium">
                <span>{course.modules.length} Modules</span>
                <span className="text-[#0EA5E9] font-bold">{course.enrolledStudentsCount} Enrolled</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id={`my-courses-edit-btn-${course.id}`}
                  onClick={() => onEditCourse(course)}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-[#0EA5E9]/10 hover:bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/30 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Course</span>
                </button>

                <button
                  id={`my-courses-toggle-btn-${course.id}`}
                  onClick={() => onTogglePublishCourse(course.id)}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#F1F5F9] text-slate-700 border border-[#E2E8F0] transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {course.isPublished ? (
                    <>
                      <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Unpublish</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-3.5 h-3.5 text-amber-600" />
                      <span>Publish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
