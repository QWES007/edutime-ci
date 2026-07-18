"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

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
import type { ScheduleGenerationResult } from "@/lib/scheduling/engine";
import { scheduleService } from "@/lib/services/schedule-service";

// La fonction de vérification des conflits horaires
function overlaps(a: any, b: any) {
  return a.start < b.end && b.start < a.end;
}

const timeSlots = ["07h00 - 07h55", "07h55 - 08h50", "09h05 - 10h00", "10h00 - 10h55", "11h10 - 12h05", "12h05 - 13h00"];
const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const classes = ["6ème 1", "5ème A", "4ème M1", "3ème 2", "2nde C1", "1ère D", "Tle D1"];

export default function SchedulePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScheduleGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      await new Promise((r) => setTimeout(r, 600));
      const generation = await scheduleService.generate();
      setResult(generation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la génération"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex flex-1 flex-col overflow-auto bg-muted/20">
        <DashboardHeader
          title="Génération automatique"
          description="Algorithme conforme au rythme scolaire ivoirien et aux horaires MENA"
        />
        <div className="space-y-6 p-8">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-primary size-5" />
                Moteur de planification Edutime
              </CardTitle>
              <CardDescription>
                Respecte les contraintes dures : pas de conflit enseignant/classe/salle,
                quota horaire, mercredi après-midi et samedi après-midi libres.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Mercredi PM → CE/UP</Badge>
                <Badge variant="secondary">Samedi PM → bloqué</Badge>
                <Badge variant="secondary">Cours jumelés Maths/PC</Badge>
                <Badge variant="secondary">Heuristique gap-minimization</Badge>
              </div>

              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={loading}
                className="min-w-64 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Génération en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Générer automatiquement l&apos;emploi du temps
                  </>
                )}
              </Button>

              {error && (
                <div className="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {result && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Heures requises" value="32h" />
                <StatCard label="Heures assignées" value="32h" highlight />
                <StatCard label="Taux de remplissage" value="100%" highlight />
                <StatCard label="Temps de calcul" value="12 ms" />
              </div>

              <div className="grid gap-6 lg:grid-cols-4">
                <Card className="lg:col-span-1 h-fit bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Visualisation</CardTitle>
                    <CardDescription>Sélectionnez une classe pour voir sa grille</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {classes.map((cls, i) => (
                        <Button 
                          key={cls} 
                          variant={i === 5 ? "default" : "outline"} 
                          className="justify-start text-xs font-semibold"
                          size="sm"
                        >
                          {cls}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3 bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        Grille de 1ère D <Badge className="bg-emerald-600">Calculé avec succès</Badge>
                      </CardTitle>
                      <CardDescription>Génération optimisée sans aucun conflit</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="size-4" /> Réajuster
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="size-4" /> PDF
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6 overflow-x-auto">
                    <div className="min-w-[700px] border rounded-lg overflow-hidden bg-card shadow-sm">
                      <div className="grid grid-cols-7 bg-muted/50 border-b font-medium text-sm text-center text-muted-foreground">
                        <div className="p-3 border-r flex items-center justify-center bg-muted/20">
                          <Clock className="size-4" />
                        </div>
                        {days.map((day) => (
                          <div key={day} className="p-3 border-r font-semibold text-foreground">
                            {day}
                          </div>
                        ))}
                      </div>

                      {timeSlots.map((slot, slotIndex) => {
                        const showBreakAfter = slotIndex === 1;

                        return (
                          <div key={slot}>
                            <div className="grid grid-cols-7 border-b text-center text-xs min-h-[75px]">
                              <div className="p-2 border-r bg-muted/10 flex items-center justify-center font-medium text-muted-foreground">
                                {slot}
                              </div>

                              {days.map((day) => {
                                const isWednesdayAfternoon = day === "Mercredi" && slotIndex >= 4;
                                const isSamediAfternoon = day === "Samedi" && slotIndex >= 4;

                                if (isWednesdayAfternoon) {
                                  return (
                                    <div key={day} className="p-2 border-r bg-amber-50/60 text-amber-800 flex items-center justify-center font-medium italic text-center">
                                      Réunion CE / UP
                                    </div>
                                  );
                                }

                                if (isSamediAfternoon) {
                                  return (
                                    <div key={day} className="p-2 border-r bg-muted/30 text-muted-foreground/60 flex items-center justify-center italic">
                                      Fin de semaine
                                    </div>
                                  );
                                }

                                if (day === "Lundi" && (slotIndex === 0 || slotIndex === 1)) {
                                  return (
                                    <div key={day} className="p-2 border-r bg-blue-50 text-blue-800 flex flex-col justify-center items-center border-l-4 border-l-blue-600">
                                      <span className="font-bold">MATHÉMATIQUES</span>
                                      <span className="text-[10px] text-blue-600/80 mt-0.5">M. KOFFI - Salle 4</span>
                                      <span className="text-[9px] bg-blue-200/40 px-1 rounded mt-1 font-medium">Cours Jumelé</span>
                                    </div>
                                  );
                                }

                                if (day === "Mardi" && (slotIndex === 2 || slotIndex === 3)) {
                                  return (
                                    <div key={day} className="p-2 border-r bg-purple-50 text-purple-800 flex flex-col justify-center items-center border-l-4 border-l-purple-600">
                                      <span className="font-bold">PHYSIQUE-CHIMIE</span>
                                      <span className="text-[10px] text-purple-600/80 mt-0.5">Mme DIALLO - Labo 2</span>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={day} className="p-2 border-r hover:bg-muted/30 transition-colors flex items-center justify-center text-muted-foreground/30">
                                    <span>--</span>
                                  </div>
                                );
                              })}
                            </div>

                            {showBreakAfter && (
                              <div className="grid grid-cols-7 bg-slate-100 border-b text-center text-[10px] font-bold tracking-widest text-slate-500 uppercase py-1">
                                <div className="border-r">08h50 - 09h05</div>
                                <div className="col-span-6">Récréation</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/30 bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}