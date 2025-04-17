// Define the course type
export interface CourseType {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_image_url: string | null;
  image_url: string | null;
}

// For TypeScript's type checking purposes
export type CourseEnrollmentResponse = {
  courses: CourseType | CourseType[] | null; // Allow single or array
}; 