import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { Course } from "../types";

const COURSES_COLLECTION = "courses";

export const getAllCourses = async (): Promise<Course[]> => {
  const querySnapshot = await getDocs(collection(db, COURSES_COLLECTION));
  const courses: Course[] = [];
  querySnapshot.forEach((docSnap) => {
    courses.push({ id: docSnap.id, ...docSnap.data() } as Course);
  });
  return courses;
};

export const getCourseById = async (id: string): Promise<Course | null> => {
  const docRef = doc(db, COURSES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Course;
  }
  return null;
};

export const createCourse = async (courseData: Omit<Course, "id">): Promise<string> => {
  const docRef = await addDoc(collection(db, COURSES_COLLECTION), {
    ...courseData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateCourse = async (id: string, courseData: Partial<Course>): Promise<void> => {
  const docRef = doc(db, COURSES_COLLECTION, id);
  await updateDoc(docRef, {
    ...courseData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCourse = async (id: string): Promise<void> => {
  const docRef = doc(db, COURSES_COLLECTION, id);
  await deleteDoc(docRef);
};
