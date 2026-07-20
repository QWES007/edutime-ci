"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  GraduationCap, 
  CalendarDays, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Sparkles
} from "lucide-react";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  subItems?: { title: string; href: string }[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    title: "ACCUEIL",
    icon: Home,
    href: "/dashboard",
  },
  {
    title: "SCOLARITÉ",
    icon: GraduationCap,
    subItems: [
      { title: "Enseignants & Dispos", href: "/dashboard/teachers" },
      { title: "Divisions & Classes", href: "/dashboard/classes" },
      { title: "Salles Physiques", href: "/dashboard/rooms" },
    ],
  },
  {
    title: "EMPLOIS DU TEMPS",
    icon: CalendarDays,
    subItems: [
      { title: "Moteur de Génération", href: "/dashboard/schedule" },
      { title: "Grille Globale", href: "/dashboard/timetable" },
    ],
  },
  {
    title: "PARAMÈTRES",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    "SCOLARITÉ": true,
    "EMPLOIS DU TEMPS": true,
  });

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-52 h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 sticky top-0 z-30">
      {/* En-tête Compact */}
      <div className="p-3.5 border-b border-slate-800 flex items-center gap-2">
        <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-md border border-emerald-500/20">
          <Sparkles className="size-4" />
        </div>
        <div>
          <h2 className="font-bold text-white tracking-tight text-xs">EDUTIME CI</h2>
          <p className="text-[9px] text-slate-500 font-semibold uppercase">Normes MENA</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto text-[11px]">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const hasSub = !!item.subItems;
          const isOpen = !!openSubmenus[item.title];
          const isActive = item.href ? pathname === item.href : item.subItems?.some(s => pathname === s.href);

          if (hasSub) {
            return (
              <div key={item.title} className="space-y-0.5">
                <button
                  onClick={() => toggleSubmenu(item.title)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`size-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                    <span>{item.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="size-3 text-slate-500" />
                  ) : (
                    <ChevronRight className="size-3 text-slate-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="pl-6 pr-1 space-y-0.5 border-l border-slate-800 ml-3 my-0.5">
                    {item.subItems?.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                            isSubActive
                              ? "bg-emerald-600 text-white font-bold shadow-xs"
                              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                          }`}
                        >
                          {sub.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.title}
              href={item.href || "#"}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg font-bold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// Export par défaut + nommé
export default DashboardSidebar;

// Export neutre de sécurité pour DashboardHeader
export function DashboardHeader() {
  return null;
}