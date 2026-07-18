import type { DayOfWeek, TimeSlot } from "@/lib/types/database";
import { WEEKLY_TIME_SLOTS } from "@/lib/constants/mena-curriculum";

/** Slots allowed by Ivorian school rhythm (excludes Wed PM & Sat PM). */
export const AVAILABLE_SLOTS = WEEKLY_TIME_SLOTS.filter((s) => s.is_available);

export function slotKey(day: DayOfWeek, period: string, start: string): string {
  return `${day}_${period}_${start}`;
}

export function entryKey(
  entityId: string,
  day: DayOfWeek,
  start: string
): string {
  return `${entityId}|${day}|${start}`;
}

export function parseHour(time: string): number {
  return parseInt(time.split(":")[0], 10);
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** Two consecutive 1h slots forming a 2h block within the same period. */
export interface DoubleBlock {
  day: DayOfWeek;
  period: "morning" | "afternoon";
  start_time: string;
  end_time: string;
  slots: [TimeSlot, TimeSlot];
}

export function getDoubleBlocks(): DoubleBlock[] {
  const blocks: DoubleBlock[] = [];
  const byDayPeriod = new Map<string, TimeSlot[]>();

  for (const slot of AVAILABLE_SLOTS) {
    const key = `${slot.day}_${slot.period}`;
    const group = byDayPeriod.get(key) ?? [];
    group.push(slot);
    byDayPeriod.set(key, group);
  }

  for (const slots of byDayPeriod.values()) {
    const sorted = [...slots].sort(
      (a, b) => parseHour(a.start_time) - parseHour(b.start_time)
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (current.end_time === next.start_time) {
        blocks.push({
          day: current.day,
          period: current.period,
          start_time: current.start_time,
          end_time: next.end_time,
          slots: [current, next],
        });
      }
    }
  }

  return blocks;
}

export const DOUBLE_BLOCKS = getDoubleBlocks();

export function isBlockedByMenaRhythm(day: DayOfWeek, period: string): boolean {
  if (day === "wednesday" && period === "afternoon") {
    return true;
  }
  if (day === "saturday" && period === "afternoon") {
    return true;
  }
  return false;
}

export function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = parseHour(startA);
  const aEnd = parseHour(endA);
  const bStart = parseHour(startB);
  const bEnd = parseHour(endB);
  return aStart < bEnd && bStart < aEnd;
}
