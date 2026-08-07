import React, { useState } from 'react';
import { Course, StudentCourseProgress, Quiz, QuizQuestion } from '../../types';
import { FileCheck, CheckCircle2, RotateCcw, Award, ArrowRight } from 'lucide-react';

interface QuizzesAssessmentsProps {
  enrolledCourses: Course[];
  studentProgress: Record<string, StudentCourseProgress>;
  onOpenCourseViewer: (course: Course) => void;
  onSubmitQuiz: (courseId: string, quizId: string, answers: number[], passed: boolean, score: number) => void;
}

export const QuizzesAssessments: React.FC<QuizzesAssessmentsProps> = ({
  enrolledCourses,
  studentProgress,
  onOpenCourseViewer,
  onSubmitQuiz,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      
      <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <h1 className="text-xl font-extrabold text-[#0F172A]">Quizzes & Assessment Center</h1>
        <p className="text-xs text-slate-500 mt-1">Complete module assessments to verify your technical competency and earn official PT. JASA PRIMA PAPUA certificates.</p>
      </div>

      <div className="space-y-4">
        {enrolledCourses.map((course) => {
          const prog = studentProgress[course.id];

          return (
            <div key={course.id} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-[#0EA5E9] uppercase tracking-wider">{course.category}</span>
                  <h3 className="text-sm font-extrabold text-[#0F172A]">{course.title}</h3>
                </div>

                <button
                  id={`quiz-center-open-course-btn-${course.id}`}
                  onClick={() => onOpenCourseViewer(course)}
                  className="text-xs font-bold text-[#0EA5E9] hover:text-[#0284C7] flex items-center space-x-1 cursor-pointer"
                >
                  <span>Open Course Viewer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {course.modules.map((mod, modIdx) => {
                  if (!mod.quiz) return null;
                  const submission = prog?.quizSubmissions?.[mod.quiz.id];

                  return (
                    <div key={mod.quiz.id} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">Module {modIdx + 1}: {mod.quiz.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{mod.quiz.questions.length} Questions • Passing: {mod.quiz.passingScorePercent || 75}%</p>
                      </div>

                      {submission ? (
                        <div className="flex items-center space-x-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            submission.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {submission.passed ? `PASSED (${submission.score}%)` : `FAILED (${submission.score}%)`}
                          </span>

                          <button
                            id={`retake-quiz-btn-${mod.quiz.id}`}
                            onClick={() => onOpenCourseViewer(course)}
                            className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] text-slate-700 border border-[#E2E8F0] text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Review / Retake
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`start-quiz-btn-${mod.quiz.id}`}
                          onClick={() => onOpenCourseViewer(course)}
                          className="px-4 py-1.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0EA5E9]/20 cursor-pointer"
                        >
                          Take Quiz
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
