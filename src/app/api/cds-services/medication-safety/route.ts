import { NextRequest, NextResponse } from "next/server";
import { fetchAllRecords } from "@/lib/medblocks";
import { getPatientId } from "@/lib/patient";
import { normalizeMedications } from "@/lib/normalize";
import { buildSafetyCards, extractDraftName, medsFromPrefetch } from "@/lib/cds";
import type { Medication } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cds-services/medication-safety
 * CDS Hooks `order-select` handler. Returns `cards[]` for the ordered drug,
 * checked against the patient's cross-source medications.
 *
 * Uses prefetch.medications when the caller supplies them (the EHR/our console);
 * otherwise pulls the patient's meds live via Medblocks.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const draftName = extractDraftName(body);
    if (!draftName) {
      return NextResponse.json(
        { error: "No ordered medication found in request." },
        { status: 400 },
      );
    }

    const pf = body?.prefetch?.medications;
    let existing: Medication[];
    if (Array.isArray(pf)) {
      existing = medsFromPrefetch(pf);
    } else {
      existing = normalizeMedications(await fetchAllRecords(await getPatientId()));
    }

    const cards = buildSafetyCards(draftName, existing);
    return NextResponse.json({ cards });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
