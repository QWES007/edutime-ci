import {
  mockStore,
  type CreateClassInput,
  type CreateRoomInput,
  type CreateTeacherInput,
} from "@/lib/mock/store";
import { createClient, isMockMode } from "@/lib/supabase/client";
import type {
  ClassGroup,
  Profile,
  Room,
  School,
  Subject,
  Teacher,
  TimetableEntry,
} from "@/lib/types/database";

/**
 * Unified data service — routes to mock store or Supabase based on env config.
 * Default: mock mode (no credentials required).
 */
export const dataService = {
  async getSchool(): Promise<School> {
    if (isMockMode()) return mockStore.getSchool();
    const supabase = createClient();
    if (!supabase) return mockStore.getSchool();
    const { data } = await supabase.from("schools").select("*").single();
    return data ?? mockStore.getSchool();
  },

  async getProfile(): Promise<Profile> {
    if (isMockMode()) return mockStore.getProfile();
    const supabase = createClient();
    if (!supabase) return mockStore.getProfile();
    const { data } = await supabase.from("profiles").select("*").single();
    return data ?? mockStore.getProfile();
  },

  async listTeachers(): Promise<Teacher[]> {
    if (isMockMode()) return mockStore.listTeachers();
    const supabase = createClient();
    if (!supabase) return mockStore.listTeachers();
    const { data } = await supabase.from("teachers").select("*").order("name");
    return data ?? [];
  },

  async createTeacher(input: CreateTeacherInput): Promise<Teacher> {
    if (isMockMode()) {
      return mockStore.createTeacher({
        name: input.name,
        subjects: input.subjects,
        max_hours_per_week: input.max_hours_per_week ?? 18,
        unavailabilities: input.unavailabilities ?? {},
      });
    }
    const supabase = createClient();
    if (!supabase) {
      return mockStore.createTeacher({
        name: input.name,
        subjects: input.subjects,
        max_hours_per_week: input.max_hours_per_week ?? 18,
        unavailabilities: input.unavailabilities ?? {},
      });
    }
    const school = await this.getSchool();
    const { data, error } = await supabase
      .from("teachers")
      .insert({
        school_id: school.id,
        name: input.name,
        subjects: input.subjects,
        max_hours_per_week: input.max_hours_per_week ?? 18,
        unavailabilities: input.unavailabilities ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTeacher(
    id: string,
    updates: Partial<Teacher>
  ): Promise<Teacher | null> {
    if (isMockMode()) return mockStore.updateTeacher(id, updates);
    const supabase = createClient();
    if (!supabase) return mockStore.updateTeacher(id, updates);
    const { data, error } = await supabase
      .from("teachers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTeacher(id: string): Promise<boolean> {
    if (isMockMode()) return mockStore.deleteTeacher(id);
    const supabase = createClient();
    if (!supabase) return mockStore.deleteTeacher(id);
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    return !error;
  },

  async listRooms(): Promise<Room[]> {
    if (isMockMode()) return mockStore.listRooms();
    const supabase = createClient();
    if (!supabase) return mockStore.listRooms();
    const { data } = await supabase.from("rooms").select("*").order("name");
    return data ?? [];
  },

  async createRoom(input: CreateRoomInput): Promise<Room> {
    if (isMockMode()) return mockStore.createRoom(input);
    const supabase = createClient();
    if (!supabase) return mockStore.createRoom(input);
    const school = await this.getSchool();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ school_id: school.id, ...input })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listClassGroups(): Promise<ClassGroup[]> {
    if (isMockMode()) return mockStore.listClassGroups();
    const supabase = createClient();
    if (!supabase) return mockStore.listClassGroups();
    const { data } = await supabase
      .from("classgroups")
      .select("*")
      .order("name");
    return data ?? [];
  },

  async createClassGroup(input: CreateClassInput): Promise<ClassGroup> {
    if (isMockMode()) return mockStore.createClassGroup(input);
    const supabase = createClient();
    if (!supabase) return mockStore.createClassGroup(input);
    const school = await this.getSchool();
    const { data, error } = await supabase
      .from("classgroups")
      .insert({ school_id: school.id, ...input })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listSubjects(classId?: string): Promise<Subject[]> {
    if (isMockMode()) return mockStore.listSubjects(classId);
    const supabase = createClient();
    if (!supabase) return mockStore.listSubjects(classId);
    let query = supabase.from("subjects").select("*");
    if (classId) query = query.eq("class_id", classId);
    const { data } = await query;
    return data ?? [];
  },

  async listTimetableEntries(filters?: {
    classId?: string;
    teacherId?: string;
    roomId?: string;
  }): Promise<TimetableEntry[]> {
    if (isMockMode()) return mockStore.listTimetableEntries(filters);
    const supabase = createClient();
    if (!supabase) return mockStore.listTimetableEntries(filters);
    let query = supabase.from("timetable_entries").select("*");
    if (filters?.classId) query = query.eq("class_id", filters.classId);
    if (filters?.teacherId) query = query.eq("teacher_id", filters.teacherId);
    if (filters?.roomId) query = query.eq("room_id", filters.roomId);
    const { data } = await query;
    return data ?? [];
  },

  async replaceTimetableEntries(
    entries: TimetableEntry[]
  ): Promise<TimetableEntry[]> {
    if (isMockMode()) return mockStore.replaceTimetableEntries(entries);
    const supabase = createClient();
    if (!supabase) return mockStore.replaceTimetableEntries(entries);
    const school = await this.getSchool();
    await supabase
      .from("timetable_entries")
      .delete()
      .eq("school_id", school.id);
    const { data, error } = await supabase
      .from("timetable_entries")
      .insert(entries.map((e) => ({ ...e, school_id: school.id })))
      .select();
    if (error) throw error;
    return data ?? [];
  },

  getStats() {
    return mockStore.getStats();
  },
};
