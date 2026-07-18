"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    schoolName: "",
    city: "", // <- Ajout de l'état pour la ville
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      setErrorMsg("Le service d'authentification n'est pas disponible.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Création de l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Insertion incluant maintenant la ville obligatoire pour la contrainte
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              school_name: formData.schoolName,
              city: formData.city, // <- On envoie la ville ici
              contact_name: `${formData.firstName} ${formData.lastName}`,
              subscription_plan: "starter",
            },
          ] as any);

        if (profileError) throw profileError;

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

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
          {errorMsg && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Amadou"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Koné"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schoolName">Nom de l&apos;établissement</Label>
                <Input
                  id="schoolName"
                  placeholder="Lycée Moderne..."
                  value={formData.schoolName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville / Localité</Label>
                <Input
                  id="city"
                  placeholder="Abidjan, Bouaké..."
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail professionnelle</Label>
              <Input
                id="email"
                type="email"
                placeholder="censeur@lycee.ci"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Création en cours..." : "Créer mon compte — Essai Starter"}
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