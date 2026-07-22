import type { Finding, FindingSeverity, Medication } from "@/lib/types";
import { INTERACTIONS } from "@/data/interactions";

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  danger: 0,
  warning: 1,
  info: 2,
};

/** Is a medication currently being taken (worth checking)? */
function isActive(m: Medication): boolean {
  const s = (m.status || "").toLowerCase();
  return s === "" || s === "active" || s === "intended" || s === "on-hold";
}

/**
 * The safety brain. Pure function: medications in, findings out.
 * No side effects, no I/O — safe to run on server or client.
 */
export function analyze(meds: Medication[]): Finding[] {
  const active = meds.filter(isActive);
  const findings: Finding[] = [];

  // 1. INTERACTIONS — every unordered pair with different ingredients
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (!a.ingredient || !b.ingredient || a.ingredient === b.ingredient) continue;

      const rule = INTERACTIONS.find(
        (r) =>
          (r.a === a.ingredient && r.b === b.ingredient) ||
          (r.a === b.ingredient && r.b === a.ingredient),
      );
      if (!rule) continue;

      findings.push({
        id: `int-${a.id}-${b.id}`,
        kind: "interaction",
        severity: rule.severity,
        title: `${cap(a.ingredient)} + ${cap(b.ingredient)}`,
        detail: rule.risk,
        advice: rule.advice,
        medIds: [a.id, b.id],
        medNames: [a.name, b.name],
      });
    }
  }

  // 2. DUPLICATE THERAPY — same ingredient from different drugs/prescribers
  const byIngredient = new Map<string, Medication[]>();
  for (const m of active) {
    if (!m.ingredient) continue;
    const arr = byIngredient.get(m.ingredient) || [];
    arr.push(m);
    byIngredient.set(m.ingredient, arr);
  }
  for (const [ingredient, group] of byIngredient) {
    if (group.length < 2) continue;
    const prescribers = new Set(group.map((m) => m.prescriber || "unknown"));
    // genuine duplication = same drug reaching you via >1 prescriber/source
    if (prescribers.size < 2) continue;
    findings.push({
      id: `dup-${ingredient}`,
      kind: "duplicate",
      severity: "warning",
      title: `Possible duplicate: ${cap(ingredient)}`,
      detail: `${cap(ingredient)} appears from ${prescribers.size} different prescribers (${[...prescribers].join(", ")}). Taking the same drug twice can mean an accidental double dose.`,
      advice: "Check with your pharmacist whether these are the same medication under two names.",
      medIds: group.map((m) => m.id),
      medNames: group.map((m) => m.name),
    });
  }

  // 3. REDUNDANT RECORDS — same entry logged many times (data-quality signal)
  for (const m of active) {
    if (m.occurrences > 3) {
      findings.push({
        id: `red-${m.id}`,
        kind: "redundant",
        severity: "info",
        title: `${cap(m.ingredient || m.name)} logged ${m.occurrences}×`,
        detail: `This medication appears ${m.occurrences} times in your connected records. Usually harmless (repeat fills), but worth confirming it's a single active prescription.`,
        advice: "If you no longer take this, ask your provider to update your record.",
        medIds: [m.id],
        medNames: [m.name],
      });
    }
  }

  // 4. UNMAPPED — we couldn't confidently identify the drug
  for (const m of active) {
    if (!m.ingredient || m.ingredient === "(unnamed") {
      findings.push({
        id: `unm-${m.id}`,
        kind: "unmapped",
        severity: "info",
        title: `Couldn't fully identify: ${m.name}`,
        detail: "This medication is shown but wasn't matched to a known ingredient, so it isn't included in interaction checks.",
        advice: "No action needed — shown for completeness.",
        medIds: [m.id],
        medNames: [m.name],
      });
    }
  }

  return findings.sort((x, y) => SEVERITY_RANK[x.severity] - SEVERITY_RANK[y.severity]);
}

/** Summary counts for the header. */
export function summarize(findings: Finding[]) {
  return {
    danger: findings.filter((f) => f.severity === "danger").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
