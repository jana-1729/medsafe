import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, DEFAULT_PATIENT_ID } from "@/lib/medblocks";
import { generateAlertsFromSync } from "@/lib/watchtower";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/medblocks
 * Receives Medblocks webhook events. On `records.sync.completed`, re-runs the
 * safety engine and raises Watchtower alerts. Must return 2xx quickly.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("medblocks-signature");

  let event: {
    type?: string;
    id?: string;
    patient_id?: string;
    data?: { patient_id?: string };
  };
  try {
    event = constructWebhookEvent(raw, signature);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Invalid signature: ${message}` }, { status: 400 });
  }

  try {
    if (event?.type === "records.sync.completed") {
      const patientId =
        event.data?.patient_id || event.patient_id || DEFAULT_PATIENT_ID;
      // fire-and-forget style, but await so alerts exist before we ack in dev
      await generateAlertsFromSync(patientId);
    }
    // Other events (patient_session.completed, connection.token_refresh_failed,
    // records.sync.failed) are acknowledged; handlers can be added here.
    return NextResponse.json({ received: true, type: event?.type ?? null });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    // still 200 so Medblocks doesn't retry a processing error indefinitely
    return NextResponse.json({ received: true, warning: message });
  }
}
