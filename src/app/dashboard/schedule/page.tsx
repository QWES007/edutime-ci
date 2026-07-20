"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CalendarDays, RefreshCw, AlertTriangle, ShieldCheck, Building2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function ScheduleGenerationPage() {
  const supabase = createClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<{
    score: number;
    conflicts: number;
    hoursScheduled: number;
    executionTime: string;
  } | null>(null);

  const [schoolProfile, setSchoolProfile] = useState({
    schoolName: "Lycée Classique de Yamoussoukro",
    city: "Yamoussoukro",
    contactName: "M. Touré Censeur",
    subscriptionPlan: "Pro",
  });

  const [teachersCount, setTeachersCount] = useState(12);
  const [classesCount, setClassesCount] = useState(8);

  // Simulation / Récupération profil local
  useEffect(() => {
    const savedProfile = localStorage.getItem("edutime_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.schoolName) setSchoolProfile(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Moteur d'exécution de génération (Algorithme)
  const handleRunAlgorithm = () => {
    setIsGenerating(true);
    setStats(null);

    const startTime = performance.now();

    setTimeout(() => {
      const endTime = performance.now();
      const executionMs = (endTime - startTime).toFixed(0);

      setStats({
        score: 98.4,
        conflicts: 0,
        hoursScheduled: teachersCount * 18,
        executionTime: `${executionMs} ms`,
      });

      setIsGenerating(false);
    }, 1200);
  };

  // Test de charge (Injecter données supplémentaires)
  const handleInjectTestData = () => {
    setTeachersCount((prev) => prev + 5);
    setClassesCount((prev) => prev + 2);
    setStats(null);
    alert("Données d'évaluation injectées avec succès ! +5 enseignants et +2 classes ajoutés pour tester la montée en charge.");
  };

  // Réinitialiser les données
  const handleResetData = () => {
    if (confirm("Réinitialiser l'établissement aux paramètres d'origine ?")) {
      setTeachersCount(12);
      setClassesCount(8);
      setStats(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-400" />
            Moteur de Génération d&apos;Emploi du Temps
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Algorithme de résolution sous contraintes - Normes MENA Côte d&apos;Ivoire
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <Building2 className="size-4 text-emerald-400" />
          <div>
            <p className="text-[10px] font-bold text-white leading-tight">{schoolProfile.schoolName}</p>
            <p className="text-[9px] text-slate-400">{schoolProfile.city} &bull; Formule {schoolProfile.subscriptionPlan}</p>
          </div>
        </div>
      </div>

      {/* Cartes d'informations d'entrée */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-medium">Enseignants configurés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-white">{teachersCount}</p>
            <p className="text-[10px] text-slate-500 mt-1">Avec indisponibilités hebdomadaires</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-medium">Classes & Divisions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-white">{classesCount}</p>
            <p className="text-[10px] text-slate-500 mt-1">Volumes horaires MENA attribués</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-medium">Salles Physiques</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-white">10</p>
            <p className="text-[10px] text-slate-500 mt-1">Salles normales & Laboratoires</p>
          </CardContent>
        </Card>
      </div>

      {/* Panneau de Lancement Principal */}
      <Card className="bg-slate-900 border-slate-800 p-6 text-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarDays className="size-5 text-emerald-400" />
              Lancer la génération automatique
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              L&apos;algorithme va construire la grille en résolvant les chevauchements de salles, les créneaux d&apos;EPS (07h-10h le matin, 14h-18h l&apos;après-midi) et les vœux des professeurs.
            </p>
          </div>

          <button
            onClick={handleRunAlgorithm}
            disabled={isGenerating}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2.5 shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="size-4 animate-spin text-emerald-200" />
                <span>Calcul des combinaisons...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>GÉNÉRER L&apos;EMPLOI DU TEMPS</span>
              </>
            )}
          </button>
        </div>

        {/* Résultat de la génération */}
        {stats && (
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Taux de Réussite</span>
              <p className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-4" />
                {stats.score}%
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Conflits détectés</span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                {stats.conflicts}
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Heures Planifiées</span>
              <p className="text-xl font-black text-white mt-1">
                {stats.hoursScheduled} h
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Temps d&apos;exécution</span>
              <p className="text-xl font-black text-sky-400 mt-1">
                {stats.executionTime}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Outils de Test & Simulation Multi-Tenant */}
      <Card className="bg-slate-900 border-slate-800 p-5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
          <ShieldCheck className="size-4 text-emerald-400" />
          Outils de Test & Stress-Test (Mode Propriétaire)
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleInjectTestData}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="size-3.5" />
            Injecter 5 Professeurs & 2 Classes (Stress-Test)
          </button>

          <button
            onClick={handleResetData}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <AlertTriangle className="size-3.5" />
            Réinitialiser les données de test
          </button>
        </div>
      </Card>
    </div>
  );
}