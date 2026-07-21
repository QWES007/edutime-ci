"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Trash2, Edit2, Calendar } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  maxHoursPerWeek: number;
  unavailabilities: string[];
}

const STORAGE_KEY = "edutime_teachers_saas_v1";
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const SLOTS = ["M1", "M2", "M3", "M4", "M5", "A1", "A2", "A3", "A4"];

export default function TeachersPage() {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState("");
  const [maxHours, setMaxHours] = useState(18);
  const [selectedUnavailabilities, setSelectedUnavailabilities] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadTeachers = async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("teachers").select("*");
        if (!error && data && data.length > 0) {
          const mapped = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            subjects: Array.isArray(t.subjects) ? t.subjects : [t.subject || "MATHS"],
            maxHoursPerWeek: Number(t.max_hours_per_week || t.weekly_hours || 18),
            unavailabilities: Object.keys(t.unavailabilities || {}),
          }));
          setTeachers(mapped);
          if (mapped.length > 0 && !selectedTeacherId) setSelectedTeacherId(mapped[0].id);
        }
      } catch (err) { console.error(err); }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadTeachers();
  }, []);

  const handleSelectForEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setSelectedTeacherId(teacher.id);
    setName(teacher.name);
    setSubjects(teacher.subjects.join(", "));
    setMaxHours(teacher.maxHoursPerWeek);
    setSelectedUnavailabilities(teacher.unavailabilities || []);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setSubjects("");
    setMaxHours(18);
    setSelectedUnavailabilities([]);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const parsedSubjects = subjects.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    const targetId = editingId || crypto.randomUUID();

    const unavailObj: Record<string, boolean> = {};
    selectedUnavailabilities.forEach((u) => { unavailObj[u] = true; });

    const payload = {
      id: targetId,
      name: name.trim(),
      subjects: parsedSubjects,
      subject: parsedSubjects[0] || "MATHS",
      max_hours_per_week: Number(maxHours),
      unavailabilities: unavailObj,
    };

    if (supabase) {
      const { error } = await supabase.from("teachers").upsert(payload);
      if (error) {
        alert(`Erreur Supabase Enseignant : ${error.message}`);
      } else {
        await loadTeachers();
      }
    }

    setIsSaving(false);
    handleCancelEdit();
  };

  const toggleUnavailability = async (daySlotKey: string) => {
    if (!selectedTeacherId) return;

    const teacher = teachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    const currentList = teacher.unavailabilities || [];
    const updatedList = currentList.includes(daySlotKey)
      ? currentList.filter((k) => k !== daySlotKey)
      : [...currentList, daySlotKey];

    const unavailObj: Record<string, boolean> = {};
    updatedList.forEach((u) => { unavailObj[u] = true; });

    if (supabase) {
      await supabase.from("teachers").update({ unavailabilities: unavailObj }).eq("id", selectedTeacherId);
      await loadTeachers();
    }
  };

  const handleDeleteTeacher = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (supabase) {
      await supabase.from("teachers").delete().eq("id", id);
      await loadTeachers();
    }
  };

  if (!isMounted) return <div className="p-8 text-xs text-slate-400">Chargement...</div>;

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        title="Enseignants & Indisponibilités"
        description="Cliquez sur un enseignant pour modifier ses informations ou marquer ses indisponibilités."
      />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="size-4 text-emerald-400" />
                {editingId ? "Modifier l'enseignant" : "Saisie Enseignant"}
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSaveTeacher} className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-300 font-semibold">Nom complet</Label>
                  <Input
                    placeholder="Ex: M. GOMEZ Paul"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-300 font-semibold">Matières (virgule)</Label>
                    <Input
                      placeholder="Ex: MATHS, PC"
                      value={subjects}
                      onChange={(e) => setSubjects(e.target.value)}
                      className="mt-1 bg-slate-950 border-slate-800 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-300 font-semibold">Quota d&apos;heures</Label>
                    <Input
                      type="number"
                      value={maxHours}
                      onChange={(e) => setMaxHours(Number(e.target.value))}
                      className="mt-1 bg-slate-950 border-slate-800 text-xs text-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9">
                    {isSaving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Enregistrer l'enseignant"}
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

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {teachers.map((t) => {
              const isSelected = selectedTeacherId === t.id;
              return (
                <Card
                  key={t.id}
                  onClick={() => handleSelectForEdit(t)}
                  className={`border cursor-pointer transition-all ${
                    isSelected ? "bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        {t.name}
                        <Edit2 className="size-3 text-slate-400 opacity-60" />
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t.subjects.join(", ")} &bull; {t.maxHoursPerWeek}h/semaine
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => handleDeleteTeacher(t.id, e)} className="text-slate-500 hover:text-rose-500">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-8">
          <Card className="border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Calendar className="size-4 text-emerald-400" />
                  Grille des Disponibilités
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pour : <span className="text-emerald-400 font-bold">{activeTeacher ? activeTeacher.name : "Aucun enseignant"}</span>
                </p>
              </div>
            </div>

            {activeTeacher && (
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-300 font-bold">
                    <th className="py-2.5 px-2 text-left w-24">Créneau</th>
                    {DAYS.map((day) => (
                      <th key={day} className="py-2.5 px-2">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {SLOTS.map((slot) => (
                    <tr key={slot} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-2 text-left font-mono font-bold text-slate-400 bg-slate-950/40">
                        {slot}
                      </td>
                      {DAYS.map((day) => {
                        const key = `${day}-${slot}`;
                        const isUnavailable = (activeTeacher.unavailabilities || []).includes(key);

                        return (
                          <td key={day} onClick={() => toggleUnavailability(key)} className="p-1 cursor-pointer">
                            <div
                              className={`py-2 rounded-md font-bold text-[10px] transition-all border ${
                                isUnavailable
                                  ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-emerald-500/50"
                              }`}
                            >
                              {isUnavailable ? "INDISPO" : "LIBRE"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}