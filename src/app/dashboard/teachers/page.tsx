"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Upload, Trash2, Edit, X, Calendar as CalendarIcon } from "lucide-react";
import * as XLSX from "xlsx";

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  maxHoursPerWeek: number;
  grade: number;
  unavailabilities: Record<string, boolean>; // Ex: { "Lundi-M1": true, "Mardi-A2": true }
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const TIME_SLOTS = [
  { id: "M1", label: "M1 (07:30 - 08:30)" },
  { id: "M2", label: "M2 (08:30 - 09:30)" },
  { id: "M3", label: "M3 (09:45 - 10:45)" },
  { id: "M4", label: "M4 (10:45 - 11:45)" },
  { id: "M5", label: "M5 (11:45 - 12:45)" },
  { id: "A1", label: "A1 (14:30 - 15:30)" },
  { id: "A2", label: "A2 (15:30 - 16:30)" },
  { id: "A3", label: "A3 (16:45 - 17:45)" },
  { id: "A4", label: "A4 (17:45 - 18:45)" },
  { id: "A5", label: "A5 (18:45 - 19:45)" },
];

export default function TeachersPage() {
  const supabase = createClient();
  const [isMounted, setIsMounted] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // État pour la modification d'un enseignant (avec onglets : "general" ou "dispo")
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "dispo">("general");

  const fetchTeachers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from("teachers").select("*");
      if (data) {
        const loadedTeachers = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          subjects: Array.isArray(item.subjects) ? item.subjects : [item.subject || "MATHS"],
          maxHoursPerWeek: Number(item.max_hours_per_week || item.weekly_hours || 24),
          grade: Number(item.grade || 3),
          unavailabilities: item.unavailabilities || {},
        }));
        
        // Tri alphabétique stable pour que les lignes ne bougent pas anarchiquement
        loadedTeachers.sort((a, b) => a.name.localeCompare(b.name));
        setTeachers(loadedTeachers);
      }
    } catch (e) {
      console.error("Erreur de chargement :", e);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchTeachers();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const formattedTeachers = data.map((row: any) => ({
          name: row.Nom || row.name || "Enseignant",
          subjects: row.Matiere || row.subjects ? String(row.Matiere || row.subjects).split(",").map(s => s.trim().toUpperCase()) : ["MATHS"],
          max_hours_per_week: Number(row.VolumeHoraire || row.max_hours_per_week || 24),
          grade: Number(row.Grade || row.grade || 3),
          unavailabilities: {}
        }));

        const { error } = await supabase.from("teachers").insert(formattedTeachers);
        if (error) throw error;

        alert("Importation Excel réussie !");
        fetchTeachers();
      } catch (err) {
        console.error("Erreur d'importation :", err);
        alert("Erreur lors de l'importation du fichier Excel.");
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet enseignant ?")) return;
    if (!supabase) return;
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (!error) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  // Enregistrement des modifications (Heures, Grade et Indisponibilités)
  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !supabase) return;

    const { error } = await supabase
      .from("teachers")
      .update({
        max_hours_per_week: Number(editingTeacher.maxHoursPerWeek),
        grade: Number(editingTeacher.grade),
        unavailabilities: editingTeacher.unavailabilities,
      })
      .eq("id", editingTeacher.id);

    if (error) {
      alert("Erreur lors de la mise à jour.");
      console.error(error);
    } else {
      alert("Enseignant mis à jour avec succès !");
      setEditingTeacher(null);
      fetchTeachers();
    }
  };

  // Basculer l'état d'un créneau d'indisponibilité
  const toggleUnavailability = (day: string, slotId: string) => {
    if (!editingTeacher) return;
    const key = `${day}-${slotId}`;
    const updatedUnavailabilities = { ...editingTeacher.unavailabilities };
    
    if (updatedUnavailabilities[key]) {
      delete updatedUnavailabilities[key]; // Retire l'indisponibilité (devient disponible)
    } else {
      updatedUnavailabilities[key] = true; // Marque comme indisponible
    }

    setEditingTeacher({ ...editingTeacher, unavailabilities: updatedUnavailabilities });
  };

  if (!isMounted) return <div className="p-8 text-xs text-slate-400">Chargement...</div>;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        title="Gestion des Enseignants & Dispos"
        description="Liste des professeurs, volumes horaires, grades et gestion des indisponibilités."
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Users className="size-6 text-emerald-400" />
          <div>
            <h3 className="text-white font-bold">Total Enseignants : {teachers.length}</h3>
            <p className="text-xs text-slate-400">Modifiez les informations ou configurez les indisponibilités de chaque professeur.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-xl cursor-pointer flex items-center gap-2">
            <Upload className="size-4" />
            {isUploading ? "Importation..." : "IMPORTER EXCEL"}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="p-4">Nom de l'Enseignant</th>
              <th className="p-4">Matière(s)</th>
              <th className="p-4">Volume Horaire Max (Hebdo)</th>
              <th className="p-4">Grade</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-900/50">
                <td className="p-4 font-bold text-white">{t.name}</td>
                <td className="p-4">{t.subjects.join(", ")}</td>
                <td className="p-4 text-emerald-400 font-extrabold">{t.maxHoursPerWeek} h / semaine</td>
                <td className="p-4">Grade {t.grade}</td>
                <td className="p-4 text-right space-x-2">
                  <Button
                    onClick={() => { setEditingTeacher(t); setActiveTab("general"); }}
                    variant="ghost"
                    size="sm"
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20"
                    title="Modifier et gérer les indisponibilités"
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(t.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">Aucun enseignant trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE MODIFICATION AVEC ONGLETS */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-white font-bold text-base">Configuration : {editingTeacher.name}</h3>
                <p className="text-xs text-slate-400">Gérez le quota horaire, le grade et les indisponibilités du professeur</p>
              </div>
              <button onClick={() => setEditingTeacher(null)} className="text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            {/* SYSTÈME D'ONGLETS */}
            <div className="flex gap-2 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === "general" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Informations Générales
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("dispo")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                  activeTab === "dispo" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <CalendarIcon className="size-4" /> Indisponibilités ({Object.keys(editingTeacher.unavailabilities || {}).length})
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher} className="space-y-6">
              {activeTab === "general" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Volume Horaire Max (Hebdo)</label>
                    <input
                      type="number"
                      value={editingTeacher.maxHoursPerWeek}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, maxHoursPerWeek: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Grade (Priorité)</label>
                    <select
                      value={editingTeacher.grade}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, grade: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs"
                    >
                      <option value={1}>Grade 1 (Très prioritaire - Second Cycle)</option>
                      <option value={2}>Grade 2 (Prioritaire)</option>
                      <option value={3}>Grade 3 (Standard)</option>
                      <option value={4}>Grade 4</option>
                      <option value={5}>Grade 5</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Cliquez sur les cases pour marquer les créneaux où l'enseignant est <b>indisponible</b> (ex: réunions, autres occupations).
                  </p>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-center text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                        <tr>
                          <th className="p-2 border-b border-slate-800 text-left">Créneau</th>
                          {DAYS.map(day => (
                            <th key={day} className="p-2 border-b border-slate-800">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {TIME_SLOTS.map(slot => (
                          <tr key={slot.id} className="hover:bg-slate-900/50">
                            <td className="p-2 text-left font-bold text-slate-400">{slot.id}</td>
                            {DAYS.map(day => {
                              const isUnv = !!editingTeacher.unavailabilities?.[`${day}-${slot.id}`];
                              return (
                                <td key={day} className="p-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleUnavailability(day, slot.id)}
                                    className={`w-full py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${
                                      isUnv
                                        ? "bg-red-950/80 text-red-400 border border-red-800"
                                        : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                                    }`}
                                  >
                                    {isUnv ? "Occupé" : "Libre"}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingTeacher(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2 rounded-xl"
                >
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}