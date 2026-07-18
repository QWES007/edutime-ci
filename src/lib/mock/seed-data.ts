import type {
  ClassGroup,
  Profile,
  Room,
  School,
  Subject,
  Teacher,
  TimetableEntry,
} from "@/lib/types/database";

export const MOCK_SCHOOL_ID = "school-demo-001";
export const MOCK_USER_ID = "user-demo-001";

export const mockSchool: School = {
  id: MOCK_SCHOOL_ID,
  name: "Lycée Moderne d'Abidjan",
  city: "Abidjan",
  region: "Lagunes",
  plan: "starter",
  stripe_customer_id: "cus_mock_starter",
  stripe_subscription_id: "sub_mock_starter",
  max_teachers: 30,
  max_classes: 20,
  created_at: "2025-09-01T08:00:00Z",
  updated_at: "2025-09-01T08:00:00Z",
};

export const mockProfile: Profile = {
  id: MOCK_USER_ID,
  school_id: MOCK_SCHOOL_ID,
  school_name: mockSchool.name,
  full_name: "M. Amadou Koné",
  role: "censeur",
  email: "censeur@lycee-moderne.ci",
  created_at: "2025-09-01T08:00:00Z",
  updated_at: "2025-09-01T08:00:00Z",
};

export const mockTeachers: Teacher[] = [
  {
    id: "teacher-001",
    school_id: MOCK_SCHOOL_ID,
    name: "M. Kouassi",
    subjects: ["Physique-Chimie", "Mathématiques"],
    max_hours_per_week: 18,
    unavailabilities: {
      "wednesday_afternoon_14:00": true,
      "wednesday_afternoon_15:00": true,
    },
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "teacher-002",
    school_id: MOCK_SCHOOL_ID,
    name: "Mme Traoré",
    subjects: ["Français"],
    max_hours_per_week: 18,
    unavailabilities: {},
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "teacher-003",
    school_id: MOCK_SCHOOL_ID,
    name: "M. Diabaté",
    subjects: ["Mathématiques"],
    max_hours_per_week: 21,
    unavailabilities: {
      "saturday_morning_11:00": true,
    },
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "teacher-004",
    school_id: MOCK_SCHOOL_ID,
    name: "Mme Bamba",
    subjects: ["Anglais", "LV2"],
    max_hours_per_week: 18,
    unavailabilities: {},
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
];

export const mockRooms: Room[] = [
  {
    id: "room-001",
    school_id: MOCK_SCHOOL_ID,
    name: "Salle 1",
    capacity: 45,
    type: "standard",
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "room-002",
    school_id: MOCK_SCHOOL_ID,
    name: "Salle 2",
    capacity: 45,
    type: "standard",
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "room-003",
    school_id: MOCK_SCHOOL_ID,
    name: "Laboratoire PC",
    capacity: 30,
    type: "lab",
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "room-004",
    school_id: MOCK_SCHOOL_ID,
    name: "Terrain EPS",
    capacity: 60,
    type: "sports",
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
];

export const mockClassGroups: ClassGroup[] = [
  {
    id: "class-001",
    school_id: MOCK_SCHOOL_ID,
    level: "6eme",
    name: "6ème 1",
    student_count: 42,
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "class-002",
    school_id: MOCK_SCHOOL_ID,
    level: "3eme",
    name: "3ème 2",
    student_count: 38,
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "class-003",
    school_id: MOCK_SCHOOL_ID,
    level: "tle_d",
    name: "Tle D1",
    student_count: 35,
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
];

export const mockSubjects: Subject[] = [
  {
    id: "subj-001",
    school_id: MOCK_SCHOOL_ID,
    class_id: "class-003",
    name: "Mathématiques",
    weekly_hours_required: 6,
    requires_double_block: true,
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "subj-002",
    school_id: MOCK_SCHOOL_ID,
    class_id: "class-003",
    name: "Physique-Chimie",
    weekly_hours_required: 5,
    requires_double_block: true,
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "subj-003",
    school_id: MOCK_SCHOOL_ID,
    class_id: "class-003",
    name: "Français",
    weekly_hours_required: 4,
    requires_double_block: false,
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
];

export const mockTimetableEntries: TimetableEntry[] = [
  {
    id: "entry-001",
    school_id: MOCK_SCHOOL_ID,
    class_id: "class-003",
    teacher_id: "teacher-003",
    subject_id: "subj-001",
    room_id: "room-001",
    day_of_week: "monday",
    start_time: "08:00",
    end_time: "10:00",
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "entry-002",
    school_id: MOCK_SCHOOL_ID,
    class_id: "class-003",
    teacher_id: "teacher-001",
    subject_id: "subj-002",
    room_id: "room-003",
    day_of_week: "tuesday",
    start_time: "08:00",
    end_time: "10:00",
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
  {
    id: "entry-003",
    school_id: MOCK_SCHOOL_ID,
    class_id: "class-003",
    teacher_id: "teacher-002",
    subject_id: "subj-003",
    room_id: "room-002",
    day_of_week: "wednesday",
    start_time: "09:00",
    end_time: "10:00",
    created_at: "2025-09-01T08:00:00Z",
    updated_at: "2025-09-01T08:00:00Z",
  },
];
