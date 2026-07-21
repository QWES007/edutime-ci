"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Building2, Calendar, Play, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

type DayOfWeek = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi';

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  maxHoursPerWeek: number;
  unavailabilities: string[];
}

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

interface ClassGroup {
  id: string;
  name: string;
  level: string;
  studentCount: number;
  subjectHours: Record<string, number>;
  doubleVacation?: 'A' | 'B' | 'none';
}

interface AllocationRequest {
  classGroupId: string;
  subjectId: string;
  teacherId: string;
  blockSize: number;
  actualHours?: number;
}

const DAYS: DayOfWeek[] = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const TIME_SLOTS = [
  { id: "M1", period: "Matin" }, { id: "M2", period: "Matin" }, { id: "M3", period: "Matin" }, { id: "M4", period: "Matin" }, { id: "M5", period: "Matin" },
  { id: "A1", period: "Après-midi" }, { id: "A2", period: "Après-midi" }, { id: "A3", period: "Après-midi" }, { id: "A4", period: "Après-midi" }, { id: "A5", period: "Après-midi" }
];

const SLOT_INDEX_MAP: Record<string, number> = {
  M1: 0, M2: 1, M3: 2, M4: 3, M5: 4,
  A1: 5, A2: 6, A3: 7, A4: 8, A5: 9
};

const isSvtPcFirstCycleLevel = (level: string) => ['6ème', '5ème', '4ème'].includes(level);
const isSvtPc1h30 = (level: string, subId: string) => isSvtPcFirstCycleLevel(level) && ['SVT', 'PC'].includes(subId.toUpperCase());

function hasInvalidGaps(slots: string[]): boolean {
  const morningIndices: number[] = [];
  const afternoonIndices: number[] = [];

  for (let i = 0; i < slots.length; i++) {
    const idx = SLOT_INDEX_MAP[slots[i]];
    if (idx !== undefined) {
      if (idx <= 4) morningIndices.push(idx);
      else afternoonIndices.push(idx);
    }
  }

  if (morningIndices.length > 1) {
    morningIndices.sort((a, b) => a - b);
    let consecutiveEmpty = 0;
    let maxConsecutiveEmpty = 0;
    const minVal = morningIndices[0];
    const maxVal = morningIndices[morningIndices.length - 1];
    const presence = [false, false, false, false, false];
    for (let i = 0; i < morningIndices.length; i++) presence[morningIndices[i]] = true;

    for (let i = minVal; i <= maxVal; i++) {
      if (!presence[i]) {
        consecutiveEmpty++;
        if (consecutiveEmpty > maxConsecutiveEmpty) maxConsecutiveEmpty = consecutiveEmpty;
      } else consecutiveEmpty = 0;
    }
    if (maxConsecutiveEmpty >= 2) return true;
  }

  if (afternoonIndices.length > 1) {
    afternoonIndices.sort((a, b) => a - b);
    let consecutiveEmpty = 0;
    let maxConsecutiveEmpty = 0;
    const minVal = afternoonIndices[0];
    const maxVal = afternoonIndices[afternoonIndices.length - 1];
    const presence = [false, false, false, false, false, false, false, false, false, false];
    for (let i = 0; i < afternoonIndices.length; i++) presence[afternoonIndices[i]] = true;

    for (let i = minVal; i <= maxVal; i++) {
      if (!presence[i]) {
        consecutiveEmpty++;
        if (consecutiveEmpty > maxConsecutiveEmpty) maxConsecutiveEmpty = consecutiveEmpty;
      } else consecutiveEmpty = 0;
    }
    if (maxConsecutiveEmpty >= 2) return true;
  }

  return false;
}

function isSlotBlockedByDoubleVacation(doubleVacation: 'A' | 'B' | 'none' | undefined, day: DayOfWeek, slotId: string): boolean {
  if (!doubleVacation || doubleVacation === 'none') return false;
  const slot = TIME_SLOTS.find(s => s.id === slotId);
  if (!slot) return false;

  if (['Lundi', 'Mercredi', 'Vendredi'].includes(day)) {
    if (doubleVacation === 'A') return slot.period === 'Après-midi';
    if (doubleVacation === 'B') return slot.period === 'Matin';
  }
  if (['Mardi', 'Jeudi'].includes(day)) {
    if (doubleVacation === 'A') return slot.period === 'Matin';
    if (doubleVacation === 'B') return slot.period === 'Après-midi';
  }
  return false;
}

