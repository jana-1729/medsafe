import Link from "next/link";
import { TriangleAlert, Link2 } from "lucide-react";
import { getConnections, fetchAllRecords } from "@/lib/medblocks";
import { normalizeMedications } from "@/lib/normalize";
import {
  normalizeConditions,
  normalizeImmunizations,
  normalizeLabs,
  buildTimeline,
  normalizePatient,
} from "@/lib/clinical";
import { evaluateCareGaps } from "@/lib/care-engine";
import { Dashboard } from "@/components/dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function ConnectedPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const initialDemo = demo === "1" || demo === "true";

  let connections: any[] = [];
  let resources: any[] = [];
  let error: string | null = null;

  try {
    connections = await getConnections();
    resources = await fetchAllRecords();
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-6 py-20">
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Couldn&apos;t load your records</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="outline"
          className="mt-6 self-start"
        >
          Back to start
        </Button>
      </main>
    );
  }

  const connectionNames = connections.map((c) => c?.name || "Connected source");
  // getConnections can lag behind the record pull, so fall back to a generic
  // label when records exist but the connection list hasn't populated yet.
  const sourceNames =
    connectionNames.length > 0
      ? connectionNames
      : resources.length > 0
        ? ["Connected record"]
        : [];
  const primaryLabel = sourceNames[0] || "Connected record";
  const meds = normalizeMedications(resources, primaryLabel);

  // only show the connect prompt when there is genuinely no data
  if (resources.length === 0 && connectionNames.length === 0) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
          <Link2 className="size-6 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          No records connected yet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect a hospital or clinic portal to see your medications and safety
          checks.
        </p>
        <Button
          render={<Link href="/api/connect" />}
          nativeButton={false}
          className="mt-6"
        >
          Connect your records
        </Button>
      </main>
    );
  }

  const problems = normalizeConditions(resources);
  const immunizations = normalizeImmunizations(resources);
  const labs = normalizeLabs(resources);
  const timeline = buildTimeline(resources);
  const patient = normalizePatient(resources);
  const careGaps = evaluateCareGaps(patient, {
    conditions: problems,
    immunizations,
    labs,
    meds,
  });

  return (
    <Dashboard
      initialMeds={meds}
      sources={sourceNames}
      totalResources={resources.length}
      problems={problems}
      immunizations={immunizations}
      labs={labs}
      timeline={timeline}
      careGaps={careGaps}
      initialDemo={initialDemo}
    />
  );
}
