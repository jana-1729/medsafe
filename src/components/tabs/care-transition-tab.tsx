"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Pill,
  ClipboardList,
  TriangleAlert,
  Check,
  Plus,
  ArrowRightLeft,
  HeartPulse,
} from "lucide-react";
import type { Medication, ProblemItem, TimelineEvent } from "@/lib/types";
import { buildCareTransition } from "@/lib/care-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function MedRow({ med, started }: { med: Medication; started: boolean }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          started
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
            : "bg-muted text-foreground/70",
        )}
      >
        <Pill className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{med.name}</div>
        <div className="text-xs text-muted-foreground">
          {med.prescriber || "Unknown prescriber"} · {med.sourceLabel}
        </div>
      </div>
      {started ? (
        <Badge className="border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Plus className="size-3" />
          New
        </Badge>
      ) : (
        <Badge variant="outline">Continue</Badge>
      )}
    </li>
  );
}

/** Recovery tab — discharge companion: reconciliation, checklist, red flags. */
export function CareTransitionTab({
  timeline,
  meds,
  problems,
}: {
  timeline: TimelineEvent[];
  meds: Medication[];
  problems: ProblemItem[];
}) {
  const plan = useMemo(
    () => buildCareTransition({ timeline, meds, problems }),
    [timeline, meds, problems],
  );
  const [done, setDone] = useState<Set<string>>(new Set());

  if (!plan.hasData) {
    return (
      <div className="rounded-2xl border bg-background p-10 text-center">
        <Building2 className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-medium">No recent hospital visit found</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          This companion appears after an inpatient stay or procedure. Toggle the
          Demo scenario on the Medications tab to preview a post-discharge plan.
        </p>
      </div>
    );
  }

  const started = plan.reconciliation.filter((r) => r.status === "started");
  const continued = plan.reconciliation.filter((r) => r.status === "continued");
  const doneCount = plan.tasks.filter((t) => done.has(t.id)).length;

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* discharge header */}
      {plan.discharge ? (
        <div className="flex items-center gap-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-900/60 dark:bg-sky-950/25">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
            <HeartPulse className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight">
              Recovering from your {plan.discharge.label.toLowerCase()}
            </h1>
            <p className="mt-0.5 text-sm text-foreground/70">
              {plan.discharge.date} · Here&apos;s your plan for the days after —
              medications, follow-up, and what to watch for.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* med reconciliation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowRightLeft className="size-4 text-muted-foreground" />
              Medication reconciliation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {started.length > 0 ? (
              <>
                <div className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Start these ({started.length})
                </div>
                <ul className="divide-y">
                  {started.map((r) => (
                    <MedRow key={r.med.id} med={r.med} started />
                  ))}
                </ul>
              </>
            ) : null}
            {continued.length > 0 ? (
              <>
                <div className="mt-3 mb-1 text-xs font-medium text-muted-foreground">
                  Continue from home ({continued.length})
                </div>
                <ul className="divide-y">
                  {continued.map((r) => (
                    <MedRow key={r.med.id} med={r.med} started={false} />
                  ))}
                </ul>
              </>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              &quot;Start&quot; = added at/after this visit; &quot;Continue&quot;
              = your existing home medications. Confirm the full list with your
              pharmacist.
            </p>
          </CardContent>
        </Card>

        {/* recovery checklist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <ClipboardList className="size-4 text-muted-foreground" />
                Your recovery checklist
              </span>
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {doneCount}/{plan.tasks.length} done
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {plan.tasks.map((t) => {
                const checked = done.has(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => toggle(t.id)}
                      className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/60"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          checked
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-input",
                        )}
                      >
                        {checked ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            checked && "text-muted-foreground line-through",
                          )}
                        >
                          {t.label}
                        </span>
                        {t.detail ? (
                          <span className="block text-xs text-muted-foreground">
                            {t.detail}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* red flags */}
      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 dark:border-red-900/60 dark:bg-red-950/25">
        <div className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-red-600 dark:text-red-400" />
          <h2 className="font-semibold">When to get help</h2>
        </div>
        <p className="mt-1 text-sm text-foreground/70">
          Get medical care right away if you notice any of these after your
          visit:
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {plan.redFlags.map((f) => (
            <li key={f.id} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" />
              <span className="text-foreground/85">{f.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        A decision-support aid generated from your connected records — not a
        substitute for your discharge instructions. Follow your care team&apos;s
        guidance.
      </p>
    </div>
  );
}
