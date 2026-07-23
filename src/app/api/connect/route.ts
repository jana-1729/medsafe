import { NextRequest, NextResponse } from "next/server";
import { initSession } from "@/lib/medblocks";
import { getPatientId, slugifyId, PATIENT_COOKIE } from "@/lib/patient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 90, // 90 days
};

/**
 * GET /api/connect
 * Re-connect / add records for the current patient (id from cookie/env).
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  try {
    const patientId = await getPatientId();
    const url = await initSession(`${origin}/connected`, patientId);
    return NextResponse.redirect(url, 302);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(message)}`,
      302,
    );
  }
}

/**
 * POST /api/connect
 * Start a session for a user-chosen id (from the landing form), remember it in
 * a cookie, then redirect into the hosted connect flow.
 */
export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;
  try {
    const form = await req.formData();
    const raw = String(form.get("id") || "");
    const patientId = slugifyId(raw);

    const url = await initSession(`${origin}/connected`, patientId);
    const res = NextResponse.redirect(url, 303);
    res.cookies.set(PATIENT_COOKIE, patientId, COOKIE_OPTS);
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(message)}`,
      303,
    );
  }
}
