"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Plus, Upload, CheckCircle2, User, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TeachersPage() {
  const [entryMode, setEntryMode] = useState<"manual" | "excel">("manual");
  const [teachers, setTeachers] = useState([
    { id: "1", name: "M. Gomez Paul", subject: "MATHS", maxHours: 18 },
  ]);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [maxHours, setMaxHours] = useState(18);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>("1");

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject) return;

    const newTeacher = {
      id: Date.now().toString(),
      name,
      subject: subject.toUpperCase(),
      maxHours: Number(maxHours),
    };

    setTeachers((prev) => [newTeacher, ...prev]);
    setName("");
    setSubject("");
    setMaxHours(18);
  };

  // Lecture du vrai fichier CSV / Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      const newTeachers: { id: string; name: string; subject: string; maxHours: number }[] = [];

      lines.forEach((line, index) => {
        // Ignorer la ligne d'en-tête ou les lignes vides
        if (index === 0 && (line.toLowerCase().includes("nom") || line.toLowerCase().includes("name"))) return;
        if (!line.trim()) return;

        // Découpage par virgule ou point-virgule
        const columns = line.split(/[,;]/);
        if (columns.length >= 2) {
          const teacherName = columns[0].trim().replace(/^["']|["']$/g, "");
          const teacherSubject = columns[1].trim().replace(/^["']|["']$/g, "").toUpperCase();
          const teacherHours = columns[2] ? parseInt(columns[2].trim(), 10) : 18;

          if (teacherName && teacherSubject) {
            newTeachers.push({
              id: Date.now().toString() + Math.random().toString().slice(2, 6),
              name: teacherName,
              subject: teacherSubject,
              maxHours: isNaN(teacherHours) ? 18 : teacherHours,
            });
          }
        }
      });

      if (newTeachers.length > 0) {
        setTeachers((prev) => [...newTeachers, ...prev]);
        setEntryMode("manual");
      } else {
        alert("Impossible de lire les enseignants du fichier. Assurez-vous que le fichier est structuré : Nom, Matière, Volume Horaire.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="size-5 text-emerald-400" />
          Enseignants & Dispos
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configurez votre corps professoral, leurs matières et leurs contraintes d&apos;emploi du temps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulaire Enseignants */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-white p-5 rounded-2xl shadow-xl text-slate-800 border-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="font-extrabold text-sm text-slate-900">Enseignants</h2>
              
              {/* Boutons Bascule Excel / Manuel */}
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEntryMode("excel")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    entryMode === "excel"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileSpreadsheet className="size-3.5" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryMode("manual")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    entryMode === "manual"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Plus className="size-3.5" />
                  <span>Manuel</span>
                </button>
              </div>
            </div>

            {/* Mode d'importation EXCEL */}
            {entryMode === "excel" ? (
              <div className="space-y-4 py-2">
                <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 transition-all hover:bg-emerald-50 cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv, .txt, .xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="size-8 text-emerald-600" />
                  <p className="text-xs font-bold text-slate-800">
                    Déposez votre fichier Excel / CSV ici
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Colonnes attendues : Nom, Discipline, Volume Horaire
                  </p>
                </div>
              </div>
            ) : (
              /* Mode Saisie MANUELLE */
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: M. Gomez Paul"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Discipline
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: MATHS, FR, PHILO"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Volume Horaire
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={maxHours}
                      onChange={(e) => setMaxHours(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs py-2.5 rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  Enregistrer l&apos;enseignant
                </button>
              </form>
            )}
          </Card>

          {/* Liste des enseignants */}
          <Card className="bg-slate-900 border-slate-800 p-4 text-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Liste des Enseignants ({teachers.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {teachers.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    selectedTeacherId === t.id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-white font-bold"
                      : "bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {t.subject} &bull; {t.maxHours}h / semaine
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTeachers((prev) => prev.filter((item) => item.id !== t.id));
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Grille des Disponibilités */}
        <div className="lg:col-span-7">
          <Card className="bg-white p-5 rounded-2xl shadow-xl text-slate-800 border-0 h-full min-h-[400px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Grille des Disponibilités Hebdomadaires
                </h2>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="size-2 rounded-full bg-slate-200"></span> Dispo
                  </span>
                  <span className="flex items-center gap-1 text-rose-500">
                    <span className="size-2 rounded-full bg-rose-500"></span> Indispo
                  </span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <span className="size-2 rounded-full bg-amber-500"></span> CE/UP
                  </span>
                </div>
              </div>

              {selectedTeacherId ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p className="font-bold text-slate-700 mb-1">
                    Grille de : {teachers.find((t) => t.id === selectedTeacherId)?.name}
                  </p>
                  <p className="text-[11px]">Cliquez sur les créneaux pour modifier les indisponibilités.</p>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 text-xs">
                  Sélectionnez un enseignant dans la liste pour modifier sa grille.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}