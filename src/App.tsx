import React, { useState, useEffect } from 'react';
import { User, UserRole, Course, StudentCourseProgress, Certificate, StudentAnalyticsItem } from './types';
import { LanguageProvider } from './context/LanguageContext';
import {
  DEFAULT_INSTRUCTOR,
  DEFAULT_STUDENT,
  INITIAL_COURSES,
  INITIAL_STUDENT_PROGRESS,
  INITIAL_CERTIFICATES,
  INITIAL_ANALYTICS,
} from './data/mockData';
 
// Firebase Imports
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from './services/firebase';
 
// Lucide Icons for Layout integration
import { Download, Sparkles, Users, ArrowRight } from 'lucide-react';

// Navigation & Auth
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/common/LoginModal';
import { LandingPage } from './components/LandingPage';

// Admin Portal
import { AdminDashboard } from './components/AdminDashboard';

// SafetyCulture Library Integration
import { SafetyCultureLibrary } from './components/SafetyCultureLibrary';

// Instructor Portal
import { InstructorSidebar, InstructorTab } from './components/instructor/InstructorSidebar';
import { InstructorDashboard } from './components/instructor/InstructorDashboard';
import { AICourseCreator } from './components/instructor/AICourseCreator';
import { MyCourses } from './components/instructor/MyCourses';
import { StudentAnalytics } from './components/instructor/StudentAnalytics';
import { InstructorSettings } from './components/instructor/InstructorSettings';
import { CourseEditorModal } from './components/instructor/CourseEditorModal';

// Student Portal
import { StudentSidebar, StudentTab } from './components/student/StudentSidebar';
import { StudentDashboard } from './components/student/StudentDashboard';
import { EnrolledCourses } from './components/student/EnrolledCourses';
import { CourseViewer } from './components/student/CourseViewer';
import { QuizzesAssessments } from './components/student/QuizzesAssessments';
import { CertificatesView } from './components/student/CertificatesView';
import { StudentProfile } from './components/student/StudentProfile';

// Fallback Mock Users (Used only if Firebase is empty/fails)
const INITIAL_USERS_DIRECTORY: User[] = [
  {
    id: 'user-admin-01',
    name: 'Mark Antonio Pigome',
    email: 'mpigome44@gmail.com',
    role: 'admin',
    department: 'Executive Administration',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    enrolledCourseIds: [],
    isApproved: true,
  }
];

