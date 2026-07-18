"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ShieldCheck, DollarSign, Calendar } from "lucide-react";

interface SuperAdminProfile {
  id: string;
  school_name: string;
  city?: string;
  created_at: string;
  subscription_plan?: string;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalSchools: 0,
    activeSubscriptions: 0,
  });
  const [schoolsList, setSchoolsList] = useState<SuperAdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadGlobalData() {
      if (!supabase) return;
      try {
        // On récupère les profils (qui contiennent les écoles enregistrées)
        const { data: profilesData, error } = await supabase
          .from("profiles")
          .select("id, school_name, city, created_at, subscription_plan")
          .order("created_at", { ascending: false }) as any;

        if (profilesData) {
          setSchoolsList(profilesData);
          setMetrics({
            totalSchools: profilesData.length,
            activeSubscriptions: profilesData.filter((p: any) => p.subscription_plan && p.subscription_plan !== "free").length,
          });
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
        <div className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Accès Fondateur
        </div>
      </div>

      {/* Cartes de KPIs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Établissements / Comptes créés</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.totalSchools}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Premium Actifs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.activeSubscriptions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau dynamique */}
      <Card>
        <CardHeader>
          <CardTitle>Écoles partenaires & Comptes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement des données...</p>
          ) : schoolsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun compte inscrit pour le moment dans la table profiles.</p>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nom de l&apos;école</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Ville / Localité</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Formule</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date d&apos;inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolsList.map((school) => (
                    <tr key={school.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-semibold text-primary">{school.school_name || "Sans nom"}</td>
                      <td className="p-4 align-middle text-muted-foreground">{school.city || "Non spécifiée"}</td>
                      <td className="p-4 align-middle">
                        <span className="px-2 py-1 text-xs rounded-md bg-secondary font-medium">
                          {school.subscription_plan || "free"}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-muted-foreground/70" />
                        {school.created_at ? new Date(school.created_at).toLocaleDateString("fr-FR") : "—"}
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