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

const parseSafeNumber = (val: any, fallback: number): number => {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (!val) return fallback;
  const cleaned = String(val).replace(/[^0-9]/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? fallback : parsed;
};

export default function RoomsPage() {
  const supabase = createClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("Standard");
  const [capacity, setCapacity] = useState(50);
  const [insertMode, setInsertMode] = useState<"manual" | "excel">("manual");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const syncAndLoadRooms = async () => {
      const savedLocal = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      let localRooms: Room[] = [];
      if (savedLocal) {
        try {
          localRooms = JSON.parse(savedLocal);
        } catch (e) {
          console.error(e);
        }
      }

      if (supabase) {
        try {
          const { data: remoteRooms } = await supabase.from("rooms").select("*");

          if (remoteRooms && remoteRooms.length > 0) {
            setRooms(remoteRooms);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteRooms));
            return;
          }

          if (localRooms.length > 0 && (!remoteRooms || remoteRooms.length === 0)) {
            const formattedRooms = localRooms.map((r) => ({
              id: r.id && r.id.length === 36 ? r.id : crypto.randomUUID(),
              name: r.name,
              type: (r.type || "Standard").toLowerCase(),
              capacity: parseSafeNumber(r.capacity, 50),
            }));

            const { error: insertError } = await supabase.from("rooms").insert(formattedRooms);
            if (!insertError) {
              setRooms(localRooms);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(localRooms));
              return;
            }
          }
        } catch (err) {
          console.error("Erreur Supabase Rooms :", err);
        }
      }

      setRooms(localRooms);
    };

    syncAndLoadRooms();
  }, []);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: roomName.trim(),
      type: roomType,
      capacity: parseSafeNumber(capacity, 50),
    };

    const updated = [newRoom, ...rooms];
    setRooms(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (supabase) {
      await supabase.from("rooms").insert([{
        id: newRoom.id,
        name: newRoom.name,
        type: newRoom.type.toLowerCase(),
        capacity: newRoom.capacity,
      }]);
    }

    setRoomName("");
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedRooms: Room[] = [];
        const supabasePayloads: any[] = [];

        data.forEach((row) => {
          // Lecture flexible de n'importe quelle colonne de salle
          const keys = Object.keys(row);
          const nameKey = keys.find(k => /salle|nom|local/i.test(k)) || keys[0];
          const typeKey = keys.find(k => /type|cat/i.test(k));
          const capKey = keys.find(k => /capa|place|effect/i.test(k));

          const rawName = row[nameKey];
          const rawType = typeKey ? row[typeKey] : "Standard";
          const rawCapacity = capKey ? row[capKey] : 50;

          if (rawName) {
            const id = crypto.randomUUID();
            const cleanName = String(rawName).trim();
            const cleanType = String(rawType).trim();
            const cleanCap = parseSafeNumber(rawCapacity, 50);

            importedRooms.push({
              id,
              name: cleanName,
              type: cleanType,
              capacity: cleanCap,
            });

            supabasePayloads.push({
              id,
              name: cleanName,
              type: cleanType.toLowerCase(),
              capacity: cleanCap,
            });
          }
        });

        if (importedRooms.length === 0) {
          alert("Fichier vide ou illisible.");
          return;
        }

        const merged = [...importedRooms, ...rooms];
        setRooms(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        if (supabase) {
          const { error } = await supabase.from("rooms").insert(supabasePayloads);
          if (error) {
            alert(`Erreur Supabase : ${error.message}`);
          } else {
            alert(`${importedRooms.length} salle(s) insérée(s) dans Supabase !`);
          }
        }

        setInsertMode("manual");
      } catch (err: any) {
        alert(`Erreur lecture fichier : ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDeleteRoom = async (id: string) => {
    const filtered = rooms.filter((r) => r.id !== id);
    setRooms(filtered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    if (supabase) {
      await supabase.from("rooms").delete().eq("id", id);
    }
  };

  const handleResetRooms = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setRooms([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

    if (supabase) {
      await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
  };

  if (!isMounted) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <DashboardHeader title="Salles Physiques" description="Configurez les locaux." />
        <div className="p-8 text-xs text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader title="Salles Physiques" description="Configurez les locaux et infrastructures de votre établissement." />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold text-slate-700">Locaux</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetRooms}
                  className="h-7 text-[10px] text-rose-500 border border-rose-200 hover:bg-rose-50 px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="size-3" /> Réinitialiser
                </button>

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
                    <Button variant="ghost" size="icon" className="text-destructive cursor-pointer" onClick={() => handleDeleteRoom(r.id)}><Trash2 className="size-4" /></Button>
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