"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  Settings,
  Sparkles,
  Users,
  DoorOpen,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/teachers", label: "Enseignants", icon: Users },
  { href: "/dashboard/classes", label: "Classes", icon: GraduationCap },
  { href: "/dashboard/rooms", label: "Salles", icon: DoorOpen },
  { href: "/dashboard/schedule", label: "Génération", icon: Sparkles },
  { href: "/dashboard/timetable", label: "Emploi du temps", icon: CalendarDays },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
  { href: "/superadmin", label: "Superadmin", icon: ShieldAlert },
];

interface DashboardSidebarProps {
  schoolName?: string;
  userName?: string;
}

export function DashboardSidebar({
  schoolName = "College Forndi",
  userName = "M. Kouakou kouassi",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // États pour stocker les vraies informations de la base de données
  const [liveSchoolName, setLiveSchoolName] = useState(schoolName);
  const [liveUserName, setLiveUserName] = useState(userName);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!supabase) return;

      // 1. Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (user && !userError) {
        // 2. Chercher son profil lié dans la table profiles
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("school_name, contact_name")
          .eq("id", user.id)
          .single();

        if (profile && !profileError) {
          if (profile.school_name) setLiveSchoolName(profile.school_name);
          if (profile.contact_name) setLiveUserName(profile.contact_name);
        }
      }
    }

    fetchUserProfile();
  }, [supabase]);

  // Gérer la déconnexion proprement avec Supabase
  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    }
  };

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 items-center justify-center rounded-lg">
          <School className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Edutime CI</p>
          <p className="text-sidebar-foreground/70 truncate text-xs">
            {liveSchoolName}
          </p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {liveUserName
                .split(" ")
                .filter(Boolean)
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "ED"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{liveUserName}</p>
            <p className="text-sidebar-foreground/60 truncate text-xs">
              Censeur
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="size-4 mr-3" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}

export function DashboardHeader({
  title,
  description,
  backHref,
}: {
  title: string;
  description?: string;
  backHref?: string;
}) {
  return (
    <header className="border-b bg-card/50 px-8 py-6 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        {backHref && (
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary size-5" />
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          </div>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
      </div>
    </header>
  );
}