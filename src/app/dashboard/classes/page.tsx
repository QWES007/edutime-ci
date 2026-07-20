"use client";

import React, { useState, useEffect } from "react";
import { Layers, Plus, FileSpreadsheet, Upload, Trash2, Save, Clock, BookOpen, ChevronRight, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import * as XLSX from "xlsx";

interface ClassGroup {
  id: string;
  name: string;
  level: string;
  studentCount: number;
  subjectHours: Record<string, number>;
}

const NIVEAUX_MENA = [
  "6ème", "5ème", "4ème", "3ème", 
  "2nde A", "2nde C", 
  "1ère A1", "1ère A2", "1ère C", "1ère D", 
  "Tle A1", "Tle A2", "Tle C", "Tle D"
];

// Matrice officielle exacte (Circulaire N° 272/MENA/DPFC)
const DEFAULT_MENA_HOURS: Record<string, Record<string, number>> = {
  "6ème": { "FR": 5, "MATHS": 4, "ANG": 3, "HG": 2, "SVT": 1.5, "PC": 1.5, "EPS": 2, "EDHC": 1, "ARTS": 1 },
  "5ème": { "FR": 5, "MATHS": 4, "ANG": 3, "HG": 2, "SVT": 1.5, "PC": 1.5, "EPS": 2, "EDHC": 1, "ARTS": 1 },
  "4ème": { "FR": 6, "MATHS": 4, "ANG": 3, "LV2": 3, "HG": 3, "SVT": 1.5, "PC": 1.5, "EPS": 2, "EDHC": 1, "ARTS": 1 },
  "3ème": { "FR": 6, "MATHS": 4, "ANG": 3, "LV2": 3, "HG": 4, "SVT": 2, "PC": 2, "EPS": 2, "EDHC": 1, "ARTS": 1 },
  "2nde A": { "FR": 4, "ANG": 3, "LV2": 3, "HG": 4, "MATHS": 3, "PC": 3.5, "SVT": 1.5, "EPS": 2, "ARTS": 1 },
  "2nde C": { "FR": 4, "MATHS": 5, "PC": 5, "SVT": 2, "ANG": 3, "LV2": 3, "HG": 4, "EPS": 2, "ARTS": 1 },
  "1ère A1": { "FR": 4, "ANG": 3, "LV2": 3, "PHILO": 3, "HG": 4, "MATHS": 4, "SVT": 2.5, "PC": 2.5, "EPS": 2, "ARTS": 1 },
  "1ère A2": { "FR": 4, "ANG": 3, "LV2": 3, "PHILO": 3, "HG": 4, "MATHS": 3, "SVT": 2.5, "PC": 2.5, "EPS": 2, "ARTS": 1 },
  "1ère C": { "MATHS": 6, "PC": 4.5, "SVT": 2, "FR": 3, "ANG": 3, "HG": 4, "PHILO": 2, "EPS": 2, "ARTS": 1 },
  "1ère D": { "SVT": 4.5, "MATHS": 5, "PC": 3, "FR": 3, "ANG": 3, "HG": 4, "PHILO": 2, "EPS": 2, "ARTS": 1 },
  "Tle A1": { "PHILO": 8, "FR": 4, "ANG": 3, "LV2": 3, "HG": 4, "MATHS": 5, "SVT": 2, "EPS": 2, "ARTS": 1 },
  "Tle A2": { "PHILO": 8, "FR": 4, "ANG": 3, "LV2": 3, "HG": 4, "MATHS": 4, "SVT": 2, "EPS": 2, "ARTS": 1 },
  "Tle C": { "MATHS": 8, "PC": 4, "SVT": 2, "FR": 3, "ANG": 2, "HG": 4, "PHILO": 3, "EPS": 2, "ARTS": 1 },
  "Tle D": { "SVT": 5, "PC": 5, "MATHS": 6, "FR": 3, "ANG": 2, "HG": 4, "PHILO": 3, "EPS": 2, "ARTS": 1 },
};

const ALL_SUBJECTS = ["FR", "MATHS", "ANG", "LV2", "HG", "SVT", "PC", "PHILO", "EPS", "EDHC", "ARTS"];
const LOCAL_STORAGE_KEY = "edutime_classes_list";

export default function ClassesPage() {
  const [entryMode, setEntryMode] = useState<"manual" | "excel">("manual");
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [level, setLevel] = useState("6ème");
  const [name, setName] = useState("6ème 1");
  const [studentCount, setStudentCount] = useState(45);
  const [customHours, setCustomHours] = useState<Record<string, number>>(DEFAULT_MENA_HOURS["6ème"]);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClasses(parsed);
          setSelectedClassId(parsed[0].id);
        } else {
          loadDefaultClasses();
        }
      } catch (e) {
        loadDefaultClasses();
      }
    } else {
      loadDefaultClasses();
    }
    setIsLoaded(true);
  }, []);

  const loadDefaultClasses = () => {
    const initial: ClassGroup[] = [
      { id: "c1", level: "6ème", name: "6ème 1", studentCount: 45, subjectHours: DEFAULT_MENA_HOURS["6ème"] },
      { id: "c2", level: "3ème", name: "3ème 2", studentCount: 42, subjectHours: DEFAULT_MENA_HOURS["3ème"] },
      { id: "c3", level: "Tle D", name: "Tle D1", studentCount: 38, subjectHours: DEFAULT_MENA_HOURS["Tle D"] },
    ];
    setClasses(initial);
    setSelectedClassId("c1");
  };

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(classes));
    }
  }, [classes, isLoaded]);

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    setName(`${newLevel} 1`);
    setCustomHours(DEFAULT_MENA_HOURS[newLevel] || {});
  };

  const handleHourChange = (sub: string, value: number) => {
    setCustomHours((prev) => ({
      ...prev,
      [sub]: Math.max(0, value),
    }));
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const activeSubjectHours: Record<string, number> = {};
    Object.entries(customHours).forEach(([sub, hrs]) => {
      if (hrs > 0) activeSubjectHours[sub] = hrs;
    });

    const newClass: ClassGroup = {
      id: Date.now().toString(),
      level,
      name,
      studentCount: Number(studentCount),
      subjectHours: activeSubjectHours,
    };

    setClasses((prev) => [newClass, ...prev]);
    setSelectedClassId(newClass.id);
  };

  const handleUpdateSelectedClassHour = (sub: string, delta: number) => {
    if (!selectedClassId) return;

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== selectedClassId) return c;
        const updatedHours = { ...c.subjectHours };
        const newHrs = Math.max(0, (updatedHours[sub] || 0) + delta);
        if (newHrs <= 0) delete updatedHours[sub];
        else updatedHours[sub] = newHrs;
        return { ...c, subjectHours: updatedHours };
      })
    );
  };

  // Traitement Excel / CSV universel avec la bibliothèque XLSX
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir la feuille en tableau JSON
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        const newClasses: ClassGroup[] = [];

        jsonData.forEach((row: any, index: number) => {
          if (index === 0) return; // Ignorer l'en-tête
          if (!row || row.length === 0) return;

          const className = row[0]?.toString().trim();
          let classLevel = row[1]?.toString().trim();
          const count = parseInt(row[2]?.toString().trim() || "40", 10);

          if (className) {
            // Détection automatique ou fallback du niveau MENA
            if (!classLevel || !DEFAULT_MENA_HOURS[classLevel]) {
              const matchedLevel = NIVEAUX_MENA.find((n) => className.toLowerCase().includes(n.toLowerCase()));
              classLevel = matchedLevel || "6ème";
            }

            newClasses.push({
              id: Date.now().toString() + Math.random().toString().slice(2, 6),
              name: className,
              level: classLevel,
              studentCount: isNaN(count) ? 40 : count,
              subjectHours: DEFAULT_MENA_HOURS[classLevel] || DEFAULT_MENA_HOURS["6ème"],
            });
          }
        });

        if (newClasses.length > 0) {
          setClasses((prev) => [...newClasses, ...prev]);
          setSelectedClassId(newClasses[0].id);
          setEntryMode("manual");
          alert(`${newClasses.length} classe(s) importée(s) avec succès !`);
        } else {
          alert("Aucune classe valide trouvée. Vérifiez la structure de votre fichier (Colonne A: Nom, Colonne B: Niveau, Colonne C: Effectif).");
        }
      } catch (err) {
        console.error("Erreur de lecture du fichier Excel", err);
        alert("Erreur lors de la lecture du fichier Excel. Assurez-vous d'utiliser un fichier .xlsx, .xls ou .csv valide.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Réinitialiser / Tout vider
  const handleResetAllClasses = () => {
    if (confirm("Êtes-vous sûr de vouloir tout effacer ? Toutes les classes de la liste seront supprimées.")) {
      setClasses([]);
      setSelectedClassId(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const totalWeeklyHoursSelected = selectedClass
    ? Object.values(selectedClass.subjectHours).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Layers className="size-5 text-emerald-400" />
          Divisions & Classes
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Horaires officiels MENA (Circulaire N° 272/MENA/DPFC)[cite: 1]
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-white p-5 rounded-2xl shadow-xl text-slate-800 border-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="font-extrabold text-sm text-slate-900">Nouvelle Classe</h2>

              <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEntryMode("excel")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    entryMode === "excel" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileSpreadsheet className="size-3.5" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryMode("manual")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    entryMode === "manual" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
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
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="size-8 text-emerald-600" />
                  <p className="text-xs font-bold text-slate-800">
                    Déposez votre fichier Excel / CSV ici
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Formats acceptés : .xlsx, .xls, .csv (Nom, Niveau, Effectif)
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Niveau MENA
                    </label>
                    <select
                      value={level}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      {NIVEAUX_MENA.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nom de la classe
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 6ème 1, Tle D2"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Effectif de la classe (Élèves)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={studentCount}
                    onChange={(e) => setStudentCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="size-3 text-emerald-600" />
                      Volume Officiel ({level})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      {Object.values(customHours).reduce((a, b) => a + b, 0)} h / sem.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {ALL_SUBJECTS.map((sub) => {
                      const hrs = customHours[sub] || 0;
                      return (
                        <div key={sub} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                          <span className="font-bold text-slate-700">{sub}</span>
                          <input
                            type="number"
                            step={0.5}
                            min={0}
                            max={15}
                            value={hrs}
                            onChange={(e) => handleHourChange(sub, Number(e.target.value))}
                            className="w-12 bg-slate-100 text-center font-bold text-slate-900 rounded p-0.5 text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs py-2.5 rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  Enregistrer la classe
                </button>
              </form>
            )}
          </Card>

          {/* Liste des classes avec BOUTON RÉINITIALISER */}
          <Card className="bg-slate-900 border-slate-800 p-4 text-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Classes configurées ({classes.length})
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAllClasses}
                  className="text-[10px] text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Tout effacer pour réimporter propre"
                >
                  <RotateCcw className="size-3" />
                  Réinitialiser
                </button>

                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <Save className="size-3" /> Auto
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {classes.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    selectedClassId === c.id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-white font-bold"
                      : "bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`size-3.5 ${selectedClassId === c.id ? "text-emerald-400" : "text-slate-600"}`} />
                    <div>
                      <p className="font-bold">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {c.studentCount} élèves &bull; {Object.values(c.subjectHours).reduce((a, b) => a + b, 0)}h / sem.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setClasses((prev) => prev.filter((item) => item.id !== c.id));
                      if (selectedClassId === c.id) setSelectedClassId(null);
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

        <div className="lg:col-span-7">
          <Card className="bg-white p-5 rounded-2xl shadow-xl text-slate-800 border-0 h-full">
            {selectedClass ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <BookOpen className="size-5 text-emerald-600" />
                      Détails de : <span className="text-emerald-600">{selectedClass.name}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Niveau MENA : <strong>{selectedClass.level}</strong> &bull; Effectif : <strong>{selectedClass.studentCount} élèves</strong>
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800 shrink-0 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider block">Total Hebdomadaire</span>
                    <span className="text-lg font-black">{totalWeeklyHoursSelected} h</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_SUBJECTS.map((sub) => {
                    const hrs = selectedClass.subjectHours[sub] || 0;
                    return (
                      <div
                        key={sub}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          hrs > 0
                            ? "bg-slate-50 border-slate-200 text-slate-800"
                            : "bg-slate-50/40 border-slate-100 text-slate-400 opacity-60"
                        }`}
                      >
                        <div>
                          <p className="font-extrabold text-xs text-slate-800">{sub}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {hrs > 0 ? `${hrs}h réservées` : "Non enseigné"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateSelectedClassHour(sub, -0.5)}
                            className="size-7 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 flex items-center justify-center text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-black text-xs">{hrs}h</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateSelectedClassHour(sub, 0.5)}
                            className="size-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white flex items-center justify-center text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-slate-400 text-xs">
                Sélectionnez une classe dans la liste à gauche pour voir et ajuster ses heures par matière.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}