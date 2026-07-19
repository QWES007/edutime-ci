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
import { ArrowLeft, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      setErrorMsg("Le service d&apos;authentification n&apos;est pas disponible.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Identifiants incorrects ou problème de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-tr from-[#0b311e] via-[#161f30] to-[#4c2409] p-6 overflow-hidden">
      
      {/* EFFET ARTISTIQUE D'ARRIÈRE-PLAN */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#009b48] blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#f77f00] blur-[120px] animate-pulse [animation-duration:6s]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* BOUTON ACCUEIL FIXE HAUT GAUCHE */}
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

      {/* CARTE DE CONNEXION PREMIUM */}
      <Card className="w-full max-w-md shadow-2xl border-white/5 bg-slate-900/80 backdrop-blur-xl text-slate-100 relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-gradient-to-br from-[#009b48] to-[#f77f00] p-2.5 rounded-2xl w-fit shadow-md mb-3 border border-white/10">
            <Lock className="size-5 text-white" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Connexion
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-1">
            Accédez à l&apos;espace de gestion de votre établissement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-slate-300 font-bold">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="censeur@lycee.ci"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-[#009b48] text-xs h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-[#009b48] text-xs h-10"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-10 mt-2 font-bold text-xs bg-gradient-to-r from-[#009b48] to-[#007b39] hover:from-[#00b453] hover:to-[#009b48] text-white shadow-lg border border-emerald-500/10 transition-all" 
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>
          
          <p className="text-slate-400 mt-6 text-center text-xs">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-[#f77f00] font-bold hover:underline transition-all">
              Créer un établissement
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}