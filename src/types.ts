export type UserRole = 'admin' | 'guest' | 'instructor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  studentId?: string;
  enrolledCourseIds?: string[];
  isApproved?: boolean; // false for pending instructor approvals
  requestedRole?: UserRole; // what role they applied for
  approvalRequestedAt?: string; // timestamp when they requested instructor access
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScorePercent?: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
  readingMaterial?: string;
  videoUrl?: string;
  videoPlaceholderTopic?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
  quiz?: Quiz;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  instructorName: string;
  instructorRole?: string;
  // Ownership — which instructor account created this course. Optional for
  // backward compatibility with courses created before this field existed;
  // treat missing instructorId as "unassigned/legacy" (admin-manageable
  // only) rather than assuming any particular instructor owns it.
  instructorId?: string;
  thumbnailUrl: string;
  estimatedHours: string;
  prerequisites: string;
  isPublished: boolean;
  createdAt: string;
  modules: CourseModule[];
  tags: string[];
  enrolledStudentsCount: number;
  completionRatePercent: number;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
}

export interface QuizSubmission {
  quizId: string;
  courseId: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  submittedAt: string;
  userAnswers: number[];
}

export interface StudentCourseProgress {
  courseId: string;
  completedLessonIds: string[];
  quizSubmissions: Record<string, QuizSubmission>; // key is quizId
  lastAccessedLessonId?: string;
  overallPercent: number;
  completed: boolean;
  certificateEarnedDate?: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  studentName: string;
  studentId: string;
  courseTitle: string;
  courseId: string;
  issueDate: string;
  expiryDate?: string;
  instructorName: string;
  instructorTitle: string;
  trainingCenterName: string; // "PT. JASA PRIMA PAPUA"
  verificationQrCodeText: string;
}

export interface AICourseGenerationInput {
  subject: string;
  targetAudience: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  moduleCount: number;
  papuaContext: boolean;
}

export interface StudentAnalyticsItem {
  id: string;
  studentName: string;
  studentId: string;
  courseTitle: string;
  progressPercent: number;
  averageQuizScore: number;
  status: 'In Progress' | 'Completed' | 'At Risk';
  lastActive: string;
}
