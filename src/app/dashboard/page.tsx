"use client";

import {
  CalendarDays,
  DoorOpen,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  DashboardHeader,
  DashboardSidebar,
} from "@/components/layout/dashboard-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  { label: "Enseignants", value: "24", icon: Users, href: "/dashboard/teachers" },
  { label: "Classes", value: "18", icon: GraduationCap, href: "/dashboard/classes" },
  { label: "Salles", value: "12", icon: DoorOpen, href: "/dashboard/rooms" },
  { label: "Créneaux planifiés", value: "342", icon: CalendarDays, href: "/dashboard/timetable" },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        <DashboardHeader
          title="Tableau de bord"
          description="Vue d'ensemble de votre établissement — Année scolaire 2025-2026"
        />
        <div className="space-y-8 p-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription>{stat.label}</CardDescription>
                    <stat.icon className="text-muted-foreground size-4" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-primary size-5" />
                  Génération d&apos;emploi du temps
                </CardTitle>
                <CardDescription>
                  Lancez l&apos;algorithme de planification conforme MENA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Mercredi PM bloqué</Badge>
                  <Badge variant="secondary">Samedi PM bloqué</Badge>
                  <Badge variant="secondary">Cours jumelés activés</Badge>
                </div>
                <Button asChild>
                  <Link href="/dashboard/schedule">
                    Générer automatiquement l&apos;emploi du temps
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conformité MENA</CardTitle>
                <CardDescription>
                  Horaires hebdomadaires officiels configurés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Premier cycle</span>
                    <span className="font-medium">6ème, 5ème, 4ème, 3ème</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Second cycle</span>
                    <span className="font-medium">2nde A/C, 1ère A/C/D, Tle A/C/D</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Plage horaire</span>
                    <span className="font-medium">Lun–Sam, 07h–18h</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Plan actuel</span>
                    <Badge>Starter</Badge>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
