import React from 'react';
import { Course, StudentCourseProgress } from '../../types';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';

interface EnrolledCoursesProps {
  enrolledCourses: Course[];
  studentProgress: Record<string, StudentCourseProgress>;
  onOpenCourseViewer: (course: Course) => void;
}

export const EnrolledCourses: React.FC<EnrolledCoursesProps> = ({
  enrolledCourses,
  studentProgress,
  onOpenCourseViewer,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <h1 className="text-xl font-extrabold text-[#0F172A]">My Enrolled Vocational Programs</h1>
        <p className="text-xs text-slate-500 mt-1">Access interactive lessons, technical reading guides, and module quizzes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map((course) => {
          const prog = studentProgress[course.id];
          const percent = prog?.overallPercent || 0;

          return (
            <div key={course.id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden p-5 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="relative h-40 rounded-xl overflow-hidden">
                  <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 bg-white/95 text-[#0EA5E9] text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                    {course.category}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-[#0F172A] line-clamp-2">{course.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>Progress</span>
                    <span className="text-[#0EA5E9]">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0EA5E9]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                id={`enrolled-courses-open-btn-${course.id}`}
                onClick={() => onOpenCourseViewer(course)}
                className="w-full py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-extrabold text-xs shadow-lg shadow-[#0EA5E9]/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Launch Course Viewer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};
