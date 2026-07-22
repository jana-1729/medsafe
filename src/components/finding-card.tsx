import { TriangleAlert, AlertCircle, Info, Layers, Copy, ArrowRight } from "lucide-react";
import type { Finding } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES = {
  danger: {
    wrap: "border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/25",
    accent: "bg-red-500",
    icon: "text-red-600 dark:text-red-400",
    pill: "bg-red-600 text-white",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/25",
    accent: "bg-amber-500",
    icon: "text-amber-600 dark:text-amber-400",
    pill: "bg-amber-500 text-white",
  },
  info: {
    wrap: "border-border bg-background",
    accent: "bg-muted-foreground/30",
    icon: "text-muted-foreground",
    pill: "bg-muted text-muted-foreground",
  },
} as const;

const KIND_ICON = {
  interaction: TriangleAlert,
  duplicate: Copy,
  redundant: Layers,
  unmapped: Info,
} as const;

const SEVERITY_TEXT = {
  danger: "High risk",
  warning: "Worth checking",
  info: "For awareness",
} as const;

/** One safety finding rendered as a color-coded card. */
export function FindingCard({ finding }: { finding: Finding }) {
  const s = STYLES[finding.severity];
  const Icon = KIND_ICON[finding.kind] ?? AlertCircle;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 pl-5 transition-all hover:shadow-sm",
        "animate-in fade-in slide-in-from-bottom-1 duration-300",
        s.wrap,
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1.5", s.accent)} />
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", s.icon)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                s.pill,
              )}
            >
              {SEVERITY_TEXT[finding.severity]}
            </span>
            <h3 className="font-semibold leading-tight tracking-tight">
              {finding.title}
            </h3>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            {finding.detail}
          </p>

          <div className="mt-3 flex items-start gap-2 rounded-lg border bg-background/60 px-3 py-2 text-sm">
            <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-foreground/80">
              <span className="font-medium text-foreground">What to do: </span>
              {finding.advice}
            </span>
          </div>

          {finding.medNames.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {finding.medNames.map((n, i) => (
                <Badge
                  key={`${finding.id}-${i}`}
                  variant="secondary"
                  className="font-normal"
                >
                  {n}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
