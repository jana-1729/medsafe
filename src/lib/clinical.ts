import type {
  ProblemItem,
  ImmunizationItem,
  LabSeries,
  LabPoint,
  TimelineEvent,
  TimelineKind,
  PatientInfo,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function isLoinc(system?: string): boolean {
  return /loinc/i.test(String(system || ""));
}

function textOf(cc: any): string {
  return (
    cc?.text ||
    cc?.coding?.[0]?.display ||
    cc?.coding?.[0]?.code ||
    ""
  );
}

function dateOnly(s?: string): string {
  return s ? String(s).slice(0, 10) : "";
}

/** Basic demographics from the Patient resource. */
export function normalizePatient(resources: any[]): PatientInfo {
  const p = resources.find((r) => r?.resourceType === "Patient");
  if (!p) return {};

  const n = Array.isArray(p.name) ? p.name[0] : p.name;
  const name =
    n?.text ||
    [n?.given?.join(" "), n?.family].filter(Boolean).join(" ") ||
    undefined;

  let age: number | undefined;
  if (p.birthDate) {
    const year = Number(String(p.birthDate).slice(0, 4));
    if (!Number.isNaN(year)) {
      const nowYear = new Date().getFullYear();
      const a = nowYear - year;
      if (a >= 0 && a < 130) age = a;
    }
  }

  return { name, age, sex: p.gender };
}

/** Active problems from Condition resources, de-duplicated, newest first. */
export function normalizeConditions(resources: any[]): ProblemItem[] {
  const seen = new Set<string>();
  const out: ProblemItem[] = [];
  for (const r of resources) {
    if (r?.resourceType !== "Condition") continue;
    const clinical =
      r.clinicalStatus?.coding?.[0]?.code ||
      r.clinicalStatus?.text ||
      "active";
    // skip clearly resolved/inactive problems
    if (["resolved", "inactive", "remission"].includes(String(clinical))) continue;

    const name = textOf(r.code);
    if (!name || name === "Not on File") continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: `cond-${out.length}`,
      name,
      status: clinical,
      onset: dateOnly(r.onsetDateTime || r.recordedDate),
      category: textOf(r.category?.[0]),
    });
  }
  return out.sort((a, b) => (b.onset || "").localeCompare(a.onset || ""));
}

/** Vaccinations from Immunization resources, newest first. */
export function normalizeImmunizations(resources: any[]): ImmunizationItem[] {
  const seen = new Set<string>();
  const out: ImmunizationItem[] = [];
  for (const r of resources) {
    if (r?.resourceType !== "Immunization") continue;
    const name = textOf(r.vaccineCode);
    const date = dateOnly(r.occurrenceDateTime);
    if (!name || name === "Not on File") continue;
    const key = `${name.toLowerCase()}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `imm-${out.length}`,
      name,
      date,
      status: r.status,
    });
  }
  return out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

interface LabEntry {
  name: string;
  loinc?: string;
  unit?: string;
  low?: number;
  high?: number;
  points: LabPoint[];
}

/** Numeric lab/vital observations, grouped into trended series. */
export function normalizeLabs(resources: any[]): LabSeries[] {
  const map = new Map<string, LabEntry>();

  for (const r of resources) {
    if (r?.resourceType !== "Observation") continue;
    const vq = r.valueQuantity;
    if (!vq || typeof vq.value !== "number") continue; // skip non-numeric / component-only

    const code = r.code || {};
    const codings: any[] = code.coding || [];
    const loinc = codings.find((c) => isLoinc(c.system));
    const key = loinc?.code || code.text || codings[0]?.display;
    if (!key) continue;
    const name = code.text || loinc?.display || codings[0]?.display || String(key);

    const date = dateOnly(
      r.effectiveDateTime || r.effectivePeriod?.start || r.issued,
    );
    if (!date) continue;

    const entry: LabEntry =
      map.get(key) || { name, loinc: loinc?.code, unit: vq.unit, points: [] };
    entry.points.push({ date, value: vq.value });
    if (!entry.unit && vq.unit) entry.unit = vq.unit;

    const rr = (r.referenceRange || [])[0];
    if (rr) {
      if (typeof rr.low?.value === "number") entry.low = rr.low.value;
      if (typeof rr.high?.value === "number") entry.high = rr.high.value;
    }
    map.set(key, entry);
  }

  const series: LabSeries[] = [];
  let i = 0;
  for (const [key, e] of map) {
    const points = e.points
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
    const last = points[points.length - 1];
    const latest = last?.value ?? 0;
    let flag: LabSeries["flag"] = "unknown";
    if (typeof e.high === "number" && latest > e.high) flag = "high";
    else if (typeof e.low === "number" && latest < e.low) flag = "low";
    else if (typeof e.low === "number" || typeof e.high === "number")
      flag = "normal";

    series.push({
      id: `lab-${i++}-${String(key).replace(/[^a-z0-9]/gi, "")}`,
      name: e.name,
      loinc: e.loinc,
      unit: e.unit,
      points,
      latest,
      latestDate: last?.date,
      low: e.low,
      high: e.high,
      flag,
    });
  }

  // most data-rich series first
  return series.sort((a, b) => b.points.length - a.points.length);
}

/** Chronological health events from encounters, conditions, immunizations, procedures. */
export function buildTimeline(resources: any[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const push = (
    date: string,
    kind: TimelineKind,
    label: string,
    detail?: string,
  ) => {
    if (date && label) events.push({ id: `ev-${events.length}`, date, kind, label, detail });
  };

  for (const r of resources) {
    switch (r?.resourceType) {
      case "Encounter":
        push(
          dateOnly(r.period?.start),
          "encounter",
          textOf(r.type?.[0]) || r.class?.display || r.class?.code || "Visit",
          textOf(r.reasonCode?.[0]),
        );
        break;
      case "Condition":
        push(
          dateOnly(r.onsetDateTime || r.recordedDate),
          "condition",
          textOf(r.code),
          "Diagnosis",
        );
        break;
      case "Immunization":
        push(dateOnly(r.occurrenceDateTime), "immunization", textOf(r.vaccineCode), "Vaccination");
        break;
      case "Procedure":
        push(
          dateOnly(r.performedDateTime || r.performedPeriod?.start),
          "procedure",
          textOf(r.code),
          "Procedure",
        );
        break;
      default:
        break;
    }
  }

  // de-duplicate identical (kind+label+date), newest first, cap for readability
  const seen = new Set<string>();
  const deduped = events.filter((e) => {
    const k = `${e.kind}|${e.label.toLowerCase()}|${e.date}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return deduped
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 40);
}
