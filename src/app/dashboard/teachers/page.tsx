"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, RotateCcw, FileSpreadsheet } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  weeklyHours: number;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(18);

  useEffect(() => {
    const saved = localStorage.getItem("edutime_teachers");
    if (saved) {
      try {
        setTeachers(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveTeachers = (data: Teacher[]) => {
    setTeachers(data);
    localStorage.setItem("edutime_teachers", JSON.stringify(data));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject) return;
    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name,
      subject,
      weeklyHours,
    };
    saveTeachers([...teachers, newTeacher]);
    setName("");
    setSubject("");
  };

  const handleDelete = (id: string) => {
    saveTeachers(teachers.filter((t) => t.id !== id));
  };

  const handleReset = () => {
    if (
      confirm(
        "Attention : Voulez-vous vraiment réinitialiser toute la liste des enseignants ?"
      )
    ) {
      localStorage.removeItem("edutime_teachers");
      localStorage.removeItem("teachers");
      setTeachers([]);
      window.location.reload();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            👨‍🏫 Enseignants & Dispos
          </h1>
          <p className="text-sm text-slate-400">
            Configurez votre corps professoral et leurs matières.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Enseignants</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nom complet
              </label>
              <input
                type="text"
                placeholder="Ex: M. Gomez Paul"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Discipline
                </label>
                <input
                  type="text"
                  placeholder="Ex: MATHS"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Volume Horaire
                </label>
                <input
                  type="number"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Enregistrer l'enseignant
            </button>
          </form>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Liste des enseignants ({teachers.length})
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 rounded-lg bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teachers.map((t) => (
              <div
                key={t.id}
                className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">
                    {t.subject} • {t.weeklyHours}h / semaine
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {teachers.length === 0 && (
              <p className="text-xs text-slate-500 col-span-2 text-center py-6">
                Aucun enseignant enregistré.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}