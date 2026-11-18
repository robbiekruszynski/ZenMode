"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function TopBar() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!aboutOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAboutOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aboutOpen]);

  const isDark = theme === "dark";

  return (
    <>
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          About
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={!isDark}
          aria-label="Toggle light mode"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="relative h-7 w-12 rounded-full border border-border bg-surface transition-colors"
        >
          <span
            className={`absolute top-0.5 left-0.5 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-accent text-[11px] text-accent-foreground transition-transform ${
              isDark ? "translate-x-0" : "translate-x-5"
            }`}
          >
            {isDark ? "☾" : "☀"}
          </span>
        </button>
      </div>

      {aboutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setAboutOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-accent/40 bg-background/85 p-8 shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setAboutOpen(false)}
              className="absolute top-4 right-4 text-muted transition-colors hover:text-accent"
            >
              ✕
            </button>
            <h2 id="about-title" className="zen-title mb-6 py-1 text-center text-3xl">
              About
            </h2>
            <div className="space-y-4 leading-7 text-muted">
              <p>
                Paste any URL and ZenMode fetches the live page through
                ZenRows. ZenRows renders the JavaScript, rotates proxies, and
                gets past anti-bot systems like Cloudflare and DataDome. What
                comes back is clean markdown, ready for an LLM to read.
              </p>
              <p>
                This demo uses Claude to turn that markdown into a short brief,
                but the output works with any LLM. ZenRows has official
                integrations for Claude and OpenAI, plus frameworks like
                LangChain, LlamaIndex, CrewAI and the Vercel AI SDK, so it fits
                whatever stack you already use.
              </p>
              <p>
                Try the toggle. With ZenRows off, ZenMode sends a plain request
                like a basic script would, and protected sites block it. Turn
                ZenRows on and the same request gets through.
              </p>
            </div>
            <h3 className="mt-6 mb-3 font-semibold text-foreground">
              How it works
            </h3>
            <ol className="list-decimal space-y-1 pl-5 leading-7 text-muted marker:text-accent">
              <li>You enter a URL.</li>
              <li>
                A server route calls the ZenRows Universal Scraper API, or a
                plain fetch if the toggle is off.
              </li>
              <li>ZenRows returns the page as markdown.</li>
              <li>Claude summarizes it. Any LLM would work here.</li>
              <li>You see both side by side.</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
