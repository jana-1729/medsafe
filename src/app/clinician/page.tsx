import { fetchAllRecords } from "@/lib/medblocks";
import { getPatientId } from "@/lib/patient";
import { normalizeMedications } from "@/lib/normalize";
import { DEMO_SCENARIO } from "@/data/demo-scenario";
import { ClinicianConsole } from "@/components/clinician-console";
import type { Medication } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ClinicianPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const isDemo = demo === "1" || demo === "true";

  let existing: Medication[] = [];
  try {
    existing = normalizeMedications(await fetchAllRecords(await getPatientId()));
  } catch {
    existing = [];
  }
  if (isDemo) existing = [...existing, ...DEMO_SCENARIO];

  return <ClinicianConsole existing={existing} demo={isDemo} />;
}
