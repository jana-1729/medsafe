import { NextRequest, NextResponse } from "next/server";
import { initSession } from "@/lib/medblocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/connect
 * Starts a Medblocks hosted connect session and redirects the patient to the
 * EHR picker. On completion Medblocks returns them to /connected.
 */
export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin;
    const url = await initSession(`${origin}/connected`);
    return NextResponse.redirect(url, 302);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const origin = req.nextUrl.origin;
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(message)}`,
      302,
    );
  }
}
