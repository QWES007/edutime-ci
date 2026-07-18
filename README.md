# Edutime CI

SaaS de génération automatique d'emplois du temps pour les collèges et lycées de Côte d'Ivoire, conforme aux horaires officiels du MENA.

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS 4, Shadcn UI
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Forms:** React Hook Form + Zod
- **PDF:** @react-pdf/renderer (étape 5)

## Démarrage rapide

```bash
# Prérequis : Node.js 20+
npm install
cp .env.example .env.local
npm run dev
```

L'application démarre en **mode mock** par défaut (`NEXT_PUBLIC_USE_MOCK_DATA=true`) — aucune configuration Supabase requise pour la démo.

Ouvrez [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
src/
├── app/
│   ├── page.tsx              # Landing page SaaS
│   ├── (auth)/login|signup   # Authentification
│   └── dashboard/            # Console admin (Censeur)
├── components/
│   ├── layout/               # Sidebar, header
│   └── ui/                   # Shadcn components
├── lib/
│   ├── constants/            # Horaires MENA, créneaux horaires
│   ├── mock/                 # Données & store en mémoire
│   ├── services/             # data-service, billing-service
│   ├── supabase/             # Client Supabase
│   ├── types/                # Types TypeScript
│   └── validations/          # Schémas Zod
supabase/
└── migrations/               # Schéma PostgreSQL + RLS
```

## Configuration Supabase (production)

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez `supabase/migrations/001_initial_schema.sql` dans l'éditeur SQL
3. Copiez l'URL et la clé anon dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_USE_MOCK_DATA=false
```

## Règles MENA intégrées

- Horaires hebdomadaires officiels par niveau (6ème → Tle A/C/D)
- Mercredi après-midi bloqué (Conseils d'Enseignement / UP)
- Samedi après-midi bloqué
- Cours jumelés pour Maths, PC et compositions de Français

## Étapes d'implémentation

- [x] **Étape 1** — Projet Next.js, Tailwind, Shadcn, shell dashboard
- [x] **Étape 2** — Schéma Supabase, types, service mock CRUD
- [ ] **Étape 3** — Algorithme de génération (`engine.ts`)
- [ ] **Étape 4** — UI interactive (enseignants, classes, grille EDT)
- [ ] **Étape 5** — Export PDF et drag-and-drop

## Licence

Propriétaire — Edutime CI © 2026
