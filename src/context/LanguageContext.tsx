import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // Brand & Header
    'nav.trainingCenter': 'Pusat Pelatihan',
    'nav.subtitle': 'Lembaga Pelatihan Kerja & Enterprise Development',
    'nav.publicSite': 'Situs Publik',
    'nav.instructorPortal': 'Portal Instruktur',
    'nav.studentPortal': 'Portal Siswa',
    'nav.instructorLogin': 'Login Instruktur',
    'nav.switchPortal': 'Beralih ke Portal Saya',
    'nav.signOut': 'Keluar Akun',
    'nav.seniorInstructor': 'Instruktur Senior',
    'nav.enrolledStudent': 'Siswa Terdaftar',
    'nav.loginSignUp': 'Masuk / Daftar',

    // Landing Page
    'landing.badge': 'Portal Pelatihan & Sertifikasi Tenaga Kerja',
    'landing.title': 'PT. JASA PRIMA PAPUA',
    'landing.subtitle': 'Memberdayakan Tenaga Kerja Teknis Papua dengan Operasi Vokasi Berstandar Dunia, Standar Industri, dan Pengembangan Kurikulum Terstruktur.',
    'landing.instructorLogin': 'Login Portal Instruktur',
    'landing.studentPortal': 'Portal Belajar Siswa',
    'landing.stat1': 'Spesialis Papua Tersertifikasi',
    'landing.stat2': 'Program Industri Aktif',
    'landing.stat3': 'Tingkat Kelulusan ESDM',
    'landing.stat4': 'Sertifikasi Diakui ISO',
    'landing.coreCompetencies': 'Kompetensi Utama',
    'landing.featuredTitle': 'Program Pelatihan Industri Unggulan',
    'landing.featuredDesc': 'Kursus vokasi ketat yang dirancang untuk sektor alat berat, pertambangan, pemeliharaan listrik, dan energi terbarukan di Papua.',
    'landing.exploreCourses': 'Jelajahi Semua Kursus Portal',
    'landing.viewCourseDetails': 'Lihat Detail Kursus Portal',
    'landing.modules': 'Modul',
    'landing.modernInfra': 'Infrastruktur Vokasi Modern',
    'landing.modernInfraDesc': 'Menggabungkan simulasi alat berat langsung dengan pembuatan kurikulum otomatis untuk mempercepat pengembangan tenaga kerja Papua.',
    'landing.feature1Title': 'Ruang Kerja Pembuat Kurikulum',
    'landing.feature1Desc': 'Instruktur memasukkan subjek lokasi, tingkat pengalaman target, dan aturan keselamatan regional Papua untuk menghasilkan panduan pelajaran dan kuis secara otomatis.',
    'landing.feature1Item1': 'Pembuatan Kuis Pilihan Ganda Otomatis',
    'landing.feature1Item2': 'Penyelarasan Standar Keselamatan ESDM & Regional',
    'landing.feature2Title': 'Alat Berat & Laboratorium Lapangan',
    'landing.feature2Desc': 'Siswa berlatih pemeriksaan langsung keliling alat, inspeksi hidrolik, dan pemeliharaan pemutus sirkuit tegangan tinggi dengan modul video dan teks interaktif.',
    'landing.feature2Item1': 'Panel Kuliah Video Interaktif',
    'landing.feature2Item2': 'Pelacakan Kemajuan Modul & Centang Penyelesaian',
    'landing.feature3Title': 'Sertifikat Digital Terverifikasi',
    'landing.feature3Desc': 'Setelah lulus semua penilaian modul dengan skor 75%+, siswa menerima sertifikat digital resmi PT. JASA PRIMA PAPUA lengkap dengan kode QR verifikasi.',
    'landing.feature3Item1': 'Cap & Tanda Tangan Resmi Instruktur',
    'landing.feature3Item2': 'Sertifikat Dapat Diunduh & Dicetak Secara Instan',
    'landing.footerDesc': 'Lembaga Pelatihan Kerja & Pusat Keunggulan Teknis',
    'landing.footerRights': '© 2026 PT. JASA PRIMA PAPUA. Hak Cipta Dilindungi.',

    // Sidebars & Tabs
    'instructor.sidebarTitle': 'Manajemen Instruktur',
    'instructor.dashboard': 'Dasbor Utama',
    'instructor.myCourses': 'Kursus Saya',
    'instructor.aiCreator': 'Pembuat Kursus AI',
    'instructor.studentAnalytics': 'Analitik Siswa',
    'instructor.settings': 'Pengaturan',
    'instructor.exit': 'Keluar Portal Instruktur',

    'student.sidebarTitle': 'Portal Siswa',
    'student.dashboard': 'Dasbor Siswa',
    'student.enrolledCourses': 'Kursus Terdaftar',
    'student.quizzes': 'Kuis & Ujian',
    'student.certificates': 'Sertifikat Saya',
    'student.profile': 'Profil Siswa',
    'student.exit': 'Keluar Portal Siswa',

    // Modal
    'modal.authGateway': 'Gerbang Otentikasi Portal',
    'modal.instantDemo': 'Akses Demo Instan',
    'modal.preloaded': 'Akun Terdaftar',
    'modal.authenticateAndLaunch': 'Otentikasi & Buka Portal',
    'modal.sslSession': 'PT. JASA PRIMA PAPUA Portal Enterprise • Sesi SSL Terenkripsi',

    // Common
    'common.language': 'Bahasa',
    'common.indonesian': 'Bahasa Indonesia',
    'common.english': 'English',
    'common.backToPortal': 'Kembali ke Portal',
    'common.progress': 'Kemajuan',
    'common.completed': 'Selesai',
    'common.markComplete': 'Tandai Selesai',
    'common.markIncomplete': 'Selesai (Klik untuk Batal)',
    'common.submitQuiz': 'Kirim Penilaian Kuis',

    // Courses Text (Indonesian overrides)
    'course.1.title': 'Operasi Alat Berat Risiko Tinggi & Keselamatan Tambang',
    'course.1.description': 'Menguasai pengoperasian ekskavator, truk pengangkut, dan pemuat di bawah kondisi medan Papua dengan mematuhi standar keselamatan tambang Freeport & ESDM yang ketat.',
    'course.2.title': 'Sistem Tenaga Listrik Industri & Pemeliharaan Tegangan Tinggi',
    'course.2.description': 'Keselamatan listrik komprehensif, pengujian transformator, panel kontrol PLC, dan pemeliharaan pemutus sirkuit tegangan tinggi untuk fasilitas pengolahan tambang.',
    'course.3.title': 'Kesehatan Lingkungan, Keselamatan (K3L) & Kepatuhan Papua',
    'course.3.description': 'Kerangka kepatuhan ISO 45001 & ISO 14001 yang disesuaikan untuk lokasi industri Papua, perlindungan keanekaragaman hayati, dan pengolahan limbah tailing.',
    'course.4.title': 'Teknik PLTS & Mikrogrid Hibrida untuk Lokasi Terpencil Papua',
    'course.4.description': 'Desain, instalasi, integrasi penyimpanan baterai litium, dan pemantauan SCADA untuk kamp industri lepas kisi dan situs komunitas Papua terpencil.',
  },
  en: {
    // Brand & Header
    'nav.trainingCenter': 'Training Center',
    'nav.subtitle': 'Lembaga Pelatihan Kerja & Enterprise Development',
    'nav.publicSite': 'Public Site',
    'nav.instructorPortal': 'Instructor Portal',
    'nav.studentPortal': 'Student Portal',
    'nav.instructorLogin': 'Instructor Login',
    'nav.switchPortal': 'Switch to My Portal',
    'nav.signOut': 'Sign Out Account',
    'nav.seniorInstructor': 'Senior Instructor',
    'nav.enrolledStudent': 'Enrolled Student',

    // Landing Page
    'landing.badge': 'Workforce Training & Certification Portal',
    'landing.title': 'PT. JASA PRIMA PAPUA',
    'landing.subtitle': 'Empowering Papua’s Technical Workforce with World-Class Vocational Operations, Industry Standards, and Advanced Technical Training.',
    'landing.instructorLogin': 'Instructor Portal Login',
    'landing.studentPortal': 'Student Learning Portal',
    'landing.stat1': 'Certified Papuan Specialists',
    'landing.stat2': 'Active Industrial Programs',
    'landing.stat3': 'ESDM Safety Pass Rate',
    'landing.stat4': 'ISO Recognized Certification',
    'landing.coreCompetencies': 'Core Competencies',
    'landing.featuredTitle': 'Featured Industrial Training Programs',
    'landing.featuredDesc': 'Rigorous vocational courses engineered for Papua’s heavy machinery, mining, electrical maintenance, and renewable energy sectors.',
    'landing.exploreCourses': 'Explore All Enrolled Courses',
    'landing.viewCourseDetails': 'View Portal Course Details',
    'landing.modules': 'Modules',
    'landing.modernInfra': 'Modern Vocational Infrastructure',
    'landing.modernInfraDesc': 'Combining hands-on heavy equipment simulation with automated curriculum generation to accelerate Papua’s workforce development.',
    'landing.feature1Title': 'Course Creator Workspace',
    'landing.feature1Desc': 'Instructors input site subjects, target experience levels, and Papua regional safety rules to generate lesson guides, reading notes, and quizzes.',
    'landing.feature1Item1': 'Automated Multiple-Choice Quiz Generation',
    'landing.feature1Item2': 'ESDM & Regional Safety Standard Alignment',
    'landing.feature2Title': 'Heavy Equipment & Field Labs',
    'landing.feature2Desc': 'Students practice real walkaround checks, hydraulic inspections, and high-voltage circuit breaker racking with distraction-free video and text modules.',
    'landing.feature2Item1': 'Interactive Video Lecture Panes',
    'landing.feature2Item2': 'Module Progress Tracking & Completion Checkmarks',
    'landing.feature3Title': 'Verified Digital Certificates',
    'landing.feature3Desc': 'Upon passing all module assessments with 75%+ score, students receive official PT. JASA PRIMA PAPUA digital certificates complete with verification QR codes.',
    'landing.feature3Item1': 'Official Instructor Seal & Signature',
    'landing.feature3Item2': 'Instant Printable & Downloadable Certificate',
    'landing.footerDesc': 'Lembaga Pelatihan Kerja & Center for Technical Excellence',
    'landing.footerRights': '© 2026 PT. JASA PRIMA PAPUA. All Rights Reserved.',

    // Sidebars & Tabs
    'instructor.sidebarTitle': 'Instructor Management',
    'instructor.dashboard': 'Dashboard',
    'instructor.myCourses': 'My Courses',
    'instructor.aiCreator': 'AI Course Creator',
    'instructor.studentAnalytics': 'Student Analytics',
    'instructor.settings': 'Settings',
    'instructor.exit': 'Exit Instructor Portal',

    'student.sidebarTitle': 'Student Portal',
    'student.dashboard': 'Dashboard',
    'student.enrolledCourses': 'Enrolled Courses',
    'student.quizzes': 'Quizzes & Assessments',
    'student.certificates': 'My Certificates',
    'student.profile': 'Student Profile',
    'student.exit': 'Exit Student Portal',

    // Modal
    'modal.authGateway': 'Portal Authentication Gateway',
    'modal.instantDemo': 'Instant Demo Access',
    'modal.preloaded': 'Pre-loaded Account',
    'modal.authenticateAndLaunch': 'Authenticate & Launch Portal',
    'modal.sslSession': 'PT. JASA PRIMA PAPUA Enterprise Portal • Encrypted SSL Session',

    // Common
    'common.language': 'Language',
    'common.indonesian': 'Bahasa Indonesia',
    'common.english': 'English',
    'common.backToPortal': 'Back to Portal',
    'common.progress': 'Progress',
    'common.completed': 'Completed',
    'common.markComplete': 'Mark Complete',
    'common.markIncomplete': 'Completed (Click to Undo)',
    'common.submitQuiz': 'Submit Quiz Assessment',

    // Courses Text (English defaults)
    'course.1.title': 'High-Risk Heavy Machinery Operations & Mine Safety',
    'course.1.description': 'Master operating excavator, haul truck, and loader machinery under Papua terrain conditions adhering to strict Freeport & ESDM mine safety standards.',
    'course.2.title': 'Industrial Electrical Power Systems & High-Voltage Maintenance',
    'course.2.description': 'Comprehensive electrical safety, transformer testing, PLC control panels, and high-voltage circuit breaker maintenance for processing plants.',
    'course.3.title': 'Environmental Health, Safety (EHS) & Papua Compliance Framework',
    'course.3.description': 'ISO 45001 & ISO 14001 compliance framework tailored for Papuan industrial sites, biodiversity protection, and tailings management.',
    'course.4.title': 'Solar PV & Hybrid Microgrid Engineering for Remote Papua Sites',
    'course.4.description': 'Design, installation, lithium battery storage integration, and SCADA monitoring for off-grid industrial camps and rural Papuan sites.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('id');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations['en'][key]) {
      return translations['en'][key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
