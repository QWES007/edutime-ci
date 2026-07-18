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
    <div className="min-h-screen">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-lg font-bold">Edutime CI</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-muted-foreground text-sm hover:text-foreground">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-muted-foreground text-sm hover:text-foreground">
              Tarifs
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Essai gratuit</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="from-primary/5 via-background to-accent/10 absolute inset-0 bg-gradient-to-br" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <Badge variant="secondary" className="mb-6">
            Conçu pour les établissements ivoiriens
          </Badge>
          <h1 className="text-balance mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Générez des emplois du temps conformes au{" "}
            <span className="text-primary">MENA</span> en quelques minutes
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
            Edutime CI automatise la planification hebdomadaire pour les
            collèges et lycées de Côte d&apos;Ivoire. Respectez le rythme
            scolaire ivoirien, les Conseils d&apos;Enseignement et les horaires
            officiels — sans tableur ni conflits.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Commencer gratuitement
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">Voir la démo</Link>
            </Button>
          </div>
          <div className="text-muted-foreground mt-12 flex flex-wrap items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="text-primary size-4" />
              Mercredi après-midi bloqué (CE/UP)
            </span>
            <span className="flex items-center gap-2">
              <Clock className="text-primary size-4" />
              Cours jumelés Maths & PC
            </span>
            <span className="flex items-center gap-2">
              <Shield className="text-primary size-4" />
              Données isolées par établissement
            </span>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">Pensé pour les Censeurs</h2>
          <p className="text-muted-foreground mt-3 text-lg">
            Tout ce dont vous avez besoin pour planifier la semaine scolaire
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-md">
              <CardHeader>
                <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">Tarifs simples et transparents</h2>
            <p className="text-muted-foreground mt-3">
              Choisissez le plan adapté à la taille de votre établissement
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlighted
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : ""
                }
              >
                <CardHeader>
                  {plan.highlighted && (
                    <Badge className="w-fit">Le plus populaire</Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="text-primary size-4 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/signup">Choisir {plan.name}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm md:flex-row">
          <p>© 2026 Edutime CI — Emplois du temps pour le secondaire ivoirien</p>
          <p>Conforme aux directives du MENA</p>
        </div>
      </footer>
    </div>
  );
}
