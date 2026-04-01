"use client";

import { AuthLocaleBar } from "@/components/auth/AuthLocaleBar";
import { useLocaleContext } from "@/components/providers/LocaleProvider";

export function HomePageClient() {
  const { messages: m } = useLocaleContext();
  const h = m.home;

  return (
    <main className="relative flex min-h-screen flex-col gap-12 bg-gradient-to-b from-slate-50 via-white to-white px-6 py-16 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <AuthLocaleBar />
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-primary">{h.badge}</p>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">{h.title}</h1>
          <p className="max-w-3xl text-base text-slate-600 dark:text-slate-300">{h.intro}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {h.sections.map((section) => (
            <div
              key={section.title}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{section.title}</p>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white/60 p-8 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-xl font-semibold">{h.quickstart}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="font-semibold text-slate-800 dark:text-slate-100">{h.installTitle}</p>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
              {h.installItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm dark:border-slate-800">
            <p className="font-semibold text-slate-800 dark:text-slate-100">{h.dbTitle}</p>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
              {h.dbItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
