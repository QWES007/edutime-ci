"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DoorOpen, Calendar } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    teachers: 0,
    classes: 0,
    rooms: 0,
    schedules: 0,
  });

  useEffect(() => {
    // Chargement optionnel des stats depuis Supabase ou LocalStorage
    const savedTeachers = localStorage.getItem("edutime_teachers");
    if (savedTeachers) {
      const parsed = JSON.parse(savedTeachers);
      setStats((prev) => ({ ...prev, teachers: parsed.length }));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Tableau de bord</h1>
        <p className="text-xs text-slate-400 mt-1">
          Vue d&apos;ensemble de votre établissement &mdash; Année scolaire 2025-2026
        </p>
      </div>

      {/* Cartes d'indicateurs clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400">Enseignants</CardTitle>
            <Users className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.teachers}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400">Classes</CardTitle>
            <GraduationCap className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.classes}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400">Salles</CardTitle>
            <DoorOpen className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.rooms}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-400">Créneaux planifiés</CardTitle>
            <Calendar className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.schedules}</div>
          </CardContent>
        </Card>
      </div>

      {/* Section Moteur de Génération */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="bg-slate-900 border-slate-800 p-5">
          <h3 className="font-bold text-sm text-white mb-2">Génération d&apos;emploi du temps</h3>
          <p className="text-xs text-slate-400 mb-4">
            Prêt à lancer l&apos;algorithme ? Assurez-vous d&apos;avoir configuré vos enseignants, classes et salles avant de démarrer.
          </p>
          <Link 
            href="/dashboard/schedule" 
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all"
          >
            Accéder au moteur de génération
          </Link>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-5">
          <h3 className="font-bold text-sm text-white mb-2">Conformité MENA</h3>
          <p className="text-xs text-slate-400">
            <strong>Réglementation :</strong> Horaires hebdomadaires officiels ivoiriens appliqués.
          </p>
          <ul className="text-xs text-slate-500 mt-2 space-y-1">
            <li>&bull; Premier cycle : 6ème, 5ème, 4ème, 3ème</li>
            <li>&bull; Second cycle : 2nde A/C, 1ère A/C/D, Tle A/C/D</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}