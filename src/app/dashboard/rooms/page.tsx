"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Plus, Trash2, FileSpreadsheet, Upload, Edit2 } from "lucide-react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("Standard");
  const [capacity, setCapacity] = useState(50);
  const [insertMode, setInsertMode] = useState<"manual" | "excel">("manual");
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadRooms = async () => {
    let loaded: Room[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from("rooms").select("*");
        if (!error && data && data.length > 0) {
          loaded = data.map((r: any) => ({
            id: r.id,
            name: r.name,
            type: r.type || "Standard",
            capacity: Number(r.capacity || 50),
          }));
        }
      } catch (err) {
        console.error("Erreur chargement salles :", err);
      }
    }

    if (loaded.length === 0 && typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { loaded = JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }

    setRooms(loaded);
  };

  useEffect(() => {
    setIsMounted(true);
    loadRooms();
  }, []);

  const handleSelectRoomForEdit = (room: Room) => {
    setEditingId(room.id);
    setRoomName(room.name);
    setRoomType(room.type);
    setCapacity(room.capacity);
    setInsertMode("manual");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setRoomName("");
    setRoomType("Standard");
    setCapacity(50);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsSaving(true);
    const targetId = editingId || crypto.randomUUID();

    const payload = {
      id: targetId,
      name: roomName.trim(),
      type: roomType.toLowerCase(),
      capacity: parseSafeNumber(capacity, 50),
    };

    // Mise à jour locale immédiate
    const updated = editingId
      ? rooms.map((r) => (r.id === editingId ? { ...r, name: payload.name, type: payload.type, capacity: payload.capacity } : r))
      : [{ id: payload.id, name: payload.name, type: payload.type, capacity: payload.capacity }, ...rooms];

    setRooms(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Upsert sécurisé dans Supabase
    if (supabase) {
      const { error } = await supabase.from("rooms").upsert(payload);
      if (error) {
        alert(`Erreur Supabase lors de la mise à jour de la salle : ${error.message}`);
      } else {
        await loadRooms();
      }
    }

    setIsSaving(false);
    handleCancelEdit();
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
          const keys = Object.keys(row);
          if (keys.length === 0) return;
          const nameKey = keys.find((k) => /salle|nom|local/i.test(k)) || keys[0];
          const typeKey = keys.find((k) => /type|cat/i.test(k));
          const capKey = keys.find((k) => /capa|place|effect/i.test(k));

          const rawName = row[nameKey];
          const rawType = typeKey ? row[typeKey] : "Standard";
          const rawCapacity = capKey ? row[capKey] : 50;

          if (rawName) {
            const id = crypto.randomUUID();
            const cleanName = String(rawName).trim();
            const cleanType = String(rawType).trim();
            const cleanCap = parseSafeNumber(rawCapacity, 50);

            importedRooms.push({ id, name: cleanName, type: cleanType, capacity: cleanCap });
            supabasePayloads.push({ id, name: cleanName, type: cleanType.toLowerCase(), capacity: cleanCap });
          }
        });

        if (importedRooms.length === 0) return alert("Aucune donnée lue.");

        if (supabase) {
          const { error } = await supabase.from("rooms").upsert(supabasePayloads);
          if (error) alert(`Erreur import : ${error.message}`);
          else {
            await loadRooms();
            alert(`${importedRooms.length} salle(s) insérée(s) / mises à jour !`);
          }
        }
        setInsertMode("manual");
      } catch (err: any) { alert(`Erreur : ${err.message}`); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteRoom = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = rooms.filter((r) => r.id !== id);
    setRooms(filtered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (editingId === id) handleCancelEdit();

    if (supabase) {
      await supabase.from("rooms").delete().eq("id", id);
      await loadRooms();
    }
  };

  if (!isMounted) return <div className="p-8 text-xs text-slate-400">Chargement...</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader title="Salles Physiques" description="Cliquez sur une salle pour modifier son nom, son type ou sa capacité." />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold text-slate-700">
                {editingId ? "Modifier la Salle" : "Saisie Salle"}
              </span>
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
          </CardHeader>
          <CardContent>
            {insertMode === "manual" ? (
              <form onSubmit={handleSaveRoom} className="space-y-4">
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
                    <option value="Sports">Terrain de Sport / EPS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacité d&apos;accueil</Label>
                  <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {isSaving ? "Enregistrement..." : editingId ? "Mettre à jour la salle" : "Enregistrer le local"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Annuler
                    </Button>
                  )}
                </div>
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

        {/* Liste des Salles Cliquables */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {rooms.map((r) => (
              <Card
                key={r.id}
                onClick={() => handleSelectRoomForEdit(r)}
                className={`shadow-xs cursor-pointer transition-all border ${
                  editingId === r.id ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30" : "hover:border-slate-400"
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary p-2.5 rounded-lg"><Home className="size-5" /></div>
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        {r.name}
                        <Edit2 className="size-3 text-slate-400 opacity-60" />
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-medium">{r.type} · Max {r.capacity} places</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive cursor-pointer" onClick={(e) => handleDeleteRoom(r.id, e)}>
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}