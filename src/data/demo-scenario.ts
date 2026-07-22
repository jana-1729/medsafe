import type { Medication } from "@/lib/types";

/**
 * CLEARLY-LABELED demo data (Approach C).
 *
 * Sandbox test patients don't carry a cross-prescriber dangerous combo, so this
 * fabricated multi-doctor med set exists ONLY to show what the engine catches
 * in a real-world messy case. It is always labeled "Demo" in the UI. Not real
 * patient data.
 *
 * Designed to trigger three findings at once:
 *   - warfarin + aspirin        (danger, two prescribers)
 *   - lisinopril + spironolactone (danger, hyperkalemia)
 *   - simvastatin + clarithromycin (danger, recent antibiotic vs statin)
 */
export const DEMO_SCENARIO: Medication[] = [
  {
    id: "demo-warfarin",
    name: "Warfarin 5 MG tablet",
    ingredient: "warfarin",
    rxnorm: "855332",
    status: "active",
    date: "2026-02-11",
    prescriber: "Dr. Alan Reyes",
    sourceLabel: "Demo · City Cardiology",
    sourceType: "demo",
    occurrences: 1,
  },
  {
    id: "demo-aspirin",
    name: "Aspirin 81 MG tablet",
    ingredient: "aspirin",
    rxnorm: "1191",
    status: "active",
    date: "2025-11-03",
    prescriber: "Dr. Beth Ortiz",
    sourceLabel: "Demo · Family Health",
    sourceType: "demo",
    occurrences: 1,
  },
  {
    id: "demo-lisinopril",
    name: "Lisinopril 20 MG tablet",
    ingredient: "lisinopril",
    rxnorm: "314077",
    status: "active",
    date: "2025-09-20",
    prescriber: "Dr. Beth Ortiz",
    sourceLabel: "Demo · Family Health",
    sourceType: "demo",
    occurrences: 1,
  },
  {
    id: "demo-spironolactone",
    name: "Spironolactone 25 MG tablet",
    ingredient: "spironolactone",
    rxnorm: "313096",
    status: "active",
    date: "2026-01-15",
    prescriber: "Dr. Alan Reyes",
    sourceLabel: "Demo · City Cardiology",
    sourceType: "demo",
    occurrences: 1,
  },
  {
    id: "demo-simvastatin",
    name: "Simvastatin 40 MG tablet",
    ingredient: "simvastatin",
    rxnorm: "312961",
    status: "active",
    date: "2025-08-02",
    prescriber: "Dr. Beth Ortiz",
    sourceLabel: "Demo · Family Health",
    sourceType: "demo",
    occurrences: 1,
  },
  {
    id: "demo-clarithromycin",
    name: "Clarithromycin 500 MG tablet",
    ingredient: "clarithromycin",
    rxnorm: "18631",
    status: "active",
    date: "2026-07-18",
    prescriber: "Urgent Care",
    sourceLabel: "Demo · QuickCare Urgent",
    sourceType: "demo",
    occurrences: 1,
  },
];
