"use client";

// MedSafe dashboard — merges connected + self-reported + demo meds, runs the safety
// engine, and presents the whole record across Overview / Medications / Labs tabs.
import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldPlus,
  ShieldCheck,
  TriangleAlert,
  Plus,
  FileText,
  Printer,
  Copy,
  LayoutDashboard,
  Pill,
  FlaskConical,
  HeartPulse,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import type {
  Medication,
  ProblemItem,
  ImmunizationItem,
  LabSeries,
  TimelineEvent,
  CareGap,
} from "@/lib/types";
import { analyze, summarize } from "@/lib/safety-engine";
import { DEMO_SCENARIO } from "@/data/demo-scenario";
import { DEMO_LABS } from "@/data/demo-labs";
import { otcToMedication, type OtcOption } from "@/data/otc";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SourceBadges } from "@/components/source-badges";
import {
  PrintSummary,
  SummaryBody,
  summaryToText,
} from "@/components/print-summary";
import { ThemeToggle } from "@/components/theme-toggle";
import { WatchtowerBell } from "@/components/watchtower-bell";
import { OverviewTab } from "@/components/tabs/overview-tab";
import { MedicationsTab } from "@/components/tabs/medications-tab";
import { LabsTab } from "@/components/tabs/labs-tab";
import { CareTab } from "@/components/tabs/care-tab";
import { CareTransitionTab } from "@/components/tabs/care-transition-tab";
import { AskTab } from "@/components/tabs/ask-tab";
import { cn } from "@/lib/utils";

