"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  Grid,
  Settings,
  Sliders,
  LogOut,
  Sparkles,
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: SidebarItem[] = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

const scolariteItems: SidebarItem[] = [
  {
    title: "Enseignants & Dispos",
    href: "/dashboard/teachers",
    icon: Users,
  },
  {
    title: "Divisions & Classes",
    href: "/dashboard/classes",
    icon: GraduationCap,
  },
  {
    title: "Salles Physiques",
    href: "/dashboard/rooms",
    icon: Building2,
  },
  {
    title: "Contraintes Dynamiques",
    href: "/dashboard/constraints",
    icon: Sliders,
  },
];

const timetableItems: SidebarItem[] = [
  {
    title: "Moteur de Génération",
    href: "/dashboard/schedule",
    icon: Calendar,
  },
  {
    title: "Grille Globale",
    href: "/dashboard/timetable",
    icon: Grid,
  },
];

const settingsItems: SidebarItem[] = [
  {
    title: "Paramètres Lycée",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-800 pb-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          {title}
        </h1>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Normes MENA v2026
        </span>
      </div>
      {description && (
        <p className="text-xs text-slate-400 max-w-2xl">{description}</p>
      )}
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();

  const renderNavGroup = (title: string, items: SidebarItem[]) => (
    <div className="space-y-1 py-2">
      <h2 className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`size-4 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                  }`}
                />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 min-h-screen">
      <div className="p-4 space-y-6">
        {/* Logo App */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-wide">
              Edutime CI
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">SaaS Emplois du Temps</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-4">
          {renderNavGroup("Vue générale", mainNavItems)}
          {renderNavGroup("Scolarité & Structure", scolariteItems)}
          {renderNavGroup("Emplois du Temps", timetableItems)}
          {renderNavGroup("Configuration", settingsItems)}
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="truncate">
            <p className="font-bold text-white truncate">Collège FORNDI</p>
            <p className="text-[10px] text-slate-500 truncate">Abidjan, Côte d&apos;Ivoire</p>
          </div>
          <Link href="/login" className="p-2 text-slate-400 hover:text-rose-400 transition-colors">
            <LogOut className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}