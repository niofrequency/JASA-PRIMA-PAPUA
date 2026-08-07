import { Course, User, StudentAnalyticsItem, Certificate, StudentCourseProgress } from '../types';
 
export const DEFAULT_INSTRUCTOR: User = {
  id: 'inst-01',
  name: 'Ir. Budi Santoso, M.T.',
  email: 'budi.santoso@jasaprimapapua.co.id',
  role: 'instructor',
  department: 'Senior Industrial & Heavy Equipment Operations',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  enrolledCourseIds: [],
};

export const DEFAULT_STUDENT: User = {
  id: 'stud-101',
  name: 'Elias Pigome',
  studentId: 'JPP-2026-088',
  email: 'elias.pigome@jasaprimapapua.co.id',
  role: 'student',
  department: 'Mechanical Maintenance & Field Operations',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  enrolledCourseIds: [], // Cleared to prevent referencing non-existent static courses
};

// ============================================================================
// DYNAMIC DATA PLACEHOLDERS
// The static mock arrays have been intentionally emptied. 
// The platform now relies exclusively on Firebase Firestore and SafetyCulture 
// API fetches to populate these states, ensuring consistent real-world data rendering.
// ============================================================================

export const INITIAL_COURSES: Course[] = [];

export const INITIAL_STUDENT_PROGRESS: Record<string, StudentCourseProgress> = {};

export const INITIAL_CERTIFICATES: Certificate[] = [];

export const INITIAL_ANALYTICS: StudentAnalyticsItem[] = [];
