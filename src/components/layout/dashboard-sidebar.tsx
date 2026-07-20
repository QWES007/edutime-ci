"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Home, 
  Sparkles, 
  CalendarDays, 
  Settings, 
  ShieldCheck, 
  LogOut 
} from "lucide-react";

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [schoolData, setSchoolData] = useState({
    schoolName: "Chargement...",
    city: "...",
    isSuperAdmin: false,
  });

  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    checkUserRoleAndProfile();
  }, [pathname]);

  const checkUserRoleAndProfile = async () => {
    if (!supabase) return;

    // 1. Détection du mode infiltration
    const impersonating = localStorage.getItem("edutime_is_impersonating") === "true";
    setIsImpersonating(impersonating);

    // 2. Si on est en mode infiltration, charger l'établissement simulé
    if (impersonating) {
      const savedProfile = localStorage.getItem("edutime_profile");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setSchoolData({
          schoolName: profile.schoolName || profile.school_name,
          city: profile.city || "Abidjan",
          isSuperAdmin: true,
        });
        return;
      }
    }

    // 3. Sinon, vérifier le VRAI utilisateur connecté depuis Supabase Auth & Profiles
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("school_name, city, is_superadmin")
        .eq("id", user.id)
        .single();

      // Typage explicite pour sécuriser TypeScript lors du build
      const profile = data as { school_name: string; city: string; is_superadmin: boolean } | null;

      if (profile) {
        setSchoolData({
          schoolName: profile.school_name || "Établissement",
          city: profile.city || "Abidjan",
          isSuperAdmin: Boolean(profile.is_superadmin),
        });
      }
    }
  };

  const handleStopImpersonation = () => {
    localStorage.removeItem("edutime_is_impersonating");
    localStorage.removeItem("edutime_profile");
    setIsImpersonating(false);
    router.push("/superadmin");
    router.refresh();
  };

  const handleLogout = async () => {
    localStorage.clear();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 h-10 bg-amber-500 text-slate-950 font-bold text-xs px-6 flex items-center justify-between shadow-md z-50">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
            </span>
            <span>Console Censeur : Vous simulez l&apos;établissement <strong>&ldquo;{schoolData.schoolName}&rdquo;</strong></span>
          </div>
          <button 
            onClick={handleStopImpersonation}
            className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 transition-colors rounded-md cursor-pointer"
          >
            &larr; Quitter et retourner au Super Admin
          </button>
        </div>
      )}

      <div className={`w-64 bg-[#0f172a] text-slate-100 p-4 flex flex-col justify-between border-r border-[#1e293b] min-h-screen ${isImpersonating ? "pt-14" : ""}`}>
        <div className="space-y-6">
          <div className="bg-slate-950/60 border border-[#1e293b]/40 p-3 rounded-lg flex items-center gap-2.5">
            <div className="bg-sky-400/10 text-sky-400 p-2 rounded-md">
              <Home className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-slate-200 text-xs truncate">{schoolData.schoolName}</h4>
              <p className="text-[9px] text-slate-400 font-medium font-mono">{schoolData.city}, Côte d&apos;Ivoire</p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link href="/dashboard" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${pathname === "/dashboard" ? "bg-sky-500 text-[#0f172a] font-bold" : "text-slate-400 hover:text-white"}`}>
              <LayoutDashboard className="w-4 h-4" /> Tableau de bord
            </Link>
            <Link href="/dashboard/teachers" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${pathname === "/dashboard/teachers" ? "bg-sky-500 text-[#0f172a] font-bold" : "text-slate-400 hover:text-white"}`}>
              <Users className="w-4 h-4" /> Enseignants
            </Link>
            <Link href="/dashboard/classes" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${pathname === "/dashboard/classes" ? "bg-sky-500 text-[#0f172a] font-bold" : "text-slate-400 hover:text-white"}`}>
              <Layers className="w-4 h-4" /> Classes
            </Link>
            <Link href="/dashboard/rooms" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${pathname === "/dashboard/rooms" ? "bg-sky-500 text-[#0f172a] font-bold" : "text-slate-400 hover:text-white"}`}>
              <Home className="w-4 h-4" /> Salles
            </Link>
            <Link href="/dashboard/schedule" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${pathname === "/dashboard/schedule" ? "bg-sky-500 text-[#0f172a] font-bold" : "text-slate-400 hover:text-white"}`}>
              <Sparkles className="w-4 h-4" /> Génération
            </Link>
            <Link href="/dashboard/timetable" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${pathname === "/dashboard/timetable" ? "bg-sky-500 text-[#0f172a] font-bold" : "text-slate-400 hover:text-white"}`}>
              <CalendarDays className="w-4 h-4" /> Emploi du temps
            </Link>
            <Link href="/dashboard/settings" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${pathname === "/dashboard/settings" ? "bg-sky-500 text-[#0f172a] font-bold" : "text-slate-400 hover:text-white"}`}>
              <Settings className="w-4 h-4" /> Paramètres
            </Link>

            {schoolData.isSuperAdmin && (
              <Link href="/superadmin" className="flex items-center gap-2.5 px-3 py-2 mt-4 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all">
                <ShieldCheck className="w-4 h-4" /> Superadmin
              </Link>
            )}
          </nav>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>
    </>
  );
}

export function DashboardHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b pb-4">
      <h2 className="text-2xl font-black tracking-tight text-foreground">{title}</h2>
      {description && <p className="text-xs text-muted-foreground font-medium mt-1">{description}</p>}
    </div>
  );
}