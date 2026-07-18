"use client";

import {
  DashboardHeader,
  DashboardSidebar,
} from "@/components/layout/dashboard-sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const placeholderPages = [
  {
    href: "/dashboard/teachers",
    title: "Enseignants",
    description: "Gestion des profils, matières et disponibilités",
  },
  {
    href: "/dashboard/classes",
    title: "Classes",
    description: "Configuration des niveaux MENA et volumes horaires",
  },
  {
    href: "/dashboard/rooms",
    title: "Salles",
    description: "Salles standard, laboratoires et terrains EPS",
  },
  {
    href: "/dashboard/schedule",
    title: "Génération",
    description: "Moteur de planification automatique",
  },
  {
    href: "/dashboard/timetable",
    title: "Emploi du temps",
    description: "Grille interactive par classe, enseignant ou salle",
  },
  {
    href: "/dashboard/settings",
    title: "Paramètres",
    description: "Profil établissement, abonnement et facturation",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        <DashboardHeader title={title} description={description} />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export function ComingSoonSection({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="secondary">Étape 4</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Cette section sera implémentée à l&apos;étape 4 (formulaires
          interactifs, grille de disponibilités et visualisation).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {placeholderPages.map((p) => (
            <Badge key={p.href} variant="outline">
              {p.title}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
