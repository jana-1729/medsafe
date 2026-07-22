# MedSafe — design spec

_Medblocks Build-a-thon · patient-facing medication safety on connected health records._

## Problem

A patient's prescriptions are scattered across many hospitals, clinics, and
pharmacies. No single doctor — and not even the patient — ever holds the
**complete** medication list. That gap causes dangerous drug interactions,
accidental duplicates, and meds that should have been stopped. Medication
problems drive a large share of avoidable harm and cost.

The blocker until now was **access** to patient-authorized records. The Medblocks
Patient Access SDK removes that blocker, which makes this buildable.

## What we build

**MedSafe** connects a patient's records once, merges every medication into one
honest list, and runs a safety engine that flags:

1. **Interactions** — dangerous drug pairs (curated, ingredient-level).
2. **Duplicate therapy** — the same drug reaching the patient via >1 prescriber.
3. **Redundant records** — the same entry logged many times (data-quality signal).

### The key insight (OTC gap)

Over-the-counter drugs and supplements (ibuprofen, aspirin, fish oil, St John's
Wort) are in **no** health record, yet cause many real interactions. MedSafe
lets the patient add what they actually take, then checks the **combined** list.
This turns a med *list* into a safety *check* — and is the honest way to surface
a real interaction from the sandbox's single real medication.

## Data reality (from the sandbox probe)

- Live pull works: ~3000 FHIR resources for the Epic Sandbox test patient.
- Real meds are thin: one distinct drug — `drospirenone-ethinyl estradiol`
  (RxNorm 4124), logged ~30×. No allergies on file. One source.
- So the demo uses **A + C hybrid**:
  - **A (real):** connected record + patient-added OTC → real interaction
    (drospirenone + ibuprofen → hyperkalemia) + real redundant-record finding.
  - **C (clearly-labeled demo):** a "Demo scenario" toggle injects a fabricated
    multi-doctor set (warfarin/aspirin, lisinopril/spironolactone,
    simvastatin/clarithromycin) to show the engine's full value. Always labeled
    "Demo · <clinic>" — never presented as real patient data.

## Architecture

```
Patient
  → /api/connect  → mb.patientSession.init → Medblocks hosted picker → Epic Sandbox
  → /connected    → mb.patients.getConnections + records (server-only, key hidden)
                  → normalize FHIR → Medication[]  (resolve medicationReference,
                                                     RxNorm, collapse duplicates)
  → <Dashboard>   → merge connected + self-reported OTC + (optional) demo
                  → analyze() → Finding[]  (pure, runs client-side, live)
                  → UI: status banner · finding cards · med list · add-OTC · demo toggle
```

### Layers

- `src/lib/medblocks.ts` — **server-only** SDK wrapper (`initSession`,
  `getConnections`, `fetchAllRecords` with cursor paging, `count ≤ 100`).
- `src/lib/normalize.ts` — FHIR → `Medication[]`; brand→ingredient mapping;
  resolves `MedicationRequest.medicationReference` → `Medication.code`.
- `src/lib/safety-engine.ts` — **pure** `analyze(meds) → Finding[]` + `summarize`.
- `src/data/interactions.ts` — curated ingredient-pair rules (demo scope).
- `src/data/otc.ts` — quick-add OTC options.
- `src/data/demo-scenario.ts` — labeled fabricated multi-doctor set.
- `src/components/*` — `dashboard` (client orchestrator), `finding-card`,
  `med-list`, `add-medication`, `source-badges`.

## Scope (YAGNI for a 1-day build)

Cut on purpose: no auth/login, no database (OTC state in memory), no live
interaction API (curated list, scope stated honestly), no RxNav lookup (RxNorm
already present in the data), no multi-patient.

## Safety / honesty rules (non-negotiable)

- Framed as **decision support, not medical advice**. Every finding says
  "discuss with your doctor/pharmacist" and never "stop taking X".
- Interaction coverage is **common high-risk combinations only** — stated in the
  UI, not implied to be exhaustive.
- Connected records can be incomplete or stale — the tool is a conversation
  starter, and says so.
- Demo data is always visibly labeled "Demo".

## Tech

Next.js (App Router, TypeScript) · shadcn/ui on Base UI · Tailwind v4 ·
`medblocks` SDK (server-side only).
