"use client";

import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Conforme MENA",
    description:
      "Horaires hebdomadaires officiels intégrés pour le collège (6ème–3ème) et le lycée (2nde, 1ère, Tle A/C/D).",
  },
  {
    icon: Calendar,
    title: "Rythme scolaire ivoirien",
    description:
      "Lundi au samedi midi, mercredi après-midi réservé aux CE/UP, cours jumelés pour les matières scientifiques.",
  },
  {
    icon: Sparkles,
    title: "Génération automatique",
    description:
      "Algorithme intelligent qui respecte les contraintes enseignants, salles et classes sans conflits.",
  },
  {
    icon: Users,
    title: "Multi-établissement",
    description:
      "Chaque école dispose de son espace isolé. Idéal pour les Censeurs et Directeurs des Études.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "15 000 FCFA",
    period: "/mois",
    description: "Jusqu'à 20 classes et 30 enseignants",
    features: ["Génération automatique", "Export PDF", "Support email"],
  },
  {
    name: "Pro",
    price: "35 000 FCFA",
    period: "/mois",
    description: "Jusqu'à 60 classes et 80 enseignants",
    features: [
      "Tout Starter",
      "Modification drag-and-drop",
      "Multi-sites",
      "Support prioritaire",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sur devis",
    period: "",
    description: "Établissements et réseaux scolaires",
    features: [
      "Classes illimitées",
      "API & intégrations",
      "Formation sur site",
      "SLA garanti",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white/85 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white flex size-9 items-center justify-center rounded-lg shadow-xs">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">Edutime CI</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex font-medium">
            <a href="#features" className="text-slate-500 text-sm hover:text-emerald-600 transition-colors">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-slate-500 text-sm hover:text-emerald-600 transition-colors">
              Tarifs
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-xs font-bold">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold">
              <Link href="/signup">Essai gratuit</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* SECTION HERO DYNAMIQUE EN 2 COLONNES AVEC LA PHOTO DE L'ÉLÈVE */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-orange-50/20 pointer-events-none" />
        
        <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28 grid gap-12 lg:grid-cols-12 items-center">
          
          {/* Colonne gauche : Textes et Actions */}
          <div className="lg:col-span-7 text-left space-y-6">
            <Badge variant="secondary" className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-3 py-1 text-xs">
              🇨🇮 Spécifique au système scolaire de Côte d&apos;Ivoire
            </Badge>
            <h1 className="text-balance text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-6xl leading-[1.15]">
              Génerez des emplois du temps conformes au <span className="text-emerald-600">MENA</span> en quelques minutes
            </h1>
            <p className="text-slate-600 max-w-2xl text-base sm:text-lg leading-relaxed font-medium">
              Edutime CI automatise la planification hebdomadaire pour les collèges et lycées. Respectez scrupuleusement le rythme scolaire ivoirien, la libération des CE/UP et les horaires officiels nationaux &mdash; sans conflits.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold h-12 px-6 shadow-md">
                <Link href="/signup">
                  Commencer gratuitement
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-xs font-bold h-12 px-6 border-slate-200 hover:bg-slate-50">
                <Link href="/dashboard">Voir la démo</Link>
              </Button>
            </div>

            <div className="pt-6 border-t border-slate-100 text-slate-500 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600 size-4 shrink-0" />
                Mercredi après-midi bloqué (CE/UP)
              </span>
              <span className="flex items-center gap-2">
                <Clock className="text-emerald-600 size-4 shrink-0" />
                Cours jumelés Maths & PC
              </span>
              <span className="flex items-center gap-2">
                <Shield className="text-emerald-600 size-4 shrink-0" />
                Isolation multi-tenant stricte
              </span>
            </div>
          </div>

          {/* Colonne droite : Cadre Photo Artistique de l'élève */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/3] sm:aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 group ring-1 ring-slate-200/50">
              <Image
                src="/images/eleve-classe.jpg"
                alt="Jeune élève ivoirien écrivant concentré dans sa classe"
                fill
                priority
                className="object-cover object-center transform group-hover:scale-103 transition-transform duration-500"
              />
              {/* Ombre douce en bas de l'image */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-80" />
              
              {/* Badge indicatif MENA superposé */}
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-100 shadow-xs">
                💡 Réussite et excellence académique
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION CARACTÉRISTIQUES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-950">Pensé pour les Censeurs & DE</h2>
          <p className="text-slate-500 text-base font-medium">
            Tout ce dont vous avez besoin pour planifier sereinement votre année académique.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border border-slate-100 shadow-xs bg-white hover:border-emerald-500/30 transition-all">
              <CardHeader className="pb-3">
                <div className="bg-emerald-50 text-emerald-600 mb-2 flex size-10 items-center justify-center rounded-lg border border-emerald-100">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs leading-relaxed text-slate-500 font-medium">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION TARIFS */}
      <section id="pricing" className="bg-slate-100/60 border-t border-b border-slate-200/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Tarifs simples et transparents</h2>
            <p className="text-slate-500 text-base font-medium">
              Choisissez le plan adapté à la structure pédagogique de votre établissement.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`bg-white border transition-all ${
                  plan.highlighted
                    ? "border-emerald-500 shadow-xl ring-4 ring-emerald-500/10 scale-102"
                    : "border-slate-200 shadow-xs"
                }`}
              >
                <CardHeader className="pb-4">
                  {plan.highlighted && (
                    <Badge className="w-fit bg-emerald-600 text-white font-bold mb-2">Le plus populaire</Badge>
                  )}
                  <CardTitle className="text-xl font-bold text-slate-950">{plan.name}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">{plan.description}</CardDescription>
                  <div className="pt-3 border-t border-slate-50 mt-2">
                    <span className="text-3xl font-black text-slate-950">{plan.price}</span>
                    <span className="text-slate-400 text-xs font-bold ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-2.5 min-h-[120px]">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <CheckCircle2 className="text-emerald-600 size-4 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full text-xs font-bold h-10 ${
                      plan.highlighted 
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/signup">Choisir la formule {plan.name}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PIED DE PAGE */}
      <footer className="bg-white py-10">
        <div className="text-slate-400 mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs font-semibold md:flex-row">
          <p>© 2026 Edutime CI &mdash; Gestion automatisée du secondaire ivoirien.</p>
          <p className="text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
            Plateforme conforme aux exigences cadres du MENA
          </p>
        </div>
      </footer>
    </div>
  );
}