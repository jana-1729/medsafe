import { NextResponse } from "next/server";
import { getAlerts, clearAlerts } from "@/lib/watchtower";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/alerts — current Watchtower alerts. */
export async function GET() {
  return NextResponse.json({ alerts: getAlerts() });
}

/** DELETE /api/alerts — clear all alerts (demo reset). */
export async function DELETE() {
  clearAlerts();
  return NextResponse.json({ ok: true });
}
