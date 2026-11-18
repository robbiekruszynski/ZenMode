import { Brief } from "./brief";
import { TopBar } from "./top-bar";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <TopBar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-8 px-6 pt-24 pb-12">
        <h1 className="zen-title py-2 text-5xl sm:text-7xl">
          ZenMode
        </h1>
        <Brief />
      </main>
    </div>
  );
}
