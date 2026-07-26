export interface TimeSlot {
  id: string;
  name: string;
  start: string; // ex: "07:00"
  end: string;   // ex: "07:55"
}

export interface ScheduleItem {
  id: string;
  day: string;
  timeSlot: string; // ID ou Name du slot
  subject: string;
  teacher: string;
  room: string;
  classId: string; // Ajouté pour le suivi interne
}

export interface ScheduleGenerationResult {
  success: boolean;
  schedule: ScheduleItem[];
  message?: string; // Pour afficher les erreurs de faisabilité
  stats: {
    total_hours_required: number;
    total_hours_assigned: number;
    assignment_percentage: number;
    generation_time_ms: number;
  };
}

// L'interface des requêtes de cours que le moteur doit placer
export interface CourseRequest {
  id: string;
  classId: string;
  className: string;
  subject: string;
  duration: number; // en créneaux (ex: 1, 2)
  teacherId: string;
  requiresLab: boolean;
  isEPS: boolean;
  doubleVacation: "none" | "A" | "B";
}

// Fonction utilitaire pour éviter l'erreur "overlaps is not defined"
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function checkOverlap(slotA: { start: string; end: string }, slotB: { start: string; end: string }): boolean {
  const startA = parseTimeToMinutes(slotA.start);
  const endA = parseTimeToMinutes(slotA.end);
  const startB = parseTimeToMinutes(slotB.start);
  const endB = parseTimeToMinutes(slotB.end);
  return startA < endB && startB < endA;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const SLOTS_PER_DAY = 10; // M1 à M5 (matin), A1 à A5 (après-midi)
const MAX_ITERATIONS = 50000; // Bloque la récursivité infinie

export class SchedulingEngine {
  private timetable: ScheduleItem[] = [];
  private iterations = 0;
  private bestTimetable: ScheduleItem[] = [];
  private maxPlacedCount = 0;

  // 1. Sanity Check : Est-ce mathématiquement possible ?
  private runSanityCheck(courses: CourseRequest[], teacherAvailabilities: Record<string, number>): string | null {
    const teacherHours = new Map<string, number>();
    for (const course of courses) {
      teacherHours.set(course.teacherId, (teacherHours.get(course.teacherId) || 0) + course.duration);
    }
    for (const [teacherId, hoursRequired] of teacherHours.entries()) {
      const available = teacherAvailabilities[teacherId] || 40; 
      if (hoursRequired > available) {
        return `Le professeur ${teacherId} doit effectuer ${hoursRequired}h mais n'a que ${available}h de disponibilité.`;
      }
    }
    return null;
  }

  // 2. MRV Heuristique : Trier du plus difficile au plus facile
  private sortCoursesByDifficulty(courses: CourseRequest[]): CourseRequest[] {
    return [...courses].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.duration > 1) scoreA += 50;
      if (b.duration > 1) scoreB += 50;
      if (a.requiresLab) scoreA += 40;
      if (b.requiresLab) scoreB += 40;
      if (a.doubleVacation !== "none") scoreA += 30;
      if (b.doubleVacation !== "none") scoreB += 30;
      if (a.isEPS) scoreA += 20;
      if (b.isEPS) scoreB += 20;

      return scoreB - scoreA;
    });
  }

  // Vérification stricte des conflits
  private isValidPlacement(course: CourseRequest, day: string, timeIndex: number): boolean {
    const isMorning = timeIndex < 5;
    if (course.doubleVacation === "A" && !isMorning) return false;
    if (course.doubleVacation === "B" && isMorning) return false;

    for (let i = 0; i < course.duration; i++) {
      const checkTime = timeIndex + i;
      if (checkTime >= SLOTS_PER_DAY) return false; 
      // Empêche le chevauchement Matin/Aprem (pause de midi)
      if (timeIndex < 5 && checkTime >= 5) return false;

      const slotId = `slot_${checkTime}`;
      const conflict = this.timetable.some(p => 
        p.day === day && 
        p.timeSlot === slotId &&
        (p.teacher === course.teacherId || p.classId === course.classId)
      );

      if (conflict) return false;
    }
    return true;
  }

  // 3. Backtracking Récursif
  private solve(courses: CourseRequest[], index: number): boolean {
    this.iterations++;

    if (index === courses.length) {
      this.bestTimetable = [...this.timetable];
      this.maxPlacedCount = this.timetable.length;
      return true;
    }

    if (this.iterations > MAX_ITERATIONS) {
      if (this.timetable.length > this.maxPlacedCount) {
        this.maxPlacedCount = this.timetable.length;
        this.bestTimetable = [...this.timetable];
      }
      return false;
    }

    const currentCourse = courses[index];

    for (const day of DAYS) {
      for (let timeIndex = 0; timeIndex < SLOTS_PER_DAY; timeIndex++) {
        if (this.isValidPlacement(currentCourse, day, timeIndex)) {
          
          const placementsToAdd: ScheduleItem[] = [];
          for (let i = 0; i < currentCourse.duration; i++) {
            placementsToAdd.push({
              id: `${currentCourse.id}_${i}`,
              day: day,
              timeSlot: `slot_${timeIndex + i}`,
              subject: currentCourse.subject,
              teacher: currentCourse.teacherId,
              room: currentCourse.requiresLab ? "LABO-01" : "SALLE-STD", // Logique de salle basique
              classId: currentCourse.classId
            });
          }

          this.timetable.push(...placementsToAdd);

          if (this.solve(courses, index + 1)) {
            return true;
          }

          // Backtrack : Retirer les éléments ajoutés
          for (let i = 0; i < currentCourse.duration; i++) {
            this.timetable.pop();
          }
        }
      }
    }
    return false;
  }

  // Méthode principale async pour l'UI
  async generate(courses: CourseRequest[] = [], teacherAvailabilities: Record<string, number> = {}): Promise<ScheduleGenerationResult> {
    const startTime = performance.now();
    this.timetable = [];
    this.iterations = 0;
    this.bestTimetable = [];
    this.maxPlacedCount = 0;

    // Si la liste est vide (par ex. premier chargement de l'UI), renvoyer une base propre
    if (courses.length === 0) {
      return {
        success: true,
        schedule: [],
        stats: { total_hours_required: 0, total_hours_assigned: 0, assignment_percentage: 100, generation_time_ms: 0 }
      };
    }

    const sanityError = this.runSanityCheck(courses, teacherAvailabilities);
    if (sanityError) {
      return {
        success: false,
        message: sanityError,
        schedule: [],
        stats: { total_hours_required: courses.length, total_hours_assigned: 0, assignment_percentage: 0, generation_time_ms: Math.round(performance.now() - startTime) }
      };
    }

    const sortedCourses = this.sortCoursesByDifficulty(courses);
    const isSuccess = this.solve(sortedCourses, 0);
    const endTime = performance.now();

    // Calcul des statistiques
    const totalRequired = courses.reduce((acc, curr) => acc + curr.duration, 0);
    const totalAssigned = this.bestTimetable.length; // 1 item = 1 slot d'1 heure
    const percentage = totalRequired === 0 ? 100 : Math.round((totalAssigned / totalRequired) * 100);

    return {
      success: isSuccess || percentage >= 95,
      schedule: this.bestTimetable,
      stats: {
        total_hours_required: totalRequired,
        total_hours_assigned: totalAssigned,
        assignment_percentage: percentage,
        generation_time_ms: Math.round(endTime - startTime),
      },
    };
  }
}

export const schedulingEngine = new SchedulingEngine();