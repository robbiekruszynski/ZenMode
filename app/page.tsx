import { TopBar } from "./top-bar";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <TopBar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-8 px-6 pt-24 pb-12">
        <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">
          Zen<span className="text-accent">Mode</span>
        </h1>
        <div className="flex w-full max-w-xl items-center gap-3">
          <input
            type="url"
            placeholder="enter url"
            aria-label="Website URL"
            className="h-12 min-w-0 flex-1 rounded-full border border-border bg-surface px-5 text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent"
          />
          <button
            type="button"
            className="h-12 shrink-0 rounded-full bg-accent px-8 font-medium text-accent-foreground transition-opacity hover:opacity-85"
          >
            Button
          </button>
        </div>
        <section className="flex min-h-[70vh] w-full items-center justify-center rounded-2xl border border-border bg-surface">
          <p className="text-muted">Website will render here</p>
        </section>
      </main>
    </div>
  );
}
