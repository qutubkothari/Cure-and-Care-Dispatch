export default function Home() {
  return (
    <div className="min-h-dvh bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="h-1 w-full bg-gradient-to-r from-brand-lemon via-brand-mint to-brand-lemon" />
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-mint text-slate-900 font-semibold">
              CC
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Cure & Care Dispatch</div>
              <div className="text-xs text-muted-foreground">
                Dispatch recording system (PWA + dashboard)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs text-muted-foreground">
              API: <span className="font-medium text-foreground">http://localhost:4000</span>
            </div>
            <button className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-muted">
              Sign in
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Today’s overview — deliveries, exceptions, petty cash, and audit signals.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Assigned" value="—" hint="Jobs scheduled today" accent="lemon" />
          <StatCard title="Delivered" value="—" hint="Completed with proof" accent="mint" />
          <StatCard title="Failed" value="—" hint="Attempted / exception" accent="lemon" />
          <StatCard title="Petty Cash" value="—" hint="Outstanding balance" accent="mint" />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Live Map (placeholder)</h2>
              <span className="text-xs text-muted-foreground">Route playback comes next</span>
            </div>
            <div className="mt-4 grid h-72 place-items-center rounded-xl border border-dashed border-border bg-surface-muted text-sm text-muted-foreground">
              Map view will show agent pins + timestamps.
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Quick Actions</h2>
            <div className="mt-4 flex flex-col gap-2">
              <ActionButton label="Create dispatch list" />
              <ActionButton label="Import CSV" />
              <ActionButton label="Issue petty cash" />
              <ActionButton label="View audit log" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string;
  hint: string;
  accent: 'lemon' | 'mint';
}) {
  const barClass = accent === 'lemon' ? 'bg-brand-lemon' : 'bg-brand-mint';
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{title}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        </div>
        <div className={`h-10 w-2 rounded-full ${barClass}`} />
      </div>
    </div>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-left text-sm font-medium hover:bg-surface-muted">
      {label}
    </button>
  );
}
