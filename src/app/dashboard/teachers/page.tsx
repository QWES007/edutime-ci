"use client";

import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2, FileSpreadsheet, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  maxHoursPerWeek: number;
  unavailabilities: string[];
  color: string;
}

const SEED_TEACHERS: Teacher[] = [
  { id: "t1", name: "M. Kouassi Koffi", subjects: ["MATHS"], maxHoursPerWeek: 18, unavailabilities: [], color: "#3b82f6" },
  { id: "t2", name: "Mme Koné Aminata", subjects: ["MATHS"], maxHoursPerWeek: 18, unavailabilities: [], color: "#10b981" },
];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newName, setNewName] = useState("");
  const [subject, setSubject] = useState("");
  const [insertMode, setInsertMode] = useState<"manual" | "excel">("manual");

  useEffect(() => {
    const saved = localStorage.getItem("edutime_teachers_live");
    if (saved) {
      setTeachers(JSON.parse(saved));
    } else {
      setTeachers(SEED_TEACHERS);
    }
  }, []);

  const saveTeachers = (updated: Teacher[]) => {
    setTeachers(updated);
    localStorage.setItem("edutime_teachers_live", JSON.stringify(updated));
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !subject.trim()) return;

    const newTeacher: Teacher = {
      id: `t_${Date.now()}`,
      name: newName,
      subjects: [subject.toUpperCase()],
      maxHoursPerWeek: 18,
      unavailabilities: [],
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };

    saveTeachers([newTeacher, ...teachers]);
    setNewName("");
    setSubject("");
  };

  // Traitement du fichier Excel importé
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
          .filter((row) => row.Nom || row.Enseignant)
          .map((row, index) => {
            const rawSubjects = row.Matières || row.Matieres || row.Matière || "GÉNÉRAL";
            const subjectsArray = String(rawSubjects)
              .split(",")
              .map((s) => s.trim().toUpperCase());

            return {
              id: `t_excel_${Date.now()}_${index}`,
              name: row.Nom || row.Enseignant,
              subjects: subjectsArray,
              maxHoursPerWeek: Number(row.Heures || row.VolumeHoraire) || 18,
              unavailabilities: [],
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            };
          });

        if (importedTeachers.length === 0) {
          alert("Aucune donnée valide trouvée. Vérifiez les colonnes 'Nom' et 'Matières'.");
          return;
        }

        saveTeachers([...importedTeachers, ...teachers]);
        alert(`${importedTeachers.length} enseignant(s) importé(s) avec succès !`);
        setInsertMode("manual");
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la lecture du fichier Excel. Assurez-vous qu'il est au bon format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteTeacher = (id: string) => {
    if (window.confirm("Supprimer cet enseignant ?")) {
      saveTeachers(teachers.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader
        title="Enseignants & Dispos"
        description="Configurez votre corps professoral, leurs matières et leurs volumes horaires."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Panneau d'insertion */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold text-slate-700">Enseignants</span>
              <div className="flex gap-1 bg-muted p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setInsertMode("excel")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${insertMode === "excel" ? "bg-white shadow-xs font-bold text-primary" : "text-muted-foreground"}`}
                >
                  <FileSpreadsheet className="inline size-3.5 mr-1" /> Excel
                </button>
                <button
                  onClick={() => setInsertMode("manual")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${insertMode === "manual" ? "bg-white shadow-xs font-bold text-primary" : "text-muted-foreground"}`}
                >
                  <Plus className="inline size-3.5 mr-1" /> Manuel
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {insertMode === "manual" ? (
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newName">Nom complet</Label>
                  <Input
                    id="newName"
                    placeholder="Ex: M. Gomez Paul"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Discipline principale</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: MATHS, FR, PHILO"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2">
                  Enregistrer l&apos;enseignant
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center hover:bg-muted/30 transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelImport}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="size-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                  <p className="text-xs font-bold">Glissez votre fichier Excel ou CSV ici</p>
                  <p className="text-[10px] text-muted-foreground mt-1">ou cliquez pour parcourir (.xlsx, .xls)</p>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[10px] text-slate-500 space-y-1">
                  <span className="font-bold text-slate-700 block">Consignes :</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Colonne <strong>Nom</strong> ou <strong>Enseignant</strong> requise.</li>
                    <li>Colonne <strong>Matières</strong> requise (ex: MATHS, PC, FR).</li>
                    <li>Plusieurs matières séparées par une virgule.</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste à droite */}
        <div className="md:col-span-2 space-y-4">
          {teachers.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center bg-card">
              <p className="text-muted-foreground">Aucun enseignant disponible.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teachers.map((t) => (
                <Card key={t.id} className="shadow-xs hover:border-primary/45 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate">{t.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                          {t.subjects.join(", ")} · {t.maxHoursPerWeek}h
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 size-8 shrink-0"
                      onClick={() => handleDeleteTeacher(t.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}