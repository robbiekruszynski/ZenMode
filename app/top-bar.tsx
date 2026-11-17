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
            className="relative w-full max-w-lg rounded-2xl border border-accent/40 bg-background/85 p-8 shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setAboutOpen(false)}
              className="absolute top-4 right-4 text-muted transition-colors hover:text-accent"
            >
              ✕
            </button>
            <h2 id="about-title" className="mb-4 text-2xl font-semibold">
              About <span className="text-accent">ZenMode</span>
            </h2>
            <p className="leading-7 text-muted">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
