import { analyze } from "@/lib/safety-engine";
import { toIngredient } from "@/lib/normalize";
import type { Medication } from "@/lib/types";

/**
 * CDS Hooks card builder for the clinician point-of-care service.
 *
 * The real-world win: at the moment a clinician orders a drug, MedSafe checks it
 * against the patient's medications assembled from ALL connected sources (via
 * Medblocks) — including scripts from other systems the prescriber's own EHR
 * can't see. Returns CDS Hooks `cards` (info | warning | critical).
 */
export interface CdsCard {
  uuid: string;
  summary: string;
  indicator: "info" | "warning" | "critical";
  detail: string;
  source: { label: string };
}

let cardCounter = 0;
function uuid(): string {
  cardCounter += 1;
  return `card-${cardCounter}`;
}

export function buildSafetyCards(
  draftName: string,
  existing: Medication[],
): CdsCard[] {
  const draft: Medication = {
    id: "draft-order",
    name: draftName,
    ingredient: toIngredient(draftName),
    status: "active",
    prescriber: "Ordering clinician",
    sourceLabel: "New order",
    sourceType: "connected",
    occurrences: 1,
  };

  const findings = analyze([...existing, draft]).filter(
    (f) => f.medIds.includes("draft-order") && f.severity !== "info",
  );

  if (findings.length === 0) {
    return [
      {
        uuid: uuid(),
        summary: `No interaction found for ${draftName}`,
        indicator: "info",
        detail: `MedSafe checked **${draftName}** against ${existing.length} medication(s) assembled from this patient's connected records across all sources. No known interaction or duplicate therapy was found.`,
        source: { label: "MedSafe · Cross-Source Safety" },
      },
    ];
  }

  return findings.map((f) => {
    // find the *existing* med in the conflict (not the draft) to cite its source
    const otherMed = existing.find((m) => f.medIds.includes(m.id));
    const crossSource = otherMed?.sourceLabel
      ? ` The existing **${otherMed.name}** is on record from **${otherMed.sourceLabel}** — which may not be visible in your EHR.`
      : "";
    return {
      uuid: uuid(),
      summary:
        `${f.severity === "danger" ? "High-risk" : "Caution"}: ${f.title}`.slice(
          0,
          140,
        ),
      indicator: f.severity === "danger" ? "critical" : "warning",
      detail: `${f.detail}${crossSource}\n\n**What to do:** ${f.advice}`,
      source: { label: "MedSafe · Cross-Source Safety" },
    };
  });
}

/** Map a simplified prefetch medication list into our Medication shape. */
export function medsFromPrefetch(
  list: Array<{
    name?: string;
    ingredient?: string;
    sourceLabel?: string;
    prescriber?: string;
  }>,
): Medication[] {
  return list
    .filter((m) => m && m.name)
    .map((m, i) => ({
      id: `ex-${i}`,
      name: m.name as string,
      ingredient: m.ingredient || toIngredient(m.name),
      status: "active",
      prescriber: m.prescriber || "",
      sourceLabel: m.sourceLabel || "Connected record",
      sourceType: "connected" as const,
      occurrences: 1,
    }));
}

/** Extract the ordered drug name from a CDS request body (several shapes). */
export function extractDraftName(body: unknown): string | null {
  const b = body as {
    medication?: string;
    context?: {
      draftOrder?: { name?: string };
      draftOrders?: { entry?: Array<{ resource?: unknown }> };
    };
  };
  if (b?.context?.draftOrder?.name) return b.context.draftOrder.name;
  if (typeof b?.medication === "string") return b.medication;
  // FHIR Bundle of draft orders
  const entries = b?.context?.draftOrders?.entry || [];
  for (const e of entries) {
    const r = e?.resource as {
      resourceType?: string;
      medicationCodeableConcept?: { text?: string; coding?: Array<{ display?: string }> };
    };
    if (r?.resourceType === "MedicationRequest") {
      const cc = r.medicationCodeableConcept;
      const name = cc?.text || cc?.coding?.[0]?.display;
      if (name) return name;
    }
  }
  return null;
}
