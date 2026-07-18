/**
 * Edutime CI — Core database types (Supabase / PostgreSQL)
 * Multi-tenant: each school is an isolated tenant via school_id + RLS.
 */

export type UserRole = "censeur" | "admin" | "directeur_etudes";

export type PricingPlan = "starter" | "pro" | "enterprise";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type RoomType = "standard" | "lab" | "sports";

export type ClassLevel =
  | "6eme"
  | "5eme"
  | "4eme"
  | "3eme"
  | "2nde_a"
  | "2nde_c"
  | "1ere_a"
  | "1ere_c"
  | "1ere_d"
  | "tle_a"
  | "tle_c"
  | "tle_d";

export type Cycle = "premier" | "second";

/** Time slot identifier e.g. "monday_morning_08:00" */
export type SlotKey = string;

export interface UnavailabilityMap {
  [slotKey: SlotKey]: boolean;
}

export interface School {
  id: string;
  name: string;
  city: string;
  region: string;
  plan: PricingPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  max_teachers: number;
  max_classes: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  school_id: string;
  school_name: string;
  full_name: string;
  role: UserRole;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  name: string;
  subjects: string[];
  max_hours_per_week: number;
  unavailabilities: UnavailabilityMap;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  school_id: string;
  name: string;
  capacity: number;
  type: RoomType;
  created_at: string;
  updated_at: string;
}

export interface ClassGroup {
  id: string;
  school_id: string;
  level: ClassLevel;
  name: string;
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  weekly_hours_required: number;
  requires_double_block: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimetableEntry {
  id: string;
  school_id: string;
  class_id: string;
  teacher_id: string;
  subject_id: string;
  room_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

/** MENA curriculum template — hours per subject for a given class level */
export interface CurriculumSubject {
  name: string;
  weekly_hours: number;
  requires_double_block?: boolean;
}

export interface CurriculumTemplate {
  level: ClassLevel;
  cycle: Cycle;
  label: string;
  subjects: CurriculumSubject[];
}

/** Scheduling time slot definition */
export interface TimeSlot {
  key: SlotKey;
  day: DayOfWeek;
  start_time: string;
  end_time: string;
  period: "morning" | "afternoon";
  /** False when slot is blocked by Ivorian school rhythm (Wed PM, Sat PM) */
  is_available: boolean;
  duration_hours: number;
}

export interface ScheduleGenerationStats {
  total_hours_required: number;
  total_hours_assigned: number;
  assignment_percentage: number;
  conflicts_resolved: number;
  unassigned_hours: number;
  generation_time_ms: number;
}

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: School;
        Insert: Omit<School, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<School>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
      };
      teachers: {
        Row: Teacher;
        Insert: Omit<Teacher, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Teacher>;
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Room>;
      };
      classgroups: {
        Row: ClassGroup;
        Insert: Omit<ClassGroup, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ClassGroup>;
      };
      subjects: {
        Row: Subject;
        Insert: Omit<Subject, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Subject>;
      };
      timetable_entries: {
        Row: TimetableEntry;
        Insert: Omit<TimetableEntry, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TimetableEntry>;
      };
    };
  };
}
