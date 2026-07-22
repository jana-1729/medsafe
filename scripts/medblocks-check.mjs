// medblocks-check.mjs
// Throwaway probe: does my Medblocks sandbox have the data to build the Med Safety Engine?
//
// What it does:
//   1. Starts a local server on :3000
//   2. GET /        -> opens Medblocks hosted picker (connect your Epic Sandbox test patient)
//   3. GET /connected (return_url) -> pulls connections + FHIR records, prints a REPORT
//      to your terminal answering: enough sources? enough meds? any dangerous pair?
//
// Run:
//   cd medblocks-check
//   npm install
//   MEDBLOCKS_API_KEY="mb_sk_live_..." node medblocks-check.mjs
//   -> open http://localhost:3000 , connect Epic Sandbox, come back, read terminal.
//
// Node 18+ required (needs global fetch / ESM). This is separate from your app repo.

import http from "node:http";
import { Medblocks, parseReturnUrl } from "medblocks";

const API_KEY = process.env.MEDBLOCKS_API_KEY;
const PATIENT_ID = process.env.PATIENT_ID || "demo-patient";
const PORT = Number(process.env.PORT || 3000);
const BASE = `http://localhost:${PORT}`;

if (!API_KEY) {
  console.error("\n[X] MEDBLOCKS_API_KEY is not set. Run:");
  console.error('    MEDBLOCKS_API_KEY="mb_sk_live_..." node medblocks-check.mjs\n');
  process.exit(1);
}

const mb = new Medblocks(API_KEY);

// --- tiny curated "dangerous pair" list, ingredient-level (demo scope only) ----
const DANGEROUS_PAIRS = [
  ["warfarin", "aspirin"],
  ["warfarin", "ibuprofen"],
  ["warfarin", "naproxen"],
  ["warfarin", "clopidogrel"],
  ["aspirin", "clopidogrel"],
  ["aspirin", "ibuprofen"],
  ["lisinopril", "spironolactone"],
  ["lisinopril", "potassium"],
  ["metformin", "contrast"],
  ["simvastatin", "clarithromycin"],
  ["simvastatin", "amiodarone"],
  ["sildenafil", "nitroglycerin"],
  ["tramadol", "sertraline"],
  ["sertraline", "fluoxetine"],
  ["digoxin", "amiodarone"],
];

// map common brand names -> generic ingredient, so dedup + pair-match works
const BRAND_TO_INGREDIENT = {
  coumadin: "warfarin",
  jantoven: "warfarin",
  ecotrin: "aspirin",
  bayer: "aspirin",
  asa: "aspirin",
  advil: "ibuprofen",
  motrin: "ibuprofen",
  aleve: "naproxen",
  plavix: "clopidogrel",
  glucophage: "metformin",
  zocor: "simvastatin",
  viagra: "sildenafil",
  ultram: "tramadol",
  zoloft: "sertraline",
  prozac: "fluoxetine",
  lanoxin: "digoxin",
  tylenol: "acetaminophen",
  paracetamol: "acetaminophen",
};

const KNOWN_INGREDIENTS = new Set([
  ...DANGEROUS_PAIRS.flat(),
  ...Object.values(BRAND_TO_INGREDIENT),
]);

