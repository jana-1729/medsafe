import "server-only";
import { fetchAllRecords } from "@/lib/medblocks";
import { normalizeMedications } from "@/lib/normalize";
import { analyze } from "@/lib/safety-engine";
import type { Medication } from "@/lib/types";

/**
 * Watchtower — proactive safety monitoring driven by Medblocks webhooks.
 *
 * When Medblocks finishes pulling new records (`records.sync.completed`), we
 * re-run the safety engine and raise an alert for any new risk — so the patient
 * is notified the moment ANY connected source adds a risky prescription,
 * without having to open the app.
 *
 * NOTE: alerts are held in an in-process store — fine for a single instance /
 * demo. Production would persist to a DB + a real notification channel
 * (email/SMS/push), since serverless instances are ephemeral.
 */

export interface Alert {
  id: string;
  severity: "danger" | "warning" | "info";
  title: string;
  detail: string;
  source: string;
  createdAt: string;
  kind: "interaction" | "new-med" | "info";
}

const store: Alert[] = [];
let counter = 0;

function addAlert(a: Omit<Alert, "id" | "createdAt">): Alert {
  counter += 1;
  const alert: Alert = {
    ...a,
    id: `al-${counter}`,
    createdAt: new Date().toISOString(),
  };
  store.unshift(alert);
  return alert;
}

export function getAlerts(): Alert[] {
  return store;
}

export function clearAlerts(): void {
  store.length = 0;
}

/**
 * Real webhook path: on a completed sync, re-analyze the patient's current
 * medications and raise alerts for any new danger/warning not already alerted.
 */
export async function generateAlertsFromSync(patientId: string): Promise<Alert[]> {
  const resources = await fetchAllRecords(patientId);
  const meds = normalizeMedications(resources);
  const findings = analyze(meds).filter((f) => f.severity !== "info");

  const created: Alert[] = [];
  for (const f of findings) {
    if (store.some((a) => a.title === f.title)) continue; // dedupe
    created.push(
      addAlert({
        severity: f.severity,
        title: f.title,
        detail: f.detail,
        source: "Records sync · connected record",
        kind: "interaction",
      }),
    );
  }
  return created;
}

// A realistic "incoming prescription" for the demo — an NSAID, which really
// interacts with the sandbox patient's drospirenone contraceptive (hyperkalemia).
const INCOMING: Medication = {
  id: "incoming",
  name: "Naproxen 500 MG tablet",
  ingredient: "naproxen",
  rxnorm: "7258",
  status: "active",
  prescriber: "Dr. Lee",
  sourceLabel: "QuickCare Urgent",
  sourceType: "connected",
  occurrences: 1,
};

/**
 * Demo path: simulate a `records.sync.completed` where a new prescription
 * arrived from another clinic, and check it against the real connected meds.
 */
export async function simulateIncomingPrescription(
  patientId: string,
): Promise<Alert[]> {
  let existing: Medication[] = [];
  try {
    existing = normalizeMedications(await fetchAllRecords(patientId));
  } catch {
    existing = [];
  }

  const findings = analyze([...existing, INCOMING]).filter(
    (f) => f.medIds.includes(INCOMING.id) && f.severity !== "info",
  );

  const created: Alert[] = [];
  if (findings.length) {
    for (const f of findings) {
      created.push(
        addAlert({
          severity: f.severity,
          title: `New prescription flagged — ${f.title}`,
          detail: `${f.detail} ${f.medNames.join(" + ")}.`,
          source: `${INCOMING.name} · ${INCOMING.sourceLabel} · ${INCOMING.prescriber}`,
          kind: "interaction",
        }),
      );
    }
  } else {
    created.push(
      addAlert({
        severity: "info",
        title: "New prescription added",
        detail: `${INCOMING.name} was added to your record. No interaction found with your current medications.`,
        source: `${INCOMING.sourceLabel} · ${INCOMING.prescriber}`,
        kind: "new-med",
      }),
    );
  }
  return created;
}
