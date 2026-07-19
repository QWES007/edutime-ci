"use client";

import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2 } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  maxHoursPerWeek: number;
  unavailabilities: string[];
  color: string;
}

const SEED_TEACHERS: Teacher[] = [
  { id: "t1", name: "M. Kouamé", subjects: ["Mathématiques"], maxHoursPerWeek: 18, unavailabilities: [], color: "#3b82f6" },
  { id: "t2", name: "Mme Tanoh", subjects: ["Français"], maxHoursPerWeek: 18, unavailabilities: [], color: "#ef4444" },
];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newName, setNewName] = useState("");
  const [subject, setSubject] = useState("");

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
      subjects: [subject],
      maxHoursPerWeek: 18,
      unavailabilities: [],
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    };

    const updated = [newTeacher, ...teachers];
    saveTeachers(updated);
    setNewName("");
    setSubject("");
  };

  const handleDeleteTeacher = (id: string) => {
    if (window.confirm("Supprimer cet enseignant ?")) {
      const updated = teachers.filter((t) => t.id !== id);
      saveTeachers(updated);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader
        title="Gestion des Enseignants"
        description="Configurez votre corps professoral et leurs volumes horaires."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Ajouter un enseignant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newName">Nom complet</Label>
                <Input
                  id="newName"
                  placeholder="Ex: M. Konan Jean"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Discipline principale</Label>
                <Input
                  id="subject"
                  placeholder="Ex: Mathématiques, Histoire-Géo"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2">
                <Plus className="size-4" /> Enregistrer l&apos;enseignant
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {teachers.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center bg-card">
              <p className="text-muted-foreground">Aucun enseignant enregistré.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {teachers.map((t) => (
                <Card key={t.id} className="shadow-xs">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg text-white" style={{ backgroundColor: t.color || "#3b82f6" }}>
                        <Users className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-card-foreground">{t.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          Matière : {t.subjects.join(", ")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/15"
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