/** best-effort: turn a med display string into a normalized ingredient token */
function toIngredient(name) {
  if (!name) return null;
  const lower = String(name).toLowerCase();
  for (const [brand, generic] of Object.entries(BRAND_TO_INGREDIENT)) {
    if (lower.includes(brand)) return generic;
  }
  for (const ing of KNOWN_INGREDIENTS) {
    if (lower.includes(ing)) return ing;
  }
  // fallback: first word
  return lower.split(/[\s,(]/)[0] || null;
}

/** extract a human drug name + rxnorm code from a FHIR medication resource.
 *  medIndex: map of "Medication/{id}" and "{id}" -> Medication resource, so we can
 *  resolve MedicationRequest.medicationReference (Epic returns meds as references). */
function readMed(resource, medIndex = {}) {
  // resolve a referenced Medication resource if present
  const ref =
    resource.medicationReference?.reference ||
    resource.medication?.reference ||
    "";
  const refId = ref.split("/").pop();
  const referenced = medIndex[ref] || medIndex[refId];

  const cc =
    resource.medicationCodeableConcept ||
    resource.medication?.concept ||
    referenced?.code || // Medication.code
    (typeof resource.medication === "object" && !ref ? resource.medication : null) ||
    resource.code || // when resource itself is a Medication
    {};
  const codings = cc.coding || [];
  const rxnorm = codings.find((c) =>
    String(c.system || "").toLowerCase().includes("rxnorm")
  );
  const name =
    cc.text ||
    rxnorm?.display ||
    codings[0]?.display ||
    "(unnamed medication)";
  const status = resource.status || "";
  const date = resource.authoredOn || resource.effectiveDateTime || "";
  const prescriber =
    resource.requester?.display ||
    resource.requester?.reference ||
    resource.performer?.[0]?.actor?.display ||
    "";
  const source =
    resource.meta?.source ||
    resource.meta?.tag?.map((t) => t.code || t.display).join("|") ||
    "";
  return {
    name,
    rxnorm: rxnorm?.code || "",
    ingredient: toIngredient(name),
    status,
    date,
    prescriber,
    source,
    type: resource.resourceType,
  };
}

/** page through mb.patients.records defensively (cursor field name unknown) */
async function fetchAllRecords(patientId) {
  const all = [];
  let cursor;
  for (let i = 0; i < 25; i++) {
    const opts = { count: 100 };
    if (cursor) opts.cursor = cursor;
    const page = await mb.patients.records(patientId, opts);
    const items = page?.data || page?.entries || page || [];
    for (const it of items) all.push(it.resource || it);
    cursor =
      page?.cursor || page?.next || page?.nextCursor || page?.next_cursor;
    if (!cursor || items.length === 0) break;
  }
  return all;
}

function histogram(resources) {
  const h = {};
  for (const r of resources) {
    const t = r.resourceType || "Unknown";
    h[t] = (h[t] || 0) + 1;
  }
  return h;
}

async function buildReport() {
  const lines = [];
  const log = (s = "") => {
    lines.push(s);
    console.log(s);
  };

  log("\n================ MEDBLOCKS SANDBOX CHECK ================\n");

  // 1. connections
  let connections = [];
  try {
    connections = await mb.patients.getConnections(PATIENT_ID, { hydrate: true });
  } catch (e) {
    log(`[X] getConnections failed: ${e?.message || e}`);
  }
  log(`SOURCES CONNECTED: ${connections.length}`);
  connections.forEach((c, i) =>
    log(`   ${i + 1}. ${c.name || c.id || JSON.stringify(c)}`)
  );
  log("");

  // 2. records
  let resources = [];
  try {
    resources = await fetchAllRecords(PATIENT_ID);
  } catch (e) {
    log(`[X] records() failed: ${e?.message || e}`);
  }
  log(`TOTAL FHIR RESOURCES: ${resources.length}`);
  if (resources.length === 0) {
    log("   (0 records — background pull may still be running. Wait ~30s, refresh /connected.)");
  }
  const hist = histogram(resources);
  Object.entries(hist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => log(`   ${t}: ${n}`));
  log("");

  // 3. medications — index Medication resources so we can resolve references
  const medIndex = {};
  for (const r of resources) {
    if (r.resourceType === "Medication" && r.id) {
      medIndex[r.id] = r;
      medIndex[`Medication/${r.id}`] = r;
    }
  }
  const medResources = resources.filter(
    (r) =>
      r.resourceType === "MedicationRequest" ||
      r.resourceType === "MedicationStatement"
  );
  const meds = medResources.map((r) => readMed(r, medIndex));
  log(`MEDICATIONS: ${meds.length}`);
  meds.forEach((m, i) =>
    log(
      `   ${i + 1}. ${m.name}` +
        `${m.rxnorm ? ` [rxnorm:${m.rxnorm}]` : " [no-rxnorm]"}` +
        ` (ing:${m.ingredient || "?"})` +
        `${m.status ? ` status:${m.status}` : ""}` +
        `${m.prescriber ? ` by:${m.prescriber}` : ""}` +
        `${m.source ? ` src:${m.source}` : ""}`
    )
  );
  log("");

  // 4. allergies (nice-to-have)
  const allergies = resources.filter((r) => r.resourceType === "AllergyIntolerance");
  log(`ALLERGIES: ${allergies.length}`);
  allergies.forEach((a, i) =>
    log(`   ${i + 1}. ${a.code?.text || a.code?.coding?.[0]?.display || "(unnamed)"}`)
  );
  log("");

  // 5. the money check: any dangerous pair? any duplicate ingredient?
  const ingredients = meds.map((m) => m.ingredient).filter(Boolean);
  const ingSet = new Set(ingredients);

  const foundPairs = DANGEROUS_PAIRS.filter(
    ([a, b]) => ingSet.has(a) && ingSet.has(b)
  );

  const dupCounts = {};
  ingredients.forEach((i) => (dupCounts[i] = (dupCounts[i] || 0) + 1));
  const dups = Object.entries(dupCounts).filter(([, n]) => n > 1);

  log("---------------- VERDICT ----------------");
  log(`sources >= 2 ............ ${connections.length >= 2 ? "YES" : "NO  <-- need for cross-source story"}`);
  log(`medications >= 2 ........ ${meds.length >= 2 ? "YES" : "NO"}`);
  log(`rxnorm codes present .... ${meds.some((m) => m.rxnorm) ? "YES" : "NO  (will map via RxNav)"}`);
  log(
    `dangerous pair present .. ${
      foundPairs.length ? "YES -> " + foundPairs.map((p) => p.join("+")).join(", ") : "NO"
    }`
  );
  log(
    `duplicate therapy ....... ${
      dups.length ? "YES -> " + dups.map(([i, n]) => `${i}x${n}`).join(", ") : "NO"
    }`
  );

  let overall;
  if (foundPairs.length || dups.length) overall = "DEMO-READY (real conflict exists in sandbox!)";
  else if (meds.length >= 2) overall = "USABLE (meds exist; may need to seed 1 conflicting med for the killer demo)";
  else if (resources.length > 0) overall = "THIN (records exist but few/no meds; likely need seeded demo data)";
  else overall = "EMPTY / STILL PULLING (retry, or we build on seeded data)";
  log(`\nOVERALL: ${overall}`);
  log("=========================================\n");

  return lines.join("\n");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE);

  if (url.pathname === "/") {
    try {
      const session = await mb.patientSession.init({
        patient_id: PATIENT_ID,
        return_url: `${BASE}/connected`,
        return_button_label: "Back to MedSafe Check",
      });
      res.writeHead(302, { Location: session.url });
      res.end();
    } catch (e) {
      res.writeHead(500);
      res.end(`patientSession.init failed: ${e?.message || e}`);
    }
    return;
  }

  if (url.pathname === "/connected") {
    const parsed = parseReturnUrl(url.searchParams);
    if (!parsed) {
      // still allow manual inspection even if not a proper return
      console.log("[i] /connected hit without valid return params — inspecting anyway.");
    }
    const report = await buildReport();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      `<pre style="font:14px/1.5 ui-monospace,monospace;padding:24px">${report
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>` +
        `<p style="font-family:sans-serif;padding:0 24px">Full report also printed in your terminal. Copy it and paste back to Claude.</p>`
    );
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`\n[ok] MedSafe sandbox check running.`);
  console.log(`   1. Open ${BASE}`);
  console.log(`   2. Connect your Epic Sandbox test patient (search "Epic Sandbox", use test creds).`);
  console.log(`   3. You'll be returned to ${BASE}/connected and the REPORT prints here.\n`);
  console.log(`   patient_id = "${PATIENT_ID}"  (override with PATIENT_ID env)\n`);
});
