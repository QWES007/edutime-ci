"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Plus, Upload, CheckCircle2, User, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  maxHours: number;
  unavailabilities: Record<string, "dispo" | "indispo" | "ce_up">;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const SLOTS = [
  { id: "M1", label: "07h30 - 08h25" },
  { id: "M2", label: "08h25 - 09h20" },
  { id: "M3", label: "09h35 - 10h30" },
  { id: "M4", label: "10h30 - 11h25" },
  { id: "A1", label: "13h00 - 13h55" },
  { id: "A2", label: "13h55 - 14h50" },
  { id: "A3", label: "15h05 - 16h00" },
  { id: "A4", label: "16h00 - 16h55" },
];

export default function TeachersPage() {
  const [entryMode, setEntryMode] = useState<"manual" | "excel">("manual");
  const [teachers, setTeachers] = useState<Teacher[]>([
    { id: "1", name: "M. Gomez Paul", subject: "MATHS", maxHours: 18, unavailabilities: {} },
  ]);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [maxHours, setMaxHours] = useState(18);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>("1");

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject) return;

    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name,
      subject: subject.toUpperCase(),
      maxHours: Number(maxHours),
      unavailabilities: {},
    };

    setTeachers((prev) => [newTeacher, ...prev]);
    setSelectedTeacherId(newTeacher.id);
    setName("");
    setSubject("");
    setMaxHours(18);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      const newTeachers: Teacher[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes("nom") || line.toLowerCase().includes("name"))) return;
        if (!line.trim()) return;

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
              unavailabilities: {},
            });
          }
        }
      });

      if (newTeachers.length > 0) {
        setTeachers((prev) => [...newTeachers, ...prev]);
        setSelectedTeacherId(newTeachers[0].id);
        setEntryMode("manual");
      }
    };

    reader.readAsText(file);
  };

  // Basculer l'état d'un créneau (Dispo -> Indispo -> CE/UP -> Dispo)
  const toggleSlotState = (day: string, slotId: string) => {
    if (!selectedTeacherId) return;

    const key = `${day}-${slotId}`;
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== selectedTeacherId) return t;

        const currentStatus = t.unavailabilities[key] || "dispo";
        let nextStatus: "dispo" | "indispo" | "ce_up" = "indispo";

        if (currentStatus === "indispo") nextStatus = "ce_up";
        else if (currentStatus === "ce_up") nextStatus = "dispo";

        const updatedUnavailabilities = { ...t.unavailabilities };
        if (nextStatus === "dispo") {
          delete updatedUnavailabilities[key];
        } else {
          updatedUnavailabilities[key] = nextStatus;
        }

        return { ...t, unavailabilities: updatedUnavailabilities };
      })
    );
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
        {/* Formulaire & Liste Enseignants */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-white p-5 rounded-2xl shadow-xl text-slate-800 border-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="font-extrabold text-sm text-slate-900">Enseignants</h2>

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
                    Colonnes : Nom, Discipline, Volume Horaire
                  </p>
                </div>
              </div>
            ) : (
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
                      placeholder="Ex: MATHS"
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

          <Card className="bg-slate-900 border-slate-800 p-4 text-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Liste des Enseignants ({teachers.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                      if (selectedTeacherId === t.id) setSelectedTeacherId(null);
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

        {/* Grille Interactive des Disponibilités */}
        <div className="lg:col-span-8">
          <Card className="bg-white p-5 rounded-2xl shadow-xl text-slate-800 border-0 h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Grille des Disponibilités Hebdomadaires
                </h2>
                {selectedTeacher && (
                  <p className="text-xs text-emerald-700 font-bold mt-0.5">
                    Enseignant sélectionné : {selectedTeacher.name} ({selectedTeacher.subject})
                  </p>
                )}
              </div>

              {/* Légende */}
              <div className="flex items-center gap-3 text-[10px] font-bold shrink-0">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="size-2.5 rounded bg-slate-100 border border-slate-300"></span> Dispo
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="size-2.5 rounded bg-rose-500"></span> Indispo
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="size-2.5 rounded bg-amber-500"></span> CE / UP
                </span>
              </div>
            </div>

            {selectedTeacher ? (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-2 text-[10px] text-slate-500 font-bold uppercase w-24">Créneau</th>
                      {DAYS.map((day) => (
                        <th key={day} className="p-2 text-slate-800 font-extrabold text-center">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SLOTS.map((slot) => (
                      <tr key={slot.id} className="hover:bg-slate-50/50">
                        <td className="p-2 text-[10px] text-slate-500 font-mono font-bold bg-slate-50/50">
                          <div>{slot.id}</div>
                          <div className="text-[9px] text-slate-400 font-normal">{slot.label}</div>
                        </td>

                        {DAYS.map((day) => {
                          const key = `${day}-${slot.id}`;
                          const status = selectedTeacher.unavailabilities[key] || "dispo";

                          let bgClass = "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200";
                          let labelText = "Dispo";

                          if (status === "indispo") {
                            bgClass = "bg-rose-500 text-white font-bold border-rose-600 shadow-xs";
                            labelText = "INDISPO";
                          } else if (status === "ce_up") {
                            bgClass = "bg-amber-500 text-white font-bold border-amber-600 shadow-xs";
                            labelText = "CE / UP";
                          }

                          return (
                            <td key={day} className="p-1">
                              <button
                                type="button"
                                onClick={() => toggleSlotState(day, slot.id)}
                                className={`w-full py-2 px-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${bgClass}`}
                              >
                                {labelText}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-24 text-slate-400 text-xs">
                Sélectionnez un enseignant dans la liste à gauche pour afficher et éditer sa grille de disponibilités.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}