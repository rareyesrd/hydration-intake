export default function Loading() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(103,232,249,0.22),transparent_30%),linear-gradient(135deg,#020617,#031019)]" />
      <div className="relative grid place-items-center gap-5">
        <div className="relative size-24 overflow-hidden rounded-full border border-cyan-200/20 bg-slate-900 shadow-[0_0_80px_rgba(103,232,249,0.35)]">
          <div className="absolute inset-x-0 bottom-0 h-1/2 animate-pulse bg-gradient-to-t from-cyan-400 to-emerald-200" />
        </div>
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/70">
            Preparing recovery cockpit
          </p>
          <p className="mt-3 text-2xl font-black">Performance starts with water.</p>
        </div>
      </div>
    </main>
  );
}
