import type {
  Medication,
  ProblemItem,
  ImmunizationItem,
  LabSeries,
  TimelineEvent,
  CareGap,
} from "@/lib/types";

export interface RecordBundle {
  meds: Medication[];
  problems: ProblemItem[];
  immunizations: ImmunizationItem[];
  labs: LabSeries[];
  timeline: TimelineEvent[];
  careGaps: CareGap[];
}

/**
 * Flatten the patient's normalized record into a compact, unambiguous text
 * block used to GROUND the AI. Only facts derived from connected records go in
 * here — the assistant is instructed to use nothing else.
 */
export function buildRecordContext(b: RecordBundle): string {
  const out: string[] = [];

  out.push("ACTIVE PROBLEMS:");
  if (b.problems.length)
    b.problems.forEach((p) =>
      out.push(`- ${p.name}${p.onset ? ` (since ${p.onset})` : ""}`),
    );
  else out.push("- none recorded");

  out.push("", "MEDICATIONS:");
  if (b.meds.length)
    b.meds.forEach((m) =>
      out.push(
        `- ${m.name}${m.rxnorm ? ` [rxnorm ${m.rxnorm}]` : ""} — prescriber: ${
          m.prescriber || "unknown"
        }, source: ${m.sourceLabel}${m.status ? `, status: ${m.status}` : ""}${
          m.occurrences > 1 ? `, appears ${m.occurrences}x` : ""
        }`,
      ),
    );
  else out.push("- none recorded");

  out.push("", "IMMUNIZATIONS:");
  if (b.immunizations.length)
    b.immunizations.forEach((i) =>
      out.push(`- ${i.name}${i.date ? ` — ${i.date}` : ""}`),
    );
  else out.push("- none recorded");

  out.push("", "LAB / VITAL RESULTS (latest value per measure):");
  if (b.labs.length)
    b.labs.forEach((s) => {
      const flag =
        s.flag === "high"
          ? " [above range]"
          : s.flag === "low"
            ? " [below range]"
            : s.flag === "normal"
              ? " [in range]"
              : "";
      const ref =
        s.low != null || s.high != null
          ? ` (ref ${s.low ?? "–"}-${s.high ?? "–"})`
          : "";
      out.push(
        `- ${s.name}: ${s.latest}${s.unit ? ` ${s.unit}` : ""}${
          s.latestDate ? ` (${s.latestDate})` : ""
        }${flag}${ref} — ${s.points.length} readings`,
      );
    });
  else out.push("- none recorded");

  out.push("", "RECENT EVENTS:");
  if (b.timeline.length)
    b.timeline
      .slice(0, 15)
      .forEach((e) => out.push(`- ${e.date} — ${e.kind}: ${e.label}`));
  else out.push("- none recorded");

  out.push("", "PREVENTIVE CARE STATUS:");
  if (b.careGaps.length)
    b.careGaps.forEach((g) =>
      out.push(`- ${g.title}: ${g.status}${g.lastDone ? ` (last ${g.lastDone})` : ""}`),
    );
  else out.push("- not evaluated");

  return out.join("\n");
}
