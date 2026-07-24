"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, GraduationCap, Building2, Calendar, Sparkles, Sliders, CheckCircle2 } from "lucide-react";

export default function DashboardContent() {
  const [supabase] = useState(() => createClient());
  const [counts, setCounts] = useState({ teachers: 0, classes: 0, rooms: 0, entries: 0 });

  useEffect(() => {
    const loadStats = async () => {
      let tCount = 0, cCount = 0, rCount = 0, eCount = 0;

      if (supabase) {
        try {
          const [tRes, cRes, rRes, eRes] = await Promise.all([
            supabase.from("teachers").select("id", { count: "exact" }),
            supabase.from("classgroups").select("id", { count: "exact" }),
            supabase.from("rooms").select("id", { count: "exact" }),
            supabase.from("timetable_entries").select("id", { count: "exact" }),
          ]);

          tCount = tRes.count || 0;
          cCount = cRes.count || 0;
          rCount = rRes.count || 0;
          eCount = eRes.count || 0;
        } catch (e) {
          console.error("Erreur stats Supabase :", e);
        }
      }

      // Fallback localStorage si zéro
      if (typeof window !== "undefined") {
        if (!tCount) {
          const savedT = localStorage.getItem("edutime_teachers_saas_v1");
          if (savedT) try { tCount = JSON.parse(savedT).length; } catch (e) {}
        }
        if (!cCount) {
          const savedC = localStorage.getItem("edutime_classes_saas_v1");
          if (savedC) try { cCount = JSON.parse(savedC).length; } catch (e) {}
        }
        if (!rCount) {
          const savedR = localStorage.getItem("edutime_rooms_saas_v1");
          if (savedR) try { rCount = JSON.parse(savedR).length; } catch (e) {}
        }
      }

      setCounts({ teachers: tCount, classes: cCount, rooms: rCount, entries: eCount });
    };

    loadStats();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Tableau de Bord Établissement
          </h1>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Normes MENA v2026
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl">
          Aperçu de la structure pédagogique et de la génération des emplois du temps.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase">Enseignants</h3>
            <Users className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{counts.teachers}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase">Classes / Divisions</h3>
            <GraduationCap className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{counts.classes}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase">Salles Disponibles</h3>
            <Building2 className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{counts.rooms}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase">Créneaux Planifiés</h3>
            <Calendar className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-400">{counts.entries} h</div>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Moteur d&apos;Emploi du Temps Actif</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Prêt pour générer les cours avec lissage Vague A/B et contraintes dynamiques.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}