export function Dashboard({
  initialMeds,
  sources,
  totalResources,
  problems,
  immunizations,
  labs,
  timeline,
  careGaps,
  initialDemo = false,
}: {
  initialMeds: Medication[];
  sources: string[];
  totalResources: number;
  problems: ProblemItem[];
  immunizations: ImmunizationItem[];
  labs: LabSeries[];
  timeline: TimelineEvent[];
  careGaps: CareGap[];
  initialDemo?: boolean;
}) {
  const [otcMeds, setOtcMeds] = useState<Medication[]>([]);
  const [demoOn, setDemoOn] = useState(initialDemo);

  const meds = useMemo(
    () => [...initialMeds, ...otcMeds, ...(demoOn ? DEMO_SCENARIO : [])],
    [initialMeds, otcMeds, demoOn],
  );

  const findings = useMemo(() => analyze(meds), [meds]);
  const summary = useMemo(() => summarize(findings), [findings]);
  const addedIngredients = useMemo(
    () => new Set(otcMeds.map((m) => m.ingredient)),
    [otcMeds],
  );
  const allLabs = useMemo(
    () => (demoOn ? [...DEMO_LABS, ...labs] : labs),
    [labs, demoOn],
  );

  function toggleOtc(opt: OtcOption) {
    if (addedIngredients.has(opt.ingredient)) {
      setOtcMeds((prev) => prev.filter((m) => m.ingredient !== opt.ingredient));
      return;
    }
    const med = otcToMedication(opt);
    const next = [...meds, med];
    const hit = analyze(next).find(
      (f) =>
        f.medIds.includes(med.id) &&
        (f.severity === "danger" || f.severity === "warning"),
    );
    setOtcMeds((prev) => [...prev, med]);

    if (hit) {
      toast.warning(hit.title, { description: hit.detail });
    } else {
      toast.success(`Added ${opt.label}`, {
        description: "No new interaction found with your current list.",
      });
    }
  }

  function removeOtc(id: string) {
    setOtcMeds((prev) => prev.filter((m) => m.id !== id));
  }

  const status =
    summary.danger > 0 ? "danger" : summary.warning > 0 ? "warning" : "ok";
  const medIssues = summary.danger + summary.warning;
  const careOverdue = careGaps.filter((g) => g.status === "overdue").length;

  return (
    <>
      <div className="screen-only flex flex-1 flex-col">
        {/* top bar */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <ShieldPlus className="size-[18px]" />
              </span>
              <span className="tracking-tight">MedSafe</span>
            </div>
            <div className="hidden md:block">
              <SourceBadges sources={sources} />
            </div>
            <div className="flex items-center gap-2">
              <WatchtowerBell />
              <ThemeToggle />
              <Dialog>
                <DialogTrigger render={<Button variant="outline" size="sm" />}>
                  <FileText className="size-4" />
                  <span className="hidden sm:inline">Summary for your doctor</span>
                  <span className="sm:hidden">Summary</span>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Summary for your doctor</DialogTitle>
                    <DialogDescription>
                      A clean snapshot of your medications and what to discuss.
                      Print it or copy it to share.
                    </DialogDescription>
                  </DialogHeader>
                  <SummaryBody meds={meds} findings={findings} sources={sources} />
                  <DialogFooter showCloseButton>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard
                          ?.writeText(summaryToText(meds, findings, sources))
                          .then(() => toast.success("Summary copied"))
                          .catch(() => toast.error("Couldn't copy"));
                      }}
                    >
                      <Copy className="size-4" />
                      Copy
                    </Button>
                    <Button onClick={() => window.print()}>
                      <Printer className="size-4" />
                      Print
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                render={<Link href="/api/connect" />}
                nativeButton={false}
                variant="outline"
                size="sm"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add records</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <StatusBanner status={status} summary={summary} medCount={meds.length} />

          <Tabs defaultValue="overview" className="mt-6 w-full">
            <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              <TabsList className="!h-12 w-max gap-1 !rounded-2xl !p-1.5 [&_[role=tab]]:!rounded-xl [&_[role=tab]]:!px-4 [&_[role=tab]]:gap-2 [&_[role=tab]]:text-[0.9rem]">
              <TabsTrigger value="overview">
                <LayoutDashboard className="size-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="ask">
                <Sparkles className="size-4" />
                Ask AI
              </TabsTrigger>
              <TabsTrigger value="medications">
                <Pill className="size-4" />
                Medications
                {medIssues > 0 ? (
                  <span
                    className={cn(
                      "ml-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white",
                      status === "danger" ? "bg-red-500" : "bg-amber-500",
                    )}
                  >
                    {medIssues}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="labs">
                <FlaskConical className="size-4" />
                Labs
              </TabsTrigger>
              <TabsTrigger value="prevention">
                <HeartPulse className="size-4" />
                Prevention
                {careOverdue > 0 ? (
                  <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {careOverdue}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="recovery">
                <ClipboardList className="size-4" />
                Recovery
              </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-5">
              <OverviewTab
                problems={problems}
                immunizations={immunizations}
                timeline={timeline}
                medCount={initialMeds.length}
                labCount={labs.length}
              />
            </TabsContent>

            <TabsContent value="ask" className="mt-5">
              <AskTab
                bundle={{
                  meds,
                  problems,
                  immunizations,
                  labs: allLabs,
                  timeline,
                  careGaps,
                }}
              />
            </TabsContent>

            <TabsContent value="medications" className="mt-5">
              <MedicationsTab
                meds={meds}
                findings={findings}
                initialMedsCount={initialMeds.length}
                totalResources={totalResources}
                addedIngredients={addedIngredients}
                onToggleOtc={toggleOtc}
                onRemoveOtc={removeOtc}
                demoOn={demoOn}
                onDemoChange={setDemoOn}
              />
            </TabsContent>

            <TabsContent value="labs" className="mt-5">
              <LabsTab labs={allLabs} />
            </TabsContent>

            <TabsContent value="prevention" className="mt-5">
              <CareTab gaps={careGaps} />
            </TabsContent>

            <TabsContent value="recovery" className="mt-5">
              <CareTransitionTab
                timeline={timeline}
                meds={meds}
                problems={problems}
              />
            </TabsContent>
          </Tabs>

          <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
            MedSafe is decision support, not medical advice. Interaction checks
            cover common high-risk combinations only and may be incomplete.
            Always confirm with your doctor or pharmacist before changing any
            medication.
          </p>
        </main>
      </div>

      <PrintSummary meds={meds} findings={findings} sources={sources} />
    </>
  );
}

function StatusBanner({
  status,
  summary,
  medCount,
}: {
  status: "danger" | "warning" | "ok";
  summary: { danger: number; warning: number; info: number };
  medCount: number;
}) {
  const config = {
    danger: {
      wrap: "border-red-200 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/25",
      circle: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400",
      Icon: TriangleAlert,
      title: `${summary.danger} thing${summary.danger === 1 ? "" : "s"} to review with your doctor`,
      sub: "We found high-risk combinations in your medication list.",
    },
    warning: {
      wrap: "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/25",
      circle: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      Icon: TriangleAlert,
      title: `${summary.warning} thing${summary.warning === 1 ? "" : "s"} worth checking`,
      sub: "Some combinations may need a conversation with your doctor.",
    },
    ok: {
      wrap: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/25",
      circle: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
      Icon: ShieldCheck,
      title: "No high-risk combinations found",
      sub: `Checked ${medCount} medication${medCount === 1 ? "" : "s"} across your list.`,
    },
  }[status];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center",
        config.wrap,
      )}
    >
      <div className="flex flex-1 items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            config.circle,
          )}
        >
          <config.Icon className="size-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight tracking-tight">
            {config.title}
          </h1>
          <p className="mt-0.5 text-sm text-foreground/70">{config.sub}</p>
        </div>
      </div>
      <div className="flex items-center rounded-2xl border bg-background/60 sm:self-center">
        <Stat n={summary.danger} label="High risk" tone="text-red-600 dark:text-red-400" />
        <Separator orientation="vertical" className="h-8" />
        <Stat n={summary.warning} label="Check" tone="text-amber-600 dark:text-amber-400" />
        <Separator orientation="vertical" className="h-8" />
        <Stat n={summary.info} label="FYI" tone="text-muted-foreground" />
      </div>
    </div>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="px-4 py-1.5 text-center">
      <div className={cn("text-xl font-bold tabular-nums", tone)}>{n}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
