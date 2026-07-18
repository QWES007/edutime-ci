export default function SuperAdminLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <section className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground">
        {children}
      </section>
    );
  }