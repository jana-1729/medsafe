import type { Medication } from "@/lib/types";

/**
 * Common over-the-counter meds & supplements a patient can add themselves.
 *
 * THE KEY INSIGHT: OTC drugs and supplements are in NO electronic health
 * record, yet they cause many real interactions. Letting the patient add what
 * they actually take is what turns a med *list* into a safety *check*.
 */
export interface OtcOption {
  label: string;
  ingredient: string;
  rxnorm?: string;
}

export const OTC_OPTIONS: OtcOption[] = [
  { label: "Ibuprofen (Advil, Motrin)", ingredient: "ibuprofen", rxnorm: "5640" },
  { label: "Aspirin (Bayer, Ecotrin)", ingredient: "aspirin", rxnorm: "1191" },
  { label: "Naproxen (Aleve)", ingredient: "naproxen", rxnorm: "7258" },
  { label: "Acetaminophen (Tylenol)", ingredient: "acetaminophen", rxnorm: "161" },
  { label: "Omeprazole (Prilosec)", ingredient: "omeprazole", rxnorm: "7646" },
  { label: "Diphenhydramine (Benadryl)", ingredient: "diphenhydramine", rxnorm: "3498" },
  { label: "Cetirizine (Zyrtec)", ingredient: "cetirizine", rxnorm: "20610" },
  { label: "Potassium supplement", ingredient: "potassium", rxnorm: "8588" },
  { label: "St. John's Wort (herbal)", ingredient: "st johns wort" },
  { label: "Fish oil / Omega-3", ingredient: "fish oil" },
];

let otcCounter = 0;

/** Build a Medication from an OTC option the patient selected. */
export function otcToMedication(opt: OtcOption): Medication {
  otcCounter += 1;
  return {
    id: `otc-${opt.ingredient}-${otcCounter}`,
    name: opt.label,
    ingredient: opt.ingredient,
    rxnorm: opt.rxnorm,
    status: "active",
    prescriber: "Self-reported",
    sourceLabel: "You (self-reported)",
    sourceType: "otc",
    occurrences: 1,
  };
}
