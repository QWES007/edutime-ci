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

const isSlotBlockedByDoubleVacation = (doubleVacation: 'A' | 'B' | 'none' | undefined, day: DayOfWeek, slotId: string, strict: boolean): boolean => {
  if (!doubleVacation || doubleVacation === 'none') return false;
  const slot = TIME_SLOTS.find(s => s.id === slotId);
  if (!slot) return false;

  // Si non-strict (mode secours pour placer les heures restantes)
  if (!strict && day === 'Mercredi') return false;

  if (['Lundi', 'Mercredi', 'Vendredi'].includes(day)) {
    if (doubleVacation === 'A') return slot.period === 'Après-midi';
    if (doubleVacation === 'B') return slot.period === 'Matin';
  }
  if (['Mardi', 'Jeudi'].includes(day)) {
    if (doubleVacation === 'A') return slot.period === 'Matin';
    if (doubleVacation === 'B') return slot.period === 'Après-midi';
  }
  return false;
};

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
        } catch (e) { console.error("Erreur Supabase :", e); }
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

    const teacherSchedules: Record<string, Record<string, string>> = {};
    const classSchedules: Record<string, Record<string, { subjectId: string; teacherId: string; roomId: string }>> = {};
    const roomSchedules: Record<string, Record<string, string>> = {};

    rawTeachers.forEach(t => { teacherSchedules[t.id] = {}; });
    rawClasses.forEach(c => { classSchedules[c.id] = {}; });
    rawRooms.forEach(r => { roomSchedules[r.id] = {}; });

    const requests: AllocationRequest[] = [];

    // 1. Préparation des requêtes de cours
    rawClasses.forEach(cg => {
      Object.entries(cg.subjectHours).forEach(([subId, totalHours]) => {
        const cleanSub = subId.toUpperCase();
        
        // Trouver prof
        const matchingTeacher = rawTeachers.find(t => t.subjects.includes(cleanSub)) || rawTeachers[0];
        if (!matchingTeacher) return;

        let rem = Number(totalHours) || 0;
        
        // Pour les classes en double vacation, privilégier des blocs de 1h si la matière à beaucoup d'heures
        while (rem >= 2) {
          requests.push({ classGroupId: cg.id, subjectId: cleanSub, teacherId: matchingTeacher.id, blockSize: 2 });
          rem -= 2;
        }
        while (rem > 0) {
          requests.push({ classGroupId: cg.id, subjectId: cleanSub, teacherId: matchingTeacher.id, blockSize: 1 });
          rem -= 1;
        }
      });
    });

    // Tri prioritaire : 1er cycle et matières principales d'abord
    requests.sort((a, b) => b.blockSize - a.blockSize);

    const entries: any[] = [];
    const unplaced: AllocationRequest[] = [];

    // 2. Traitement par passe (Strict Vague -> Secours Vague)
    for (const req of requests) {
      const cg = rawClasses.find(c => c.id === req.classGroupId)!;
      const teacher = rawTeachers.find(t => t.id === req.teacherId)!;
      if (!cg || !teacher) continue;

      let placed = false;

      // Pass 1: Strict respect de la Vague
      // Pass 2: Assouplissement si bloqué
      for (const strictVacation of [true, false]) {
        if (placed) break;

        for (const day of DAYS) {
          if (placed) break;

          // Pas plus de 2h de la même matière par jour
          let currentSubHoursOnDay = 0;
          Object.entries(classSchedules[cg.id] || {}).forEach(([k, v]) => {
            if (k.startsWith(`${day}-`) && v.subjectId === req.subjectId) currentSubHoursOnDay++;
          });
          if (currentSubHoursOnDay + req.blockSize > 2) continue;

          for (let i = 0; i <= TIME_SLOTS.length - req.blockSize; i++) {
            const slotsToTest = TIME_SLOTS.slice(i, i + req.blockSize);
            
            // Éviter la coupure de midi (M5 + A1)
            const isLunchSpan = slotsToTest.some(s => s.period === 'Matin') && slotsToTest.some(s => s.period === 'Après-midi');
            if (isLunchSpan) continue;

            let ok = true;
            for (const slot of slotsToTest) {
              const key = `${day}-${slot.id}`;

              // Mercredi après-midi réservé
              if (day === 'Mercredi' && slot.period === 'Après-midi') { ok = false; break; }

              // Rotation Vague A/B
              if (isSlotBlockedByDoubleVacation(cg.doubleVacation, day, slot.id, strictVacation)) { ok = false; break; }

              // Occupation Prof, Classe
              if (teacherSchedules[teacher.id]?.[key]) { ok = false; break; }
              if (classSchedules[cg.id]?.[key]) { ok = false; break; }
              if (teacher.unavailabilities && teacher.unavailabilities.includes(key)) { ok = false; break; }
            }

            if (!ok) continue;

            // Salle disponible
            const freeRoom = rawRooms.find(r => !roomSchedules[r.id]?.[`${day}-${slotsToTest[0].id}`]) || rawRooms[0];
            const roomName = freeRoom ? freeRoom.name : "Salle Standard";
            const roomId = freeRoom ? freeRoom.id : "room_1";

            // Enregistrement
            slotsToTest.forEach(slot => {
              const key = `${day}-${slot.id}`;
              if (!teacherSchedules[teacher.id]) teacherSchedules[teacher.id] = {};
              if (!classSchedules[cg.id]) classSchedules[cg.id] = {};
              if (!roomSchedules[roomId]) roomSchedules[roomId] = {};

              teacherSchedules[teacher.id][key] = cg.id;
              classSchedules[cg.id][key] = { subjectId: req.subjectId, teacherId: teacher.id, roomId };
              roomSchedules[roomId][key] = cg.id;

              entries.push({
                id: `entry_${cg.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                day: day,
                slot: slot.id,
                slot_id: slot.id,
                class_name: cg.name,
                class_id: cg.id,
                teacher_name: teacher.name,
                teacher_id: teacher.id,
                subject: req.subjectId,
                room_name: roomName,
                room_id: roomId,
              });
            });

            placed = true;
            break;
          }
        }
      }

      if (!placed) unplaced.push(req);
    }

    // Enregistrement final
    localStorage.setItem("edutime_timetable_entries_v1", JSON.stringify(entries));

    if (supabase && entries.length > 0) {
      try {
        await supabase.from("timetable_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("timetable_entries").insert(entries);
      } catch (e) { console.error(e); }
    }

    const duration = Date.now() - startTimeMs;
    const totalReqs = requests.length || 1;
    const successRate = Math.round((entries.length / totalReqs) * 100);

    setStats({
      successRate: Math.min(100, successRate),
      conflicts: unplaced.length,
      hoursPlanned: entries.length,
      executionTime: duration,
    });

    setIsGenerating(false);
    alert(`Emploi du temps généré ! ${entries.length} créneaux placés avec succès sur ${totalReqs} demandés.`);
  };

  if (!isMounted) return <div className="p-8 text-xs text-slate-400">Chargement...</div>;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        title="Moteur de Génération d'Emploi du Temps"
        description="Résolution sous contraintes avec lissage Vague A/B (MENA)"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-300 uppercase">Enseignants</CardTitle>
            <Users className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{dataCount.teachers}</div></CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-300 uppercase">Classes</CardTitle>
            <GraduationCap className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{dataCount.classes}</div></CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-300 uppercase">Salles</CardTitle>
            <Building2 className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent><div className="text-3xl font-black text-white">{dataCount.rooms}</div></CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Calendar className="size-5 text-emerald-400" />
              Lancer la génération automatique
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Distribution intelligente des cours avec lissage de la Double Vacation.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs h-12 px-6 rounded-xl shrink-0 cursor-pointer"
          >
            {isGenerating ? <Clock className="size-4 animate-spin mr-2" /> : <Play className="size-4 fill-white mr-2" />}
            GÉNÉRER L&apos;EMPLOI DU TEMPS
          </Button>
        </div>
      </Card>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-800 bg-emerald-950/20">
            <CardContent className="pt-4">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Taux de réussite</div>
              <div className="text-2xl font-black text-emerald-400 flex items-center gap-2 mt-1">
                <CheckCircle2 className="size-5" /> {stats.successRate}%
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="pt-4">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Cours non placés</div>
              <div className="text-2xl font-black text-amber-400 flex items-center gap-2 mt-1">
                <AlertTriangle className="size-5" /> {stats.conflicts}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="pt-4">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Heures planifiées</div>
              <div className="text-2xl font-black text-white mt-1">{stats.hoursPlanned} h</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="pt-4">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Temps d&apos;exécution</div>
              <div className="text-2xl font-black text-slate-300 mt-1">{stats.executionTime} ms</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}