/** Where a medication came from. */
export type MedSource = "connected" | "otc" | "demo";

/** A single normalized medication, source-agnostic. */
export interface Medication {
  /** stable id for React keys + finding references */
  id: string;
  /** human display name, e.g. "Warfarin 5 MG tablet" */
  name: string;
  /** normalized lowercase token used for interaction/dup matching, e.g. "warfarin" */
  ingredient: string;
  /** RxNorm code if known */
  rxnorm?: string;
  /** FHIR status: active | stopped | completed | ... */
  status?: string;
  /** authoredOn / effective date (ISO) */
  date?: string;
  /** prescriber display */
  prescriber?: string;
  /** where it came from, human label e.g. "Epic Sandbox", "You (self-reported)", "Demo · Cardiology" */
  sourceLabel: string;
  sourceType: MedSource;
  /** how many identical records were collapsed into this one (record-quality signal) */
  occurrences: number;
}

export type FindingSeverity = "danger" | "warning" | "info";
export type FindingKind = "interaction" | "duplicate" | "redundant" | "unmapped";

/** One issue surfaced by the safety engine. */
export interface Finding {
  id: string;
  kind: FindingKind;
  severity: FindingSeverity;
  /** short headline */
  title: string;
  /** what the issue is, plain language */
  detail: string;
  /** what the patient should do — always "talk to your doctor/pharmacist" framed */
  advice: string;
  /** ids of medications involved */
  medIds: string[];
  /** display names of medications involved */
  medNames: string[];
}

/** An active problem / diagnosis from Condition resources. */
export interface ProblemItem {
  id: string;
  name: string;
  status?: string;
  onset?: string;
  category?: string;
}

/** A vaccination from Immunization resources. */
export interface ImmunizationItem {
  id: string;
  name: string;
  date?: string;
  status?: string;
}

/** One measurement in a lab series. */
export interface LabPoint {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  value: number;
}

/** A lab/vital observation trended over time. */
export interface LabSeries {
  id: string;
  name: string;
  loinc?: string;
  unit?: string;
  /** sorted ascending by date */
  points: LabPoint[];
  latest: number;
  latestDate?: string;
  low?: number;
  high?: number;
  flag: "low" | "high" | "normal" | "unknown";
  /** true for clearly-labeled sample series (not from the connected record) */
  demo?: boolean;
}

export type TimelineKind =
  | "encounter"
  | "condition"
  | "medication"
  | "immunization"
  | "procedure";

/** A single dated event on the health timeline. */
export interface TimelineEvent {
  id: string;
  date: string;
  kind: TimelineKind;
  label: string;
  detail?: string;
}

/** Basic demographics from the Patient resource. */
export interface PatientInfo {
  name?: string;
  age?: number;
  sex?: string;
}

export type CareStatus = "overdue" | "up-to-date";
export type CareCategory = "Screening" | "Vaccine" | "Monitoring";

/** A preventive-care recommendation evaluated against guidelines. */
export interface CareGap {
  id: string;
  title: string;
  category: CareCategory;
  status: CareStatus;
  /** why this applies to the patient */
  reason: string;
  /** what's found / missing */
  detail: string;
  advice: string;
  /** last completed date, if any */
  lastDone?: string;
}
