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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
];

interface DashboardSidebarProps {
  schoolName?: string;
  userName?: string;
}

export function DashboardSidebar({
  schoolName = "Lycée Moderne d'Abidjan",
  userName = "M. Koné",
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 items-center justify-center rounded-lg">
          <School className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Edutime CI</p>
          <p className="text-sidebar-foreground/70 truncate text-xs">
            {schoolName}
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
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-sidebar-foreground/60 truncate text-xs">
              Censeur
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start"
          asChild
        >
          <Link href="/">
            <LogOut className="size-4" />
            Déconnexion
          </Link>
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
