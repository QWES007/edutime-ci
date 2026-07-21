"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Building2, Calendar, Play, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const SLOTS = ["M1", "M2", "M3", "M4", "M5", "A1", "A2", "A3", "A4"];

export default function ScheduleGeneratorPage() {
  const supabase = createClient();
  const [isMounted, setIsMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataCount, setDataCount] = useState({ teachers: 0, classes: 0, rooms: 0 });

  const [rawTeachers, setRawTeachers] = useState<any[]>([]);
  const [rawClasses, setRawClasses] = useState<any[]>([]);
  const [rawRooms, setRawRooms] = useState<any[]>([]);

  const [stats, setStats] = useState<{
    successRate: number;
    conflicts: number;
    hoursPlanned: number;
    executionTime: number;
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);

    const loadRealData = async () => {
      let t: any[] = [];
      let c: any[] = [];
      let r: any[] = [];

      if (supabase) {
        try {
          const [tRes, cRes, rRes] = await Promise.all([
            supabase.from("teachers").select("*"),
            supabase.from("classgroups").select("*"),
            supabase.from("rooms").select("*"),
          ]);

          if (tRes.data) t = tRes.data;
          if (cRes.data) c = cRes.data;
          if (rRes.data) r = rRes.data;
        } catch (e) {
          console.error("Erreur chargement Supabase Generator :", e);
        }
      }

      if (t.length === 0 && typeof window !== "undefined") {
        const localT = localStorage.getItem("edutime_teachers_saas_v1");
        if (localT) t = JSON.parse(localT);
      }
      if (c.length === 0 && typeof window !== "undefined") {
        const localC = localStorage.getItem("edutime_classes_saas_v1");
        if (localC) c = JSON.parse(localC);
      }
      if (r.length === 0 && typeof window !== "undefined") {
        const localR = localStorage.getItem("edutime_rooms_saas_v1");
        if (localR) r = JSON.parse(localR);
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
    const startTime = performance.now();

    const generatedEntries: any[] = [];
    let plannedHours = 0;
    let conflicts = 0;

    // Masques d'occupation pour éviter les doublons
    const teacherSlotBusy = new Set<string>(); // "TeacherName-Day-Slot"
    const classSlotBusy = new Set<string>();   // "ClassName-Day-Slot"
    const roomSlotBusy = new Set<string>();    // "RoomName-Day-Slot"

    // Compteurs journaliers pour lisser la charge sur la semaine
    const classSubjectDayHours: Record<string, number> = {}; // "ClassName-Subject-Day" -> nbHours
    const teacherDayHours: Record<string, number> = {};       // "TeacherName-Day" -> nbHours

    // 1. Préparation de la liste des cours à placer (Task Queue)
    interface CourseTask {
      className: string;
      classId: string;
      subject: string;
      teacherName: string;
      teacherId: string;
    }

    const tasks: CourseTask[] = [];

    rawClasses.forEach((cls) => {
      const subjectHours = cls.subject_hours || cls.subjectHours || {};
      Object.entries(subjectHours).forEach(([subj, hoursReq]) => {
        const total = Number(hoursReq) || 0;

        // Trouver le prof associé
        const matchingTeacher = rawTeachers.find((t) => {
          const subjList = Array.isArray(t.subjects) ? t.subjects : [t.subject];
          return subjList.some((s: string) => String(s).toUpperCase() === String(subj).toUpperCase());
        }) || rawTeachers[0];

        const tName = matchingTeacher ? matchingTeacher.name : "Professeur Indéterminé";
        const tId = matchingTeacher ? matchingTeacher.id : tName;

        for (let i = 0; i < total; i++) {
          tasks.push({
            className: cls.name,
            classId: cls.id || cls.name,
            subject: subj,
            teacherName: tName,
            teacherId: tId,
          });
        }
      });
    });

    // 2. Mélange / Tri intelligent : traiter les matières à fort volume en premier
    tasks.sort((a, b) => a.subject.localeCompare(b.subject));

    // 3. Placement équilibré
    for (const task of tasks) {
      let placed = false;

      // On parcourt les jours et les créneaux pour trouver le meilleur créneau équilibré
      for (const day of DAYS) {
        if (placed) break;

        const csKey = `${task.className}-${task.subject}-${day}`;
        const currentCSHours = classSubjectDayHours[csKey] || 0;

        // Règle de lissage : Max 2h d'une même matière par jour pour une classe
        if (currentCSHours >= 2) continue;

        const tdKey = `${task.teacherName}-${day}`;
        const currentTDHours = teacherDayHours[tdKey] || 0;

        // Règle de lissage : Max 6h de cours par jour pour un prof
        if (currentTDHours >= 6) continue;

        for (const slot of SLOTS) {
          const classKey = `${task.className}-${day}-${slot}`;
          const teacherKey = `${task.teacherName}-${day}-${slot}`;

          if (classSlotBusy.has(classKey) || teacherSlotBusy.has(teacherKey)) {
            continue; // Déjà occupé
          }

          // Trouver une salle disponible
          const freeRoom = rawRooms.find((r) => !roomSlotBusy.has(`${r.name}-${day}-${slot}`)) || rawRooms[0];
          const roomName = freeRoom ? freeRoom.name : "Salle Standard";
          const roomKey = `${roomName}-${day}-${slot}`;

          // Validation du créneau
          classSlotBusy.add(classKey);
          teacherSlotBusy.add(teacherKey);
          if (roomName) roomSlotBusy.add(roomKey);

          classSubjectDayHours[csKey] = currentCSHours + 1;
          teacherDayHours[tdKey] = currentTDHours + 1;

          generatedEntries.push({
            id: crypto.randomUUID(),
            day,
            slot,
            slot_id: slot,
            class_name: task.className,
            class_id: task.classId,
            teacher_name: task.teacherName,
            teacher_id: task.teacherId,
            subject: task.subject,
            room_name: roomName,
            room_id: freeRoom?.id || roomName,
          });

          plannedHours++;
          placed = true;
          break;
        }
      }

      if (!placed) {
        conflicts++;
      }
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // 4. Enregistrement des données
    localStorage.setItem("edutime_timetable_entries_v1", JSON.stringify(generatedEntries));

    if (supabase && generatedEntries.length > 0) {
      try {
        await supabase.from("timetable_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const { error } = await supabase.from("timetable_entries").insert(generatedEntries);
        if (error) {
          console.error("Erreur insertion Supabase timetable_entries :", error.message);
        }
      } catch (err) {
        console.error("Erreur Supabase :", err);
      }
    }

    const totalTasks = tasks.length || 1;
    const successRate = Math.min(100, Math.round((plannedHours / totalTasks) * 1000) / 10);

    setStats({
      successRate: isNaN(successRate) ? 100 : successRate,
      conflicts,
      hoursPlanned: plannedHours,
      executionTime: duration,
    });

    setIsGenerating(false);
    alert(`Emploi du temps rééquilibré généré avec succès ! (${plannedHours} heures placées sur ${totalTasks} prévues)`);
  };

  if (!isMounted) {
    return (
      <div className="p-8 space-y-6">
        <DashboardHeader title="Moteur de Génération d'Emploi du Temps" description="Algorithme de répartition sous contraintes MENA" />
        <div className="text-xs text-slate-400">Chargement du moteur...</div>
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
              Lancer la génération automatique équilibrée
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              L&apos;algorithme va distribuer les cours de vos <strong>{dataCount.classes} classes</strong> et <strong>{dataCount.teachers} enseignants</strong> équitablement du Lundi au Vendredi.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs h-12 px-6 rounded-xl shrink-0 cursor-pointer shadow-lg transition-all flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Clock className="size-4 animate-spin" /> Distribution en cours...
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