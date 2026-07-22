// scripts/obs-analyze.mjs
// Diagnose what Observation data exists so we render the Labs tab well.
// Run:  node --env-file=.env.local scripts/obs-analyze.mjs
import { Medblocks } from "medblocks";

const mb = new Medblocks(process.env.MEDBLOCKS_API_KEY);
const PATIENT_ID = process.env.MEDBLOCKS_PATIENT_ID || "demo-patient";

const all = [];
let cursor;
for (let i = 0; i < 40; i++) {
  const opts = { count: 100 };
  if (cursor) opts.cursor = cursor;
  const page = await mb.patients.records(PATIENT_ID, opts);
  const items = page?.data || page?.entries || [];
  for (const it of items) all.push(it.resource || it);
  cursor = page?.cursor || page?.next || page?.nextCursor || page?.next_cursor;
  if (!cursor || items.length === 0) break;
}

const obs = all.filter((r) => r?.resourceType === "Observation");
console.log(`total resources: ${all.length}, observations: ${obs.length}\n`);

// value-type distribution
const vtype = {};
for (const o of obs) {
  let t = "none";
  if (o.valueQuantity && typeof o.valueQuantity.value === "number") t = "valueQuantity";
  else if (o.valueString) t = "valueString";
  else if (o.valueCodeableConcept) t = "valueCodeableConcept";
  else if (Array.isArray(o.component) && o.component.length) t = "component";
  else if (o.dataAbsentReason) t = "dataAbsentReason";
  else if (o.valueBoolean !== undefined) t = "valueBoolean";
  vtype[t] = (vtype[t] || 0) + 1;
}
console.log("value types:", JSON.stringify(vtype, null, 2), "\n");

// top codes by count (numeric only)
const byCode = {};
for (const o of obs) {
  const cc = o.code || {};
  const name = cc.text || cc.coding?.[0]?.display || cc.coding?.[0]?.code || "(none)";
  const numeric = o.valueQuantity && typeof o.valueQuantity.value === "number";
  const key = name;
  byCode[key] = byCode[key] || { count: 0, numeric: 0, unit: o.valueQuantity?.unit, sample: o.valueQuantity?.value };
  byCode[key].count += 1;
  if (numeric) byCode[key].numeric += 1;
}
const top = Object.entries(byCode)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 30);
console.log("top codes (name | total | numeric | unit | sample):");
for (const [name, v] of top) {
  console.log(`  ${name} | ${v.count} | ${v.numeric} | ${v.unit || "-"} | ${v.sample ?? "-"}`);
}

// component sample (e.g. blood pressure)
const comp = obs.find((o) => Array.isArray(o.component) && o.component.length);
if (comp) {
  console.log("\nsample component observation code:", comp.code?.text || comp.code?.coding?.[0]?.display);
  console.log("components:", (comp.component || []).map((c) => `${c.code?.text || c.code?.coding?.[0]?.display}=${c.valueQuantity?.value}${c.valueQuantity?.unit || ""}`).join(", "));
}
