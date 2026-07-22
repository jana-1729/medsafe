"use client";

import { Pill, X, User, Hospital, UserRound, FlaskConical } from "lucide-react";
import type { Medication, MedSource } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SourceBadge({ med }: { med: Medication }) {
  if (med.sourceType === "demo") {
    return (
      <Badge className="border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
        {med.sourceLabel}
      </Badge>
    );
  }
  if (med.sourceType === "otc") {
    return (
      <Badge className="border-sky-300 bg-sky-100 text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
        {med.sourceLabel}
      </Badge>
    );
  }
  return <Badge variant="outline">{med.sourceLabel}</Badge>;
}

function MedRow({
  med,
  onRemove,
}: {
  med: Medication;
  onRemove?: (id: string) => void;
}) {
  const stopped = (med.status || "").toLowerCase() === "stopped";
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          med.sourceType === "otc"
            ? "bg-sky-100 dark:bg-sky-950/60"
            : med.sourceType === "demo"
              ? "bg-amber-100 dark:bg-amber-950/60"
              : "bg-muted",
        )}
      >
        <Pill className="size-4 text-foreground/70" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate font-medium",
              stopped && "line-through opacity-60",
            )}
          >
            {med.name}
          </span>
          {med.occurrences > 1 ? (
            <Badge variant="secondary" className="shrink-0 font-normal tabular-nums">
              ×{med.occurrences}
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="size-3" />
            {med.prescriber || "Unknown prescriber"}
          </span>
          {med.date ? <span>· {med.date.slice(0, 10)}</span> : null}
          {med.rxnorm ? (
            <span className="font-mono">· rxnorm {med.rxnorm}</span>
          ) : null}
        </div>
      </div>

      <SourceBadge med={med} />

      {onRemove && med.sourceType === "otc" ? (
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-muted-foreground"
          onClick={() => onRemove(med.id)}
          aria-label={`Remove ${med.name}`}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </li>
  );
}

const GROUPS: { type: MedSource; label: string; icon: typeof Hospital }[] = [
  { type: "connected", label: "From your records", icon: Hospital },
  { type: "otc", label: "Self-reported", icon: UserRound },
  { type: "demo", label: "Demo scenario", icon: FlaskConical },
];

/** The unified medication list, grouped connected → self-reported → demo. */
export function MedList({
  meds,
  onRemoveOtc,
}: {
  meds: Medication[];
  onRemoveOtc?: (id: string) => void;
}) {
  if (meds.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No medications yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {GROUPS.map((g) => {
        const items = meds.filter((m) => m.sourceType === g.type);
        if (items.length === 0) return null;
        return (
          <div key={g.type}>
            <div className="mb-1 flex items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground">
              <g.icon className="size-3.5" />
              {g.label}
              <span className="tabular-nums">({items.length})</span>
            </div>
            <ul>
              {items.map((m) => (
                <MedRow key={m.id} med={m} onRemove={onRemoveOtc} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
