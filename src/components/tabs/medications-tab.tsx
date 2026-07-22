"use client";

import { ShieldCheck, FlaskConical, Database } from "lucide-react";
import type { Finding, Medication } from "@/lib/types";
import type { OtcOption } from "@/data/otc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { FindingCard } from "@/components/finding-card";
import { MedList } from "@/components/med-list";
import { AddMedication } from "@/components/add-medication";
import { cn } from "@/lib/utils";

/** Medications tab — safety findings, add-OTC, demo toggle, and the full merged list. */
export function MedicationsTab({
  meds,
  findings,
  initialMedsCount,
  totalResources,
  addedIngredients,
  onToggleOtc,
  onRemoveOtc,
  demoOn,
  onDemoChange,
}: {
  meds: Medication[];
  findings: Finding[];
  initialMedsCount: number;
  totalResources: number;
  addedIngredients: Set<string>;
  onToggleOtc: (opt: OtcOption) => void;
  onRemoveOtc: (id: string) => void;
  demoOn: boolean;
  onDemoChange: (v: boolean) => void;
}) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Safety findings
          </h2>
          {findings.length === 0 ? (
            <div className="rounded-2xl border bg-background p-10 text-center">
              <div className="relative mx-auto flex size-16 items-center justify-center">
                <span className="absolute inset-0 animate-pulse rounded-full bg-emerald-100 dark:bg-emerald-950/40" />
                <span className="absolute inset-[10px] rounded-full bg-emerald-200/70 dark:bg-emerald-900/50" />
                <ShieldCheck className="relative size-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-4 font-medium">Nothing flagged yet</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                No high-risk combinations across your {meds.length} medications.
                Add what you take over the counter to check further.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <AddMedication
                addedIngredients={addedIngredients}
                onToggle={onToggleOtc}
              />
            </CardContent>
          </Card>

          <Card className={cn(demoOn && "border-amber-300 dark:border-amber-800")}>
            <CardContent className="flex items-start gap-3 pt-6">
              <FlaskConical className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Demo scenario</span>
                  <Switch checked={demoOn} onCheckedChange={onDemoChange} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Loads a sample multi-doctor medication set (not your data) to
                  show what MedSafe catches in a messy real-world record.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="size-4 text-muted-foreground" />
                From your records
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>FHIR resources pulled</span>
                <span className="font-medium text-foreground">
                  {totalResources}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span>Medications found</span>
                <span className="font-medium text-foreground">
                  {initialMedsCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section className="mt-8">
        <h2 className="mb-1 text-sm font-semibold text-muted-foreground">
          All medications ({meds.length})
        </h2>
        <Card>
          <CardContent className="py-1">
            <MedList meds={meds} onRemoveOtc={onRemoveOtc} />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
