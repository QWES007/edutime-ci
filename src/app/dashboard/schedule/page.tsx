"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Building2, Calendar, Play, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

// ✅ IMPORTATION DU NOUVEAU MOTEUR DE GÉNÉRATION
import { schedulingEngine, CourseRequest } from "@/lib/scheduling/engine"; 

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

const SLOT_MAP = ["M1", "M2", "M3", "M4", "M5", "A1", "A2", "A3", "A4", "A5"];

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
              type: String(item.type || "Standard").toLowerCase().includes("lab") ? "Lab" : "Standard",
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

    // 1. FORMATAGE DES DONNÉES POUR LE NOUVEAU MOTEUR
    const requests: CourseRequest[] = [];
    const availabilities: Record<string, number> = {};

    rawTeachers.forEach(t => {
        availabilities[t.id] = t.maxHoursPerWeek;
    });

    rawClasses.forEach(cg => {
      Object.entries(cg.subjectHours).forEach(([subId, totalHours]) => {
        const cleanSub = subId.toUpperCase();
        const matchingTeacher = rawTeachers.find(t => t.subjects.includes(cleanSub)) || rawTeachers[0];
        if (!matchingTeacher) return;

        let rem = Number(totalHours) || 0;
        
        // On découpe en blocs de 2h ou 1h
        while (rem >= 2) {
          requests.push({
            id: `req_${cg.id}_${cleanSub}_${Math.random().toString(36).substring(7)}`,
            classId: cg.id,
            className: cg.name,
            subject: cleanSub,
            duration: 2,
            teacherId: matchingTeacher.id,
            requiresLab: ['SVT', 'PC', 'PHYSIQUE'].includes(cleanSub),
            isEPS: cleanSub === 'EPS',
            doubleVacation: cg.doubleVacation as "none" | "A" | "B"
          });
          rem -= 2;
        }
        while (rem > 0) {
          requests.push({
            id: `req_${cg.id}_${cleanSub}_${Math.random().toString(36).substring(7)}`,
            classId: cg.id,
            className: cg.name,
            subject: cleanSub,
            duration: 1,
            teacherId: matchingTeacher.id,
            requiresLab: ['SVT', 'PC', 'PHYSIQUE'].includes(cleanSub),
            isEPS: cleanSub === 'EPS',
            doubleVacation: cg.doubleVacation as "none" | "A" | "B"
          });
          rem -= 1;
        }
      });
    });

    // 2. APPEL DU NOUVEAU MOTEUR INTELLIGENT
    const result = await schedulingEngine.generate(requests, availabilities);

    if (!result.success && result.message) {
      alert("⚠️ Erreur de faisabilité :\n\n" + result.message);
      setIsGenerating(false);
      return;
    }

    // 3. TRANSFORMATION DU RÉSULTAT POUR SUPABASE
    const entries: any[] = result.schedule.map(slot => {
      const teacher = rawTeachers.find(t => t.id === slot.teacher);
      const cg = rawClasses.find(c => c.id === slot.classId);
      
      // Conversion de l'index du moteur (ex: "slot_0") au format de l'UI (ex: "M1")
      const timeIndex = parseInt(slot.timeSlot.split('_')[1]);
      const realSlotId = SLOT_MAP[timeIndex] || "M1";

      return {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        day: slot.day,
        slot: realSlotId,
        slot_id: realSlotId,
        class_name: cg?.name || "Classe",
        class_id: slot.classId,
        teacher_name: teacher?.name || "Inconnu",
        teacher_id: slot.teacher,
        subject: slot.subject,
        room_name: slot.room,
        room_id: "room_std", // À lier avec rawRooms plus tard
      };
    });

    // 4. SAUVEGARDE EN BASE DE DONNÉES
    localStorage.setItem("edutime_timetable_entries_v1", JSON.stringify(entries));

    if (supabase && entries.length > 0) {
      try {
        await supabase.from("timetable_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("timetable_entries").insert(entries);
      } catch (e) { console.error(e); }
    }

    // 5. MISE À JOUR DES STATISTIQUES
    setStats({
      successRate: result.stats.assignment_percentage,
      conflicts: result.stats.total_hours_required - result.stats.total_hours_assigned,
      hoursPlanned: result.stats.total_hours_assigned,
      executionTime: result.stats.generation_time_ms,
    });

    setIsGenerating(false);
    alert(`Emploi du temps généré ! ${result.stats.total_hours_assigned} créneaux placés sur ${result.stats.total_hours_required} demandés.`);
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
            {isGenerating ? "RECHERCHE EN COURS (Max 8s)..." : "GÉNÉRER L'EMPLOI DU TEMPS"}
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