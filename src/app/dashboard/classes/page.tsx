"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Plus, Trash2, RotateCcw, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface ClassGroup {
  id: string;
  name: string;
  level: string;
  student_count: number;
  subject_hours: Record<string, number>;
  double_vacation: "none" | "A" | "B";
}

const STORAGE_KEY = "edutime_classes_saas_v1";

const DEFAULT_MENA_HOURS: Record<string, Record<string, number>> = {
  "6ème": { MATHS: 4, PC: 0, SVT: 2, FR: 6, PHILO: 0, ANG: 4, LV2: 0, HG: 3, ARTS: 1, EDHC: 1, EPS: 2, TICE: 1 },
  "5ème": { MATHS: 4, PC: 2, SVT: 2, FR: 5, PHILO: 0, ANG: 3, LV2: 3, HG: 3, ARTS: 1, EDHC: 1, EPS: 2, TICE: 1 },
  "4ème": { MATHS: 4, PC: 2, SVT: 2, FR: 5, PHILO: 0, ANG: 3, LV2: 3, HG: 3, ARTS: 1, EDHC: 1, EPS: 2, TICE: 1 },
  "3ème": { MATHS: 5, PC: 3, SVT: 3, FR: 5, PHILO: 0, ANG: 3, LV2: 3, HG: 3, ARTS: 1, EDHC: 1, EPS: 2, TICE: 1 },
  "2nde A": { MATHS: 3, PC: 2, SVT: 2, FR: 5, PHILO: 0, ANG: 4, LV2: 4, HG: 4, ARTS: 1, EDHC: 1, EPS: 2, TICE: 1 },
  "2nde C": { MATHS: 6, PC: 5, SVT: 4, FR: 4, PHILO: 0, ANG: 3, LV2: 3, HG: 3, ARTS: 1, EDHC: 1, EPS: 2, TICE: 1 },
  "1ère A1": { MATHS: 2, PC: 0, SVT: 2, FR: 5, PHILO: 4, ANG: 4, LV2: 4, HG: 4, ARTS: 1, EDHC: 1, EPS: 2, TICE: 1 },
  "1ère A2": { MATHS: 3, PC: 0, SVT: 2, FR: 5, PHILO: 4, ANG: 4, LV2: 4, HG: 4, ARTS: 1, EDHC: 1, EPS: 2, TICE: 1 },
  "1ère C": { MATHS: 7, PC: 6, SVT: 3, FR: 3, PHILO: 2, ANG: 3, LV2: 3, HG: 3, ARTS: 0, EDHC: 1, EPS: 2, TICE: 1 },
  "1ère D": { MATHS: 5, PC: 5, SVT: 5, FR: 3, PHILO: 2, ANG: 3, LV2: 3, HG: 3, ARTS: 0, EDHC: 1, EPS: 2, TICE: 1 },
  "Tle A1": { MATHS: 2, PC: 0, SVT: 0, FR: 5, PHILO: 5, ANG: 4, LV2: 4, HG: 4, ARTS: 0, EDHC: 1, EPS: 2, TICE: 1 },
  "Tle A2": { MATHS: 3, PC: 0, SVT: 0, FR: 5, PHILO: 5, ANG: 4, LV2: 4, HG: 4, ARTS: 0, EDHC: 1, EPS: 2, TICE: 1 },
  "Tle C": { MATHS: 8, PC: 7, SVT: 3, FR: 3, PHILO: 3, ANG: 3, LV2: 2, HG: 2, ARTS: 0, EDHC: 1, EPS: 2, TICE: 1 },
  "Tle D": { MATHS: 5, PC: 5, SVT: 6, FR: 3, PHILO: 3, ANG: 3, LV2: 2, HG: 2, ARTS: 0, EDHC: 1, EPS: 2, TICE: 1 },
};

