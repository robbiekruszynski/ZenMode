"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { BriefResult } from "./api/brief/route";

export function Brief() {
  const [url, setUrl] = useState("");
  const [useZenRows, setUseZenRows] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BriefResult | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, useZenRows }),
      });
      setResult((await res.json()) as BriefResult);
    } catch {
      setResult({ outcome: "error", message: "Couldn't reach the server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-2xl flex-wrap items-center justify-center gap-3"
      >
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="enter url"
          aria-label="Website URL"
          className="h-12 min-w-0 flex-1 basis-64 rounded-full border border-border bg-surface px-5 text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent"
        />
        <label className="flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm select-none">
          <span className={useZenRows ? "text-accent" : "text-muted"}>
            ZenRows {useZenRows ? "on" : "off"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={useZenRows}
            aria-label="Use ZenRows"
            onClick={() => setUseZenRows((v) => !v)}
            className={`relative h-6 w-10 rounded-full transition-colors ${
              useZenRows ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
                useZenRows ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="h-12 shrink-0 rounded-full bg-accent px-8 font-medium text-accent-foreground transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Getting brief…" : "Get brief"}
        </button>
      </form>

      {result && <StatusBanner result={result} />}

      <section className="grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <Panel
          title={result?.outcome === "direct" ? "Raw page text" : "Raw markdown from ZenRows"}
          loading={loading}
          hasContent={!!result?.content}
          empty="The scraped page will appear here"
        >
          {result?.content && (
            <pre className="font-mono text-xs leading-5 whitespace-pre-wrap break-words text-muted">
              {result.content}
            </pre>
          )}
        </Panel>
        <Panel
          title="Claude's summary"
          loading={loading}
          hasContent={!!(result?.summary || result?.summaryError)}
          empty="Claude's brief will appear here"
        >
          {result?.summary && (
            <p className="leading-7 whitespace-pre-wrap">{result.summary}</p>
          )}
          {result?.summaryError && <p className="text-sm text-red-400">{result.summaryError}</p>}
        </Panel>
      </section>
    </>
  );
}

function StatusBanner({ result }: { result: BriefResult }) {
  const styles =
    result.outcome === "zenrows"
      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-500"
      : result.outcome === "direct"
        ? "border-amber-500/50 bg-amber-500/15 text-amber-500"
        : "border-red-500/50 bg-red-500/15 text-red-500";
  const icon = result.outcome === "zenrows" ? "✓" : result.outcome === "direct" ? "!" : "✕";

  return (
    <div
      role="status"
      className={`flex w-full items-center justify-center gap-3 rounded-xl border px-5 py-3 text-lg font-semibold ${styles}`}
    >
      <span aria-hidden>{icon}</span>
      {result.message}
    </div>
  );
}

function Panel({
  title,
  loading,
  hasContent,
  empty,
  children,
}: {
  title: string;
  loading: boolean;
  hasContent: boolean;
  empty: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[60vh] min-h-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <h2 className="border-b border-border px-5 py-3 text-sm font-medium text-muted">{title}</h2>
      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <p className="animate-pulse text-muted">Working…</p>
        ) : hasContent ? (
          children
        ) : (
          <p className="text-muted">{empty}</p>
        )}
      </div>
    </div>
  );
}
