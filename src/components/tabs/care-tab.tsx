import {
  Syringe,
  ScanSearch,
  Activity,
  CircleAlert,
  CircleCheck,
  ShieldCheck,
} from "lucide-react";
import type { CareGap, CareCategory } from "@/lib/types";
import { summarizeCare } from "@/lib/care-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<CareCategory, typeof Activity> = {
  Vaccine: Syringe,
  Screening: ScanSearch,
  Monitoring: Activity,
};

function CareCard({ gap }: { gap: CareGap }) {
  const overdue = gap.status === "overdue";
  const Icon = CATEGORY_ICON[gap.category];
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-1 rounded-2xl border p-4 duration-300",
        overdue
          ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/25"
          : "bg-background",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            overdue
              ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
          )}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {gap.category}
            </Badge>
            <h3 className="font-semibold leading-tight">{gap.title}</h3>
            <span
              className={cn(
                "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                overdue
                  ? "bg-amber-500 text-white"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
              )}
            >
              {overdue ? (
                <CircleAlert className="size-3" />
              ) : (
                <CircleCheck className="size-3" />
              )}
              {overdue ? "Overdue" : "Up to date"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-foreground/80">{gap.detail}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{gap.reason}</p>
          {overdue ? (
            <div className="mt-2 rounded-lg border bg-background/60 px-3 py-1.5 text-sm text-foreground/80">
              <span className="font-medium text-foreground">Next step: </span>
              {gap.advice}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Prevention tab — screening / vaccine / monitoring gaps from guidelines. */
export function CareTab({ gaps }: { gaps: CareGap[] }) {
  if (gaps.length === 0) {
    return (
      <div className="rounded-2xl border bg-background p-10 text-center">
        <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-medium">Nothing to evaluate yet</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          We couldn&apos;t derive preventive recommendations from your record.
        </p>
      </div>
    );
  }

  const summary = summarizeCare(gaps);
  const overdue = gaps.filter((g) => g.status === "overdue");
  const upToDate = gaps.filter((g) => g.status === "up-to-date");

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl border p-4",
          summary.overdue > 0
            ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/25"
            : "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/25",
        )}
      >
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            summary.overdue > 0
              ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
          )}
        >
          {summary.overdue > 0 ? (
            <CircleAlert className="size-6" />
          ) : (
            <ShieldCheck className="size-6" />
          )}
        </div>
        <div>
          <h2 className="font-semibold leading-tight">
            {summary.overdue > 0
              ? `${summary.overdue} preventive item${summary.overdue === 1 ? "" : "s"} may be overdue`
              : "You're up to date on the basics"}
          </h2>
          <p className="mt-0.5 text-sm text-foreground/70">
            Checked {summary.total} common screening, vaccine, and monitoring
            recommendations against your record.
          </p>
        </div>
      </div>

      {overdue.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Worth asking about ({overdue.length})
          </h2>
          <div className="space-y-3">
            {overdue.map((g) => (
              <CareCard key={g.id} gap={g} />
            ))}
          </div>
        </section>
      ) : null}

      {upToDate.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Up to date ({upToDate.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upToDate.map((g) => (
              <CareCard key={g.id} gap={g} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        A demonstration subset of common guidelines — not complete or
        personalized. Confirm what applies to you with your doctor.
      </p>
    </div>
  );
}
