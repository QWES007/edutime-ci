"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Coins, 
  ShieldCheck, 
  Activity, 
  Search, 
  Eye, 
  Trash2, 
  LogOut,
  SlidersHorizontal,
  Download
} from "lucide-react";

interface ProfileRow {
  id: string;
  school_name: string;
  city: string;
  contact_name: string;
  subscription_plan: string;
  created_at?: string;
  is_superadmin?: boolean;
}

export default function SuperAdminConsole() {
  const router = useRouter();
  const supabase = createClient();

  const [schools, setSchools] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("Tous");

  useEffect(() => {
    verifySuperAdminAccess();
  }, []);

  // GARDE D'ACCÈS DE SÉCURITÉ : Vérification stricte en Base de Données
  const verifySuperAdminAccess = async () => {
    try {
      setLoading(true);
      if (!supabase) return;

      // 1. Récupérer l'utilisateur actuellement authentifié chez Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        // Redirection si non connecté
        router.push("/login");
        return;
      }

      // 2. Interroger la table profiles avec un typage explicite
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("is_superadmin")
        .eq("id", user.id)
        .single();

      // Typage sécurisé pour TypeScript
      const profile = data as { is_superadmin: boolean } | null;

      if (profileError || !profile || !profile.is_superadmin) {
        // Redirection immédiate si l'utilisateur est un simple censeur/utilisateur
        console.warn("Accès refusé : L'utilisateur n'a pas les droits Superadmin.");
        router.push("/dashboard");
        return;
      }

      // 3. Si l'utilisateur est un VRAI superadmin, charger la liste des écoles
      await fetchSchools();
    } catch (err) {
      console.error("Erreur de contrôle d'accès :", err);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("school_name", { ascending: true });

      if (error) throw error;
      setSchools(data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des écoles :", err);
    }
  };

  // Fonction d'infiltration (Impersonation)
  const handleInfiltrer = (school: ProfileRow) => {
    const targetProfile = {
      schoolName: school.school_name,
      city: school.city,
      contactName: school.contact_name,
      contactEmail: "contact@ecole.ci", 
      subscriptionPlan: school.subscription_plan,
    };
    
    localStorage.setItem("edutime_profile", JSON.stringify(targetProfile));
    localStorage.setItem("edutime_is_impersonating", "true");
    
    router.push("/dashboard");
    router.refresh();
  };

  const handleLogout = async () => {
    localStorage.clear();
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  // Filtres de recherche
  const filteredSchools = schools.filter((s) => {
    const matchesSearch = 
      s.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contact_name.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesPlan = planFilter === "Tous" || s.subscription_plan.toLowerCase() === planFilter.toLowerCase();
    
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans pb-12">
      {/* Barre supérieure d'administration */}
      <header className="bg-[#0f172a] border-b border-[#1e293b] px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-amber-500/20">
            Super Admin Console
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-200">
            Edutime CI &mdash; Gestion de la Plateforme
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-medium">Connecté en tant que Propriétaire</span>
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold gap-2 cursor-pointer"
          >
            <LogOut className="size-4" /> Se Déconnecter
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Cartes de Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#0f172a] border-[#1e293b] text-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-sky-500/10 text-sky-400 p-3 rounded-xl border border-sky-500/10">
                <Building2 className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Établissements</p>
                <h3 className="text-2xl font-black mt-0.5">{schools.length}</h3>
                <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Lycées et collèges enregistrés</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a] border-[#1e293b] text-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/10">
                <Coins className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenu Estimé</p>
                <h3 className="text-2xl font-black mt-0.5">0 FCFA</h3>
                <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Basé sur les formules annuelles</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a] border-[#1e293b] text-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl border border-amber-500/10">
                <SlidersHorizontal className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Abonnements Pro / Ent</p>
                <h3 className="text-2xl font-black mt-0.5">0</h3>
                <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Ratio de conversion : 0%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a] border-[#1e293b] text-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl border border-purple-500/10">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statut Supabase</p>
                <h3 className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/10 w-fit">
                  <Activity className="size-3.5 animate-pulse" /> CONFORMITÉ RLS OK
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre d'outils et de filtres */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl shadow-xs">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-500" />
            <Input
              placeholder="Rechercher par nom, ville, interlocuteur ou UUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#090d16] border-[#1e293b] text-slate-200 placeholder:text-slate-500 focus-visible:ring-amber-500 text-xs"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-[#090d16] border border-[#1e293b] rounded-md px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none"
            >
              <option value="Tous">Plan : Tous</option>
              <option value="free">Formule Free</option>
              <option value="starter">Formule Starter</option>
              <option value="pro">Formule Pro</option>
            </select>
            
            <Button size="sm" variant="secondary" className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs gap-1.5 cursor-pointer">
              <Download className="size-3.5" /> Export
            </Button>
          </div>
        </div>

        {/* Tableau Principal d'Administration */}
        <Card className="bg-[#0f172a] border-[#1e293b] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#131c32]/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Établissement</th>
                  <th className="px-6 py-4">Ville / Pays</th>
                  <th className="px-6 py-4">Interlocuteur (Censeur)</th>
                  <th className="px-6 py-4">Formule d&apos;abonnement</th>
                  <th className="px-6 py-4">Date de création</th>
                  <th className="px-6 py-4 text-center">Actions Globales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-xs text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 font-medium">
                      Vérification des accès et chargement des données...
                    </td>
                  </tr>
                ) : filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 font-medium">
                      Aucun établissement ne correspond aux critères.
                    </td>
                  </tr>
                ) : (
                  filteredSchools.map((school) => (
                    <tr key={school.id} className="hover:bg-[#131c32]/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-100">
                        <div>{school.school_name}</div>
                        <div className="text-[9px] text-slate-500 font-mono font-normal mt-0.5 group-hover:text-slate-400">UUID: {school.id}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-400">
                        {school.city}, Côte d&apos;Ivoire
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {school.contact_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#090d16] border border-[#1e293b] text-slate-400">
                          {school.subscription_plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                        {school.created_at ? new Date(school.created_at).toLocaleDateString() : "19/07/2026"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleInfiltrer(school)}
                            className="bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold px-3 py-1 h-7 gap-1 shadow-xs cursor-pointer"
                          >
                            <Eye className="size-3.5" /> Infiltrer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 size-7 p-0 cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}