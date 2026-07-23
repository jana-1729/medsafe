import { NextResponse } from "next/server";
import { simulateIncomingPrescription } from "@/lib/watchtower";
import { getPatientId } from "@/lib/patient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/alerts/simulate
 * Demo helper: simulate a `records.sync.completed` where a new prescription
 * arrived from another clinic, and raise the resulting Watchtower alert.
 */
export async function POST() {
  try {
    const patientId = await getPatientId();
    const alerts = await simulateIncomingPrescription(patientId);
    return NextResponse.json({ alerts });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
