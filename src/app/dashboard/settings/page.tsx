"use client";

import React, { useState } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Settings, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  const [restrictedCapacity, setRestrictedCapacity] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Configurations de l'établissement sauvegardées avec succès !");
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader
        title="Paramètres de Configuration"
        description="Ajustez les contraintes pédagogiques et les informations de l&apos;application."
      />

      <div className="max-w-2xl space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Settings className="size-4 text-primary" /> Options de Génération
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-xl select-none">
                <input
                  type="checkbox"
                  id="restrictedRoomCapacity"
                  checked={restrictedCapacity}
                  onChange={(e) => setRestrictedCapacity(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary size-4 cursor-pointer mt-0.5"
                />
                <div className="flex flex-col">
                  <label htmlFor="restrictedRoomCapacity" className="text-xs font-bold text-foreground cursor-pointer">
                    Établissement à capacité de salles restreinte
                  </label>
                  <span className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    Activez cette option pour forcer la planification de cours le Mercredi après-midi afin d&apos;optimiser l&apos;occupation des locaux physiques.
                  </span>
                </div>
              </div>

              <Button type="submit" className="text-xs font-bold">
                Sauvegarder les préférences
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
              <ShieldAlert className="size-4" /> Zone Critique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              La réinitialisation supprimera toutes les données locales actuelles (Enseignants, Classes, Salles) et videra l&apos;emploi du temps pour remettre l&apos;application à zéro.
            </p>
            <Button variant="destructive" size="sm" className="text-xs font-bold">
              Réinitialiser l&apos;établissement
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}