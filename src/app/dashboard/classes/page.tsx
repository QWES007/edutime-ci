"use client";

import dynamic from "next/dynamic";

const ClassesContent = dynamic(() => import("./ClassesContent"), {
  ssr: false,
  loading: () => <div className="p-8 text-xs text-slate-400">Chargement...</div>,
});

export default function ClassesPage() {
  return <ClassesContent />;
}