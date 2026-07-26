"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Upload, Plus, Trash2, Edit } from "lucide-react";
import * as XLSX from "xlsx";

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  maxHoursPerWeek: number;
  grade: number;
  unavailabilities: string[];
}

export default function TeachersPage() {
  const supabase = createClient();
  const [isMounted, setIsMounted] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchTeachers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from("teachers").select("*");
      if (data) {
        setTeachers(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            subjects: Array.isArray(item.subjects) ? item.subjects : [item.subject || "MATHS"],
            maxHoursPerWeek: Number(item.max_hours_per_week || item.weekly_hours || 24),
            grade: Number(item.grade || 3),
            unavailabilities: item.unavailabilities || {},
          }))
        );
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

  if (!isMounted) return <div className="p-8 text-xs text-slate-400">Chargement...</div>;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        title="Gestion des Enseignants & Dispos"
        description="Liste des professeurs, matières enseignées et volumes horaires hebdomadaires."
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Users className="size-6 text-emerald-400" />
          <div>
            <h3 className="text-white font-bold">Total Enseignants : {teachers.length}</h3>
            <p className="text-xs text-slate-400">Gérez vos enseignants ou importez une liste Excel (avec colonne VolumeHoraire)</p>
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
                <td className="p-4 text-right">
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
    </div>
  );
}