export default function ClassesPage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [className, setClassName] = useState("");
  const [level, setLevel] = useState("6ème");
  const [studentCount, setStudentCount] = useState(45);
  const [doubleVacation, setDoubleVacation] = useState<"none" | "A" | "B">("none");
  const [subjectHours, setSubjectHours] = useState<Record<string, number>>(DEFAULT_MENA_HOURS["6ème"]);
  const [insertMode, setInsertMode] = useState<"manual" | "excel">("manual");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const loadClasses = async () => {
      let loaded: ClassGroup[] = [];

      if (supabase) {
        try {
          const { data } = await supabase.from("classgroups").select("*");
          if (data && data.length > 0) {
            loaded = data.map((c: any) => ({
              id: c.id,
              name: c.name,
              level: c.level || "6ème",
              student_count: Number(c.student_count || 45),
              subject_hours: c.subject_hours || DEFAULT_MENA_HOURS[c.level] || {},
              double_vacation: c.double_vacation || "none",
            }));
          }
        } catch (e) {
          console.error("Erreur Supabase Classes :", e);
        }
      }

      if (loaded.length === 0 && typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try { loaded = JSON.parse(saved); } catch (e) { console.error(e); }
        }
      }

      setClasses(loaded);
    };

    loadClasses();
  }, []);

  useEffect(() => {
    setSubjectHours(DEFAULT_MENA_HOURS[level] || {});
  }, [level]);

  const handleHourChange = (subject: string, val: number) => {
    setSubjectHours((prev) => ({
      ...prev,
      [subject]: Math.max(0, val),
    }));
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    const newClass: ClassGroup = {
      id: crypto.randomUUID(),
      name: className.trim(),
      level,
      student_count: Number(studentCount),
      subject_hours: subjectHours,
      double_vacation: doubleVacation,
    };

    const updated = [newClass, ...classes];
    setClasses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (supabase) {
      const { error } = await supabase.from("classgroups").insert([{
        id: newClass.id,
        name: newClass.name,
        level: newClass.level,
        student_count: newClass.student_count,
        subject_hours: newClass.subject_hours,
        double_vacation: newClass.double_vacation,
      }]);
      if (error) console.error("Erreur insertion classe Supabase :", error.message);
    }

    setClassName("");
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedClasses: ClassGroup[] = [];
        const supabasePayloads: any[] = [];

        data.forEach((row) => {
          const keys = Object.keys(row);
          if (keys.length === 0) return;

          const nameKey = keys.find(k => /classe|nom|division/i.test(k)) || keys[0];
          const levelKey = keys.find(k => /niveau|cycle/i.test(k)) || keys[1];

          const rawName = row[nameKey];
          const rawLevel = levelKey ? String(row[levelKey]).trim() : "6ème";

          if (rawName) {
            const id = crypto.randomUUID();
            const nameStr = String(rawName).trim();
            const hours = DEFAULT_MENA_HOURS[rawLevel] || DEFAULT_MENA_HOURS["6ème"];

            importedClasses.push({
              id,
              name: nameStr,
              level: rawLevel,
              student_count: 45,
              subject_hours: hours,
              double_vacation: "none",
            });

            supabasePayloads.push({
              id,
              name: nameStr,
              level: rawLevel,
              student_count: 45,
              subject_hours: hours,
              double_vacation: "none",
            });
          }
        });

        if (importedClasses.length === 0) {
          alert("Aucune classe lue dans le fichier.");
          return;
        }

        const merged = [...importedClasses, ...classes];
        setClasses(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        if (supabase) {
          const { error } = await supabase.from("classgroups").insert(supabasePayloads);
          if (error) alert(`Erreur Supabase : ${error.message}`);
          else alert(`${importedClasses.length} classe(s) importée(s) !`);
        }

        setInsertMode("manual");
      } catch (err: any) {
        alert(`Erreur lecture fichier : ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDeleteClass = async (id: string) => {
    const filtered = classes.filter((c) => c.id !== id);
    setClasses(filtered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    if (supabase) {
      await supabase.from("classgroups").delete().eq("id", id);
    }
  };

  const handleResetClasses = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setClasses([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    if (supabase) {
      await supabase.from("classgroups").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
  };

  if (!isMounted) {
    return (
      <div className="p-8 space-y-6">
        <DashboardHeader title="Divisions & Classes" description="Configuration des niveaux MENA" />
        <div className="text-xs text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        title="Configuration des Divisions & Classes"
        description="Configurez vos classes et définissez leurs volumes horaires d'enseignement hebdomadaire."
      />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5 space-y-6">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <GraduationCap className="size-4 text-emerald-400" /> Création d&apos;une Division Académique
                </CardTitle>
                <button
                  type="button"
                  onClick={handleResetClasses}
                  className="text-[10px] h-6 px-2 text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="size-3" /> Réinitialiser
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-300">Désignation de la classe</Label>
                  <Input
                    placeholder="Ex: 6ème 2, 1ère D2"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-300">Niveau d&apos;enseignement</Label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-emerald-400 font-bold focus:outline-none"
                    >
                      {Object.keys(DEFAULT_MENA_HOURS).map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-300">Effectif de la classe</Label>
                    <Input
                      type="number"
                      value={studentCount}
                      onChange={(e) => setStudentCount(Number(e.target.value))}
                      className="mt-1 bg-slate-950 border-slate-800 text-xs text-white"
                      required
                    />
                  </div>
                </div>

                {/* SÉLECTEUR DE DOUBLE VACATION MENA */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <Label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Système de Double Vacation (Rotation MENA)
                  </Label>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vacation"
                        checked={doubleVacation === "none"}
                        onChange={() => setDoubleVacation("none")}
                        className="accent-emerald-500"
                      />
                      <span>Plein temps (Standard)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vacation"
                        checked={doubleVacation === "A"}
                        onChange={() => setDoubleVacation("A")}
                        className="accent-emerald-500"
                      />
                      <span>Vague A <span className="text-[10px] text-slate-500">(L/M/V Matin, M/J Après-midi)</span></span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vacation"
                        checked={doubleVacation === "B"}
                        onChange={() => setDoubleVacation("B")}
                        className="accent-emerald-500"
                      />
                      <span>Vague B <span className="text-[10px] text-slate-500">(L/M/V Après-midi, M/J Matin)</span></span>
                    </label>
                  </div>
                </div>

                {/* VOLUMES HORAIRES MENA */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Volumes Horaires Requis ({level})
                  </Label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(subjectHours).map(([sub, hours]) => (
                      <div key={sub} className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-center">
                        <span className="text-[10px] font-bold text-slate-300 block">{sub}</span>
                        <Input
                          type="number"
                          value={hours}
                          onChange={(e) => handleHourChange(sub, Number(e.target.value))}
                          className="h-6 text-center text-xs font-bold text-emerald-400 bg-transparent border-none p-0 focus-visible:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 cursor-pointer">
                  Enregistrer la classe
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7 space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {classes.map((c) => (
            <Card key={c.id} className="border-slate-800 bg-slate-900/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    {c.name}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {c.level}
                    </span>
                    {c.double_vacation !== "none" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        Vague {c.double_vacation}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Effectif : {c.student_count} élèves &bull; Total : {Object.values(c.subject_hours).reduce((a, b) => a + b, 0)}h / semaine
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(c.id)} className="text-slate-500 hover:text-rose-500 cursor-pointer">
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}