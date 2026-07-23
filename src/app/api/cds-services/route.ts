import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cds-services
 * CDS Hooks discovery document — what an EHR reads to register our service.
 */
export async function GET() {
  return NextResponse.json({
    services: [
      {
        hook: "order-select",
        id: "medication-safety",
        title: "MedSafe Cross-Source Medication Safety",
        description:
          "At order time, checks the drug against the patient's medications assembled from ALL connected sources (via Medblocks) — catching interactions with scripts from other systems the EHR can't see.",
        prefetch: {
          patient: "Patient/{{context.patientId}}",
        },
      },
    ],
  });
}