export default function ScheduleGeneratorPage() {
  const supabase = createClient();
  const [isMounted, setIsMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataCount, setDataCount] = useState({ teachers: 0, classes: 0, rooms: 0 });

  const [rawTeachers, setRawTeachers] = useState<Teacher[]>([]);
  const [rawClasses, setRawClasses] = useState<ClassGroup[]>([]);
  const [rawRooms, setRawRooms] = useState<Room[]>([]);

  const [stats, setStats] = useState<{
    successRate: number;
    conflicts: number;
    hoursPlanned: number;
    executionTime: number;
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);

    const loadRealData = async () => {
      let t: Teacher[] = [];
      let c: ClassGroup[] = [];
      let r: Room[] = [];

      if (supabase) {
        try {
          const [tRes, cRes, rRes] = await Promise.all([
            supabase.from("teachers").select("*"),
            supabase.from("classgroups").select("*"),
            supabase.from("rooms").select("*"),
          ]);

          if (tRes.data) {
            t = tRes.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              subjects: Array.isArray(item.subjects) ? item.subjects.map((s: string) => String(s).toUpperCase()) : [String(item.subject || "MATHS").toUpperCase()],
              maxHoursPerWeek: Number(item.max_hours_per_week || item.weekly_hours || 18),
              unavailabilities: Object.keys(item.unavailabilities || {}),
            }));
          }

          if (cRes.data) {
            c = cRes.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              level: item.level || "6ème",
              studentCount: Number(item.student_count || 45),
              subjectHours: item.subject_hours || {},
              doubleVacation: item.double_vacation || "none",
            }));
          }

          if (rRes.data) {
            r = rRes.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              type: String(item.type || "Standard").toLowerCase().includes("lab") ? "Lab" : String(item.type || "Standard").toLowerCase().includes("sport") ? "Sports" : "Standard",
              capacity: Number(item.capacity || 50),
            }));
          }
        } catch (e) {
          console.error("Erreur Supabase :", e);
        }
      }

      setRawTeachers(t);
      setRawClasses(c);
      setRawRooms(r);
      setDataCount({ teachers: t.length, classes: c.length, rooms: r.length });
    };

    loadRealData();
  }, []);

  const handleGenerate = async () => {
    if (rawClasses.length === 0 || rawTeachers.length === 0) {
      alert("Veuillez d'abord configurer au moins une classe et un enseignant.");
      return;
    }

    setIsGenerating(true);
    const startTimeMs = Date.now();
    let conflictsSolved = 0;

    const teacherSchedules: Record<string, Record<string, string>> = {};
    const classSchedules: Record<string, Record<string, { subjectId: string; teacherId: string; roomId: string }>> = {};
    const roomSchedules: Record<string, Record<string, string>> = {};
    const teacherAssignedHours: Record<string, number> = {};

    rawTeachers.forEach(t => {
      teacherSchedules[t.id] = {};
      teacherAssignedHours[t.id] = 0;
    });
    rawClasses.forEach(c => { classSchedules[c.id] = {}; });
    rawRooms.forEach(r => { roomSchedules[r.id] = {}; });

    const classSubjectTeacherMap: Record<string, string> = {};

    rawClasses.forEach(cg => {
      Object.keys(cg.subjectHours).forEach(subId => {
        const cleanSubId = subId.toUpperCase();
        const eligibleTeachers = rawTeachers.filter(t => t.subjects.includes(cleanSubId));

        if (eligibleTeachers.length > 0) {
          eligibleTeachers.sort((a, b) => {
            const aRemaining = a.maxHoursPerWeek - (teacherAssignedHours[a.id] || 0);
            const bRemaining = b.maxHoursPerWeek - (teacherAssignedHours[b.id] || 0);
            return bRemaining - aRemaining;
          });
          classSubjectTeacherMap[`${cg.id}_${cleanSubId}`] = eligibleTeachers[0].id;
        } else if (rawTeachers.length > 0) {
          classSubjectTeacherMap[`${cg.id}_${cleanSubId}`] = rawTeachers[0].id;
        }
      });
    });

    const requests: AllocationRequest[] = [];

    rawClasses.forEach(cg => {
      Object.entries(cg.subjectHours).forEach(([subId, totalHours]) => {
        const cleanSubId = subId.toUpperCase();
        const teacherId = classSubjectTeacherMap[`${cg.id}_${cleanSubId}`];
        if (!teacherId) return;

        if (isSvtPc1h30(cg.level, cleanSubId)) {
          requests.push({ classGroupId: cg.id, subjectId: cleanSubId, teacherId, blockSize: 2, actualHours: 1.5 });
          return;
        }

        let remainingHours = Number(totalHours) || 0;
        const isBlockPreferred = ['MATHS', 'PC', 'FR', 'SVT', 'PHILO', 'EPS'].includes(cleanSubId);

        if (isBlockPreferred || remainingHours > 2) {
          while (remainingHours >= 2) {
            requests.push({ classGroupId: cg.id, subjectId: cleanSubId, teacherId, blockSize: 2 });
            remainingHours -= 2;
          }
        }
        while (remainingHours > 0) {
          requests.push({ classGroupId: cg.id, subjectId: cleanSubId, teacherId, blockSize: 1 });
          remainingHours -= 1;
        }
      });
    });

    const getLevelPriority = (level: string): number => {
      if (level.startsWith('Tle')) return 4;
      if (level.startsWith('1ère')) return 3;
      if (level === '3ème') return 2.5;
      if (level.startsWith('2nde')) return 2;
      return 1;
    };

    requests.sort((a, b) => {
      const classA = rawClasses.find(c => c.id === a.classGroupId)!;
      const classB = rawClasses.find(c => c.id === b.classGroupId)!;
      const prioA = getLevelPriority(classA?.level || '');
      const prioB = getLevelPriority(classB?.level || '');
      if (prioA !== prioB) return prioB - prioA;
      return b.blockSize - a.blockSize;
    });

    const isAfternoonRestPeriod = (day: DayOfWeek, slotId: string): boolean => {
      if (day === 'Mercredi') {
        const slotIndex = TIME_SLOTS.findIndex(s => s.id === slotId);
        return slotIndex >= 5;
      }
      return false;
    };

    const getEligibleRooms = (subId: string, neededCapacity: number): Room[] => {
      let filtered = rawRooms;
      const clean = subId.toUpperCase();
      if (clean === 'EPS') {
        filtered = rawRooms.filter(r => r.type === 'Sports');
      } else if (['PC', 'SVT'].includes(clean)) {
        const labs = rawRooms.filter(r => r.type === 'Lab' && r.capacity >= neededCapacity);
        if (labs.length > 0) return labs;
        filtered = rawRooms.filter(r => r.type === 'Standard');
      } else {
        filtered = rawRooms.filter(r => r.type === 'Standard');
      }
      if (filtered.length === 0) filtered = rawRooms;
      return filtered.sort((a, b) => a.capacity - b.capacity);
    };

    const entries: any[] = [];
    const unplacedRequests: AllocationRequest[] = [];
    let totalTries = 0;
    const TRY_LIMIT = 5000;

    for (let rIndex = 0; rIndex < requests.length; rIndex++) {
      if (totalTries >= TRY_LIMIT) {
        for (let j = rIndex; j < requests.length; j++) unplacedRequests.push(requests[j]);
        break;
      }

      const req = requests[rIndex];
      const classGroup = rawClasses.find(c => c.id === req.classGroupId)!;
      const teacher = rawTeachers.find(t => t.id === req.teacherId)!;

      if (!classGroup || !teacher) continue;

      const blockHoursToAssign = req.actualHours !== undefined ? req.actualHours : req.blockSize;
      if (teacherAssignedHours[teacher.id] + blockHoursToAssign > teacher.maxHoursPerWeek) {
        unplacedRequests.push(req);
        conflictsSolved++;
        continue;
      }

      let placed = false;
      const isFirstCycle = ['6ème', '5ème', '4ème', '3ème'].includes(classGroup.level);
      const dayOrder: DayOfWeek[] = isFirstCycle
        ? ['Mercredi', 'Lundi', 'Mardi', 'Jeudi', 'Vendredi']
        : ['Lundi', 'Mardi', 'Jeudi', 'Vendredi', 'Mercredi'];

      for (const strictGaps of [true, false]) {
        if (placed || totalTries >= TRY_LIMIT) break;

        for (const day of dayOrder) {
          if (placed || totalTries >= TRY_LIMIT) break;

          let hoursOnDay = 0;
          for (const [key, value] of Object.entries(classSchedules[classGroup.id] || {})) {
            if (key.startsWith(`${day}-`) && value.subjectId === req.subjectId) hoursOnDay++;
          }
          if (hoursOnDay + req.blockSize > 2) continue;

          const totalSlots = TIME_SLOTS.length;

          for (let i = 0; i <= totalSlots - req.blockSize; i++) {
            totalTries++;
            if (totalTries >= TRY_LIMIT) break;

            const slotsToTest = TIME_SLOTS.slice(i, i + req.blockSize);
            const isLunchSpan = slotsToTest.some(s => s.period === 'Matin') && slotsToTest.some(s => s.period === 'Après-midi');
            if (isLunchSpan) continue;

            if (req.subjectId.toUpperCase() === 'EPS') {
              let epsSlotsOk = true;
              for (const slot of slotsToTest) {
                if (isFirstCycle) {
                  if (!['M1', 'M2', 'M3'].includes(slot.id)) { epsSlotsOk = false; break; }
                } else {
                  if (!['A2', 'A3', 'A4', 'A5'].includes(slot.id)) { epsSlotsOk = false; break; }
                }
                if (slot.id === 'A1' || slot.id === 'M4' || slot.id === 'M5') { epsSlotsOk = false; break; }
              }
              if (!epsSlotsOk) continue;
            }

            let ok = true;

            for (const slot of slotsToTest) {
              const key = `${day}-${slot.id}`;
              if (isAfternoonRestPeriod(day, slot.id)) { ok = false; break; }
              if (teacher.unavailabilities && teacher.unavailabilities.includes(key)) { ok = false; break; }
              if (teacherSchedules[teacher.id]?.[key]) { ok = false; break; }
              if (classSchedules[classGroup.id]?.[key]) { ok = false; break; }
              if (isSlotBlockedByDoubleVacation(classGroup.doubleVacation, day, slot.id)) { ok = false; break; }
            }

            if (!ok) continue;

            if (strictGaps) {
              const classSlotsOnDay: string[] = [];
              TIME_SLOTS.forEach(ts => {
                if (classSchedules[classGroup.id]?.[`${day}-${ts.id}`] || slotsToTest.some(s => s.id === ts.id)) {
                  classSlotsOnDay.push(ts.id);
                }
              });
              const teacherSlotsOnDay: string[] = [];
              TIME_SLOTS.forEach(ts => {
                if (teacherSchedules[teacher.id]?.[`${day}-${ts.id}`] || slotsToTest.some(s => s.id === ts.id)) {
                  teacherSlotsOnDay.push(ts.id);
                }
              });

              if (hasInvalidGaps(classSlotsOnDay) || hasInvalidGaps(teacherSlotsOnDay)) continue;
            }

            const eligibleRooms = getEligibleRooms(req.subjectId, classGroup.studentCount);
            let selectedRoom: Room | null = null;

            for (const room of eligibleRooms) {
              let roomFree = true;
              for (const slot of slotsToTest) {
                const key = `${day}-${slot.id}`;
                if (roomSchedules[room.id]?.[key]) { roomFree = false; break; }
              }
              if (roomFree) { selectedRoom = room; break; }
            }

            if (selectedRoom) {
              slotsToTest.forEach(slot => {
                const key = `${day}-${slot.id}`;
                if (!teacherSchedules[teacher.id]) teacherSchedules[teacher.id] = {};
                if (!classSchedules[classGroup.id]) classSchedules[classGroup.id] = {};
                if (!roomSchedules[selectedRoom!.id]) roomSchedules[selectedRoom!.id] = {};

                teacherSchedules[teacher.id][key] = classGroup.id;
                classSchedules[classGroup.id][key] = {
                  subjectId: req.subjectId,
                  teacherId: teacher.id,
                  roomId: selectedRoom!.id
                };
                roomSchedules[selectedRoom!.id][key] = classGroup.id;

                entries.push({
                  id: `entry_${classGroup.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  day: day,
                  slot: slot.id,
                  slot_id: slot.id,
                  class_name: classGroup.name,
                  class_id: classGroup.id,
                  teacher_name: teacher.name,
                  teacher_id: teacher.id,
                  subject: req.subjectId.toUpperCase(),
                  room_name: selectedRoom!.name,
                  room_id: selectedRoom!.id,
                });
              });

              teacherAssignedHours[teacher.id] += blockHoursToAssign;
              placed = true;
              break;
            }
          }
        }
      }

      if (!placed) {
        if (totalTries < TRY_LIMIT && req.blockSize === 2 && !isSvtPc1h30(classGroup.level, req.subjectId)) {
          requests.push({ ...req, blockSize: 1 });
          requests.push({ ...req, blockSize: 1 });
          conflictsSolved++;
        } else unplacedRequests.push(req);
      }
    }

    const generationTimeMs = Date.now() - startTimeMs;
    const totalHoursNeeded = requests.length;
    const assignedHours = entries.length;
    const successRate = totalHoursNeeded > 0 ? Math.round((assignedHours / totalHoursNeeded) * 100) : 100;

    localStorage.setItem("edutime_timetable_entries_v1", JSON.stringify(entries));

    if (supabase && entries.length > 0) {
      try {
        await supabase.from("timetable_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const { error } = await supabase.from("timetable_entries").insert(entries);
        if (error) console.error("Erreur Supabase insertion :", error.message);
      } catch (err) {
        console.error("Erreur Supabase :", err);
      }
    }

    setStats({
      successRate,
      conflicts: unplacedRequests.length,
      hoursPlanned: assignedHours,
      executionTime: generationTimeMs,
    });

    setIsGenerating(false);
    alert(`Moteur MENA exécuté ! ${assignedHours} créneaux placés avec un taux de réussite de ${successRate}%.`);
  };

  if (!isMounted) {
    return (
      <div className="p-8 space-y-6">
        <DashboardHeader title="Moteur de Génération d'Emploi du Temps" description="Moteur de résolution MENA Côte d'Ivoire" />
        <div className="text-xs text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        title="Moteur de Génération d'Emploi du Temps"
        description="Algorithme de résolution sous contraintes — Normes MENA Côte d'Ivoire"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider">Enseignants configurés</CardTitle>
            <Users className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{dataCount.teachers}</div>
            <p className="text-[11px] text-slate-400 mt-1">Disponibilités & contraintes chargées</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider">Classes & Divisions</CardTitle>
            <GraduationCap className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{dataCount.classes}</div>
            <p className="text-[11px] text-slate-400 mt-1">Volumes horaires MENA appliqués</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider">Salles Physiques</CardTitle>
            <Building2 className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{dataCount.rooms}</div>
            <p className="text-[11px] text-slate-400 mt-1">Locaux & laboratoires disponibles</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Calendar className="size-5 text-emerald-400" />
              Lancer le moteur de génération MENA
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              L&apos;algorithme va construire la grille pour vos <strong>{dataCount.classes} classes</strong> et <strong>{dataCount.teachers} enseignants</strong> selon les règles MENA.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs h-12 px-6 rounded-xl shrink-0 cursor-pointer shadow-lg transition-all flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Clock className="size-4 animate-spin" /> Moteur en cours d&apos;exécution...
              </>
            ) : (
              <>
                <Play className="size-4 fill-white" /> GÉNÉRER L&apos;EMPLOI DU TEMPS
              </>
            )}
          </Button>
        </div>
      </Card>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-800 bg-emerald-950/20">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase">Taux de réussite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="size-5" /> {stats.successRate}%
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase">Conflits non placés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                <AlertTriangle className="size-5" /> {stats.conflicts}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase">Heures planifiées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{stats.hoursPlanned} h</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase">Temps d&apos;exécution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-300">{stats.executionTime} ms</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}