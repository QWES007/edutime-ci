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
  { href: "/superadmin", label: "Superadmin", icon: ShieldAlert, isSecret: true },
];

interface DashboardSidebarProps {
  schoolName?: string;
  userName?: string;
}

export function DashboardSidebar({
  schoolName = "Chargement...",
  userName = "Utilisateur",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // On initialise avec des valeurs neutres pour éviter que l'ancien compte reste figé à l'écran
  const [liveSchoolName, setLiveSchoolName] = useState("");
  const [liveUserName, setLiveUserName] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    async function fetchUserProfile(userId: string) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("school_name, contact_name, is_superadmin")
          .eq("id", userId)
          .single() as any;

        if (profile && !profileError) {
          setLiveSchoolName(profile.school_name || "Établissement sans nom");
          setLiveUserName(profile.contact_name || "Censeur");
          setIsSuperAdmin(!!profile.is_superadmin);
        } else {
          // Fallback si aucun profil n'est trouvé
          setLiveSchoolName(schoolName);
          setLiveUserName(userName);
          setIsSuperAdmin(false);
        }
      } catch (err) {
        console.error("Erreur profil:", err);
      } finally {
        setLoading(false);
      }
    }

    // 1. Charger l'état initial
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchUserProfile(user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Écouter les changements d'état (connexion/déconnexion) pour réagir instantanément
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLiveSchoolName("");
        setLiveUserName("");
        setIsSuperAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, schoolName, userName]);

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
            {loading ? "Mise à jour..." : liveSchoolName || schoolName}
          </p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          if (item.isSecret && !isSuperAdmin) {
            return null;
          }

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
                ? liveUserName
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "ED"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {loading ? "Chargement..." : liveUserName || userName}
            </p>
            <p className="text-sidebar-foreground/60 truncate text-xs">
              {isSuperAdmin ? "Superadmin" : "Censeur"}
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