"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, GraduationCap, Printer, Filter, AlertTriangle, CheckCircle } from "lucide-react";

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
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const loadEntries = async () => {
      let loaded: TimetableEntry[] = [];
      if (supabase) {
        try {
          const { data, error } = await supabase.from("timetable_entries").select("*");
          if (!error && data && data.length > 0) {
            loaded = data.map((item: any) => ({
              id: item.id,
              day: item.day || item.dayOfWeek,
              slot: item.slot || item.slot_id || item.slotId,
              class_name: item.class_name || item.classGroupId,
              teacher_name: item.teacher_name || item.teacherId,
              subject: item.subject || item.subjectId,
              room_name: item.room_name || item.roomId || "Standard",
            }));
          }
        } catch (e) { console.error(e); }
      }

      if (loaded.length === 0 && typeof window !== "undefined") {
        const saved = localStorage.getItem("edutime_timetable_entries_v1");
        if (saved) { try { loaded = JSON.parse(saved); } catch (e) { console.error(e); } }
      }
      setEntries(loaded);
    };
    loadEntries();
  }, []);

  useEffect(() => {
    if (entries.length === 0) return;
    if (viewType === "class") {
      const classes = Array.from(new Set(entries.map((e) => e.class_name))).filter(Boolean).sort();
      setAvailableTargets(classes);
      if (classes.length > 0 && !classes.includes(selectedTarget)) setSelectedTarget(classes[0]);
    } else {
      const teachers = Array.from(new Set(entries.map((e) => e.teacher_name))).filter(Boolean).sort();
      setAvailableTargets(teachers);
      if (teachers.length > 0 && !teachers.includes(selectedTarget)) setSelectedTarget(teachers[0]);
    }
  }, [entries, viewType]);

  // Validation anti-chevauchement au déplacement
  const handleCellClick = async (targetDay: string, targetSlot: string) => {
    if (!selectedEntry) return;

    // Si on clique sur la même case, désélectionner
    if (selectedEntry.day === targetDay && selectedEntry.slot === targetSlot) {
      setSelectedEntry(null);
      return;
    }

    // 1. Vérification de collision Professeur
    const teacherCollision = entries.find(
      (e) => e.id !== selectedEntry.id && e.teacher_name === selectedEntry.teacher_name && e.day === targetDay && e.slot === targetSlot
    );

    if (teacherCollision) {
      setAlertMessage({
        type: "error",
        text: `Impossible ! L'enseignant ${selectedEntry.teacher_name} a déjà un cours avec la classe ${teacherCollision.class_name} le ${targetDay} à ${targetSlot}.`,
      });
      return;
    }

    // 2. Vérification de collision Classe
    const classCollision = entries.find(
      (e) => e.id !== selectedEntry.id && e.class_name === selectedEntry.class_name && e.day === targetDay && e.slot === targetSlot
    );

    if (classCollision) {
      setAlertMessage({
        type: "error",
        text: `Impossible ! La classe ${selectedEntry.class_name} a déjà un cours de ${classCollision.subject} le ${targetDay} à ${targetSlot}.`,
      });
      return;
    }

    // 3. Déplacement autorisé
    const updatedEntries = entries.map((e) =>
      e.id === selectedEntry.id ? { ...e, day: targetDay, slot: targetSlot } : e
    );

    setEntries(updatedEntries);
    localStorage.setItem("edutime_timetable_entries_v1", JSON.stringify(updatedEntries));

    if (supabase) {
      await supabase.from("timetable_entries").update({ day: targetDay, slot: targetSlot }).eq("id", selectedEntry.id);
    }

    setAlertMessage({
      type: "success",
      text: `Créneau de ${selectedEntry.subject} déplaçé avec succès au ${targetDay} (${targetSlot}) !`,
    });

    setSelectedEntry(null);
  };

  if (!isMounted) return <div className="p-8 text-xs text-slate-400">Chargement...</div>;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        title="Emploi du Temps Général & Édition Interactive"
        description="Cliquez sur n'importe quel cours pour le sélectionner, puis cliquez sur une case libre pour le déplacer."
      />

      {/* Message d'Alerte anti-chevauchement */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
            alertMessage.type === "error"
              ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
              : "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === "error" ? <AlertTriangle className="size-4" /> : <CheckCircle className="size-4" />}
            {alertMessage.text}
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/50 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Mode :</span>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => setViewType("class")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold ${viewType === "class" ? "bg-emerald-600 text-white" : "text-slate-400"}`}
                >
                  <GraduationCap className="inline size-3.5 mr-1" /> Par Classe
                </button>
                <button
                  type="button"
                  onClick={() => setViewType("teacher")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold ${viewType === "teacher" ? "bg-emerald-600 text-white" : "text-slate-400"}`}
                >
                  <Users className="inline size-3.5 mr-1" /> Par Enseignant
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-300">
                {viewType === "class" ? "Classe :" : "Professeur :"}
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-400 focus:outline-none"
              >
                {availableTargets.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Grille Interactive */}
      <Card className="border-slate-800 bg-slate-900/50 p-5 overflow-x-auto">
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
                  const cellEntry = entries.find(
                    (e) =>
                      e.day === day &&
                      e.slot === slot.id &&
                      (viewType === "class" ? e.class_name === selectedTarget : e.teacher_name === selectedTarget)
                  );

                  const isSelected = selectedEntry?.id === cellEntry?.id;

                  return (
                    <td
                      key={day}
                      onClick={() => {
                        if (cellEntry) setSelectedEntry(cellEntry);
                        else handleCellClick(day, slot.id);
                      }}
                      className={`p-1.5 border-r border-slate-800/40 min-w-28 h-16 cursor-pointer transition-all ${
                        selectedEntry && !cellEntry ? "bg-emerald-500/5 hover:bg-emerald-500/20" : ""
                      }`}
                    >
                      {cellEntry ? (
                        <div
                          className={`h-full rounded-lg p-2 text-left flex flex-col justify-between transition-all border ${
                            isSelected
                              ? "bg-amber-500/20 border-amber-400 shadow-md ring-2 ring-amber-400/50"
                              : "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400"
                          }`}
                        >
                          <span className="font-extrabold text-emerald-400 text-xs truncate block">
                            {cellEntry.subject}
                          </span>
                          <span className="text-[10px] font-medium text-slate-300 truncate block">
                            {viewType === "class" ? cellEntry.teacher_name : cellEntry.class_name}
                          </span>
                        </div>
                      ) : (
                        <div className="h-full rounded-lg border border-dashed border-slate-800/40 flex items-center justify-center text-[10px] text-slate-600 hover:text-emerald-400 font-mono">
                          {selectedEntry ? "Placer ici" : "Libre"}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}