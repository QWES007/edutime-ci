"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Building2, Calendar, Play, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

import { schedulingEngine, CourseRequest } from "@/lib/scheduling/engine"; 

const SLOT_MAP = ["M1", "M2", "M3", "M4", "M5", "A1", "A2", "A3", "A4", "A5"];

export default function ScheduleGeneratorPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataCount, setDataCount] = useState({ teachers: 0, classes: 0, rooms: 0 });

  const [rawTeachers, setRawTeachers] = useState<any[]>([]);
  const [rawClasses, setRawClasses] = useState<any[]>([]);
  const [rawRooms, setRawRooms] = useState<any[]>([]);

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    const loadRealData = async () => {
      const supabase = createClient();
      if (!supabase) return;

      try {
        const [tRes, cRes, rRes] = await Promise.all([
          supabase.from("teachers").select("*"),
          supabase.from("classgroups").select("*"),
          supabase.from("rooms").select("*"),
        ]);

        if (tRes.data) setRawTeachers(tRes.data);
        if (cRes.data) setRawClasses(cRes.data);
        if (rRes.data) setRawRooms(rRes.data);

        setDataCount({
          teachers: tRes.data?.length || 0,
          classes: cRes.data?.length || 0,
          rooms: rRes.data?.length || 0,
        });
      } catch (e) {
        console.error("Erreur de chargement Supabase:", e);
      }
    };

    loadRealData();
  }, []);

  const handleGenerate = async () => {
    alert("Bouton cliqué ! Lancement de la génération...");

    if (rawClasses.length === 0 || rawTeachers.length === 0) {
      alert("Attention : Aucune classe ou aucun enseignant trouvé dans la base.");
      return;
    }

    setIsGenerating(true);

    try {
      const requests: CourseRequest[] = [];
      const availabilities: Record<string, number> = {};

      rawTeachers.forEach(t => {
        availabilities[t.id] = Number(t.max_hours_per_week || 24);
      });

      const teacherAssignedHours: Record<string, number> = {};
      rawTeachers.forEach(t => { teacherAssignedHours[t.id] = 0; });

      rawClasses.forEach(cg => {
        const level = cg.level || "";
        const isSecondCycle = ['Terminale', '1ère', '2nde', 'Tle', '1er'].some(l => level.includes(l));
        const subjectHours = cg.subject_hours || {};

        Object.entries(subjectHours).forEach(([subId, totalHours]: [string, any]) => {
          const cleanSub = subId.toUpperCase();
          
          const matchingTeachers = rawTeachers
            .filter(t => {
              const subs = Array.isArray(t.subjects) ? t.subjects : [t.subject || "MATHS"];
              return subs.map((s: string) => s.toUpperCase()).includes(cleanSub);
            })
            .sort((a, b) => {
              const gradeA = Number(a.grade || 3);
              const gradeB = Number(b.grade || 3);
              return isSecondCycle ? gradeA - gradeB : gradeB - gradeA;
            });

          let selectedTeacher = matchingTeachers.find(t => {
            const currentHours = teacherAssignedHours[t.id] || 0;
            return (currentHours + Number(totalHours)) <= Number(t.max_hours_per_week || 24);
          });

          if (!selectedTeacher && matchingTeachers.length > 0) {
            selectedTeacher = matchingTeachers[0];
          }

          if (!selectedTeacher) return;

          teacherAssignedHours[selectedTeacher.id] = (teacherAssignedHours[selectedTeacher.id] || 0) + Number(totalHours);

          let rem = Number(totalHours) || 0;
          
          while (rem >= 2) {
            requests.push({
              id: `req_${cg.id}_${cleanSub}_${Math.random().toString(36).substring(7)}`,
              classId: cg.id,
              className: cg.name,
              subject: cleanSub,
              duration: 2,
              teacherId: selectedTeacher.id,
              requiresLab: ['SVT', 'PC', 'PHYSIQUE'].includes(cleanSub),
              isEPS: cleanSub === 'EPS',
              doubleVacation: cg.double_vacation || "none"
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
              teacherId: selectedTeacher.id,
              requiresLab: ['SVT', 'PC', 'PHYSIQUE'].includes(cleanSub),
              isEPS: cleanSub === 'EPS',
              doubleVacation: cg.double_vacation || "none"
            });
            rem -= 1;
          }
        });
      });

      const result = await schedulingEngine.generate(requests, availabilities);

      if (!result.success) {
        alert("⚠️ Erreur de faisabilité : " + (result.message || "Conflit dans les contraintes horaires."));
        setIsGenerating(false);
        return;
      }

      const entries = result.schedule.map((slot: any) => {
        const teacher = rawTeachers.find(t => t.id === slot.teacher);
        const cg = rawClasses.find(c => c.id === slot.classId);
        const timeIndex = parseInt(slot.timeSlot.split('_')[1]) || 0;
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
          room_id: "room_std",
        };
      });

      const supabase = createClient();
      if (supabase && entries.length > 0) {
        await supabase.from("timetable_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("timetable_entries").insert(entries);
      }

      setStats({
        successRate: result.stats.assignment_percentage,
        conflicts: result.stats.total_hours_required - result.stats.total_hours_assigned,
        hoursPlanned: result.stats.total_hours_assigned,
        executionTime: result.stats.generation_time_ms,
      });

      alert(`Succès ! ${result.stats.total_hours_assigned} créneaux placés sur ${result.stats.total_hours_required}.`);
    } catch (err) {
      console.error("Erreur critique lors de la génération :", err);
      alert("Une erreur technique est survenue. Vérifiez la console.");
    } finally {
      setIsGenerating(false);
    }
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
              Distribution intelligente des cours avec lissage de la Double Vacation et priorisation par grade.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs h-12 px-6 rounded-xl shrink-0 cursor-pointer"
          >
            {isGenerating ? <Clock className="size-4 animate-spin mr-2" /> : <Play className="size-4 fill-white mr-2" />}
            {isGenerating ? "RECHERCHE EN COURS..." : "GÉNÉRER L'EMPLOI DU TEMPS"}
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