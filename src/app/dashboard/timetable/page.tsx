"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, GraduationCap, Printer, Filter } from "lucide-react";

interface TimetableEntry {
  id: string;
  day: string;
  slot: string;
  class_name: string;
  teacher_name: string;
  subject: string;
  room_name?: string;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const SLOTS = [
  { id: "M1", label: "M1 (07h - 08h)" },
  { id: "M2", label: "M2 (08h - 09h)" },
  { id: "M3", label: "M3 (09h - 10h)" },
  { id: "M4", label: "M4 (10h - 11h)" },
  { id: "M5", label: "M5 (11h - 12h)" },
  { id: "A1", label: "A1 (13h - 14h)" },
  { id: "A2", label: "A2 (14h - 15h)" },
  { id: "A3", label: "A3 (15h - 16h)" },
  { id: "A4", label: "A4 (16h - 17h)" },
];

export default function TimetablePage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [viewType, setViewType] = useState<"class" | "teacher">("class");
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [availableTargets, setAvailableTargets] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const loadEntries = async () => {
      let loaded: TimetableEntry[] = [];

      // 1. Essai de chargement depuis Supabase
      if (supabase) {
        try {
          const { data, error } = await supabase.from("timetable_entries").select("*");
          if (!error && data && data.length > 0) {
            loaded = data.map((item: any) => ({
              id: item.id,
              day: item.day,
              slot: item.slot_id || item.slot,
              class_name: item.class_name || item.class_id,
              teacher_name: item.teacher_name || item.teacher_id,
              subject: item.subject,
              room_name: item.room_name || item.room_id || "Standard",
            }));
          }
        } catch (e) {
          console.error("Erreur lecture Supabase timetable_entries :", e);
        }
      }

      // 2. Fallback LocalStorage si Supabase vide
      if (loaded.length === 0 && typeof window !== "undefined") {
        const saved = localStorage.getItem("edutime_timetable_entries_v1") || localStorage.getItem("edutime_generated_schedule_v1");
        if (saved) {
          try {
            loaded = JSON.parse(saved);
          } catch (e) {
            console.error(e);
          }
        }
      }

      setEntries(loaded);
    };

    loadEntries();
  }, []);

  // Extraire la liste des classes ou des enseignants disponibles dès que les entrées changent
  useEffect(() => {
    if (entries.length === 0) {
      setAvailableTargets([]);
      setSelectedTarget("");
      return;
    }

    if (viewType === "class") {
      const classes = Array.from(new Set(entries.map((e) => e.class_name))).filter(Boolean).sort();
      setAvailableTargets(classes);
      if (classes.length > 0) setSelectedTarget(classes[0]);
    } else {
      const teachers = Array.from(new Set(entries.map((e) => e.teacher_name))).filter(Boolean).sort();
      setAvailableTargets(teachers);
      if (teachers.length > 0) setSelectedTarget(teachers[0]);
    }
  }, [entries, viewType]);

  const handlePrint = () => {
    window.print();
  };

  if (!isMounted) {
    return (
      <div className="p-8 space-y-6">
        <DashboardHeader title="Emploi du Temps Général" description="Consultez les grilles créées." />
        <div className="text-xs text-slate-400">Chargement de la grille...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardHeader
          title="Emploi du Temps Général"
          description="Consultez, filtrez et imprimez les grilles horaires générées."
        />

        {entries.length > 0 && (
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer print:hidden"
          >
            <Printer className="size-4 text-emerald-400" /> Imprimer la grille
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/50 p-8 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <Calendar className="size-10 mx-auto text-slate-500 animate-bounce" />
            <h3 className="font-bold text-white text-base">Aucun planning actif trouvé</h3>
            <p className="text-xs text-slate-400">
              Pour visualiser les grilles horaires interactives, rendez-vous dans la section{" "}
              <strong className="text-emerald-400">Moteur de Génération</strong> et cliquez sur le bouton{" "}
              <strong className="text-emerald-400">GÉNÉRER L&apos;EMPLOI DU TEMPS</strong>.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Barre de filtre / Sélection du modèle de vue */}
          <Card className="border-slate-800 bg-slate-900/50 p-4 print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Mode d&apos;affichage :</span>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => setViewType("class")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      viewType === "class" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <GraduationCap className="size-3.5" /> Par Classe
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewType("teacher")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      viewType === "teacher" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Users className="size-3.5" /> Par Enseignant
                  </button>
                </div>
              </div>

              {/* Menu déroulant de sélection (Classe ou Enseignant) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-300">
                  {viewType === "class" ? "Sélectionner la classe :" : "Sélectionner le professeur :"}
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                >
                  {availableTargets.map((target) => (
                    <option key={target} value={target}>
                      {target}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Grille Horaire Imprimable */}
          <Card className="border-slate-800 bg-slate-900/50 p-5 overflow-hidden">
            <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                <Calendar className="size-5 text-emerald-400" />
                Planning : <span className="text-emerald-400">{selectedTarget || "Global"}</span>
              </CardTitle>
              <span className="text-xs font-mono text-slate-400">
                Total créneaux : {entries.filter((e) => (viewType === "class" ? e.class_name === selectedTarget : e.teacher_name === selectedTarget)).length} h
              </span>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-bold">
                    <th className="py-3 px-2 text-left w-28 border-r border-slate-800">Créneau</th>
                    {DAYS.map((day) => (
                      <th key={day} className="py-3 px-2 border-r border-slate-800/50">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {SLOTS.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-2 text-left font-mono font-bold text-[10px] text-slate-400 border-r border-slate-800 bg-slate-950/40">
                        {slot.label}
                      </td>
                      {DAYS.map((day) => {
                        // Trouver l'entrée correspondant au jour et créneau
                        const cellEntry = entries.find(
                          (e) =>
                            e.day === day &&
                            e.slot === slot.id &&
                            (viewType === "class" ? e.class_name === selectedTarget : e.teacher_name === selectedTarget)
                        );

                        return (
                          <td key={day} className="p-1.5 border-r border-slate-800/40 min-w-28 h-16">
                            {cellEntry ? (
                              <div className="h-full bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-left flex flex-col justify-between">
                                <span className="font-extrabold text-emerald-400 text-xs truncate block">
                                  {cellEntry.subject}
                                </span>
                                <span className="text-[10px] font-medium text-slate-300 truncate block">
                                  {viewType === "class" ? cellEntry.teacher_name : cellEntry.class_name}
                                </span>
                                {cellEntry.room_name && (
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    Salle : {cellEntry.room_name}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="h-full rounded-lg border border-dashed border-slate-800/40 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                                Libre
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}