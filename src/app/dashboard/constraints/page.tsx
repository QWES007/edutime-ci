"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardHeader } from '@/components/layout/dashboard-sidebar';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Check, 
  Clock, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Layers, 
  Calendar, 
  Sun, 
  Moon,
  AlertCircle
} from 'lucide-react';

export type Level = 
  | '6ème' | '5ème' | '4ème' | '3ème'
  | '2nde A' | '2nde C'
  | '1ère A' | '1ère D' | '1ère C'
  | 'Tle A' | 'Tle D' | 'Tle C';

export type DayOfWeek = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';

export interface LevelConstraint {
  level: Level;
  epsAllowedSlots: string[];
  maxHoursPerDay: number;
  maxHoursPerSubjectPerDay: number;
  blockPreferredSubjects: string[];
  svtPc1h30Rule: boolean;
  restPeriods: string[];
  doubleVacationPattern: {
    enabled: boolean;
    vagueAMorningDays: DayOfWeek[];
    vagueBMorningDays: DayOfWeek[];
  };
}

export type LevelConstraintsMap = Record<Level, LevelConstraint>;

export const ALL_LEVELS: Level[] = [
  '6ème', '5ème', '4ème', '3ème',
  '2nde A', '2nde C',
  '1ère A', '1ère D', '1ère C',
  'Tle A', 'Tle D', 'Tle C'
];

export const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export const TIME_SLOTS = [
  { id: 'M1', name: '07h00 - 08h00' },
  { id: 'M2', name: '08h00 - 09h00' },
  { id: 'M3', name: '09h00 - 10h00' },
  { id: 'M4', name: '10h00 - 11h00' },
  { id: 'M5', name: '11h00 - 12h00' },
  { id: 'A1', name: '13h00 - 14h00' },
  { id: 'A2', name: '14h00 - 15h00' },
  { id: 'A3', name: '15h00 - 16h00' },
  { id: 'A4', name: '16h00 - 17h00' },
  { id: 'A5', name: '17h00 - 18h00' },
];

export const DEFAULT_SUBJECTS = [
  { id: 'MATHS', name: 'Mathématiques' },
  { id: 'PC', name: 'Physique-Chimie' },
  { id: 'SVT', name: 'SVT' },
  { id: 'FR', name: 'Français & Littérature' },
  { id: 'PHILO', name: 'Philosophie' },
  { id: 'ANG', name: 'Anglais' },
  { id: 'LV2', name: 'LV2 (Espagnol / Allemand)' },
  { id: 'HG', name: 'Histoire-Géographie' },
  { id: 'ARTS', name: 'Arts Plastiques ou Musique' },
  { id: 'EDHC', name: 'EDHC' },
  { id: 'EPS', name: 'EPS' },
  { id: 'TICE', name: 'TICE (Informatique)' },
];

export const DEFAULT_LEVEL_CONSTRAINTS: LevelConstraintsMap = ALL_LEVELS.reduce((acc, level) => {
  const isFirstCycle = ['6ème', '5ème', '4ème', '3ème'].includes(level);
  const isSvtPc1h30Level = ['6ème', '5ème', '4ème'].includes(level);

  acc[level] = {
    level,
    epsAllowedSlots: isFirstCycle ? ['M1', 'M2', 'M3'] : ['A2', 'A3', 'A4', 'A5'],
    maxHoursPerDay: 8,
    maxHoursPerSubjectPerDay: 2,
    blockPreferredSubjects: ['MATHS', 'PC', 'FR', 'SVT', 'PHILO', 'EPS'],
    svtPc1h30Rule: isSvtPc1h30Level,
    restPeriods: ['Mercredi-Après-midi', 'Samedi-Après-midi'],
    doubleVacationPattern: {
      enabled: true,
      vagueAMorningDays: ['Lundi', 'Mercredi', 'Vendredi'],
      vagueBMorningDays: ['Mardi', 'Jeudi']
    }
  };
  return acc;
}, {} as LevelConstraintsMap);

const STORAGE_KEY = "edutime_level_constraints_v1";

