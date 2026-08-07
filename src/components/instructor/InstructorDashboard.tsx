import React from 'react';
import { Course, StudentAnalyticsItem } from '../../types';
import { InstructorTab } from './InstructorSidebar';
import { BookOpen, Users, Award, Sparkles, Plus, CheckCircle2, AlertCircle, ArrowUpRight, ArrowRight, Eye, ToggleLeft, ToggleRight, Edit3, Trash2, UserCircle2 } from 'lucide-react';

interface InstructorDashboardProps {
  courses: Course[];
  studentAnalytics: StudentAnalyticsItem[];
  onSelectTab: (tab: InstructorTab) => void;
  onTogglePublishCourse: (courseId: string) => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  isAdminView: boolean;
  getInstructorName: (instructorId?: string) => string;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  courses,
  studentAnalytics,
  onSelectTab,
  onTogglePublishCourse,
  onEditCourse,
  onDeleteCourse,
  isAdminView,
  getInstructorName,
}) => {
  const handleDeleteClick = (course: Course) => {
    const confirmed = window.confirm(
      `Delete "${course.title}" permanently? This cannot be undone — all modules, lessons, and quizzes in this course will be removed.`
    );
    if (confirmed) onDeleteCourse(course.id);
  };
  const totalCourses = courses.length;
  const publishedCoursesCount = courses.filter((c) => c.isPublished).length;
  const totalEnrolledStudents = courses.reduce((sum, c) => sum + c.enrolledStudentsCount, 0);
  const avgCompletionRate = Math.round(
    courses.reduce((sum, c) => sum + c.completionRatePercent, 0) / (totalCourses || 1)
  );

  return (
    <div className="space-y-8 animate-fadeIn w-full">
      
      {/* Top Welcome Banner */}
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#0EA5E9] bg-cyan-50 border border-cyan-100 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PT. JASA PRIMA PAPUA • Instructor Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">Course Management & AI Curriculum Hub</h1>
          <p className="text-xs text-slate-500">
            Monitor Papuan workforce student progress, review active modules, and generate custom course outlines with Gemini AI.
          </p>
        </div>

        <button
          id="dash-launch-ai-creator-btn"
          onClick={() => onSelectTab('ai-creator')}
          className="px-5 py-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-xs shadow-lg shadow-[#0EA5E9]/20 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch AI Course Creator</span>
        </button>
      </div>

      {/* Overview Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Active & Draft Courses</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-[#0EA5E9]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-[#0F172A]">{totalCourses}</p>
            <span className="text-[11px] font-medium text-[#0EA5E9] bg-cyan-50 px-2 py-0.5 rounded-md">{publishedCoursesCount} Published</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Enrolled Workforce Students</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-[#0F172A]">{totalEnrolledStudents}</p>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Active Learning</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Avg Course Completion Rate</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-[#0EA5E9]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-[#0F172A]">{avgCompletionRate}%</p>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">ESDM Certified</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">AI Generated Modules</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-[#0F172A]">18</p>
            <span className="text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Automated Quizzes</span>
          </div>
        </div>

      </div>

      {/* Course List & Management Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Course Directory & Publishing Status</h3>
            <p className="text-xs text-slate-500">Manage published workforce modules and draft AI courses.</p>
          </div>
          <button
            id="dash-manage-all-courses-btn"
            onClick={() => onSelectTab('courses')}
            className="text-xs font-bold text-[#0EA5E9] hover:text-[#0284C7] flex items-center space-x-1 cursor-pointer"
          >
            <span>Manage All Courses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0F172A]">
            <thead className="bg-[#F8FAFC] text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3.5 px-5">Course Title</th>
                <th className="py-3.5 px-5">Category</th>
                {isAdminView && <th className="py-3.5 px-5">Instructor</th>}
                <th className="py-3.5 px-5">Modules</th>
                <th className="py-3.5 px-5">Enrolled</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={course.thumbnailUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#E2E8F0]"
                      />
                      <div>
                        <p className="font-bold text-[#0F172A] text-xs line-clamp-1">{course.title}</p>
                        <p className="text-[10px] text-slate-500">{course.estimatedHours} • {course.prerequisites}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-slate-700 text-[10px] font-bold">
                      {course.category}
                    </span>
                  </td>
                  {isAdminView && (
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                        <UserCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        {getInstructorName(course.instructorId)}
                      </span>
                    </td>
                  )}
                  <td className="py-4 px-5 font-bold text-[#0F172A]">
                    {course.modules.length} Modules
                  </td>
                  <td className="py-4 px-5 font-bold text-[#0EA5E9]">
                    {course.enrolledStudentsCount} Students
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        course.isPublished
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft / Private'}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-2 flex-nowrap">
                      <button
                        id={`edit-course-btn-${course.id}`}
                        onClick={() => onEditCourse(course)}
                        title="Edit Course"
                        className="p-2 rounded-xl bg-[#0EA5E9]/10 hover:bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/30 transition-colors inline-flex items-center cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        id={`toggle-publish-btn-${course.id}`}
                        onClick={() => onTogglePublishCourse(course.id)}
                        title={course.isPublished ? 'Unpublish' : 'Publish Live'}
                        className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-slate-700 border border-[#E2E8F0] transition-colors inline-flex items-center cursor-pointer"
                      >
                        {course.isPublished ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-amber-600" />
                        )}
                      </button>

                      <button
                        id={`delete-course-btn-${course.id}`}
                        onClick={() => handleDeleteClick(course)}
                        title="Delete Course"
                        className="p-2 rounded-xl text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 transition-colors inline-flex items-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Activity Feed */}
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Recent Student Progress Activity</h3>
            <p className="text-xs text-slate-500">Live feed of student quiz completions and course status updates.</p>
          </div>
          <button
            id="dash-view-analytics-btn"
            onClick={() => onSelectTab('analytics')}
            className="text-xs font-bold text-[#0EA5E9] hover:text-[#0284C7] cursor-pointer"
          >
            View Full Analytics →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {studentAnalytics.slice(0, 4).map((item) => (
            <div key={item.id} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#0F172A]">{item.studentName}</p>
                <p className="text-[10px] text-slate-500 truncate max-w-[220px]">{item.courseTitle}</p>
                <div className="flex items-center space-x-2 pt-1 text-[10px]">
                  <span className="text-slate-500">Score: {item.averageQuizScore}%</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#0EA5E9] font-semibold">{item.lastActive}</span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  item.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : item.status === 'At Risk'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-cyan-50 text-[#0EA5E9] border border-cyan-200'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
