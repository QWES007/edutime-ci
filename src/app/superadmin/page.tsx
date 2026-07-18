"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users2, ShieldCheck, DollarSign, Calendar } from "lucide-react";

interface School {
  id: string;
  name: string;
  city?: string;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalSchools: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
  });
  const [schoolsList, setSchoolsList] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadGlobalData() {
      if (!supabase) return;
      try {
        // 1. Récupérer les comptages globaux dans Supabase
        const [schoolsCount, profilesCount] = await Promise.all([
          supabase.from("schools").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
        ]);

        // 2. Récupérer la vraie liste des écoles pour le tableau
        const { data: schoolsData } = await supabase
          .from("schools")
          .select("id, name, city, created_at")
          .order("created_at", { ascending: false });

        setMetrics({
          totalSchools: schoolsCount.count || 0,
          totalUsers: profilesCount.count || 0,
          activeSubscriptions: 0,
        });

        if (schoolsData) {
          setSchoolsList(schoolsData);
        }
      } catch (error) {
        console.error("Erreur superadmin:", error);
      } finally {
        setLoading(false);
      }
    }
    loadGlobalData();
  }, [supabase]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Console Superadmin</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble globale de la plateforme Edutime CI</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Accès Fondateur
        </div>
      </div>

      {/* Cartes de KPIs Globaux */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Établissements Inscrits</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.totalSchools}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau dynamique des Écoles */}
      <Card>
        <CardHeader>
          <CardTitle>Écoles partenaires</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement des établissements...</p>
          ) : schoolsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun établissement inscrit pour le moment.</p>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nom de l&apos;école</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Ville / Localité</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date d&apos;inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolsList.map((school) => (
                    <tr key={school.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-semibold text-primary">{school.name}</td>
                      <td className="p-4 align-middle text-muted-foreground">{school.city || "Non spécifiée"}</td>
                      <td className="p-4 align-middle text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-muted-foreground/70" />
                        {new Date(school.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}