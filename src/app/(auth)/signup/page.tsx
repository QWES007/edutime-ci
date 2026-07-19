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
import { School, ArrowLeft, GraduationCap, Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    schoolName: "",
    city: "",
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
      setErrorMsg("Le service d&apos;authentification n&apos;est pas disponible.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              school_name: formData.schoolName,
              city: formData.city,
              contact_name: `${formData.firstName} ${formData.lastName}`,
              subscription_plan: "free",
              is_superadmin: false,
            },
          ] as any);

        if (profileError) throw profileError;

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Une erreur est survenue lors de l&apos;inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-tr from-[#0b311e] via-[#161f30] to-[#4c2409] p-6 overflow-hidden">
      
      {/* EFFET ARTISTIQUE D'ARRIÈRE-PLAN (Éducation Nationale CI) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#009b48] blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#f77f00] blur-[120px] animate-pulse [animation-duration:6s]" />
        
        {/* Lignes artistiques de fond rappelant des grilles de cahier / emplois du temps */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* BOUTON RETOUR ACCUEIL STATIQUE FIXE HAUT GAUCHE */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Button 
            variant="ghost" 
            className="text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold gap-2 backdrop-blur-xs border border-white/10"
          >
            <ArrowLeft className="size-4" /> Retour à l&apos;accueil
          </Button>
        </Link>
      </div>

      {/* LE FORMULAIRE PRINCIPAL COMPACT ET SOIGNÉ */}
      <Card className="w-full max-w-lg shadow-2xl border-white/5 bg-slate-900/80 backdrop-blur-xl text-slate-100 relative z-10 my-12">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-gradient-to-br from-[#009b48] to-[#f77f00] p-2.5 rounded-2xl w-fit shadow-md mb-3 border border-white/10">
            <GraduationCap className="size-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Edutime CI <span className="text-[10px] font-bold text-[#f77f00] tracking-widest border border-[#f77f00]/30 px-2 py-0.5 rounded bg-[#f77f00]/5 uppercase">Normes MENA</span>
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-1">
            Inscrivez votre établissement pour concevoir vos plannings sans conflits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs text-slate-300 font-bold">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Amadou"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-[#009b48] text-xs h-9.5"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs text-slate-300 font-bold">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Koné"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-[#009b48] text-xs h-9.5"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="schoolName" className="text-xs text-slate-300 font-bold">Nom de l&apos;établissement</Label>
                <Input
                  id="schoolName"
                  placeholder="Ex: Lycée Moderne..."
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-[#009b48] text-xs h-9.5"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs text-slate-300 font-bold">Ville / Localité</Label>
                <Input
                  id="city"
                  placeholder="Ex: Abidjan, Bouaké..."
                  value={formData.city}
                  onChange={handleChange}
                  className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-[#009b48] text-xs h-9.5"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-slate-300 font-bold">Adresse e-mail professionnelle</Label>
              <Input
                id="email"
                type="email"
                placeholder="censeur@lycee.ci"
                value={formData.email}
                onChange={handleChange}
                className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-[#009b48] text-xs h-9.5"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-[#009b48] text-xs h-9.5"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-10 mt-2 font-bold text-xs bg-gradient-to-r from-[#009b48] to-[#007b39] hover:from-[#00b453] hover:to-[#009b48] text-white shadow-lg shadow-emerald-950/40 border border-emerald-500/10 transition-all" 
              disabled={loading}
            >
              {loading ? "Création en cours..." : "Créer le compte de l'établissement"}
            </Button>
          </form>
          
          <p className="text-slate-400 mt-6 text-center text-xs">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-[#f77f00] font-bold hover:underline transition-all">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}