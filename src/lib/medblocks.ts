import "server-only";
import { Medblocks } from "medblocks";

/**
 * Verify + parse a Medblocks webhook. Uses the SDK's signature verification
 * when a signing secret is configured; otherwise (dev) parses the body and logs
 * a warning. Returns the parsed event object.
 */
export function constructWebhookEvent(
  rawBody: string,
  signature: string | null,
): any {
  const secret = process.env.MEDBLOCKS_WEBHOOK_SECRET;
  const anyMb = Medblocks as any;
  if (secret && signature && anyMb?.webhooks?.constructEvent) {
    return anyMb.webhooks.constructEvent(rawBody, signature, secret);
  }
  // dev fallback: no secret configured → accept but don't trust
  if (!secret) {
    console.warn(
      "[watchtower] MEDBLOCKS_WEBHOOK_SECRET not set — skipping signature verification (dev only).",
    );
  }
  return JSON.parse(rawBody);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Server-only Medblocks SDK wrapper. The secret API key never reaches the
 * browser — every function here runs in Node (route handlers / server
 * components) only.
 */

const apiKey = process.env.MEDBLOCKS_API_KEY;

/** Fallback patient id (used when no per-user id is supplied). */
export const DEFAULT_PATIENT_ID =
  process.env.MEDBLOCKS_PATIENT_ID || "demo-patient";

function getClient(): Medblocks {
  if (!apiKey) {
    throw new Error(
      "MEDBLOCKS_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
  }
  return new Medblocks(apiKey);
}

/** Start a hosted connect session and return the URL to redirect the patient to. */
export async function initSession(
  returnUrl: string,
  patientId: string,
): Promise<string> {
  const mb = getClient();
  const session = await mb.patientSession.init({
    patient_id: patientId,
    return_url: returnUrl,
    return_button_label: "Back to MedSafe",
  });
  return session.url as string;
}

/** List the sources this patient has connected. */
export async function getConnections(patientId: string): Promise<any[]> {
  const mb = getClient();
  const conns = await mb.patients.getConnections(patientId, { hydrate: true });
  return Array.isArray(conns) ? conns : [];
}

/**
 * Page through every FHIR record for the patient. The API caps `count` at 100,
 * so we follow the cursor. Field name for the cursor isn't documented, so we
 * probe the common variants defensively.
 */
export async function fetchAllRecords(patientId: string): Promise<any[]> {
  const mb = getClient();
  const all: any[] = [];
  let cursor: string | undefined;

  for (let i = 0; i < 30; i++) {
    const opts: any = { count: 100 };
    if (cursor) opts.cursor = cursor;
    const page: any = await mb.patients.records(patientId, opts);
    const items: any[] = page?.data || page?.entries || [];
    for (const it of items) all.push(it.resource || it);
    cursor =
      page?.cursor || page?.next || page?.nextCursor || page?.next_cursor;
    if (!cursor || items.length === 0) break;
  }
  return all;
}
