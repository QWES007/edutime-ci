"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Building2, CalendarDays, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const supabase = createClient();
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState({
    teachersCount: 0,
    classesCount: 0,
    roomsCount: 0,
    entriesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    const fetchDashboardStats = async () => {
      setLoading(true);

      if (supabase) {
        try {
          const [
            { count: teachersCount },
            { count: classesCount },
            { count: roomsCount },
            { count: entriesCount },
          ] = await Promise.all([
            supabase.from("teachers").select("*", { count: "exact", head: true }),
            supabase.from("classgroups").select("*", { count: "exact", head: true }),
            supabase.from("rooms").select("*", { count: "exact", head: true }),
            supabase.from("timetable_entries").select("*", { count: "exact", head: true }),
          ]);

          setStats({
            teachersCount: teachersCount || 0,
            classesCount: classesCount || 0,
            roomsCount: roomsCount || 0,
            entriesCount: entriesCount || 0,
          });
        } catch (error) {
          console.error("Erreur stats Supabase :", error);
        }
      }

      setLoading(false);
    };

    fetchDashboardStats();
  }, []);

  if (!isMounted) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <DashboardHeader title="Tableau de bord" description="Vue d'ensemble de votre établissement" />
        <div className="p-8 text-xs text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre établissement — Année scolaire 2025-2026"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Enseignants</CardTitle>
            <Users className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">
              {loading ? "..." : stats.teachersCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Corps professoral configuré</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Classes</CardTitle>
            <GraduationCap className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">
              {loading ? "..." : stats.classesCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Divisions & niveaux MENA</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Salles</CardTitle>
            <Building2 className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">
              {loading ? "..." : stats.roomsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Locaux & infrastructures</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Créneaux planifiés</CardTitle>
            <CalendarDays className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">
              {loading ? "..." : stats.entriesCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Heures générées dans la grille</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="size-5 text-emerald-400" /> Généralité & Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Vos données sont bien centralisées. Vous pouvez lancer le moteur de génération pour attribuer automatiquement les cours selon les volumes horaires et les contraintes.
            </p>
            <Link href="/dashboard/generator">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 cursor-pointer">
                Accéder au moteur de génération
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-400" /> Conformité MENA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            <p className="font-semibold text-slate-200">
              Réglementation : Horaires hebdomadaires officiels ivoiriens appliqués.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Premier cycle : 6ème, 5ème, 4ème, 3ème</li>
              <li>Second cycle : 2nde A/C, 1ère A/C/D, Tle A/C/D</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}