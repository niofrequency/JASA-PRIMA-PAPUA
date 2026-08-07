import React from 'react';
import { Course, StudentCourseProgress, Certificate } from '../../types';
import { StudentTab } from './StudentSidebar';
import { PlayCircle, BookOpen, Award, CheckCircle2, Clock, ArrowRight, Sparkles, Bell, Calendar, ChevronRight } from 'lucide-react';

interface StudentDashboardProps {
  enrolledCourses: Course[];
  studentProgress: Record<string, StudentCourseProgress>;
  certificates: Certificate[];
  onSelectTab: (tab: StudentTab) => void;
  onOpenCourseViewer: (course: Course, lessonId?: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  enrolledCourses,
  studentProgress,
  certificates,
  onSelectTab,
  onOpenCourseViewer,
}) => {
  // Find primary active course to resume
  const activeCourse = enrolledCourses[0] || null;
  const activeProg = activeCourse ? studentProgress[activeCourse.id] : null;
  const activeLesson = activeCourse?.modules[0]?.lessons[0] || null;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#0EA5E9] bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PT. JASA PRIMA PAPUA • Student Learning Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">Welcome Back, Workforce Trainee!</h1>
          <p className="text-xs text-slate-500 font-medium">
            Track your ongoing vocational modules, attempt quizzes, and download ESDM-compliant digital certificates.
          </p>
        </div>

        {certificates.length > 0 && (
          <button
            id="dash-view-certificates-btn"
            onClick={() => onSelectTab('certificates')}
            className="px-4 py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100/80 text-[#0EA5E9] border border-cyan-200 font-bold text-xs flex items-center space-x-2 transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <Award className="w-4 h-4 text-[#0EA5E9]" />
            <span>{certificates.length} Certificate Earned</span>
          </button>
        )}
      </div>

      {/* "Resume Learning" Highlight Widget */}
      {activeCourse && (
        <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[#0EA5E9] flex items-center space-x-1.5">
              <PlayCircle className="w-4 h-4 animate-pulse" />
              <span>Continue Learning • Resume Active Course</span>
            </span>
            <span className="text-slate-500 font-semibold">Last accessed recently</span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
            <div className="flex items-center space-x-4">
              <img
                src={activeCourse.thumbnailUrl}
                alt=""
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-[#0EA5E9]/30 shrink-0"
              />
              <div>
                <span className="text-[10px] font-bold text-[#0EA5E9] bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-lg">
                  {activeCourse.category}
                </span>
                <h3 className="text-base font-extrabold text-[#0F172A] mt-1 line-clamp-1">{activeCourse.title}</h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">
                  Current Lesson: {activeLesson ? activeLesson.title : 'Module 1 Overview'}
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <div className="w-full md:w-40 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>Progress</span>
                  <span className="text-[#0EA5E9]">{activeProg?.overallPercent || 65}%</span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0EA5E9]"
                    style={{ width: `${activeProg?.overallPercent || 65}%` }}
                  />
                </div>
              </div>

              <button
                id="resume-learning-btn"
                onClick={() => onOpenCourseViewer(activeCourse, activeLesson?.id)}
                className="px-6 py-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-extrabold text-xs shadow-lg shadow-[#0EA5E9]/20 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Resume Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Courses Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F172A]">Enrolled Vocational Programs</h2>
            <p className="text-xs text-slate-500 font-medium">Track module completion and quiz readiness across your courses.</p>
          </div>
          <button
            id="dash-view-enrolled-courses-btn"
            onClick={() => onSelectTab('courses')}
            className="text-xs font-bold text-[#0EA5E9] hover:text-[#0284C7] flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Enrolled ({enrolledCourses.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => {
            const prog = studentProgress[course.id];
            const percent = prog?.overallPercent || 0;
            return (
              <div key={course.id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden p-5 space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-[#0EA5E9] bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                      {course.category}
                    </span>
                    <span className="text-slate-500 text-[11px] font-semibold">{course.estimatedHours}</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-[#0F172A] line-clamp-2">{course.title}</h3>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>Course Progress</span>
                      <span className="font-bold text-[#0EA5E9]">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0EA5E9]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  id={`open-course-viewer-btn-${course.id}`}
                  onClick={() => onOpenCourseViewer(course)}
                  className="w-full py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0EA5E9] font-bold text-xs border border-[#E2E8F0] transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Launch Course Viewer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Noticeboard & Upcoming Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Noticeboard */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-[#0F172A]">
            <Bell className="w-4 h-4 text-[#0EA5E9]" />
            <h3 className="text-sm font-extrabold">PT. JASA PRIMA PAPUA Training Center Announcements</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold text-[#0EA5E9]">ESDM Mine Safety Directive</span>
              <p className="text-xs font-bold text-[#0F172A]">Mandatory Module 1 Inspection Checklist Updated</p>
              <p className="text-[11px] text-slate-500 font-medium">All heavy machinery trainees must complete Module 1 quiz prior to August 15 field practicals.</p>
            </div>
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[10px] font-extrabold text-[#0EA5E9]">Jayapura Training Lab Notice</span>
              <p className="text-xs font-bold text-[#0F172A]">High-Voltage Substation Simulator Lab Schedule</p>
              <p className="text-[11px] text-slate-500 font-medium">Simulations open weekdays 08:00 - 16:00 WIT. Bring certified PPE gloves.</p>
            </div>
          </div>
        </div>

        {/* Quizzes Overview */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#0F172A]">
              <Clock className="w-4 h-4 text-[#0EA5E9]" />
              <h3 className="text-sm font-extrabold">Pending Assessments</h3>
            </div>
            <button
              id="dash-go-to-quizzes-btn"
              onClick={() => onSelectTab('quizzes')}
              className="text-xs font-bold text-[#0EA5E9] hover:text-[#0284C7] cursor-pointer"
            >
              Take Quizzes →
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#0F172A]">Module 1 Safety Certification Quiz</p>
                <p className="text-[10px] text-slate-500 font-medium">Heavy Machinery Operations</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                Passed (100%)
              </span>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#0F172A]">Module 1 LOTO & High-Voltage Quiz</p>
                <p className="text-[10px] text-slate-500 font-medium">Industrial Electrical Systems</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                Passed (100%)
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
