"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Plus, Trash2, FileSpreadsheet, Upload, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

const STORAGE_KEY = "edutime_rooms_saas_v1";

export default function RoomsPage() {
  const supabase = createClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("Standard");
  const [capacity, setCapacity] = useState(50);
  const [insertMode, setInsertMode] = useState<"manual" | "excel">("manual");
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Chargement au démarrage : Priorité à Supabase puis au LocalStorage
  useEffect(() => {
    const loadRoomsData = async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("rooms")
            .select("*")
            .order("name", { ascending: true });

          if (!error && data && data.length > 0) {
            setRooms(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setIsInitialized(true);
            return;
          }
        } catch (e) {
          console.log("Supabase non disponible ou vide :", e);
        }
      }

      const savedLocal = localStorage.getItem(STORAGE_KEY);
      if (savedLocal !== null) {
        try {
          const parsed = JSON.parse(savedLocal);
          setRooms(parsed);
          setIsInitialized(true);
          return;
        } catch (e) {
          console.error("Erreur de lecture du localStorage :", e);
        }
      }

      setRooms([]);
      setIsInitialized(true);
    };

    loadRoomsData();
  }, []);

  // 2. Ajout Manuel avec UUID compatible Supabase
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    const newRoom: Room = {
      id: crypto.randomUUID(), // Génère un UUID valide pour Supabase
      name: roomName.trim(),
      type: roomType,
      capacity: Number(capacity),
    };

    // Sauvegarde Locale instantanée
    const updated = [newRoom, ...rooms];
    setRooms(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Insertion Supabase
    if (supabase) {
      const { error } = await supabase.from("rooms").insert([newRoom]);
      if (error) {
        console.error("Erreur d'insertion Supabase Rooms :", error.message);
      } else {
        console.log("Salle enregistrée avec succès dans Supabase !");
      }
    }

    setRoomName("");
  };

  // 3. Importation Excel avec UUIDs compatibles Supabase
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedRooms: Room[] = data
          .filter((row) => row.Salle || row.Nom)
          .map((row) => ({
            id: crypto.randomUUID(), // UUID valide pour chaque salle
            name: String(row.Salle || row.Nom).trim(),
            type: String(row.Type || "Standard").trim(),
            capacity: Number(row.Capacite || row.Capacité || row.Places) || 50,
          }));

        if (importedRooms.length === 0) {
          alert("Aucun local valide trouvé. Vérifiez les colonnes 'Salle' et 'Capacité'.");
          return;
        }

        const merged = [...importedRooms, ...rooms];
        setRooms(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        if (supabase) {
          const { error } = await supabase.from("rooms").insert(importedRooms);
          if (error) {
            console.error("Erreur d'insertion Supabase Excel :", error.message);
          } else {
            console.log(`${importedRooms.length} salle(s) insérée(s) dans Supabase !`);
          }
        }

        alert(`${importedRooms.length} salle(s) importée(s) avec succès !`);
        setInsertMode("manual");
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'importation du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // 4. Suppression
  const handleDeleteRoom = async (id: string) => {
    if (window.confirm("Supprimer cette salle physique ?")) {
      const filtered = rooms.filter((r) => r.id !== id);
      setRooms(filtered);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

      if (supabase) {
        const { error } = await supabase.from("rooms").delete().eq("id", id);
        if (error) console.error("Erreur de suppression Supabase :", error.message);
      }
    }
  };

  // 5. Réinitialisation
  const handleResetRooms = async () => {
    if (window.confirm("Attention : Voulez-vous vraiment TOUT effacer pour les salles ?")) {
      setRooms([]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

      if (supabase) {
        const { error } = await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) console.error("Erreur de réinitialisation Supabase :", error.message);
      }
    }
  };

  if (!isInitialized) {
    return <div className="p-8 text-xs text-slate-400">Chargement des locaux...</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader
        title="Salles Physiques"
        description="Configurez les locaux et infrastructures de votre établissement."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold text-slate-700">Locaux</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetRooms}
                  className="h-7 text-[10px] text-rose-500 border-rose-200 hover:bg-rose-50"
                >
                  <RotateCcw className="size-3 mr-1" /> Réinitialiser
                </Button>

                <div className="flex gap-1 bg-muted p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setInsertMode("excel")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${insertMode === "excel" ? "bg-white shadow-xs font-bold text-primary" : "text-muted-foreground"}`}
                  >
                    <FileSpreadsheet className="inline size-3.5 mr-1" /> Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => setInsertMode("manual")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${insertMode === "manual" ? "bg-white shadow-xs font-bold text-primary" : "text-muted-foreground"}`}
                  >
                    <Plus className="inline size-3.5 mr-1" /> Manuel
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {insertMode === "manual" ? (
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Nom / Numéro de salle</Label>
                  <Input id="roomName" placeholder="Ex: Salle 12, Labo Chimie" value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomType">Type de local</Label>
                  <select id="roomType" value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none">
                    <option value="Standard">Salle Standard</option>
                    <option value="Laboratoire">Laboratoire / Sciences</option>
                    <option value="Informatique">Salle Informatique</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacité d&apos;accueil</Label>
                  <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
                </div>
                <Button type="submit" className="w-full">Enregistrer le local</Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center hover:bg-muted/30 transition-colors relative cursor-pointer group">
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload className="size-8 mx-auto text-muted-foreground group-hover:text-primary mb-2" />
                  <p className="text-xs font-bold">Glissez votre fichier Excel ou CSV ici</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center bg-card">
              <p className="text-muted-foreground">Aucun local disponible.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rooms.map((r) => (
                <Card key={r.id} className="shadow-xs">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary p-2.5 rounded-lg"><Home className="size-5" /></div>
                      <div>
                        <h4 className="font-bold text-sm">{r.name}</h4>
                        <p className="text-[11px] text-muted-foreground font-medium">{r.type} · Max {r.capacity} places</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRoom(r.id)}><Trash2 className="size-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}