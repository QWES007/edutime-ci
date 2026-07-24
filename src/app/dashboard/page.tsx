"use client";

import dynamic from "next/dynamic";

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  ssr: false,
  loading: () => <div className="p-8 text-xs text-slate-400">Chargement du tableau de bord...</div>,
});

export default function DashboardPage() {
  return <DashboardContent />;
}