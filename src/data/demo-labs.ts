import type { LabSeries } from "@/lib/types";

/**
 * CLEARLY-LABELED sample lab trends (paired with the "Demo scenario" toggle).
 *
 * The sandbox test patient only has Pulse observations, so these realistic
 * series exist to demonstrate trend + out-of-range detection. Every series is
 * flagged `demo: true` and badged "Sample" in the UI — never presented as real.
 */
function mk(
  id: string,
  name: string,
  unit: string,
  low: number | undefined,
  high: number | undefined,
  raw: Array<[string, number]>,
): LabSeries {
  const points = raw.map(([date, value]) => ({ date, value }));
  const last = points[points.length - 1];
  const latest = last.value;
  let flag: LabSeries["flag"] = "unknown";
  if (typeof high === "number" && latest > high) flag = "high";
  else if (typeof low === "number" && latest < low) flag = "low";
  else if (typeof low === "number" || typeof high === "number") flag = "normal";

  return {
    id,
    name,
    unit,
    low,
    high,
    points,
    latest,
    latestDate: last.date,
    flag,
    demo: true,
  };
}

export const DEMO_LABS: LabSeries[] = [
  mk("demo-a1c", "Hemoglobin A1c", "%", 4, 5.7, [
    ["2025-01-10", 8.1],
    ["2025-04-15", 7.6],
    ["2025-08-02", 7.2],
    ["2026-01-20", 6.9],
    ["2026-06-18", 6.7],
  ]),
  mk("demo-ldl", "LDL Cholesterol", "mg/dL", undefined, 100, [
    ["2025-01-10", 168],
    ["2025-08-02", 142],
    ["2026-06-18", 118],
  ]),
  mk("demo-egfr", "eGFR (kidney function)", "mL/min", 60, undefined, [
    ["2025-01-10", 74],
    ["2025-08-02", 71],
    ["2026-06-18", 68],
  ]),
  mk("demo-sbp", "Systolic blood pressure", "mmHg", 90, 120, [
    ["2025-01-10", 150],
    ["2025-04-15", 144],
    ["2025-08-02", 138],
    ["2026-01-20", 134],
    ["2026-06-18", 131],
  ]),
];
