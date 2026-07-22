"use client";

import {
  Activity,
  Stethoscope,
  Syringe,
  Scissors,
  Pill,
  FlaskConical,
  ShieldAlert,
  CalendarClock,
} from "lucide-react";
import type {
  ProblemItem,
  ImmunizationItem,
  TimelineEvent,
  TimelineKind,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-foreground/70" />
        </div>
        <div>
          <div className="text-xl font-semibold tabular-nums leading-none">
            {value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const KIND_META: Record<
  TimelineKind,
  { icon: typeof Activity; chip: string; label: string }
> = {
  encounter: {
    icon: Stethoscope,
    chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    label: "Visit",
  },
  condition: {
    icon: Activity,
    chip: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400",
    label: "Diagnosis",
  },
  immunization: {
    icon: Syringe,
    chip: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    label: "Vaccination",
  },
  procedure: {
    icon: Scissors,
    chip: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
    label: "Procedure",
  },
  medication: {
    icon: Pill,
    chip: "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
    label: "Medication",
  },
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2024-07-08" -> "Jul 8" (locale-independent). */
function monthDay(date: string): string {
  const [y, m, d] = date.split("-");
  const mi = Number(m) - 1;
  if (!y || Number.isNaN(mi) || !MONTHS_SHORT[mi]) return date;
  return `${MONTHS_SHORT[mi]} ${Number(d)}`;
}

/** Group timeline events by year, preserving newest-first order. */
function groupByYear(
  events: TimelineEvent[],
): Array<{ year: string; items: TimelineEvent[] }> {
  const groups: Array<{ year: string; items: TimelineEvent[] }> = [];
  for (const e of events) {
    const year = e.date.slice(0, 4);
    const g = groups.find((x) => x.year === year);
    if (g) g.items.push(e);
    else groups.push({ year, items: [e] });
  }
  return groups;
}

/** Overview tab — a health snapshot: problems, immunizations, and a timeline. */
export function OverviewTab({
  problems,
  immunizations,
  timeline,
  medCount,
  labCount,
}: {
  problems: ProblemItem[];
  immunizations: ImmunizationItem[];
  timeline: TimelineEvent[];
  medCount: number;
  labCount: number;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={ShieldAlert} label="Active problems" value={problems.length} />
        <StatTile icon={Pill} label="Medications" value={medCount} />
        <StatTile icon={FlaskConical} label="Lab measures" value={labCount} />
        <StatTile icon={Syringe} label="Vaccinations" value={immunizations.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="size-4 text-red-500" />
                Active problems
              </CardTitle>
            </CardHeader>
            <CardContent>
              {problems.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  No active problems on file.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {problems.map((p) => (
                    <li key={p.id}>
                      <Badge variant="secondary" className="font-normal">
                        {p.name}
                        {p.onset ? (
                          <span className="ml-1.5 text-muted-foreground">
                            {p.onset.slice(0, 4)}
                          </span>
                        ) : null}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Syringe className="size-4 text-emerald-500" />
                Immunizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {immunizations.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  No immunizations on file.
                </p>
              ) : (
                <ul className="divide-y">
                  {immunizations.map((im) => (
                    <li
                      key={im.id}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate">{im.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {im.date || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="size-4 text-muted-foreground" />
              Health timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No dated events found.
              </p>
            ) : (
              <div className="space-y-5">
                {groupByYear(timeline).map((group) => (
                  <div key={group.year}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums">
                        {group.year}
                      </span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                    <ol className="relative space-y-0.5">
                      {/* connecting rail */}
                      <span
                        aria-hidden
                        className="absolute bottom-4 left-4 top-4 w-px bg-gradient-to-b from-border via-border to-transparent"
                      />
                      {group.items.map((e) => {
                        const meta = KIND_META[e.kind];
                        const Icon = meta.icon;
                        return (
                          <li
                            key={e.id}
                            className="animate-in fade-in slide-in-from-bottom-1 relative flex gap-3 rounded-xl p-2 transition-colors duration-300 hover:bg-muted/60"
                          >
                            <span
                              className={cn(
                                "z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                                meta.chip,
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <div className="min-w-0 pt-0.5">
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="tabular-nums">{monthDay(e.date)}</span>
                                <span aria-hidden>·</span>
                                <span>{meta.label}</span>
                              </div>
                              <div className="text-sm font-medium leading-snug">
                                {e.label}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
