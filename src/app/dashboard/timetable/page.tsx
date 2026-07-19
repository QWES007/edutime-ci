"use client";

import React from "react";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, AlertCircle } from "lucide-react";

export default function TimetablePage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader
        title="Emploi du Temps Général"
        description="Consultez, filtrez et exportez les grilles horaires officielles générées."
      />

      <Card className="border-amber-200 bg-amber-50/40 shadow-xs">
        <CardContent className="p-6 flex items-start gap-3">
          <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-900">Aucun planning actif trouvé</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Pour visualiser une grille complète, vous devez d&apos;abord lancer le moteur de calcul automatique depuis la section <strong>Génération</strong> dans la barre latérale.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-dashed p-12 text-center bg-card flex flex-col items-center justify-center gap-3">
        <div className="bg-muted size-12 flex items-center justify-center rounded-full text-muted-foreground">
          <CalendarDays className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-card-foreground">La matrice des horaires est vide</p>
          <p className="text-xs text-muted-foreground">Les grilles interactives (par classe et par enseignant) apparaîtront ici après traitement.</p>
        </div>
      </div>
    </div>
  );
}