function AppContent() {
  // Portal & User State
  const [activePortalRole, setActivePortalRole] = useState<UserRole>('guest');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [modalInitialRole, setModalInitialRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(true);

  // Managed Users List for Admin Access
  const [usersList, setUsersList] = useState<User[]>(INITIAL_USERS_DIRECTORY);

  // Instructor Tabs
  const [instructorTab, setInstructorTab] = useState<InstructorTab | 'safetyculture'>('dashboard');

  // Student Tabs
  const [studentTab, setStudentTab] = useState<StudentTab>('dashboard');

  // Core Application Data State
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [studentProgress, setStudentProgress] = useState<Record<string, StudentCourseProgress>>(INITIAL_STUDENT_PROGRESS);
  const [certificates, setCertificates] = useState<Certificate[]>(INITIAL_CERTIFICATES);
  const [analytics, setAnalytics] = useState<StudentAnalyticsItem[]>(INITIAL_ANALYTICS);

  // Active Course Viewer & Editor state
  const [activeViewingCourse, setActiveViewingCourse] = useState<Course | null>(null);
  const [activeViewingLessonId, setActiveViewingLessonId] = useState<string | undefined>(undefined);

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCourseEditorOpen, setIsCourseEditorOpen] = useState(false);

  // Success Notification banner state for course imports
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // --- Firebase User Sync & Session Persistence ---
  useEffect(() => {
    // 1. Load active session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setActivePortalRole(user.role);
      } catch (err) {
        console.error('Error loading saved session:', err);
      }
    }

    // 2. Fetch real users and courses from Firebase Firestore
    const fetchFirebaseData = async () => {
      try {
        const [usersSnapshot, coursesSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'courses'))
        ]);

        const dbUsers: User[] = [];
        usersSnapshot.forEach((doc) => {
          dbUsers.push({ id: doc.id, ...doc.data() } as User);
        });

        if (dbUsers.length > 0) {
          setUsersList(dbUsers);
        }

        const dbCourses: Course[] = [];
        coursesSnapshot.forEach((doc) => {
          dbCourses.push({ id: doc.id, ...doc.data() } as Course);
        });

        if (dbCourses.length > 0) {
          setCourses(dbCourses);
        }
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirebaseData();
  }, []);

  // --- Save user to localStorage whenever it changes ---
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Auth & Portal Handlers
  const handleOpenLoginModal = (role: UserRole = 'student') => {
    setModalInitialRole(role);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    const formattedUser: User = {
      ...user,
      enrolledCourseIds: user.enrolledCourseIds || [],
    };

    setCurrentUser(formattedUser);
    setActivePortalRole(formattedUser.role);
    setIsLoginModalOpen(false);

    setUsersList((prev) => {
      const exists = prev.some((u) => u.email.toLowerCase() === formattedUser.email.toLowerCase());
      if (!exists) return [formattedUser, ...prev];
      return prev.map((u) => u.email.toLowerCase() === formattedUser.email.toLowerCase() ? formattedUser : u);
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActivePortalRole('guest');
    setActiveViewingCourse(null);
    localStorage.removeItem('currentUser');
  };

  // --- Restrict portal switching based on user role & pending status ---
  const handleSelectPortalRole = (role: UserRole) => {
    if (role === 'guest') {
      setActivePortalRole('guest');
      setActiveViewingCourse(null);
      return;
    }

    if (!currentUser) {
      handleOpenLoginModal(role);
      return;
    }

    // CHECK FOR PENDING INSTRUCTORS
    if (
      role === 'instructor' &&
      currentUser.requestedRole === 'instructor' &&
      currentUser.isApproved === false
    ) {
      alert('Your instructor access request is currently pending admin approval. You can continue using the student portal in the meantime.');
      return;
    }

    // Allow access ONLY to the user's actual role, EXCEPT if the user is an admin
    if (currentUser.role === role || currentUser.role === 'admin') {
      setActivePortalRole(role);
      setActiveViewingCourse(null);
    } else {
      alert(`You don't have access to the ${role} portal. You are logged in as a ${currentUser.role}.`);
      return;
    }
  };

  // --- Admin User Management Handlers (SYNCED WITH FIREBASE) ---
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    // 1. Optimistic UI update
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            role: newRole,
            isApproved: true, 
            requestedRole: undefined,
          };
        }
        return u;
      })
    );

    // 2. Sync to Firebase
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        role: newRole, 
        isApproved: true, 
        requestedRole: null 
      });
    } catch (error) {
      console.error("Error updating user role in Firebase:", error);
      alert("Failed to update role in database. Please check your connection.");
    }

    // 3. Update active session if changing own role
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { 
        ...currentUser, 
        role: newRole,
        isApproved: true,
        requestedRole: undefined
      };
      setCurrentUser(updatedUser);
      setActivePortalRole(newRole);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (usersList.length <= 1) {
      alert('Cannot delete the last remaining user account.');
      return;
    }
    
    // 1. Optimistic UI update
    setUsersList((prev) => prev.filter((u) => u.id !== userId));

    // 2. Sync to Firebase
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error("Error deleting user from Firebase:", error);
      alert("Failed to delete user from database.");
    }
  };

  const handleAddUser = async (name: string, email: string, department: string, role: UserRole) => {
    const newUserId = `usr_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      department: department.trim() || 'General Operations',
      avatarUrl: '', // Will default to blank icon via your render logic
      enrolledCourseIds: [],
      isApproved: true,
    };
    
    // 1. Optimistic UI update
    setUsersList((prev) => [newUser, ...prev]);

    // 2. Sync to Firebase
    try {
      await setDoc(doc(db, 'users', newUserId), newUser);
    } catch (error) {
      console.error("Error creating user in Firebase:", error);
      alert("Failed to add user to the database.");
    }
  };

  // --- SafetyCulture Course Import Handler ---
  const handleImportSafetyCultureCourse = async (importedCourse: Course) => {
    const alreadyExists = courses.some((c) => c.id === importedCourse.id);
    if (alreadyExists) {
      setImportNotification(`"${importedCourse.title}" is already in your platform course catalog.`);
      setTimeout(() => setImportNotification(null), 4000);
      return;
    }

    setCourses((prev) => [importedCourse, ...prev]);

    try {
      await setDoc(doc(db, 'courses', importedCourse.id), importedCourse);
    } catch (error) {
      console.error("Error syncing imported course to Firebase:", error);
    }

    setStudentProgress((prev) => ({
      ...prev,
      [importedCourse.id]: {
        courseId: importedCourse.id,
        completedLessonIds: [],
        quizSubmissions: {},
        overallPercent: 0,
        completed: false,
      },
    }));

    setImportNotification(`Successfully imported "${importedCourse.title}" into JASA-PRIMA-PAPUA!`);
    setTimeout(() => setImportNotification(null), 4000);
  };

  // --- Course Management Handlers ---
  const handleTogglePublishCourse = async (courseId: string) => {
    const updatedCourse = courses.find((c) => c.id === courseId);
    if (!updatedCourse) return;

    const newPublishStatus = !updatedCourse.isPublished;

    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, isPublished: newPublishStatus } : c))
    );

    try {
      await updateDoc(doc(db, 'courses', courseId), { isPublished: newPublishStatus });
    } catch (error) {
      console.error("Error updating course publish status in Firebase:", error);
    }
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsCourseEditorOpen(true);
  };

  const handleSaveUpdatedCourse = async (updatedCourse: Course) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
    );

    try {
      await setDoc(doc(db, 'courses', updatedCourse.id), updatedCourse);
    } catch (error) {
      console.error("Error updating course in Firebase:", error);
    }
  };

  const handlePublishNewAICourse = async (newCourse: Course) => {
    setCourses((prev) => [newCourse, ...prev]);

    try {
      await setDoc(doc(db, 'courses', newCourse.id), newCourse);
    } catch (error) {
      console.error("Error saving new AI course to Firebase:", error);
    }

    setStudentProgress((prev) => ({
      ...prev,
      [newCourse.id]: {
        courseId: newCourse.id,
        completedLessonIds: [],
        quizSubmissions: {},
        overallPercent: 0,
        completed: false,
      },
    }));

    setAnalytics((prev) => [
      {
        id: `sa-${Date.now()}`,
        studentName: DEFAULT_STUDENT.name,
        studentId: DEFAULT_STUDENT.studentId!,
        courseTitle: newCourse.title,
        progressPercent: 0,
        averageQuizScore: 0,
        status: 'In Progress',
        lastActive: 'Just now',
      },
      ...prev,
    ]);
  };

  // --- Student Progress & Quiz Handlers ---
  const handleUpdateLessonComplete = (courseId: string, lessonId: string) => {
    setStudentProgress((prev) => {
      const existing = prev[courseId] || {
        courseId,
        completedLessonIds: [],
        quizSubmissions: {},
        overallPercent: 0,
        completed: false,
      };

      const isCompleted = existing.completedLessonIds.includes(lessonId);
      const updatedLessonIds = isCompleted
        ? existing.completedLessonIds.filter((id) => id !== lessonId)
        : [...existing.completedLessonIds, lessonId];

      const targetCourse = courses.find((c) => c.id === courseId);
      const totalLessons = targetCourse?.modules.reduce((sum, m) => sum + m.lessons.length, 0) || 1;
      const overallPercent = Math.min(100, Math.round((updatedLessonIds.length / totalLessons) * 100));

      return {
        ...prev,
        [courseId]: {
          ...existing,
          completedLessonIds: updatedLessonIds,
          lastAccessedLessonId: lessonId,
          overallPercent,
        },
      };
    });
  };

  const handleSubmitQuiz = (
    courseId: string,
    quizId: string,
    answers: number[],
    passed: boolean,
    score: number
  ) => {
    setStudentProgress((prev) => {
      const existing = prev[courseId] || {
        courseId,
        completedLessonIds: [],
        quizSubmissions: {},
        overallPercent: 0,
        completed: false,
      };

      const updatedSubmissions = {
        ...existing.quizSubmissions,
        [quizId]: {
          quizId,
          courseId,
          score,
          totalQuestions: answers.length,
          passed,
          submittedAt: new Date().toISOString().split('T')[0],
          userAnswers: answers,
        },
      };

      const targetCourse = courses.find((c) => c.id === courseId);
      const allPassed = targetCourse?.modules.every((m) =>
        m.quiz ? updatedSubmissions[m.quiz.id]?.passed : true
      );

      if (allPassed && !existing.completed) {
        const certNumber = `CERT/JPP/${Date.now().toString().slice(-4)}`;
        const newCert: Certificate = {
          id: `cert-${Date.now()}`,
          certificateNumber: certNumber,
          studentName: currentUser?.name || DEFAULT_STUDENT.name,
          studentId: currentUser?.studentId || DEFAULT_STUDENT.studentId!,
          courseTitle: targetCourse?.title || 'Vocational Program',
          courseId,
          issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          instructorName: 'Ir. Budi Santoso, M.T.',
          instructorTitle: 'Head of Industrial Curriculum',
          trainingCenterName: 'PT. JASA PRIMA PAPUA',
          verificationQrCodeText: `https://jasaprimapapua.co.id/verify/${certNumber}`,
        };

        setCertificates((cPrev) => [newCert, ...cPrev]);
      }

      return {
        ...prev,
        [courseId]: {
          ...existing,
          quizSubmissions: updatedSubmissions,
          completed: allPassed || false,
        },
      };
    });
  };

  const handleOpenCourseViewer = (course: Course, lessonId?: string) => {
    if (!currentUser) {
      setCurrentUser(DEFAULT_STUDENT);
      setActivePortalRole('student');
    }
    setActiveViewingCourse(course);
    setActiveViewingLessonId(lessonId);
  };

  const handleUpdateInstructorUser = (updated: Partial<User>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updated });
    }
  };

  const visibleStudentCourses = courses.filter((c) => c.isPublished);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      
      {/* Global Brand Navbar */}
      <Navbar
        currentUser={currentUser}
        activeRole={activePortalRole}
        onSelectRole={handleSelectPortalRole}
        onOpenLoginModal={handleOpenLoginModal}
        onLogout={handleLogout}
      />

      {/* Import Toast Notification */}
      {importNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 animate-fadeIn">
          <Download className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <span className="text-xs font-extrabold">{importNotification}</span>
        </div>
      )}

      {/* Main Content Router */}
      {activeViewingCourse ? (
        <CourseViewer
          course={activeViewingCourse}
          progress={studentProgress[activeViewingCourse.id] || {
            courseId: activeViewingCourse.id,
            completedLessonIds: [],
            quizSubmissions: {},
            overallPercent: 0,
            completed: false,
          }}
          initialLessonId={activeViewingLessonId}
          onBack={() => setActiveViewingCourse(null)}
          onUpdateLessonComplete={handleUpdateLessonComplete}
          onSubmitQuiz={handleSubmitQuiz}
        />
      ) : activePortalRole === 'guest' ? (
        <LandingPage
          courses={visibleStudentCourses}
          currentUser={currentUser}
          onOpenLoginModal={handleOpenLoginModal}
          onSelectCoursePreview={(c) => handleOpenCourseViewer(c)}
          onGoToDashboard={() => {
            if (currentUser) {
              handleSelectPortalRole(currentUser.role);
            }
          }}
        />
      ) : activePortalRole === 'admin' ? (
        <div className="flex-1 w-full flex flex-col">
          <AdminDashboard
            currentUser={currentUser!}
            allUsers={usersList}
            onUpdateRole={handleUpdateRole}
            onDeleteUser={handleDeleteUser}
            onAddUser={handleAddUser}
          />
        </div>
      ) : activePortalRole === 'instructor' ? (
        <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
          <InstructorSidebar
            activeTab={instructorTab as InstructorTab}
            onSelectTab={(tab) => setInstructorTab(tab)}
            instructorName={currentUser?.name || DEFAULT_INSTRUCTOR.name}
            department={currentUser?.department || DEFAULT_INSTRUCTOR.department}
            avatarUrl={currentUser?.avatarUrl || DEFAULT_INSTRUCTOR.avatarUrl}
            onLogout={handleLogout}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
            {instructorTab !== 'safetyculture' && (
              <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-50 text-[#0EA5E9] flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">SafetyCulture Library</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate">Accredited K3 modules, ready to import & enhance.</p>
                  </div>
                </div>
                <button
                  onClick={() => setInstructorTab('safetyculture')}
                  className="group flex items-center gap-1.5 text-xs font-bold text-[#0EA5E9] hover:text-[#0284C7] transition cursor-pointer flex-shrink-0"
                >
                  <span>Browse catalog</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}

            {instructorTab === 'dashboard' && (
              <InstructorDashboard
                courses={courses}
                studentAnalytics={analytics}
                onSelectTab={(tab) => setInstructorTab(tab)}
                onTogglePublishCourse={handleTogglePublishCourse}
                onEditCourse={handleOpenEditCourse}
              />
            )}
            {instructorTab === 'courses' && (
              <MyCourses
                courses={courses}
                onSelectTab={(tab) => setInstructorTab(tab)}
                onTogglePublishCourse={handleTogglePublishCourse}
                onEditCourse={handleOpenEditCourse}
              />
            )}
            {instructorTab === 'ai-creator' && (
              <AICourseCreator onPublishCourse={handlePublishNewAICourse} />
            )}
            {instructorTab === 'analytics' && (
              <StudentAnalytics analytics={analytics} />
            )}
            {instructorTab === 'settings' && (
              <InstructorSettings
                currentUser={currentUser || DEFAULT_INSTRUCTOR}
                onUpdateUser={handleUpdateInstructorUser}
              />
            )}
            {instructorTab === 'safetyculture' && (
              <SafetyCultureLibrary onImportCourse={handleImportSafetyCultureCourse} />
            )}
          </main>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
          <StudentSidebar
            activeTab={studentTab}
            onSelectTab={setStudentTab}
            studentName={currentUser?.name || DEFAULT_STUDENT.name}
            studentId={currentUser?.studentId || DEFAULT_STUDENT.studentId}
            avatarUrl={currentUser?.avatarUrl || DEFAULT_STUDENT.avatarUrl}
            onLogout={handleLogout}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {studentTab === 'dashboard' && (
              <StudentDashboard
                enrolledCourses={visibleStudentCourses}
                studentProgress={studentProgress}
                certificates={certificates}
                onSelectTab={setStudentTab}
                onOpenCourseViewer={handleOpenCourseViewer}
              />
            )}
            {studentTab === 'courses' && (
              <EnrolledCourses
                enrolledCourses={visibleStudentCourses}
                studentProgress={studentProgress}
                onOpenCourseViewer={handleOpenCourseViewer}
              />
            )}
            {studentTab === 'quizzes' && (
              <QuizzesAssessments
                enrolledCourses={visibleStudentCourses}
                studentProgress={studentProgress}
                onOpenCourseViewer={handleOpenCourseViewer}
                onSubmitQuiz={handleSubmitQuiz}
              />
            )}
            {studentTab === 'certificates' && (
              <CertificatesView certificates={certificates} />
            )}
            {studentTab === 'profile' && (
              <StudentProfile
                currentUser={currentUser || DEFAULT_STUDENT}
                certificates={certificates}
                onUpdateUser={handleUpdateInstructorUser}
              />
            )}
          </main>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        defaultRole={modalInitialRole}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Course Editor Modal */}
      <CourseEditorModal
        course={editingCourse}
        isOpen={isCourseEditorOpen}
        onClose={() => setIsCourseEditorOpen(false)}
        onSave={handleSaveUpdatedCourse}
      />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
