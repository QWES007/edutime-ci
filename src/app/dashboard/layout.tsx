import DashboardSidebar from "@/components/layout/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar fixe et compacte */}
      <DashboardSidebar />

      {/* Zone de contenu principal */}
      <main className="flex-1 overflow-y-auto p-6 bg-[#090d16]">
        {children}
      </main>
    </div>
  );
}