# MedSafe

**One honest list of every medication you take — checked for dangerous combinations no single doctor sees.**

Built for the Medblocks Build-a-thon on the Patient Access SDK. Patients connect
their hospital/clinic portals once; MedSafe merges every medication into one list
and flags interactions, duplicates, and record gaps in plain language.

See [`SPEC.md`](./SPEC.md) for the full design.

## Run it

1. Put your sandbox key in `.env.local`:
   ```
   MEDBLOCKS_API_KEY=mb_sk_...
   MEDBLOCKS_PATIENT_ID=demo-patient
   ```
2. Start the app:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 → **Connect your records** → connect the **Epic
   Sandbox** test patient (`fhircamila` / `epicepic1`) → you land on the dashboard.

   > The sandbox patient stays connected to `demo-patient`, so after the first
   > connect you can go straight to http://localhost:3000/connected.

## 60-second demo script

1. **Land on `/connected`.** "These medications were pulled live from Epic
   through Medblocks — 3000 FHIR resources, one honest list." Point to the
   `×30` badge: "the record even shows this logged 30 times."
2. **Add ibuprofen** (a drug that's in *no* EHR). A warning appears instantly:
   _"Your birth control (drospirenone) can raise potassium; ibuprofen does too."_
   "That interaction only exists because we combined the record with what she
   actually takes over the counter."
3. **Flip "Demo scenario".** Banner turns red — _"3 things to review with your
   doctor"_: warfarin+aspirin, lisinopril+spironolactone, simvastatin+
   clarithromycin, each from a different clinic. "No single one of those doctors
   could see this. That's the whole point."

## How it's built

- **Next.js** (App Router, TS) · **shadcn/ui** (Base UI) · **Tailwind v4**
- `medblocks` SDK used **server-side only** — the API key never reaches the browser
- Safety engine is a **pure function** (`src/lib/safety-engine.ts`) — easy to test
- Sandbox data probe lives in [`scripts/medblocks-check.mjs`](./scripts/medblocks-check.mjs)

## Honesty

MedSafe is **decision support, not medical advice**. Interaction checks cover
common high-risk combinations only and may be incomplete; connected records can
be stale. Findings always point to "discuss with your doctor/pharmacist".
"Demo scenario" data is fabricated and always labeled.
