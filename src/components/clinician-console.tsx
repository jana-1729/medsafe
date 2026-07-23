"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Pill,
  TriangleAlert,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  ClipboardPlus,
  Hospital,
} from "lucide-react";
import type { Medication } from "@/lib/types";
import type { CdsCard } from "@/lib/cds";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ORDER_OPTIONS = [
  "Ibuprofen",
  "Naproxen",
  "Clopidogrel",
  "Potassium chloride",
  "Amiodarone",
  "Tramadol",
  "Metformin",
  "Sildenafil",
];

const INDICATOR = {
  critical: {
    wrap: "border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/25",
    chip: "bg-red-600 text-white",
    icon: TriangleAlert,
    iconTint: "text-red-600 dark:text-red-400",
    label: "Critical",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/25",
    chip: "bg-amber-500 text-white",
    icon: TriangleAlert,
    iconTint: "text-amber-600 dark:text-amber-400",
    label: "Warning",
  },
  info: {
    wrap: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/25",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    icon: ShieldCheck,
    iconTint: "text-emerald-600 dark:text-emerald-400",
    label: "Info",
  },
} as const;

function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) =>
        line.trim() === "" ? (
          <div key={i} className="h-1" />
        ) : (
          <p key={i}>
            {line.split(/(\*\*[^*]+\*\*)/g).map((s, j) =>
              s.startsWith("**") && s.endsWith("**") ? (
                <strong key={j}>{s.slice(2, -2)}</strong>
              ) : (
                <span key={j}>{s}</span>
              ),
            )}
          </p>
        ),
      )}
    </div>
  );
}

/** Clinician point-of-care console — simulates a CDS Hooks order-time check. */
export function ClinicianConsole({
  existing,
  demo,
}: {
  existing: Medication[];
  demo: boolean;
}) {
  const [order, setOrder] = useState("");
  const [cards, setCards] = useState<CdsCard[] | null>(null);
  const [checked, setChecked] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function check(name: string) {
    const drug = name.trim();
    if (!drug || loading) return;
    setLoading(true);
    setChecked(drug);
    try {
      const res = await fetch("/api/cds-services/medication-safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hook: "order-select",
          context: { patientId: "demo-patient", draftOrder: { name: drug } },
          prefetch: {
            medications: existing.map((m) => ({
              name: m.name,
              ingredient: m.ingredient,
              sourceLabel: m.sourceLabel,
              prescriber: m.prescriber,
            })),
          },
        }),
      });
      const data = await res.json();
      setCards(res.ok ? data.cards || [] : []);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  const sources = [...new Set(existing.map((m) => m.sourceLabel))];

  return (
    <div className="min-h-screen">
      {/* EHR-style top bar */}
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm">
              <Stethoscope className="size-[18px]" />
            </span>
            <span className="tracking-tight">MedSafe · Clinician</span>
            <Badge variant="outline" className="ml-1 font-normal">
              CDS Hooks demo
            </Badge>
          </div>
          <Button
            render={<Link href="/connected" />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Patient app</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-3">
        {/* order panel */}
        <section className="lg:col-span-2">
          <div className="mb-4 rounded-2xl border bg-background p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hospital className="size-4" />
              Patient: <span className="font-medium text-foreground">demo-patient</span>
              <span aria-hidden>·</span>
              {existing.length} medication(s) across{" "}
              {sources.length} source{sources.length === 1 ? "" : "s"}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardPlus className="size-4 text-sky-600" />
                New medication order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Order a drug — MedSafe checks it in real time against the
                patient&apos;s cross-source medications, the way a CDS Hooks card
                appears in your EHR at order entry.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ORDER_OPTIONS.map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full"
                    disabled={loading}
                    onClick={() => {
                      setOrder(d);
                      check(d);
                    }}
                  >
                    {d}
                  </Button>
                ))}
              </div>
              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  check(order);
                }}
              >
                <input
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="Or type a drug to order…"
                  className="h-10 flex-1 rounded-xl border bg-background px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                <Button type="submit" disabled={loading || !order.trim()}>
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Check order"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* CDS cards */}
          {cards ? (
            <div className="mt-4 space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">
                CDS Hooks response {checked ? `· ordering ${checked}` : ""}
              </div>
              {cards.map((c) => {
                const s = INDICATOR[c.indicator];
                const Icon = s.icon;
                return (
                  <div
                    key={c.uuid}
                    className={cn(
                      "animate-in fade-in slide-in-from-bottom-1 rounded-2xl border p-4 duration-300",
                      s.wrap,
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("mt-0.5 size-5 shrink-0", s.iconTint)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              s.chip,
                            )}
                          >
                            {s.label}
                          </span>
                          <h3 className="font-semibold leading-tight">
                            {c.summary}
                          </h3>
                        </div>
                        <div className="mt-2 text-sm text-foreground/85">
                          <Rich text={c.detail} />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Source: {c.source.label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <details className="rounded-xl border bg-muted/40 p-3 text-xs">
                <summary className="cursor-pointer font-medium text-muted-foreground">
                  View raw CDS Hooks cards (JSON)
                </summary>
                <pre className="mt-2 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify({ cards }, null, 2)}
                </pre>
              </details>
            </div>
          ) : null}
        </section>

        {/* cross-source med list */}
        <aside>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Pill className="size-4 text-muted-foreground" />
                What MedSafe sees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-xs text-muted-foreground">
                Medications assembled from every connected source — including ones
                outside your EHR.
              </p>
              {existing.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  No medications on file.
                </p>
              ) : (
                <ul className="divide-y">
                  {existing.map((m) => (
                    <li key={m.id} className="py-2">
                      <div className="text-sm font-medium leading-tight">
                        {m.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.sourceLabel}
                        {m.prescriber ? ` · ${m.prescriber}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!demo ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Tip: open{" "}
                  <Link href="/clinician?demo=1" className="underline">
                    /clinician?demo=1
                  </Link>{" "}
                  for a multi-source demo record.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </main>

      <p className="mx-auto max-w-5xl px-6 pb-10 text-center text-xs text-muted-foreground">
        Decision support delivered via CDS Hooks at order entry — not a
        substitute for clinical judgement.
      </p>
    </div>
  );
}
