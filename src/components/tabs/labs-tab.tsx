"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { FlaskConical, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LabSeries } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FLAG_COLOR: Record<LabSeries["flag"], string> = {
  high: "#ef4444",
  low: "#f59e0b",
  normal: "#10b981",
  unknown: "#6b7280",
};

/** Thin out a dense series so the line chart stays readable (keeps first + last). */
function downsample<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

function FlagBadge({ flag }: { flag: LabSeries["flag"] }) {
  if (flag === "high")
    return (
      <Badge className="border-red-300 bg-red-100 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
        Above range
      </Badge>
    );
  if (flag === "low")
    return (
      <Badge className="border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
        Below range
      </Badge>
    );
  if (flag === "normal")
    return (
      <Badge className="border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
        In range
      </Badge>
    );
  return <Badge variant="outline">No range</Badge>;
}

function TrendCard({ s }: { s: LabSeries }) {
  const color = FLAG_COLOR[s.flag];
  const data = downsample(s.points, 80);
  const gradId = `grad-${s.id}`;

  // padded y-domain that always includes the reference bounds
  const values = data.map((p) => p.value);
  const candidatesMin = [...values, ...(s.low != null ? [s.low] : [])];
  const candidatesMax = [...values, ...(s.high != null ? [s.high] : [])];
  const yMin = Math.min(...candidatesMin);
  const yMax = Math.max(...candidatesMax);
  const span = yMax - yMin || Math.abs(yMax) || 1;
  const pad = span * 0.18;
  const domain: [number, number] = [yMin - pad, yMax + pad];

  const first = s.points[0]?.value ?? s.latest;
  const delta = Math.round((s.latest - first) * 100) / 100;
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-sm">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium leading-tight" title={s.name}>
              {s.name}
            </h3>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {s.points.length} readings
              {s.latestDate ? ` · latest ${s.latestDate}` : ""}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {s.demo ? (
              <Badge variant="outline" className="text-[10px] font-normal">
                Sample
              </Badge>
            ) : null}
            <FlagBadge flag={s.flag} />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-3xl font-semibold tabular-nums" style={{ color }}>
            {s.latest}
          </span>
          {s.unit ? (
            <span className="text-sm text-muted-foreground">{s.unit}</span>
          ) : null}
          {delta !== 0 ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <DeltaIcon className="size-3" />
              {delta > 0 ? "+" : ""}
              {delta} since first
            </span>
          ) : null}
          {s.low != null || s.high != null ? (
            <span className="ml-auto text-[11px] text-muted-foreground">
              ref {s.low ?? "–"}–{s.high ?? "–"}
            </span>
          ) : null}
        </div>

        <div className="mt-3 h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis domain={domain} hide />
              {s.low != null && s.high != null ? (
                <ReferenceArea
                  y1={s.low}
                  y2={s.high}
                  fill="#10b981"
                  fillOpacity={0.09}
                  stroke="none"
                />
              ) : s.high != null ? (
                <ReferenceLine y={s.high} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
              ) : s.low != null ? (
                <ReferenceLine y={s.low} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
              ) : null}
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(value) => [`${value}${s.unit ? " " + s.unit : ""}`, s.name]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/** Labs tab — trended charts for rich series + a compact latest-results list. */
export function LabsTab({ labs }: { labs: LabSeries[] }) {
  if (labs.length === 0) {
    return (
      <div className="rounded-2xl border bg-background p-10 text-center">
        <FlaskConical className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-medium">No lab results found</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          Your connected records don&apos;t include numeric lab or vital
          measurements.
        </p>
      </div>
    );
  }

  const trended = labs.filter((s) => s.points.length >= 3).slice(0, 8);
  const flagged = labs.filter((s) => s.flag === "high" || s.flag === "low");

  return (
    <div className="space-y-6">
      {flagged.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/25">
          <span className="font-medium">{flagged.length}</span> result
          {flagged.length === 1 ? " is" : "s are"} outside the reference range —
          worth mentioning to your doctor.
        </div>
      ) : null}

      {trended.length > 0 ? (
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <TrendingUp className="size-4" />
            Trends
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {trended.map((s) => (
              <TrendCard key={s.id} s={s} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Latest results ({labs.length})
        </h2>
        <Card>
          <CardContent className="py-1">
            <ul className="divide-y">
              {labs.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      s.flag === "high" && "bg-red-500",
                      s.flag === "low" && "bg-amber-500",
                      s.flag === "normal" && "bg-emerald-500",
                      s.flag === "unknown" && "bg-muted-foreground/40",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm" title={s.name}>
                    {s.name}
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {s.latest}
                    {s.unit ? (
                      <span className="ml-1 font-normal text-muted-foreground">
                        {s.unit}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
