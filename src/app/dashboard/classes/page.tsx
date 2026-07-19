"use client";

import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Plus, Trash2, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface ClassGroup {
  id: string;
  level: string;
  name: string;
  studentCount: number;
  subjectHours: Record<string, number>;
}

const SEED_CLASSES: ClassGroup[] = [
  { id: "c1", level: "6ème", name: "6ème 1", studentCount: 45, subjectHours: { fr: 6, ang: 4, maths: 4, eps: 2 } },
  { id: "c2", level: "3ème", name: "3ème A", studentCount: 42, subjectHours: { fr: 5, ang: 4, maths: 5, eps: 2 } },
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassLevel, setNewClassLevel] = useState("6ème");
  const [studentCount, setStudentCount] = useState(40);
  const [insertMode, setInsertMode] = useState<"manual" | "excel">("manual");

  useEffect(() => {
    const saved = localStorage.getItem("edutime_classes_live");
    if (saved) {
      setClasses(JSON.parse(saved));
    } else {
      setClasses(SEED_CLASSES);
    }
  }, []);

  const saveClasses = (updatedClasses: ClassGroup[]) => {
    setClasses(updatedClasses);
    localStorage.setItem("edutime_classes_live", JSON.stringify(updatedClasses));
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClass: ClassGroup = {
      id: `c_${Date.now()}`,
      level: newClassLevel,
      name: newClassName,
      studentCount: Number(studentCount),
      subjectHours: { fr: 5, ang: 4, maths: 4, eps: 2 },
    };

    saveClasses([newClass, ...classes]);
    setNewClassName("");
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

        const importedClasses: ClassGroup[] = data
          .filter((row) => row.Classe || row.Nom)
          .map((row, index) => {
            const rawLevel = row.Niveau || row.Level || "6ème";
            return {
              id: `c_excel_${Date.now()}_${index}`,
              level: String(rawLevel).trim(),
              name: String(row.Classe || row.Nom).trim(),
              studentCount: Number(row.Effectif || row.Eleves || row.Count) || 40,
              subjectHours: { fr: 5, ang: 4, maths: 4, eps: 2 },
            };
          });

        if (importedClasses.length === 0) {
          alert("Aucune classe valide trouvée. Vérifiez les colonnes 'Classe' et 'Effectif'.");
          return;
        }

        saveClasses([...importedClasses, ...classes]);
        alert(`${importedClasses.length} classe(s) importée(s) !`);
        setInsertMode("manual");
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'importation du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette division ?")) {
      saveClasses(classes.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader
        title="Divisions & Classes"
        description="Gérez les effectifs et les structures pédagogiques de votre établissement."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold text-slate-700">Divisions</span>
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
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newClassLevel">Niveau pédagogique</Label>
                  <select
                    id="newClassLevel"
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="6ème">6ème</option>
                    <option value="5ème">5ème</option>
                    <option value="4ème">4ème</option>
                    <option value="3ème">3ème</option>
                    <option value="2nde A">2nde A</option>
                    <option value="2nde C">2nde C</option>
                    <option value="1ère A">1ère A</option>
                    <option value="1ère D">1ère D</option>
                    <option value="Tle A">Tle A</option>
                    <option value="Tle D">Tle D</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newClassName">Nom de la classe</Label>
                  <Input
                    id="newClassName"
                    placeholder="Ex: 6ème 2, Tle D1"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentCount">Nombre d&apos;élèves</Label>
                  <Input
                    id="studentCount"
                    type="number"
                    value={studentCount}
                    onChange={(e) => setStudentCount(Number(e.target.value))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Enregistrer la classe</Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center hover:bg-muted/30 transition-colors relative cursor-pointer group">
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload className="size-8 mx-auto text-muted-foreground group-hover:text-primary mb-2" />
                  <p className="text-xs font-bold">Glissez votre fichier Excel ou CSV ici</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[10px] text-slate-500 space-y-1">
                  <span className="font-bold text-slate-700 block">Colonnes acceptées :</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li><strong>Classe</strong> ou <strong>Nom</strong> (ex: 4ème 3).</li>
                    <li><strong>Niveau</strong> (ex: 4ème).</li>
                    <li><strong>Effectif</strong> ou <strong>Eleves</strong>.</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {classes.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center bg-card">
              <p className="text-muted-foreground">Aucune classe enregistrée.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {classes.map((cls) => (
                <Card key={cls.id} className="shadow-xs">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary p-2.5 rounded-lg"><Layers className="size-5" /></div>
                      <div>
                        <h4 className="font-bold text-sm">{cls.name}</h4>
                        <p className="text-[11px] text-muted-foreground font-medium">{cls.studentCount} élèves · {cls.level}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClass(cls.id)}><Trash2 className="size-4" /></Button>
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