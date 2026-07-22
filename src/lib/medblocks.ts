import "server-only";
import { Medblocks } from "medblocks";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Server-only Medblocks SDK wrapper. The secret API key never reaches the
 * browser — every function here runs in Node (route handlers / server
 * components) only.
 */

const apiKey = process.env.MEDBLOCKS_API_KEY;

/** Single sandbox patient for the demo (override via env). */
export const PATIENT_ID = process.env.MEDBLOCKS_PATIENT_ID || "demo-patient";

function getClient(): Medblocks {
  if (!apiKey) {
    throw new Error(
      "MEDBLOCKS_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
  }
  return new Medblocks(apiKey);
}

/** Start a hosted connect session and return the URL to redirect the patient to. */
export async function initSession(returnUrl: string): Promise<string> {
  const mb = getClient();
  const session = await mb.patientSession.init({
    patient_id: PATIENT_ID,
    return_url: returnUrl,
    return_button_label: "Back to MedSafe",
  });
  return session.url as string;
}

/** List the sources this patient has connected. */
export async function getConnections(): Promise<any[]> {
  const mb = getClient();
  const conns = await mb.patients.getConnections(PATIENT_ID, { hydrate: true });
  return Array.isArray(conns) ? conns : [];
}

/**
 * Page through every FHIR record for the patient. The API caps `count` at 100,
 * so we follow the cursor. Field name for the cursor isn't documented, so we
 * probe the common variants defensively.
 */
export async function fetchAllRecords(): Promise<any[]> {
  const mb = getClient();
  const all: any[] = [];
  let cursor: string | undefined;

  for (let i = 0; i < 30; i++) {
    const opts: any = { count: 100 };
    if (cursor) opts.cursor = cursor;
    const page: any = await mb.patients.records(PATIENT_ID, opts);
    const items: any[] = page?.data || page?.entries || [];
    for (const it of items) all.push(it.resource || it);
    cursor =
      page?.cursor || page?.next || page?.nextCursor || page?.next_cursor;
    if (!cursor || items.length === 0) break;
  }
  return all;
}
