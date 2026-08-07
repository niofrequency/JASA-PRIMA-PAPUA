import React from 'react';
import { UserRole, Course, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, GraduationCap, Award, ArrowRight, HardHat, CheckCircle2, Cpu } from 'lucide-react';

interface LandingPageProps {
  courses: Course[];
  currentUser?: User | null;
  onOpenLoginModal: (role: UserRole) => void;
  onSelectCoursePreview: (course: Course) => void;
  onGoToDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  courses,
  currentUser,
  onOpenLoginModal,
  onSelectCoursePreview,
  onGoToDashboard,
}) => {
  const { t } = useLanguage();

  const handlePortalAccess = (role: UserRole) => {
    if (currentUser) {
      onGoToDashboard?.();
    } else {
      onOpenLoginModal(role);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-[#0EA5E9] selection:text-white">
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-[#E2E8F0] bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-50/60 via-white to-white pointer-events-none" />
        
        <div className="relative w-full px-6 sm:px-10 lg:px-12 text-center space-y-8">
          
          {/* Title & Circular Logo */}
          <div className="space-y-4 max-w-6xl mx-auto flex flex-col items-center">
            <img 
              src="/img/jpp-logo.png" 
              alt="PT. JASA PRIMA PAPUA Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full shadow-lg border-2 border-slate-100 mb-2 hover:scale-105 transition-transform"
            />
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0F172A] leading-tight font-heading">
              {t('landing.title', 'PT. JASA PRIMA PAPUA')}
            </h1>
            <p className="text-lg sm:text-2xl font-semibold text-slate-600 max-w-5xl mx-auto leading-relaxed">
              {t('landing.subtitle', 'Empowering Papua’s Technical Workforce with World-Class Vocational Operations, Industry Standards, and Advanced Technical Training.')}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              id="hero-instructor-portal-btn"
              onClick={() => handlePortalAccess('instructor')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-[#0EA5E9]/20 flex items-center justify-center space-x-3 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{t('landing.instructorLogin', 'Instructor Portal Login')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-student-portal-btn"
              onClick={() => handlePortalAccess('student')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] font-extrabold text-sm sm:text-base transition-all shadow-sm flex items-center justify-center space-x-3 hover:border-[#0EA5E9] cursor-pointer"
            >
              <GraduationCap className="w-5 h-5 text-[#0EA5E9]" />
              <span>{t('landing.studentPortal', 'Student Learning Portal')}</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl text-center space-y-1 shadow-sm">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#0EA5E9] font-heading">1,200+</p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">{t('landing.stat1', 'Certified Papuan Specialists')}</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl text-center space-y-1 shadow-sm">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#0EA5E9] font-heading">50+</p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">{t('landing.stat2', 'Active Industrial Programs')}</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl text-center space-y-1 shadow-sm">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#0EA5E9] font-heading">98%</p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">{t('landing.stat3', 'ESDM Safety Pass Rate')}</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl text-center space-y-1 shadow-sm">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#0EA5E9] font-heading">100%</p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">{t('landing.stat4', 'ISO Recognized Certification')}</p>
            </div>
          </div>

        </div>
      </section>

      {/* Training Programs Overview Section */}
      <section className="py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="w-full px-6 sm:px-10 lg:px-12 space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9] bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full">
                {t('landing.coreCompetencies', 'Core Competencies')}
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-[#0F172A] mt-3">
                {t('landing.featuredTitle', 'Featured Industrial Training Programs')}
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-4xl font-medium">
                {t('landing.featuredDesc', 'Rigorous vocational courses engineered for Papua’s heavy machinery, mining, electrical maintenance, and renewable energy sectors.')}
              </p>
            </div>
            <button
              id="landing-view-all-courses-btn"
              onClick={() => handlePortalAccess('student')}
              className="inline-flex items-center space-x-2 text-xs font-extrabold text-[#0EA5E9] hover:text-[#0284C7] cursor-pointer shrink-0"
            >
              <span>{t('landing.exploreCourses', 'Explore All Enrolled Courses')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Program Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.slice(0, 4).map((course, index) => {
              const courseTitle = t(`course.${index + 1}.title`, course.title);
              const courseDesc = t(`course.${index + 1}.description`, course.description);

              return (
                <div
                  key={course.id}
                  className="group bg-white border border-[#E2E8F0] hover:border-[#0EA5E9]/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img
                        src={course.thumbnailUrl}
                        alt={courseTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; 
                          target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-[#0EA5E9] border border-[#E2E8F0] text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm z-10">
                        {course.category}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="text-base font-extrabold font-heading text-[#0F172A] group-hover:text-[#0EA5E9] transition-colors line-clamp-2 leading-snug">
                        {courseTitle}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">
                        {courseDesc}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 space-y-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-[#E2E8F0] pt-3 font-medium">
                      <span className="font-bold text-slate-700">{course.estimatedHours}</span>
                      <span className="text-[#0EA5E9] font-bold">{course.modules.length} {t('landing.modules', 'Modules')}</span>
                    </div>

                    <button
                      id={`preview-course-btn-${course.id}`}
                      onClick={() => {
                        if (currentUser) {
                          onSelectCoursePreview(course);
                        } else {
                          onOpenLoginModal('student');
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0EA5E9] font-extrabold text-xs border border-[#E2E8F0] transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>{t('landing.viewCourseDetails', 'View Portal Course Details')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Modern Learning Infrastructure Section */}
      <section className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="w-full px-6 sm:px-10 lg:px-12 space-y-12">
          
          <div className="text-center max-w-5xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-[#0F172A]">
              {t('landing.modernInfra', 'Modern Vocational Infrastructure')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              {t('landing.modernInfraDesc', 'Combining hands-on heavy equipment simulation with automated curriculum generation to accelerate Papua’s workforce development.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-8 rounded-2xl space-y-4 hover:border-[#0EA5E9]/40 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 text-[#0EA5E9] flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold font-heading text-[#0F172A]">{t('landing.feature1Title', 'Course Creator Workspace')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t('landing.feature1Desc', 'Instructors input site subjects, target experience levels, and Papua regional safety rules to generate lesson guides, reading notes, and quizzes.')}
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-semibold pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />
                  <span>{t('landing.feature1Item1', 'Automated Multiple-Choice Quiz Generation')}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />
                  <span>{t('landing.feature1Item2', 'ESDM & Regional Safety Standard Alignment')}</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-8 rounded-2xl space-y-4 hover:border-[#0EA5E9]/40 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 text-[#0EA5E9] flex items-center justify-center">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold font-heading text-[#0F172A]">{t('landing.feature2Title', 'Heavy Equipment & Field Labs')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t('landing.feature2Desc', 'Students practice real walkaround checks, hydraulic inspections, and high-voltage circuit breaker racking with distraction-free video and text modules.')}
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-semibold pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />
                  <span>{t('landing.feature2Item1', 'Interactive Video Lecture Panes')}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />
                  <span>{t('landing.feature2Item2', 'Module Progress Tracking & Completion Checkmarks')}</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-8 rounded-2xl space-y-4 hover:border-[#0EA5E9]/40 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 text-[#0EA5E9] flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold font-heading text-[#0F172A]">{t('landing.feature3Title', 'Verified Digital Certificates')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t('landing.feature3Desc', 'Upon passing all module assessments with 75%+ score, students receive official PT. JASA PRIMA PAPUA digital certificates complete with verification QR codes.')}
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-semibold pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />
                  <span>{t('landing.feature3Item1', 'Official Instructor Seal & Signature')}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />
                  <span>{t('landing.feature3Item2', 'Instant Printable & Downloadable Certificate')}</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#E2E8F0] text-slate-700 text-xs border-t border-[#CBD5E1] w-full">
        <div className="w-full px-6 sm:px-10 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <img 
              src="/img/jpp-logo.png" 
              alt="PT. JASA PRIMA PAPUA Logo" 
              className="w-10 h-10 object-cover rounded-full shadow-sm border border-slate-300"
            />
            <div>
              <p className="font-extrabold font-heading text-[#0F172A] text-sm">PT. JASA PRIMA PAPUA</p>
              <p className="text-slate-600 text-[11px] font-medium">{t('landing.footerDesc', 'Lembaga Pelatihan Kerja & Center for Technical Excellence')}</p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="font-bold text-[#0F172A]">{t('landing.footerRights', '© 2026 PT. JASA PRIMA PAPUA. All Rights Reserved.')}</p>
            <p className="text-slate-600 text-[10px] font-medium">Jayapura • Timika • Sorong • Merauke Regional Portals</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
