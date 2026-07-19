"use client";

import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Plus, Trash2 } from "lucide-react";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

const SEED_ROOMS: Room[] = [
  { id: "r1", name: "Salle 01", type: "Standard", capacity: 50 },
  { id: "r2", name: "Labo Physique", type: "Laboratoire", capacity: 40 },
];

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("Standard");
  const [capacity, setCapacity] = useState(50);

  useEffect(() => {
    const saved = localStorage.getItem("edutime_rooms_live");
    if (saved) {
      setRooms(JSON.parse(saved));
    } else {
      setRooms(SEED_ROOMS);
    }
  }, []);

  const saveRooms = (updated: Room[]) => {
    setRooms(updated);
    localStorage.setItem("edutime_rooms_live", JSON.stringify(updated));
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    const newRoom: Room = {
      id: `r_${Date.now()}`,
      name: roomName,
      type: roomType,
      capacity: Number(capacity),
    };

    const updated = [newRoom, ...rooms];
    saveRooms(updated);
    setRoomName("");
  };

  const handleDeleteRoom = (id: string) => {
    if (window.confirm("Supprimer cette salle physique ?")) {
      const updated = rooms.filter((r) => r.id !== id);
      saveRooms(updated);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardHeader
        title="Salles Physiques"
        description="Configurez les locaux et infrastructures de votre établissement."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Ajouter un local
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRoom} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Nom / Numéro de salle</Label>
                <Input
                  id="roomName"
                  placeholder="Ex: Bâtiment A - Salle 4"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomType">Type de local</Label>
                <select
                  id="roomType"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Standard">Salle Standard</option>
                  <option value="Laboratoire">Laboratoire / Sciences</option>
                  <option value="Informatique">Salle Informatique</option>
                  <option value="Terrain">Terrain de Sport</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité d&apos;accueil</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2">
                <Plus className="size-4" /> Enregistrer le local
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center bg-card">
              <p className="text-muted-foreground">Aucun local enregistré.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rooms.map((r) => (
                <Card key={r.id} className="shadow-xs">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                        <Home className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-card-foreground">{r.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          {r.type} · Max {r.capacity} places
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/15"
                      onClick={() => handleDeleteRoom(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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