"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, RotateCcw, Home } from "lucide-react";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("Salle Standard");
  const [capacity, setCapacity] = useState(50);

  useEffect(() => {
    const saved = localStorage.getItem("edutime_rooms");
    if (saved) {
      try {
        setRooms(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveRooms = (data: Room[]) => {
    setRooms(data);
    localStorage.setItem("edutime_rooms", JSON.stringify(data));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newRoom: Room = {
      id: Date.now().toString(),
      name,
      type,
      capacity,
    };
    saveRooms([...rooms, newRoom]);
    setName("");
  };

  const handleDelete = (id: string) => {
    saveRooms(rooms.filter((r) => r.id !== id));
  };

  const handleReset = () => {
    if (
      confirm(
        "Attention : Voulez-vous vraiment réinitialiser toute la liste des salles ?"
      )
    ) {
      localStorage.removeItem("edutime_rooms");
      localStorage.removeItem("rooms");
      setRooms([]);
      window.location.reload();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🏛️ Salles Physiques
          </h1>
          <p className="text-sm text-slate-400">
            Configurez les locaux et infrastructures de votre établissement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Locaux</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nom / Numéro de salle
              </label>
              <input
                type="text"
                placeholder="Ex: Salle 12, Labo Chimie"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Type de local
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Salle Standard">Salle Standard</option>
                <option value="Laboratoire">Laboratoire</option>
                <option value="Salle Informatique">Salle Informatique</option>
                <option value="Terrain de Sport">Terrain de Sport</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Capacité d'accueil
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Enregistrer le local
            </button>
          </form>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Salles Configuées ({rooms.length})
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 rounded-lg bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{r.name}</p>
                    <p className="text-xs text-slate-400">
                      {r.type} • Max {r.capacity} places
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {rooms.length === 0 && (
              <p className="text-xs text-slate-500 col-span-2 text-center py-6">
                Aucune salle configurée.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}