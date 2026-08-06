import { Course } from '../types';

// --- Types for Catalog/List View ---
export interface SafetyCultureCourseRaw {
  id: string;
  title: string;
  description?: string;
  category?: string;
  thumbnail_url?: string;
  lessons_count?: number;
  duration_minutes?: number;
  created_at?: string;
}

// --- Types for Deep Content (Gemini Processing) ---
export interface SCSlideRaw {
  id: string;
  type: string; // e.g., 'text', 'quiz', 'image', 'video'
  content: string; // The raw text, markdown, or json data
}

export interface SCLessonRaw {
  id: string;
  title: string;
  description?: string;
  slides: SCSlideRaw[];
}

export interface SCCourseFullRaw {
  id: string;
  title: string;
  description?: string;
  lessons: SCLessonRaw[];
}

// --- API Endpoints ---

/**
 * Fetches the high-level course catalog from SafetyCulture.
 * Used for displaying available templates to import in the library UI.
 */
export const fetchSafetyCultureCourses = async (): Promise<Course[]> => {
  try {
    const response = await fetch('/api/safetyculture/courses');
    
    if (!response.ok) {
      throw new Error('Failed to retrieve course catalog from SafetyCulture.');
    }

    const data = await response.json();
    const rawCourses: SafetyCultureCourseRaw[] = data.courses || data.data || [];

    return rawCourses.map((item) => ({
      id: `sc-${item.id}`,
      title: item.title,
      category: item.category || 'Occupational Safety & K3',
      description: item.description || 'Verified SafetyCulture industrial training module.',
      instructorName: 'SafetyCulture Certified',
      instructorRole: 'Global K3 Standards',
      thumbnailUrl: item.thumbnail_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
      estimatedHours: `${Math.ceil((item.duration_minutes || 45) / 60)} Hours`,
      prerequisites: 'Basic Industrial K3 Awareness',
      isPublished: true,
      createdAt: item.created_at || new Date().toISOString(),
      tags: ['SafetyCulture', 'K3', 'Global Standard'],
      enrolledStudentsCount: 0,
      completionRatePercent: 0,
      modules: [
        {
          id: `mod-sc-${item.id}-1`,
          title: 'Standard Operating Procedures & Safety Protocols',
          summary: 'Core safety modules imported from SafetyCulture training library.',
          lessons: [
            {
              id: `les-sc-${item.id}-1`,
              title: 'Interactive Safety Orientation',
              duration: `${item.duration_minutes || 30} mins`,
              content: 'Complete the interactive module via SafetyCulture digital portal.',
            }
          ]
        }
      ]
    }));
  } catch (error) {
    console.error('Error in fetchSafetyCultureCourses:', error);
    return [];
  }
};

/**
 * Fetches the complete, raw data hierarchy (course -> lessons -> slides)
 * specifically to feed into the Gemini AI processor.
 */
export const fetchFullSafetyCultureCourse = async (courseId: string): Promise<SCCourseFullRaw> => {
  try {
    // Strip the "sc-" prefix if it was passed from the catalog mapping above
    const rawId = courseId.replace('sc-', '');
    
    // NOTE: Your backend proxy at /api/safetyculture/courses/:id/full must 
    // handle the nested SC API requests to aggregate lessons and slides.
    const response = await fetch(`/api/safetyculture/courses/${rawId}/full`);
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve deep course data for ID: ${courseId}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in fetchFullSafetyCultureCourse for ${courseId}:`, error);
    throw error;
  }
};
