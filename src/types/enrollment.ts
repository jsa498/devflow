// Define types matching the getChildEnrollments action return structure
export type DbEnrollment = {
  id: string;
  child_id: string;
  class_type: string;
  class_level: string;
  time_slot: string; 
  created_at: string;
  updated_at: string;
};

export type ChildWithEnrollments = {
  id: string;
  user_id: string;
  name: string;
  age: number;
  created_at: string;
  updated_at: string;
  enrollments: DbEnrollment[];
}; 