import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-6">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Créer votre établissement</CardTitle>
          <CardDescription>
            Inscrivez-vous en tant que Censeur ou Directeur des Études
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" placeholder="Amadou" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" placeholder="Koné" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolName">Nom de l&apos;établissement</Label>
              <Input
                id="schoolName"
                placeholder="Lycée Moderne d'Abidjan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail professionnelle</Label>
              <Input
                id="email"
                type="email"
                placeholder="censeur@lycee.ci"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" />
            </div>
            <Button className="w-full" asChild>
              <Link href="/dashboard">Créer mon compte — Essai Starter</Link>
            </Button>
          </form>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
