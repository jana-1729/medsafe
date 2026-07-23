import type { Medication, ProblemItem, TimelineEvent } from "@/lib/types";

/**
 * Care-Transition / Discharge Companion.
 *
 * Real-world problem: ~1 in 5 hospital discharges leads to a readmission within
 * 30 days, and post-discharge medication confusion is a leading cause. This
 * builds, from the connected record: the recent hospital visit, a medication
 * reconciliation (what's new vs continued from home), a recovery checklist, and
 * red-flag symptoms — so the patient knows exactly what to do after they leave.
 *
 * Pure + client-safe. Richer when the Demo scenario is on (a cardiac discharge).
 */

const DISCHARGE_RE = /surg|inpatient|admiss|discharge|hospital|procedure/i;

export interface ReconItem {
  med: Medication;
  status: "started" | "continued";
}
export interface RecoveryTask {
  id: string;
  label: string;
  detail?: string;
}
export interface RedFlag {
  id: string;
  text: string;
}
export interface CareTransition {
  discharge?: { date: string; label: string };
  reconciliation: ReconItem[];
  tasks: RecoveryTask[];
  redFlags: RedFlag[];
  hasData: boolean;
}

export function buildCareTransition(input: {
  timeline: TimelineEvent[];
  meds: Medication[];
  problems: ProblemItem[];
}): CareTransition {
  const { timeline, meds, problems } = input;

  const encounters = timeline.filter(
    (e) => e.kind === "encounter" || e.kind === "procedure",
  );
  const discharge =
    encounters.find((e) => DISCHARGE_RE.test(e.label)) || encounters[0];

  const active = meds.filter(
    (m) => (m.status || "active").toLowerCase() !== "stopped",
  );

  // A med counts as "started around this visit" if it was authored on/after the
  // discharge date, or (fallback) came from the demo discharge scenario.
  const reconciliation: ReconItem[] = active.map((m) => {
    let status: ReconItem["status"] = "continued";
    if (discharge?.date && m.date && m.date.slice(0, 10) >= discharge.date) {
      status = "started";
    } else if (m.sourceType === "demo") {
      status = "started";
    }
    return { med: m, status };
  });

  const hasIngredient = (re: RegExp) =>
    reconciliation.some((r) => re.test(r.med.ingredient));
  const hasCondition = (re: RegExp) =>
    problems.some((p) => re.test(p.name.toLowerCase()));

  // ---- recovery checklist -------------------------------------------------
  const started = reconciliation.filter((r) => r.status === "started");
  const tasks: RecoveryTask[] = [];
  tasks.push({
    id: "followup",
    label: "Book a follow-up visit within 7 days",
    detail: discharge
      ? `After your ${discharge.label.toLowerCase()} on ${discharge.date}.`
      : undefined,
  });
  if (started.length)
    tasks.push({
      id: "fill",
      label: "Fill all new prescriptions before you run out",
    });
  for (const r of started)
    tasks.push({
      id: `take-${r.med.id}`,
      label: `Take ${r.med.name} exactly as prescribed`,
    });
  if (hasIngredient(/warfarin/))
    tasks.push({
      id: "inr",
      label: "Get your INR (blood-thinner) level checked as scheduled",
    });
  tasks.push({
    id: "list",
    label: "Keep this medication list with you and show it at every visit",
  });

  // ---- red-flag symptoms --------------------------------------------------
  const redFlags: RedFlag[] = [];
  if (hasIngredient(/warfarin|aspirin|clopidogrel/))
    redFlags.push({
      id: "bleed",
      text: "Unusual bleeding or bruising, blood in urine or stool, or black/tarry stools.",
    });
  if (hasCondition(/ischemic|chest pain|cardiac|heart|angina/) || hasIngredient(/nitro/))
    redFlags.push({
      id: "chest",
      text: "Chest pain or pressure, or shortness of breath — call emergency services.",
    });
  if (hasIngredient(/lisinopril|spironolactone/))
    redFlags.push({
      id: "cardiorenal",
      text: "Severe dizziness, fainting, or new swelling in your legs or face.",
    });
  redFlags.push({
    id: "infection",
    text: "Fever over 38°C (100.4°F), or a wound that is red, swollen, or draining.",
  });
  redFlags.push({
    id: "general",
    text: "Confusion, severe weakness, or any symptom that worries you.",
  });

  return {
    discharge: discharge ? { date: discharge.date, label: discharge.label } : undefined,
    reconciliation,
    tasks,
    redFlags,
    hasData: !!discharge || reconciliation.length > 0,
  };
}
