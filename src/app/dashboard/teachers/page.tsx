"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Trash2, 
  Plus, 
  FileSpreadsheet, 
  Calendar,
  XCircle,
  AlertCircle,
  RotateCcw,
  Upload
} from "lucide-react";
import * as XLSX from "xlsx";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  weekly_hours: number;
  unavailabilities?: Record<string, string>;
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

const STORAGE_KEY = "edutime_teachers_saas_v1";

export default function TeachersPage() {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [insertMode, setInsertMode] = useState<"manual" | "excel">("manual");
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(18);

  useEffect(() => {
    const loadTeachersData = async () => {
      const savedLocal = localStorage.getItem(STORAGE_KEY);
      if (savedLocal !== null) {
        try {
          const parsed = JSON.parse(savedLocal);
          setTeachers(parsed);
          if (parsed.length > 0) setSelectedTeacherId(parsed[0].id);
          setIsInitialized(true);
          return;
        } catch (e) {
          console.error("Erreur de lecture du localStorage enseignants :", e);
        }
      }

      if (supabase) {
        try {
          const { data, error } = await (supabase.from("teachers" as any) as any)
            .select("*")
            .order("name", { ascending: true });

          if (!error && data && data.length > 0) {
            setTeachers(data);
            setSelectedTeacherId(data[0].id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setIsInitialized(true);
            return;
          }
        } catch (e) {
          console.log("Supabase teachers non disponible ou vide", e);
        }
      }

      const initial: Teacher[] = [
        { id: "t1", name: "M. Kouassi Koffi", subject: "MATHS", weekly_hours: 18, unavailabilities: {} },
        { id: "t2", name: "Mme Koné Aminata", subject: "MATHS", weekly_hours: 18, unavailabilities: {} },
        { id: "t3", name: "M. Gomez Paul", subject: "FR, PHILO", weekly_hours: 21, unavailabilities: { "Mardi-A1": "indisponible" } },
      ];
      setTeachers(initial);
      setSelectedTeacherId("t1");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      setIsInitialized(true);
    };

    loadTeachersData();
  }, []);

  const persistTeachers = async (updated: Teacher[]) => {
    setTeachers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (supabase) {
      try {
        await (supabase.from("teachers" as any) as any).upsert(updated);
      } catch (e) {
        console.error("Erreur Supabase Teachers :", e);
      }
    }
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject) return;

    const newTeacher: Teacher = {
      id: `t_${Date.now()}`,
      name,
      subject: subject.toUpperCase(),
      weekly_hours: Number(weeklyHours),
      unavailabilities: {},
    };

    const updated = [...teachers, newTeacher];
    persistTeachers(updated);
    setSelectedTeacherId(newTeacher.id);

    setName("");
    setSubject("");
    setWeeklyHours(18);
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedTeachers: Teacher[] = data
          .filter((row) => row.Nom || row.Teacher || row.Enseignant)
          .map((row, index) => ({
            id: `t_excel_${Date.now()}_${index}`,
            name: String(row.Nom || row.Teacher || row.Enseignant).trim(),
            subject: String(row.Discipline || row.Matiere || row.Subject || "MATHS").trim().toUpperCase(),
            weekly_hours: Number(row.Heures || row.Volume || row.Hours) || 18,
            unavailabilities: {},
          }));

        if (importedTeachers.length === 0) {
          alert("Aucun enseignant valide trouvé. Vérifiez les colonnes 'Nom', 'Discipline', 'Heures'.");
          return;
        }

        const merged = [...teachers, ...importedTeachers];
        persistTeachers(merged);
        if (importedTeachers.length > 0) setSelectedTeacherId(importedTeachers[0].id);
        alert(`${importedTeachers.length} enseignant(s) importé(s) et sauvegardé(s) avec succès !`);
        setInsertMode("manual");
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la lecture du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = teachers.filter((t) => t.id !== id);
    persistTeachers(updated);
    if (selectedTeacherId === id) {
      setSelectedTeacherId(updated.length > 0 ? updated[0].id : null);
    }

    if (supabase) {
      try {
        (supabase.from("teachers" as any) as any).delete().eq("id", id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleResetTeachers = () => {
    if (confirm("Attention : Voulez-vous vraiment TOUT effacer pour les enseignants ?")) {
      setTeachers([]);
      setSelectedTeacherId(null);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

      if (supabase) {
        try {
          (supabase.from("teachers" as any) as any).delete().neq("id", "0");
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleSlotClick = (day: string, slotId: string) => {
    if (!selectedTeacherId) return;

    const slotKey = `${day}-${slotId}`;
    const updatedTeachers = teachers.map((t) => {
      if (t.id !== selectedTeacherId) return t;

      const currentUnavail = t.unavailabilities || {};
      const currentStatus = currentUnavail[slotKey];

      let newStatus: string | undefined;
      if (!currentStatus) {
        newStatus = "indisponible";
      } else if (currentStatus === "indisponible") {
        newStatus = "ce_up";
      } else {
        newStatus = undefined;
      }

      const newUnavail = { ...currentUnavail };
      if (newStatus) {
        newUnavail[slotKey] = newStatus;
      } else {
        delete newUnavail[slotKey];
      }

      return { ...t, unavailabilities: newUnavail };
    });

    persistTeachers(updatedTeachers);
  };

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  if (!isInitialized) {
    return <div className="p-8 text-xs text-slate-400">Chargement des enseignants...</div>;
  }

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
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Enseignants</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={handleResetTeachers}
                    className="text-[10px] h-7 gap-1 text-rose-500 border-rose-200 hover:bg-rose-50"
                  >
                    <RotateCcw className="size-3" /> Réinitialiser
                  </Button>

                  <Button 
                    size="sm" 
                    variant={insertMode === "excel" ? "default" : "outline"} 
                    onClick={() => setInsertMode("excel")}
                    className={`text-xs h-7 gap-1 ${insertMode === "excel" ? "bg-emerald-600 text-white" : ""}`}
                  >
                    <FileSpreadsheet className="size-3.5" /> Excel
                  </Button>
                  <Button 
                    size="sm" 
                    variant={insertMode === "manual" ? "default" : "outline"}
                    onClick={() => setInsertMode("manual")}
                    className={`text-xs h-7 gap-1 ${insertMode === "manual" ? "bg-emerald-600 text-white" : ""}`}
                  >
                    <Plus className="size-3.5" /> Manuel
                  </Button>
                </div>
              </div>

              {insertMode === "excel" ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-emerald-500/30 bg-emerald-50/50 rounded-xl p-6 text-center hover:bg-emerald-50 transition-colors relative cursor-pointer group">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={handleExcelImport} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                    <Upload className="size-8 mx-auto text-emerald-600 mb-2" />
                    <p className="text-xs font-bold text-slate-800">Glissez votre fichier Excel ou CSV ici</p>
                  </div>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>

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
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
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

                <div className="flex items-center gap-3 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <span className="size-2.5 rounded bg-slate-100 border" /> Dispo
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
                        <tr key={slot.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2 text-left font-semibold text-[10px] text-slate-500 border-r">
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
                                      ? "bg-rose-500/15 border-rose-500/40 text-rose-600 shadow-xs"
                                      : status === "ce_up"
                                      ? "bg-amber-500/15 border-amber-500/40 text-amber-600 shadow-xs"
                                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300"
                                  }`}
                                >
                                  {status === "indisponible" && <XCircle className="size-3 text-rose-600" />}
                                  {status === "ce_up" && <AlertCircle className="size-3 text-amber-600" />}
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