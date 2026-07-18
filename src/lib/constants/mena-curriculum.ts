import type {
  ClassLevel,
  CurriculumTemplate,
  DayOfWeek,
  TimeSlot,
} from "@/lib/types/database";

/** Official MENA weekly hour allocations for Ivorian secondary schools */
export const MENA_CURRICULUM: CurriculumTemplate[] = [
  {
    level: "6eme",
    cycle: "premier",
    label: "6ème",
    subjects: [
      { name: "Français", weekly_hours: 6 },
      { name: "Anglais", weekly_hours: 4 },
      { name: "Mathématiques", weekly_hours: 4, requires_double_block: true },
      { name: "SVT", weekly_hours: 2 },
      { name: "Histoire-Géographie", weekly_hours: 3 },
      { name: "Arts Plastiques", weekly_hours: 1 },
      { name: "EDHC", weekly_hours: 1 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
  {
    level: "5eme",
    cycle: "premier",
    label: "5ème",
    subjects: [
      { name: "Français", weekly_hours: 6 },
      { name: "Anglais", weekly_hours: 4 },
      { name: "Mathématiques", weekly_hours: 4, requires_double_block: true },
      { name: "SVT", weekly_hours: 2 },
      { name: "Physique-Chimie", weekly_hours: 2, requires_double_block: true },
      { name: "Histoire-Géographie", weekly_hours: 3 },
      { name: "Arts Plastiques", weekly_hours: 1 },
      { name: "EDHC", weekly_hours: 1 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
  {
    level: "4eme",
    cycle: "premier",
    label: "4ème",
    subjects: [
      { name: "Français", weekly_hours: 5 },
      { name: "Anglais", weekly_hours: 3 },
      { name: "LV2", weekly_hours: 3 },
      { name: "Mathématiques", weekly_hours: 4, requires_double_block: true },
      { name: "Physique-Chimie", weekly_hours: 3, requires_double_block: true },
      { name: "SVT", weekly_hours: 2 },
      { name: "Histoire-Géographie", weekly_hours: 3 },
      { name: "EDHC", weekly_hours: 1 },
      { name: "EPS", weekly_hours: 2 },
      { name: "Arts", weekly_hours: 1 },
    ],
  },
  {
    level: "3eme",
    cycle: "premier",
    label: "3ème",
    subjects: [
      { name: "Français", weekly_hours: 5 },
      { name: "Anglais", weekly_hours: 3 },
      { name: "LV2", weekly_hours: 3 },
      { name: "Mathématiques", weekly_hours: 4, requires_double_block: true },
      { name: "Physique-Chimie", weekly_hours: 3, requires_double_block: true },
      { name: "SVT", weekly_hours: 2 },
      { name: "Histoire-Géographie", weekly_hours: 3 },
      { name: "EDHC", weekly_hours: 1 },
      { name: "EPS", weekly_hours: 2 },
      { name: "Arts", weekly_hours: 1 },
    ],
  },
  {
    level: "2nde_c",
    cycle: "second",
    label: "2nde C",
    subjects: [
      { name: "Mathématiques", weekly_hours: 5, requires_double_block: true },
      { name: "Physique-Chimie", weekly_hours: 5, requires_double_block: true },
      { name: "SVT", weekly_hours: 4 },
      { name: "Français", weekly_hours: 4 },
      { name: "Anglais", weekly_hours: 3 },
      { name: "Histoire-Géographie", weekly_hours: 3 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
  {
    level: "2nde_a",
    cycle: "second",
    label: "2nde A",
    subjects: [
      { name: "Français", weekly_hours: 6 },
      { name: "Anglais", weekly_hours: 4 },
      { name: "LV2", weekly_hours: 4 },
      { name: "Mathématiques", weekly_hours: 2 },
      { name: "SVT", weekly_hours: 2 },
      { name: "Histoire-Géographie", weekly_hours: 4 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
  {
    level: "1ere_d",
    cycle: "second",
    label: "1ère D",
    subjects: [
      { name: "Mathématiques", weekly_hours: 6, requires_double_block: true },
      { name: "Physique-Chimie", weekly_hours: 5, requires_double_block: true },
      { name: "SVT", weekly_hours: 4 },
      { name: "Français", weekly_hours: 4 },
      { name: "Anglais", weekly_hours: 3 },
      { name: "Histoire-Géographie", weekly_hours: 3 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
  {
    level: "1ere_c",
    cycle: "second",
    label: "1ère C",
    subjects: [
      { name: "Mathématiques", weekly_hours: 6, requires_double_block: true },
      { name: "Physique-Chimie", weekly_hours: 5, requires_double_block: true },
      { name: "SVT", weekly_hours: 4 },
      { name: "Français", weekly_hours: 4 },
      { name: "Anglais", weekly_hours: 3 },
      { name: "Histoire-Géographie", weekly_hours: 3 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
  {
    level: "1ere_a",
    cycle: "second",
    label: "1ère A",
    subjects: [
      { name: "Français", weekly_hours: 6 },
      { name: "Anglais", weekly_hours: 4 },
      { name: "LV2", weekly_hours: 4 },
      { name: "Mathématiques", weekly_hours: 2 },
      { name: "Histoire-Géographie", weekly_hours: 4 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
  {
    level: "tle_d",
    cycle: "second",
    label: "Tle D",
    subjects: [
      { name: "Mathématiques", weekly_hours: 6, requires_double_block: true },
      { name: "Physique-Chimie", weekly_hours: 5, requires_double_block: true },
      { name: "SVT", weekly_hours: 4 },
      { name: "Français", weekly_hours: 4 },
      { name: "Philosophie", weekly_hours: 4 },
      { name: "Anglais", weekly_hours: 3 },
      { name: "Histoire-Géographie", weekly_hours: 3 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
  {
    level: "tle_c",
    cycle: "second",
    label: "Tle C",
    subjects: [
      { name: "Mathématiques", weekly_hours: 6, requires_double_block: true },
      { name: "Physique-Chimie", weekly_hours: 5, requires_double_block: true },
      { name: "SVT", weekly_hours: 4 },
      { name: "Français", weekly_hours: 4 },
      { name: "Philosophie", weekly_hours: 4 },
      { name: "Anglais", weekly_hours: 3 },
      { name: "Histoire-Géographie", weekly_hours: 3 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
  {
    level: "tle_a",
    cycle: "second",
    label: "Tle A",
    subjects: [
      { name: "Français", weekly_hours: 6 },
      { name: "Philosophie", weekly_hours: 4 },
      { name: "Anglais", weekly_hours: 4 },
      { name: "LV2", weekly_hours: 4 },
      { name: "Mathématiques", weekly_hours: 2 },
      { name: "Histoire-Géographie", weekly_hours: 4 },
      { name: "EPS", weekly_hours: 2 },
    ],
  },
];

export const CLASS_LEVEL_OPTIONS: { value: ClassLevel; label: string }[] =
  MENA_CURRICULUM.map((c) => ({ value: c.level, label: c.label }));

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
};

/**
 * Ivorian school rhythm — weekly time slots.
 * HARD RULES:
 * - Wednesday afternoon: BLOCKED (Conseils d'Enseignement / Unités Pédagogiques)
 * - Saturday afternoon: BLOCKED
 * - School runs Monday to Saturday noon
 */
const MORNING_SLOTS = ["07:00", "08:00", "09:00", "10:00", "11:00"];
const AFTERNOON_SLOTS = ["14:00", "15:00", "16:00", "17:00"];

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function addHour(time: string): string {
  const hour = parseInt(time.split(":")[0], 10);
  return `${String(hour + 1).padStart(2, "0")}:00`;
}

function isSlotAvailable(day: DayOfWeek, period: "morning" | "afternoon"): boolean {
  if (day === "wednesday" && period === "afternoon") return false;
  if (day === "saturday" && period === "afternoon") return false;
  return true;
}

export function generateWeeklyTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (const day of DAYS) {
    for (const start of MORNING_SLOTS) {
      const period = "morning" as const;
      slots.push({
        key: `${day}_${period}_${start}`,
        day,
        start_time: start,
        end_time: addHour(start),
        period,
        is_available: isSlotAvailable(day, period),
        duration_hours: 1,
      });
    }

    for (const start of AFTERNOON_SLOTS) {
      const period = "afternoon" as const;
      slots.push({
        key: `${day}_${period}_${start}`,
        day,
        start_time: start,
        end_time: addHour(start),
        period,
        is_available: isSlotAvailable(day, period),
        duration_hours: 1,
      });
    }
  }

  return slots;
}

export const WEEKLY_TIME_SLOTS = generateWeeklyTimeSlots();

export function getCurriculumForLevel(level: ClassLevel) {
  return MENA_CURRICULUM.find((c) => c.level === level);
}

export function getPlanLimits(plan: "starter" | "pro" | "enterprise") {
  const limits = {
    starter: { max_teachers: 30, max_classes: 20, price_fcfa: 15000 },
    pro: { max_teachers: 80, max_classes: 60, price_fcfa: 35000 },
    enterprise: { max_teachers: 999, max_classes: 999, price_fcfa: 0 },
  };
  return limits[plan];
}
