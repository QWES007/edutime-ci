"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Trash2, Edit } from "lucide-react";

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
  "2nde A": { MATHS: 3, PC: 0, SVT: 2, FR: 5, PHILO: 0, ANG: 4, LV2: 4, HG: 4, ARTS: 1, EDHC: 1, EPS: 2, TICE: 1 },
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

export default function ClassesContent() {
  const [supabase] = useState(() => createClient());
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [level, setLevel] = useState("6ème");
  const [studentCount, setStudentCount] = useState(45);
  const [doubleVacation, setDoubleVacation] = useState<"none" | "A" | "B">("none");
  const [subjectHours, setSubjectHours] = useState<Record<string, number>>(DEFAULT_MENA_HOURS["6ème"]);
  const [isSaving, setIsSaving] = useState(false);

  const loadClasses = async () => {
    let loaded: ClassGroup[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from("classgroups").select("*");
        if (!error && data && data.length > 0) {
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
        console.error("Erreur Supabase :", e);
      }
    }

    if (loaded.length === 0 && typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { loaded = JSON.parse(saved); } catch (e) {}
      }
    }

    setClasses(loaded);
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleSelectClassForEdit = (c: ClassGroup) => {
    setEditingId(c.id);
    setClassName(c.name);
    setLevel(c.level);
    setStudentCount(c.student_count);
    setDoubleVacation(c.double_vacation || "none");
    setSubjectHours(c.subject_hours || DEFAULT_MENA_HOURS[c.level] || {});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setClassName("");
    setLevel("6ème");
    setStudentCount(45);
    setDoubleVacation("none");
    setSubjectHours(DEFAULT_MENA_HOURS["6ème"]);
  };

  const handleHourChange = (subject: string, val: number) => {
    setSubjectHours((prev) => ({ ...prev, [subject]: Math.max(0, val) }));
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    setIsSaving(true);
    const targetId = editingId || crypto.randomUUID();

    const localPayload = {
      id: targetId,
      name: className.trim(),
      level,
      student_count: Number(studentCount),
      double_vacation: doubleVacation,
      subject_hours: subjectHours,
    };

    const updated = editingId
      ? classes.map((c) => (c.id === editingId ? localPayload : c))
      : [localPayload, ...classes];

    setClasses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (supabase) {
      const dbPayload: any = {
        id: targetId,
        name: className.trim(),
        level,
        student_count: Number(studentCount),
        subject_hours: subjectHours,
        double_vacation: doubleVacation,
      };

      let { error } = await supabase.from("classgroups").upsert(dbPayload);

      if (error && error.message.includes("double_vacation")) {
        delete dbPayload.double_vacation;
        await supabase.from("classgroups").upsert(dbPayload);
      }
      await loadClasses();
    }

    setIsSaving(false);
    handleCancelEdit();
  };

  const handleDeleteClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = classes.filter((c) => c.id !== id);
    setClasses(filtered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (editingId === id) handleCancelEdit();

    if (supabase) {
      await supabase.from("classgroups").delete().eq("id", id);
      await loadClasses();
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Configuration des Divisions & Classes
          </h1>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Normes MENA v2026
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl">
          Cliquez sur n&apos;importe quelle classe pour modifier son niveau, sa double vacation ou ses volumes horaires.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5 space-y-6">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="size-4 text-emerald-400" />
                {editingId ? "Modifier la classe" : "Création d'une Division"}
              </h3>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <form onSubmit={handleSaveClass} className="space-y-4">
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
                      onChange={(e) => {
                        setLevel(e.target.value);
                        setSubjectHours(DEFAULT_MENA_HOURS[e.target.value] || {});
                      }}
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

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <Label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Système de Double Vacation (Rotation MENA)
                  </Label>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="vacation" checked={doubleVacation === "none"} onChange={() => setDoubleVacation("none")} className="accent-emerald-500" />
                      <span>Plein temps (Standard)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="vacation" checked={doubleVacation === "A"} onChange={() => setDoubleVacation("A")} className="accent-emerald-500" />
                      <span>Vague A <span className="text-[10px] text-slate-500">(L/M/V Matin, M/J Après-midi)</span></span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="vacation" checked={doubleVacation === "B"} onChange={() => setDoubleVacation("B")} className="accent-emerald-500" />
                      <span>Vague B <span className="text-[10px] text-slate-500">(L/M/V Après-midi, M/J Matin)</span></span>
                    </label>
                  </div>
                </div>

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
                          step="0.5"
                          value={hours}
                          onChange={(e) => handleHourChange(sub, Number(e.target.value))}
                          className="h-6 text-center text-xs font-bold text-emerald-400 bg-transparent border-none p-0 focus-visible:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9">
                    {isSaving ? "Enregistrement..." : editingId ? "Mettre à jour la classe" : "Enregistrer la classe"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="text-xs h-9 border-slate-800 text-slate-300">
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {classes.map((c) => {
            const isSelected = editingId === c.id;
            return (
              <Card
                key={c.id}
                onClick={() => handleSelectClassForEdit(c)}
                className={`border cursor-pointer transition-all ${
                  isSelected ? "bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      {c.name}
                      <Edit className="size-3.5 text-slate-400 opacity-60" />
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
                      Effectif : {c.student_count} élèves &bull; Total : {Object.values(c.subject_hours || {}).reduce((a, b) => a + Number(b), 0)}h / semaine
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => handleDeleteClass(c.id, e)} className="text-slate-500 hover:text-rose-500">
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}