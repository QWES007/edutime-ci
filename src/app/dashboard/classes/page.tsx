"use client";

import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Plus, Trash2 } from "lucide-react";

// Définition locale des types pour éviter les conflits d'importation
interface ClassGroup {
  id: string;
  level: string;
  name: string;
  studentCount: number;
  subjectHours: Record<string, number>;
}

const SEED_CLASSES: ClassGroup[] = [
  {
    id: "c_6eme1",
    level: "6ème",
    name: "6ème 1",
    studentCount: 45,
    subjectHours: { fr: 6, ang: 4, maths: 4, svt: 2, hg: 3, edhc: 1, eps: 2 },
  },
  {
    id: "c_3emeA",
    level: "3ème",
    name: "3ème A",
    studentCount: 42,
    subjectHours: { fr: 5, ang: 4, maths: 5, svt: 2, pc: 2, hg: 3, edhc: 1, eps: 2 },
  },
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassLevel, setNewClassLevel] = useState("6ème");
  const [studentCount, setStudentCount] = useState(40);

  // Chargement des données locales spécifiques à l'établissement
  useEffect(() => {
    const saved = localStorage.getItem("edutime_classes_live");
    if (saved) {
      setClasses(JSON.parse(saved));
    } else {
      setClasses(SEED_CLASSES);
    }
  }, []);

  // Sauvegarde automatique à chaque modification
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
      subjectHours: { fr: 5, ang: 4, maths: 4, eps: 2 }, // Horaires de base MENA par défaut
    };

    const updated = [newClass, ...classes];
    saveClasses(updated);
    setNewClassName("");
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette division ?")) {
      const updated = classes.filter((c) => c.id !== id);
      saveClasses(updated);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader
        title="Divisions & Classes"
        description="Gérez les effectifs et les structures pédagogiques de votre établissement."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Formulaire d'ajout */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Ajouter une classe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newClassLevel">Niveau pédagogique</Label>
                <select
                  id="newClassLevel"
                  value={newClassLevel}
                  onChange={(e) => setNewClassLevel(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="6ème">6ème</option>
                  <option value="5ème">5ème</option>
                  <option value="4ème">4ème</option>
                  <option value="3ème">3ème</option>
                  <option value="2nde A">2nde A</option>
                  <option value="2nde C">2nde C</option>
                  <option value="1ère A">1ère A</option>
                  <option value="1ère C">1ère C</option>
                  <option value="1ère D">1ère D</option>
                  <option value="Tle A">Tle A</option>
                  <option value="Tle C">Tle C</option>
                  <option value="Tle D">Tle D</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newClassName">Nom de la classe</Label>
                <Input
                  id="newClassName"
                  placeholder="Ex: 6ème 1, Tle D2..."
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
                  min="1"
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-2">
                <Plus className="size-4" /> Enregistrer la classe
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Liste des classes existantes */}
        <div className="md:col-span-2 space-y-4">
          {classes.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center bg-card">
              <p className="text-muted-foreground">Aucune classe enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {classes.map((cls) => (
                <Card key={cls.id} className="shadow-xs hover:border-primary/40 transition-colors">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                        <Layers className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-card-foreground">{cls.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          {cls.studentCount} élèves · Niveau {cls.level}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/15 hover:text-destructive"
                      onClick={() => handleDeleteClass(cls.id)}
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