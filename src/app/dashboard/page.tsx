"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DoorOpen, Calendar } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    teachers: 0,
    classes: 0,
    rooms: 0,
    slots: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      if (!supabase) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // On type explicitement le "as any" ici pour contourner le blocage strict de TypeScript
          const { data: profile } = await supabase
            .from("profiles")
            .select("school_id")
            .eq("id", user.id)
            .single() as any;

          if (profile?.school_id) {
            const [teachersCount, classesCount, roomsCount] = await Promise.all([
              supabase.from("teachers").select("*", { count: "exact", head: true }).eq("school_id", profile.school_id),
              supabase.from("classes").select("*", { count: "exact", head: true }).eq("school_id", profile.school_id),
              supabase.from("rooms").select("*", { count: "exact", head: true }).eq("school_id", profile.school_id),
            ]);

            setStats({
              teachers: teachersCount.count || 0,
              classes: classesCount.count || 0,
              rooms: roomsCount.count || 0,
              slots: 0,
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques :", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [supabase]);

  return (
    <DashboardShell
      title="Tableau de bord"
      description="Vue d&apos;ensemble de votre établissement — Année scolaire 2025-2026"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enseignants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.teachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.classes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salles</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.rooms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créneaux planifiés</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.slots}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Génération d&apos;emploi du temps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Prêt à lancer l&apos;algorithme ? Assurez-vous d&apos;avoir configuré vos enseignants, classes et salles avant de démarrer.
            </p>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Accéder au moteur de génération
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conformité MENA</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p><strong>Réglementation :</strong> Horaires hebdomadaires officiels ivoiriens appliqués.</p>
            <p><strong>Premier cycle :</strong> 6ème, 5ème, 4ème, 3ème</p>
            <p><strong>Second cycle :</strong> 2nde A/C, 1ère A/C/D, Tle A/C/D</p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}