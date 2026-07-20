"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  BookOpen, 
  Clock, 
  Trash2, 
  Plus, 
  FileSpreadsheet, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  weekly_hours: number;
  unavailabilities?: Record<string, string>; // Ex: { "Lundi-M1": "indisponible", "Mardi-A1": "ce_up" }
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

export default function TeachersPage() {
  const supabase = createClient();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  
  // Formulaire d'ajout
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(18);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      if (supabase) {
        const { data, error } = await (supabase.from("teachers" as any) as any)
          .select("*")
          .order("name", { ascending: true });

        if (!error && data && data.length > 0) {
          setTeachers(data);
          setSelectedTeacherId(data[0].id);
          return;
        }
      }
    } catch (e) {
      console.log("Supabase non connecté, utilisation du stockage local.");
    }

    // Fallback LocalStorage / Mock
    const saved = localStorage.getItem("edutime_teachers");
    if (saved) {
      const parsed = JSON.parse(saved);
      setTeachers(parsed);
      if (parsed.length > 0) setSelectedTeacherId(parsed[0].id);
    } else {
      const initial: Teacher[] = [
        { id: "1", name: "M. Kouassi Koffi", subject: "MATHS", weekly_hours: 18, unavailabilities: {} },
        { id: "2", name: "Mme Koné Aminata", subject: "MATHS", weekly_hours: 18, unavailabilities: {} },
        { id: "3", name: "M. Gomez Paul", subject: "FR, PHILO", weekly_hours: 21, unavailabilities: { "Mardi-A1": "indisponible", "Mercredi-A1": "ce_up" } },
      ];
      setTeachers(initial);
      setSelectedTeacherId("1");
      localStorage.setItem("edutime_teachers", JSON.stringify(initial));
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject) return;

    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name,
      subject: subject.toUpperCase(),
      weekly_hours: Number(weeklyHours),
      unavailabilities: {},
    };

    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    setSelectedTeacherId(newTeacher.id);
    localStorage.setItem("edutime_teachers", JSON.stringify(updated));

    if (supabase) {
      try {
        await (supabase.from("teachers" as any) as any).insert([newTeacher]);
      } catch (e) {
        console.error(e);
      }
    }

    setName("");
    setSubject("");
    setWeeklyHours(18);
  };

  const handleDeleteTeacher = async (id: string) => {
    const updated = teachers.filter((t) => t.id !== id);
    setTeachers(updated);
    if (selectedTeacherId === id) {
      setSelectedTeacherId(updated.length > 0 ? updated[0].id : null);
    }
    localStorage.setItem("edutime_teachers", JSON.stringify(updated));

    if (supabase) {
      try {
        await (supabase.from("teachers" as any) as any).delete().eq("id", id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Gestion du Clic sur une case de Disponibilité
  const handleSlotClick = async (day: string, slotId: string) => {
    if (!selectedTeacherId) return;

    const slotKey = `${day}-${slotId}`;

    const updatedTeachers = teachers.map((t) => {
      if (t.id !== selectedTeacherId) return t;

      const currentUnavail = t.unavailabilities || {};
      const currentStatus = currentUnavail[slotKey];

      let newStatus: string | undefined;
      if (!currentStatus) {
        newStatus = "indisponible"; // 1er clic -> Indisponible (Rouge)
      } else if (currentStatus === "indisponible") {
        newStatus = "ce_up"; // 2e clic -> Conseil Enseignement / UP (Orange)
      } else {
        newStatus = undefined; // 3e clic -> Remise à dispo (Blanc)
      }

      const newUnavail = { ...currentUnavail };
      if (newStatus) {
        newUnavail[slotKey] = newStatus;
      } else {
        delete newUnavail[slotKey];
      }

      return { ...t, unavailabilities: newUnavail };
    });

    setTeachers(updatedTeachers);
    localStorage.setItem("edutime_teachers", JSON.stringify(updatedTeachers));

    if (supabase) {
      try {
        const selected = updatedTeachers.find((t) => t.id === selectedTeacherId);
        await (supabase.from("teachers" as any) as any)
          .update({ unavailabilities: selected?.unavailabilities })
          .eq("id", selectedTeacherId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="size-6 text-emerald-600" /> Enseignants & Dispos
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configurez votre corps professoral, leurs matières et leurs contraintes d&apos;emploi du temps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLONNE GAUCHE : Formulaire & Liste (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Formulaire */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Enseignants</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                    <FileSpreadsheet className="size-3.5 text-emerald-600" /> Excel
                  </Button>
                  <Button size="sm" className="text-xs h-7 gap-1 bg-emerald-600 text-white">
                    <Plus className="size-3.5" /> Manuel
                  </Button>
                </div>
              </div>

              <form onSubmit={handleAddTeacher} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Nom complet</label>
                  <Input 
                    placeholder="Ex: M. Gomez Paul" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Discipline</label>
                    <Input 
                      placeholder="Ex: MATHS, FR, PHILO" 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Volume Horaire</label>
                    <Input 
                      type="number"
                      value={weeklyHours} 
                      onChange={(e) => setWeeklyHours(Number(e.target.value))}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9">
                  Enregistrer l&apos;enseignant
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Liste des Enseignants */}
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {teachers.map((t) => {
              const isSelected = t.id === selectedTeacherId;
              const unavailCount = Object.keys(t.unavailabilities || {}).length;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-3 rounded-full ${isSelected ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`} />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{t.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {t.subject} &bull; {t.weekly_hours}h
                        {unavailCount > 0 && (
                          <span className="ml-2 text-amber-600 font-bold">({unavailCount} contrainte(s))</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeacher(t.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 size-7 p-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLONNE DROITE : Grille des Disponibilités (7 Cols) */}
        <div className="lg:col-span-7">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Calendar className="size-4 text-emerald-600" /> Grille des Disponibilités Hebdomadaires
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedTeacher ? (
                      <>Pour : <strong className="text-emerald-600">{selectedTeacher.name}</strong> ({selectedTeacher.subject})</>
                    ) : (
                      "Sélectionnez un enseignant à gauche pour configurer ses créneaux."
                    )}
                  </p>
                </div>

                {/* Légende */}
                <div className="flex items-center gap-3 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <span className="size-2.5 rounded bg-slate-100 dark:bg-slate-800 border" /> Dispo
                  </span>
                  <span className="flex items-center gap-1 text-rose-600">
                    <span className="size-2.5 rounded bg-rose-500" /> Indispo
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="size-2.5 rounded bg-amber-500" /> CE/UP
                  </span>
                </div>
              </div>

              {!selectedTeacher ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                  Sélectionnez un enseignant dans la liste pour modifier sa grille.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <th className="py-2.5 px-2 text-left w-28">Créneau</th>
                        {DAYS.map((day) => (
                          <th key={day} className="py-2.5 px-2">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {SLOTS.map((slot) => (
                        <tr key={slot.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="py-2 px-2 text-left font-semibold text-[10px] text-slate-500 border-r dark:border-slate-800">
                            {slot.label}
                          </td>
                          {DAYS.map((day) => {
                            const key = `${day}-${slot.id}`;
                            const status = selectedTeacher.unavailabilities?.[key];

                            return (
                              <td key={day} className="p-1">
                                <button
                                  type="button"
                                  onClick={() => handleSlotClick(day, slot.id)}
                                  className={`w-full h-8 rounded-md font-bold text-[10px] transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                                    status === "indisponible"
                                      ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-xs"
                                      : status === "ce_up"
                                      ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-xs"
                                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300"
                                  }`}
                                >
                                  {status === "indisponible" && (
                                    <>
                                      <XCircle className="size-3" /> Indisponible
                                    </>
                                  )}
                                  {status === "ce_up" && (
                                    <>
                                      <AlertCircle className="size-3" /> CE/UP
                                    </>
                                  )}
                                  {!status && <span className="opacity-0 hover:opacity-100 text-slate-400">+</span>}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}