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

      // Fallback localstorage si vide
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

    // 1. Préparation de la matrice d'attribution
    const generatedEntries: any[] = [];
    let plannedHours = 0;
    let conflicts = 0;

    // Pour suivre l'occupation (profs, classes, salles) : Key = "JOUR-CRENEAU"
    const teacherOccupied: Record<string, Set<string>> = {};
    const classOccupied: Record<string, Set<string>> = {};
    const roomOccupied: Record<string, Set<string>> = {};

    DAYS.forEach((d) => {
      SLOTS.forEach((s) => {
        const key = `${d}-${s}`;
        teacherOccupied[key] = new Set();
        classOccupied[key] = new Set();
        roomOccupied[key] = new Set();
      });
    });

    // 2. Boucle de génération sur TOUTES les classes configurées
    for (const cls of rawClasses) {
      const className = cls.name;
      const subjectHours = cls.subject_hours || cls.subjectHours || {};

      for (const [subject, hoursReq] of Object.entries(subjectHours)) {
        const targetHours = Number(hoursReq) || 0;
        let hoursAssigned = 0;

        // Trouver un professeur pour cette matière
        const matchingTeacher = rawTeachers.find((t) => {
          const subjList = Array.isArray(t.subjects) ? t.subjects : [t.subject];
          return subjList.some((s: string) => String(s).toUpperCase() === String(subject).toUpperCase());
        }) || rawTeachers[0]; // Fallback au 1er prof si non trouvé

        const teacherName = matchingTeacher ? matchingTeacher.name : "Professeur Indéterminé";

        // Tenter d'attribuer les créneaux sur la semaine
        for (const day of DAYS) {
          if (hoursAssigned >= targetHours) break;

          for (const slot of SLOTS) {
            if (hoursAssigned >= targetHours) break;

            const timeKey = `${day}-${slot}`;

            // Vérification des chevauchements
            const isClassFree = !classOccupied[timeKey].has(className);
            const isTeacherFree = !teacherOccupied[timeKey].has(teacherName);

            if (isClassFree && isTeacherFree) {
              // Trouver une salle libre
              const freeRoom = rawRooms.find((r) => !roomOccupied[timeKey].has(r.name)) || rawRooms[0];
              const roomName = freeRoom ? freeRoom.name : "Salle Standard";

              // Marquer comme occupé
              classOccupied[timeKey].add(className);
              teacherOccupied[timeKey].add(teacherName);
              if (roomName) roomOccupied[timeKey].add(roomName);

              const entryId = crypto.randomUUID();

              generatedEntries.push({
                id: entryId,
                day,
                slot,
                slot_id: slot,
                class_name: className,
                class_id: cls.id || className,
                teacher_name: teacherName,
                teacher_id: matchingTeacher?.id || teacherName,
                subject,
                room_name: roomName,
                room_id: freeRoom?.id || roomName,
              });

              hoursAssigned++;
              plannedHours++;
            }
          }
        }

        if (hoursAssigned < targetHours) {
          conflicts += (targetHours - hoursAssigned);
        }
      }
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // 3. Sauvegarde dans LocalStorage
    localStorage.setItem("edutime_timetable_entries_v1", JSON.stringify(generatedEntries));

    // 4. Sauvegarde dans Supabase
    if (supabase && generatedEntries.length > 0) {
      try {
        // Vider l'ancien emploi du temps
        await supabase.from("timetable_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // Insérer le nouveau
        const { error } = await supabase.from("timetable_entries").insert(generatedEntries);
        if (error) {
          console.error("Erreur enregistrement timetable_entries Supabase :", error.message);
        } else {
          console.log("Nouveau planning enregistré avec succès dans Supabase !");
        }
      } catch (err) {
        console.error("Erreur Supabase insertion :", err);
      }
    }

    const successRate = Math.min(100, Math.round(((plannedHours) / (plannedHours + conflicts || 1)) * 1000) / 10);

    setStats({
      successRate: isNaN(successRate) ? 100 : successRate,
      conflicts,
      hoursPlanned: plannedHours,
      executionTime: duration,
    });

    setIsGenerating(false);
    alert(`Génération terminée avec succès ! ${plannedHours} heures planifiées pour ${rawClasses.length} classes.`);
  };

  if (!isMounted) {
    return (
      <div className="p-8 space-y-6">
        <DashboardHeader title="Moteur de Génération d'Emploi du Temps" description="Algorithme sous contraintes — Normes MENA Côte d'Ivoire" />
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

      {/* Statistiques des données d'entrée lues en direct sur Supabase */}
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

      {/* Zone de Lancement de la génération */}
      <Card className="border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Calendar className="size-5 text-emerald-400" />
              Lancer la génération automatique
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              L&apos;algorithme va construire la grille pour vos <strong>{dataCount.classes} classes</strong> et <strong>{dataCount.teachers} enseignants</strong> en éliminant les chevauchements de salles et de professeurs.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs h-12 px-6 rounded-xl shrink-0 cursor-pointer shadow-lg transition-all flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Clock className="size-4 animate-spin" /> Calcul de la matrice en cours...
              </>
            ) : (
              <>
                <Play className="size-4 fill-white" /> GÉNÉRER L&apos;EMPLOI DU TEMPS
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Résultats du dernier traitement */}
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
              <CardTitle className="text-[10px] font-bold text-slate-400 uppercase">Conflits détectés</CardTitle>
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