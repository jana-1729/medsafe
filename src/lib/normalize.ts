import type { Medication } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** brand / synonym -> generic ingredient token */
const BRAND_TO_INGREDIENT: Record<string, string> = {
  coumadin: "warfarin",
  jantoven: "warfarin",
  ecotrin: "aspirin",
  bayer: "aspirin",
  asa: "aspirin",
  advil: "ibuprofen",
  motrin: "ibuprofen",
  aleve: "naproxen",
  plavix: "clopidogrel",
  glucophage: "metformin",
  zocor: "simvastatin",
  viagra: "sildenafil",
  ultram: "tramadol",
  zoloft: "sertraline",
  prozac: "fluoxetine",
  lanoxin: "digoxin",
  tylenol: "acetaminophen",
  paracetamol: "acetaminophen",
  prilosec: "omeprazole",
  benadryl: "diphenhydramine",
  zyrtec: "cetirizine",
};

/**
 * Known ingredient tokens the engine reasons about. Longest-match-first so
 * "drospirenone" wins over a bare word, and multi-word tokens match.
 */
const KNOWN_INGREDIENTS = [
  // NOTE: drospirenone (not "ethinyl estradiol") is the interaction-relevant
  // component of combined contraceptives — it drives the hyperkalemia risk with
  // NSAIDs — so it must win the match for "drospirenone-ethinyl estradiol ...".
  "drospirenone",
  "warfarin",
  "clopidogrel",
  "aspirin",
  "ibuprofen",
  "naproxen",
  "acetaminophen",
  "lisinopril",
  "spironolactone",
  "potassium",
  "simvastatin",
  "clarithromycin",
  "amiodarone",
  "sildenafil",
  "nitroglycerin",
  "tramadol",
  "sertraline",
  "fluoxetine",
  "digoxin",
  "metformin",
  "contrast",
  "omeprazole",
  "diphenhydramine",
  "cetirizine",
  "st johns wort",
  "fish oil",
].sort((a, b) => b.length - a.length);

/** Best-effort: turn a drug display string into a normalized ingredient token. */
export function toIngredient(name?: string | null): string {
  if (!name) return "";
  const lower = String(name).toLowerCase();
  for (const [brand, generic] of Object.entries(BRAND_TO_INGREDIENT)) {
    if (lower.includes(brand)) return generic;
  }
  for (const ing of KNOWN_INGREDIENTS) {
    if (lower.includes(ing)) return ing;
  }
  // fallback: first meaningful word (unmatched -> engine treats as unmapped)
  return lower.split(/[\s,(]/)[0] || "";
}

/** Read one FHIR medication resource into partial Medication fields. */
function readOne(
  resource: any,
  medIndex: Record<string, any>,
  sourceLabel: string,
  idx: number,
): Medication {
  // Epic returns MedicationRequest.medicationReference -> a Medication resource
  const ref: string =
    resource.medicationReference?.reference ||
    resource.medication?.reference ||
    "";
  const refId = ref.split("/").pop() || "";
  const referenced = medIndex[ref] || medIndex[refId];

  const cc =
    resource.medicationCodeableConcept ||
    resource.medication?.concept ||
    referenced?.code ||
    (typeof resource.medication === "object" && !ref ? resource.medication : null) ||
    resource.code ||
    {};

  const codings: any[] = cc.coding || [];
  const rxnorm = codings.find((c) =>
    String(c.system || "").toLowerCase().includes("rxnorm"),
  );
  const name: string =
    cc.text || rxnorm?.display || codings[0]?.display || "(unnamed medication)";

  return {
    id: `conn-${idx}`,
    name,
    ingredient: toIngredient(name),
    rxnorm: rxnorm?.code,
    status: resource.status,
    date: resource.authoredOn || resource.effectiveDateTime,
    prescriber:
      resource.requester?.display ||
      resource.performer?.[0]?.actor?.display ||
      "Physician",
    sourceLabel,
    sourceType: "connected",
    occurrences: 1,
  };
}

/**
 * Turn a bag of FHIR resources into a clean, de-duplicated medication list.
 * Identical records (same drug + prescriber + status) collapse into one row
 * with an `occurrences` count — a record-quality signal we surface later.
 */
export function normalizeMedications(
  resources: any[],
  sourceLabel = "Connected record",
): Medication[] {
  const medIndex: Record<string, any> = {};
  for (const r of resources) {
    if (r?.resourceType === "Medication" && r.id) {
      medIndex[r.id] = r;
      medIndex[`Medication/${r.id}`] = r;
    }
  }

  const requests = resources.filter(
    (r) =>
      r?.resourceType === "MedicationRequest" ||
      r?.resourceType === "MedicationStatement",
  );

  const collapsed = new Map<string, Medication>();
  requests.forEach((r, i) => {
    const med = readOne(r, medIndex, sourceLabel, i);
    const key = `${med.rxnorm || med.name}|${med.prescriber || ""}|${med.status || ""}`;
    const existing = collapsed.get(key);
    if (existing) {
      existing.occurrences += 1;
    } else {
      collapsed.set(key, med);
    }
  });

  return [...collapsed.values()];
}
