import type {
  DayOfWeek,
  Room,
  ScheduleGenerationStats,
  Subject,
  Teacher,
  TimetableEntry,
} from "@/lib/types/database";
import { entryKey, overlaps } from "@/lib/scheduling/slots";

export interface ConstraintViolation {
  type:
    | "teacher_clash"
    | "class_clash"
    | "room_clash"
    | "teacher_max_hours"
    | "teacher_unavailable"
    | "mena_blocked_slot";
  message: string;
}

export function isTeacherUnavailable(
  teacher: Teacher,
  day: DayOfWeek,
  period: string,
  start: string
): boolean {
  const key = `${day}_${period}_${start}`;
  return Boolean(teacher.unavailabilities[key]);
}

export function isMenaBlockedSlot(
  day: DayOfWeek,
  period: string
): boolean {
  if (day === "wednesday" && period === "afternoon") return true;
  if (day === "saturday" && period === "afternoon") return true;
  return false;
}

export function getTeacherWeeklyHours(
  teacherId: string,
  entries: TimetableEntry[]
): number {
  return entries
    .filter((e) => e.teacher_id === teacherId)
    .reduce((sum, e) => {
      const start = parseInt(e.start_time.split(":")[0], 10);
      const end = parseInt(e.end_time.split(":")[0], 10);
      return sum + (end - start);
    }, 0);
}

export function validatePlacement(
  entry: Pick<
    TimetableEntry,
    "class_id" | "teacher_id" | "room_id" | "day_of_week" | "start_time" | "end_time"
  >,
  existing: TimetableEntry[],
  teacher: Teacher,
  period: "morning" | "afternoon"
): ConstraintViolation | null {
  if (isMenaBlockedSlot(entry.day_of_week, period)) {
    return {
      type: "mena_blocked_slot",
      message:
        "Créneau interdit : mercredi après-midi (CE/UP) ou samedi après-midi.",
    };
  }

  if (
    isTeacherUnavailable(
      teacher,
      entry.day_of_week,
      period,
      entry.start_time
    )
  ) {
    return {
      type: "teacher_unavailable",
      message: `${teacher.name} n'est pas disponible à ce créneau.`,
    };
  }

  const duration =
    parseInt(entry.end_time.split(":")[0], 10) -
    parseInt(entry.start_time.split(":")[0], 10);
  const currentHours = getTeacherWeeklyHours(entry.teacher_id, existing);
  if (currentHours + duration > teacher.max_hours_per_week) {
    return {
      type: "teacher_max_hours",
      message: `${teacher.name} dépasse le quota horaire (${teacher.max_hours_per_week}h).`,
    };
  }

  for (const other of existing) {
    if (!overlaps(entry.start_time, entry.end_time, other.start_time, other.end_time)) {
      continue;
    }
    if (other.day_of_week !== entry.day_of_week) continue;

    if (other.teacher_id === entry.teacher_id) {
      return {
        type: "teacher_clash",
        message: `${teacher.name} est déjà assigné à ce créneau.`,
      };
    }
    if (other.class_id === entry.class_id) {
      return {
        type: "class_clash",
        message: "La classe a déjà un cours à ce créneau.",
      };
    }
    if (other.room_id === entry.room_id) {
      return {
        type: "room_clash",
        message: "La salle est déjà occupée à ce créneau.",
      };
    }
  }

  return null;
}

export function computeStats(
  subjects: Subject[],
  entries: TimetableEntry[],
  totalRequired: number,
  assignedHours: number,
  conflictsResolved: number,
  startMs: number
): ScheduleGenerationStats {
  const totalHoursRequired = totalRequired;
  const totalHoursAssigned = assignedHours;
  const unassigned = totalHoursRequired - totalHoursAssigned;

  return {
    total_hours_required: totalHoursRequired,
    total_hours_assigned: totalHoursAssigned,
    assignment_percentage:
      totalHoursRequired > 0
        ? Math.round((totalHoursAssigned / totalHoursRequired) * 100)
        : 100,
    conflicts_resolved: conflictsResolved,
    unassigned_hours: Math.max(0, unassigned),
    generation_time_ms: Date.now() - startMs,
  };
}

export function subjectNeedsLab(name: string): boolean {
  return ["Physique-Chimie", "SVT"].includes(name);
}

export function subjectNeedsSports(name: string): boolean {
  return name === "EPS";
}

export function pickRoom(
  rooms: Room[],
  subjectName: string,
  studentCount: number,
  entries: TimetableEntry[],
  day: DayOfWeek,
  start: string,
  end: string
): Room | null {
  const candidates = rooms.filter((r) => r.capacity >= studentCount);

  const preferType = subjectNeedsSports(subjectName)
    ? "sports"
    : subjectNeedsLab(subjectName)
      ? "lab"
      : "standard";

  const sorted = [
    ...candidates.filter((r) => r.type === preferType),
    ...candidates.filter((r) => r.type !== preferType),
  ];

  for (const room of sorted) {
    const hasOverlap = entries.some(
      (e) =>
        e.room_id === room.id &&
        e.day_of_week === day &&
        overlaps(start, end, e.start_time, e.end_time)
    );
    if (!hasOverlap) return room;
  }

  return sorted[0] ?? null;
}

export function teacherTeachesSubject(
  teacher: Teacher,
  subjectName: string
): boolean {
  return teacher.subjects.some(
    (s) => s.toLowerCase() === subjectName.toLowerCase()
  );
}

export function buildBusySets(entries: TimetableEntry[]) {
  const classBusy = new Set<string>();
  const teacherBusy = new Set<string>();
  const roomBusy = new Set<string>();

  for (const e of entries) {
    classBusy.add(entryKey(e.class_id, e.day_of_week, e.start_time));
    teacherBusy.add(entryKey(e.teacher_id, e.day_of_week, e.start_time));
    roomBusy.add(entryKey(e.room_id, e.day_of_week, e.start_time));
  }

  return { classBusy, teacherBusy, roomBusy };
}
