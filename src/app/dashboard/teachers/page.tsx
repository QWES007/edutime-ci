"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Upload, Plus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  maxHoursPerHeader: number;
  maxHoursPerWeek: number;
  grade: number;
}

export default function TeachersPage() {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchTeachers = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("teachers").select("*");
    if (data) {
      setTeachers(data.map((item: any) => ({
        id: item.id,
        name: item.name,
        subjects: Array.isArray(item.subjects) ? item.subjects : [item.subject || "MATHS"],
        maxHoursPerWeek: Number(item.max_hours_per_week || 24),
        grade: Number(item.grade || 3),
      })));
    }
  };

  useEffect(() => {
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

        alert("Importation Excel réussie avec les volumes horaires !");
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

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        title="Gestion des Enseignants & Quotas Horaires"
        description="Configurez les volumes horaires hebdomadaires et les grades par enseignant."
      />

      <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Users className="size-6 text-emerald-400" />
          <div>
            <h3 className="text-white font-bold">Liste des Professeurs ({teachers.length})</h3>
            <p className="text-xs text-slate-400">Importez votre fichier Excel contenant les colonnes : Nom, Matiere, VolumeHoraire, Grade</p>
          </div>
        </div>

        <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-xl cursor-pointer flex items-center gap-2">
          <Upload className="size-4" />
          {isUploading ? "Importation..." : "IMPORTER VIA EXCEL"}
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="p-4">Nom de l'Enseignant</th>
              <th className="p-4">Matière(s)</th>
              <th className="p-4">Volume Horaire Max (Hebdo)</th>
              <th className="p-4">Grade (Priorité)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-900/50">
                <td className="p-4 font-bold text-white">{t.name}</td>
                <td className="p-4">{t.subjects.join(", ")}</td>
                <td className="p-4 text-emerald-400 font-extrabold">{t.maxHoursPerWeek} h / semaine</td>
                <td className="p-4">Grade {t.grade}</td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">Aucun enseignant enregistré. Importez un fichier Excel.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}