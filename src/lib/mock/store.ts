import { getCurriculumForLevel } from "@/lib/constants/mena-curriculum";
import {
  MOCK_SCHOOL_ID,
  mockClassGroups,
  mockProfile,
  mockRooms,
  mockSchool,
  mockSubjects,
  mockTeachers,
  mockTimetableEntries,
} from "@/lib/mock/seed-data";
import type {
  ClassGroup,
  ClassLevel,
  Profile,
  Room,
  School,
  Subject,
  Teacher,
  TimetableEntry,
} from "@/lib/types/database";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

/**
 * In-memory mock store — persists for the lifetime of the dev server.
 * Allows instant demo without Supabase credentials.
 */
class MockStore {
  school: School = { ...mockSchool };
  profile: Profile = { ...mockProfile };
  teachers: Teacher[] = [...mockTeachers];
  rooms: Room[] = [...mockRooms];
  classGroups: ClassGroup[] = [...mockClassGroups];
  subjects: Subject[] = [...mockSubjects];
  timetableEntries: TimetableEntry[] = [...mockTimetableEntries];

  getSchool(): School {
    return this.school;
  }

  getProfile(): Profile {
    return this.profile;
  }

  listTeachers(): Teacher[] {
    return [...this.teachers];
  }

  getTeacher(id: string): Teacher | undefined {
    return this.teachers.find((t) => t.id === id);
  }

  createTeacher(
    data: Omit<Teacher, "id" | "school_id" | "created_at" | "updated_at">
  ): Teacher {
    const teacher: Teacher = {
      id: generateId("teacher"),
      school_id: MOCK_SCHOOL_ID,
      ...data,
      created_at: now(),
      updated_at: now(),
    };
    this.teachers.push(teacher);
    return teacher;
  }

  updateTeacher(id: string, data: Partial<Teacher>): Teacher | null {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) return null;
    this.teachers[index] = {
      ...this.teachers[index],
      ...data,
      updated_at: now(),
    };
    return this.teachers[index];
  }

  deleteTeacher(id: string): boolean {
    const before = this.teachers.length;
    this.teachers = this.teachers.filter((t) => t.id !== id);
    return this.teachers.length < before;
  }

  listRooms(): Room[] {
    return [...this.rooms];
  }

  createRoom(
    data: Omit<Room, "id" | "school_id" | "created_at" | "updated_at">
  ): Room {
    const room: Room = {
      id: generateId("room"),
      school_id: MOCK_SCHOOL_ID,
      ...data,
      created_at: now(),
      updated_at: now(),
    };
    this.rooms.push(room);
    return room;
  }

  updateRoom(id: string, data: Partial<Room>): Room | null {
    const index = this.rooms.findIndex((r) => r.id === id);
    if (index === -1) return null;
    this.rooms[index] = { ...this.rooms[index], ...data, updated_at: now() };
    return this.rooms[index];
  }

  deleteRoom(id: string): boolean {
    const before = this.rooms.length;
    this.rooms = this.rooms.filter((r) => r.id !== id);
    return this.rooms.length < before;
  }

  listClassGroups(): ClassGroup[] {
    return [...this.classGroups];
  }

  createClassGroup(
    data: Omit<ClassGroup, "id" | "school_id" | "created_at" | "updated_at">
  ): ClassGroup {
    const classGroup: ClassGroup = {
      id: generateId("class"),
      school_id: MOCK_SCHOOL_ID,
      ...data,
      created_at: now(),
      updated_at: now(),
    };
    this.classGroups.push(classGroup);
    this.seedSubjectsForClass(classGroup);
    return classGroup;
  }

  /** Auto-populate MENA subjects when a class is created */
  seedSubjectsForClass(classGroup: ClassGroup): void {
    const curriculum = getCurriculumForLevel(classGroup.level);
    if (!curriculum) return;

    for (const subj of curriculum.subjects) {
      this.subjects.push({
        id: generateId("subj"),
        school_id: MOCK_SCHOOL_ID,
        class_id: classGroup.id,
        name: subj.name,
        weekly_hours_required: subj.weekly_hours,
        requires_double_block: subj.requires_double_block ?? false,
        created_at: now(),
        updated_at: now(),
      });
    }
  }

  listSubjects(classId?: string): Subject[] {
    if (classId) {
      return this.subjects.filter((s) => s.class_id === classId);
    }
    return [...this.subjects];
  }

  updateSubject(id: string, data: Partial<Subject>): Subject | null {
    const index = this.subjects.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.subjects[index] = { ...this.subjects[index], ...data, updated_at: now() };
    return this.subjects[index];
  }

  listTimetableEntries(filters?: {
    classId?: string;
    teacherId?: string;
    roomId?: string;
  }): TimetableEntry[] {
    let entries = [...this.timetableEntries];
    if (filters?.classId) {
      entries = entries.filter((e) => e.class_id === filters.classId);
    }
    if (filters?.teacherId) {
      entries = entries.filter((e) => e.teacher_id === filters.teacherId);
    }
    if (filters?.roomId) {
      entries = entries.filter((e) => e.room_id === filters.roomId);
    }
    return entries;
  }

  replaceTimetableEntries(entries: TimetableEntry[]): TimetableEntry[] {
    this.timetableEntries = entries.map((e) => ({
      ...e,
      school_id: MOCK_SCHOOL_ID,
      updated_at: now(),
    }));
    return this.timetableEntries;
  }

  createTimetableEntry(
    data: Omit<TimetableEntry, "id" | "school_id" | "created_at" | "updated_at">
  ): TimetableEntry {
    const entry: TimetableEntry = {
      id: generateId("entry"),
      school_id: MOCK_SCHOOL_ID,
      ...data,
      created_at: now(),
      updated_at: now(),
    };
    this.timetableEntries.push(entry);
    return entry;
  }

  deleteTimetableEntry(id: string): boolean {
    const before = this.timetableEntries.length;
    this.timetableEntries = this.timetableEntries.filter((e) => e.id !== id);
    return this.timetableEntries.length < before;
  }

  getStats() {
    return {
      teachers: this.teachers.length,
      classes: this.classGroups.length,
      rooms: this.rooms.length,
      timetableSlots: this.timetableEntries.length,
    };
  }
}

export const mockStore = new MockStore();

export type CreateClassInput = {
  level: ClassLevel;
  name: string;
  student_count: number;
};

export type CreateTeacherInput = {
  name: string;
  subjects: string[];
  max_hours_per_week?: number;
  unavailabilities?: Teacher["unavailabilities"];
};

export type CreateRoomInput = {
  name: string;
  capacity: number;
  type: Room["type"];
};