export default function ConstraintsPage() {
  const supabase = createClient();
  const [constraintsMap, setConstraintsMap] = useState<LevelConstraintsMap>(DEFAULT_LEVEL_CONSTRAINTS);
  const [selectedLevel, setSelectedLevel] = useState<Level>('6ème');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadConstraints = async () => {
      let loaded = null;
      if (supabase) {
        try {
          const { data } = await supabase.from("level_constraints").select("constraints_json").maybeSingle();
          if (data && data.constraints_json) loaded = data.constraints_json;
        } catch (e) {
          console.error("Erreur chargement contraintes Supabase:", e);
        }
      }

      if (!loaded && typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try { loaded = JSON.parse(saved); } catch (e) {}
        }
      }

      if (loaded) {
        setConstraintsMap({ ...DEFAULT_LEVEL_CONSTRAINTS, ...loaded });
      }
    };

    loadConstraints();
  }, []);

  const currentConstraint = constraintsMap[selectedLevel] || DEFAULT_LEVEL_CONSTRAINTS[selectedLevel];

  const updateCurrentConstraint = (field: keyof LevelConstraint, value: any) => {
    setConstraintsMap(prev => ({
      ...prev,
      [selectedLevel]: {
        ...prev[selectedLevel],
        [field]: value
      }
    }));
  };

  const toggleEpsSlot = (slotId: string) => {
    const currentSlots = currentConstraint.epsAllowedSlots || [];
    const newSlots = currentSlots.includes(slotId)
      ? currentSlots.filter(id => id !== slotId)
      : [...currentSlots, slotId];
    updateCurrentConstraint('epsAllowedSlots', newSlots);
  };

  const togglePreferredSubject = (subId: string) => {
    const currentSubs = currentConstraint.blockPreferredSubjects || [];
    const newSubs = currentSubs.includes(subId)
      ? currentSubs.filter(id => id !== subId)
      : [...currentSubs, subId];
    updateCurrentConstraint('blockPreferredSubjects', newSubs);
  };

  const toggleRestPeriod = (periodKey: string) => {
    const currentPeriods = currentConstraint.restPeriods || [];
    const newPeriods = currentPeriods.includes(periodKey)
      ? currentPeriods.filter(k => k !== periodKey)
      : [...currentPeriods, periodKey];
    updateCurrentConstraint('restPeriods', newPeriods);
  };

  const toggleDoubleVacationDay = (vague: 'A' | 'B', day: DayOfWeek) => {
    const pattern = currentConstraint.doubleVacationPattern || {
      enabled: true,
      vagueAMorningDays: ['Lundi', 'Mercredi', 'Vendredi'],
      vagueBMorningDays: ['Mardi', 'Jeudi']
    };

    if (vague === 'A') {
      const currentDays = pattern.vagueAMorningDays || [];
      const newDays = currentDays.includes(day) ? currentDays.filter(d => d !== day) : [...currentDays, day];
      updateCurrentConstraint('doubleVacationPattern', { ...pattern, vagueAMorningDays: newDays });
    } else {
      const currentDays = pattern.vagueBMorningDays || [];
      const newDays = currentDays.includes(day) ? currentDays.filter(d => d !== day) : [...currentDays, day];
      updateCurrentConstraint('doubleVacationPattern', { ...pattern, vagueBMorningDays: newDays });
    }
  };

  const copyToCycle = () => {
    const isFirstCycle = ['6ème', '5ème', '4ème', '3ème'].includes(selectedLevel);
    const targetLevels = isFirstCycle 
      ? ['6ème', '5ème', '4ème', '3ème'] as Level[]
      : ['2nde A', '2nde C', '1ère A', '1ère D', '1ère C', 'Tle A', 'Tle D', 'Tle C'] as Level[];

    setConstraintsMap(prev => {
      const updated = { ...prev };
      const sourceConfig = prev[selectedLevel];
      targetLevels.forEach(lvl => {
        updated[lvl] = { ...sourceConfig, level: lvl };
      });
      return updated;
    });

    setStatusMessage({
      type: 'success',
      text: `Configuration de ${selectedLevel} appliquée à tous les niveaux du ${isFirstCycle ? '1er cycle (Collège)' : '2nd cycle (Lycée)'}.`
    });
  };

  const handleResetDefaults = () => {
    setConstraintsMap(DEFAULT_LEVEL_CONSTRAINTS);
    setStatusMessage({
      type: 'success',
      text: 'Toutes les contraintes ont été réinitialisées aux valeurs MENA par défaut.'
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(constraintsMap));

    if (supabase) {
      try {
        const { data: user } = await supabase.auth.getUser();
        const schoolId = user.user?.id;

        const { error } = await supabase.from("level_constraints").upsert({
          school_id: schoolId,
          constraints_json: constraintsMap,
          updated_at: new Date().toISOString()
        });

        if (error) throw error;

        setStatusMessage({
          type: 'success',
          text: 'Les contraintes par niveau ont été enregistrées avec succès dans Supabase.'
        });
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Enregistré localement. (Note Supabase : ${err?.message || 'table non disponible'})`
        });
      }
    }

    setIsSaving(false);
  };

  const isCollege = ['6ème', '5ème', '4ème', '3ème'].includes(selectedLevel);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <DashboardHeader
        title="Règles & Contraintes Dynamiques par Niveau"
        description="Personnalisez les règles MENA, plages horaires EPS, créneaux SVT/PC et vagues de double vacation."
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gestion des Règles Établissement</h2>
            <p className="text-xs text-slate-400">Configurez finement chaque niveau de la 6ème à la Terminale</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser MENA
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Enregistrer dans Supabase
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <p className="text-xs font-medium">{statusMessage.text}</p>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-semibold underline cursor-pointer">Fermer</button>
        </div>
      )}

      {/* Selector Tabs */}
      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            SÉLECTIONNER LE NIVEAU À CONFIGURER
          </h2>
          <button
            onClick={copyToCycle}
            className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Appliquer à tout le {isCollege ? '1er Cycle (Collège)' : '2nd Cycle (Lycée)'}
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {ALL_LEVELS.map(level => {
            const isSelected = selectedLevel === level;
            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all border text-center cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg scale-105'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Horaires EPS */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Plages Autorisées pour l&apos;EPS</h3>
                <p className="text-[11px] text-slate-400">Créneaux horaires autorisés pour la {selectedLevel}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
              {currentConstraint.epsAllowedSlots.length} créneaux
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-300">Créneaux de Matinée (07h00 - 12h00)</p>
            <div className="grid grid-cols-5 gap-2">
              {TIME_SLOTS.slice(0, 5).map(slot => {
                const isAllowed = currentConstraint.epsAllowedSlots.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggleEpsSlot(slot.id)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      isAllowed
                        ? 'bg-rose-600 text-white border-rose-500 font-bold'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs">{slot.id}</div>
                    <div className="text-[9px] opacity-80">{slot.name.split(' - ')[0]}</div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-semibold text-slate-300 pt-2">Créneaux d&apos;Après-Midi (13h00 - 18h00)</p>
            <div className="grid grid-cols-5 gap-2">
              {TIME_SLOTS.slice(5, 10).map(slot => {
                const isAllowed = currentConstraint.epsAllowedSlots.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggleEpsSlot(slot.id)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      isAllowed
                        ? 'bg-rose-600 text-white border-rose-500 font-bold'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs">{slot.id}</div>
                    <div className="text-[9px] opacity-80">{slot.name.split(' - ')[0]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Règle Découpage SVT/PC 1h30
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                SVT et PC planifiés en blocs de 1h30 (2 créneaux, comptés 1.5h)
              </p>
            </div>
            <input
              type="checkbox"
              checked={currentConstraint.svtPc1h30Rule}
              onChange={(e) => updateCurrentConstraint('svtPc1h30Rule', e.target.checked)}
              className="size-5 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Card 2: Charge & Blocs de 2h */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Volume Horaire & Cours Jumelés</h3>
              <p className="text-[11px] text-slate-400">Plafonds quotidiens et matières priorisées en 2h</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Max Heures / Jour (Classe)</label>
              <input
                type="number"
                min={4} max={10}
                value={currentConstraint.maxHoursPerDay}
                onChange={(e) => updateCurrentConstraint('maxHoursPerDay', parseInt(e.target.value) || 8)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Max Heures / Matière / Jour</label>
              <input
                type="number"
                min={1} max={4}
                value={currentConstraint.maxHoursPerSubjectPerDay}
                onChange={(e) => updateCurrentConstraint('maxHoursPerSubjectPerDay', parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <p className="text-xs font-semibold text-slate-300">Matières priorisées en Blocs de 2 heures (&quot;Cours Jumelés&quot;)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEFAULT_SUBJECTS.map(sub => {
                const isPreferred = currentConstraint.blockPreferredSubjects.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => togglePreferredSubject(sub.id)}
                    className={`py-2 px-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isPreferred
                        ? 'bg-blue-950/40 border-blue-500/50 text-blue-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate">{sub.name}</span>
                    {isPreferred && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Périodes de Repos */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Périodes de Repos Générales</h3>
              <p className="text-[11px] text-slate-400">Demi-journées bloquées (ex: Mercredi après-midi réservé MENA)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'Mercredi-Après-midi', label: 'Mercredi Après-midi' },
              { id: 'Samedi-Après-midi', label: 'Samedi Après-midi' },
              { id: 'Samedi-Matin', label: 'Samedi Matin' },
              { id: 'Vendredi-Après-midi', label: 'Vendredi Après-midi' },
            ].map(period => {
              const isBlocked = currentConstraint.restPeriods?.includes(period.id);
              return (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => toggleRestPeriod(period.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isBlocked
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <span>{period.label}</span>
                  {isBlocked && <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 4: Patterns Double Vacation */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pattern Double Vacation (Vagues)</h3>
                <p className="text-[11px] text-slate-400">Rotation Matin / Après-midi pour Vague A et B</p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={currentConstraint.doubleVacationPattern?.enabled ?? true}
              onChange={(e) => {
                const pattern = currentConstraint.doubleVacationPattern || {
                  enabled: true,
                  vagueAMorningDays: ['Lundi', 'Mercredi', 'Vendredi'],
                  vagueBMorningDays: ['Mardi', 'Jeudi']
                };
                updateCurrentConstraint('doubleVacationPattern', { ...pattern, enabled: e.target.checked });
              }}
              className="size-5 accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" />
                Vague A - Jours de cours le MATIN (Après-midi bloqué)
              </p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => {
                  const isAMorning = currentConstraint.doubleVacationPattern?.vagueAMorningDays?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDoubleVacationDay('A', day)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        isAMorning
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" />
                Vague B - Jours de cours le MATIN (Après-midi bloqué)
              </p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => {
                  const isBMorning = currentConstraint.doubleVacationPattern?.vagueBMorningDays?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDoubleVacationDay('B', day)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        isBMorning
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}