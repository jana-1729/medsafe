import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_PATIENT_ID } from "@/lib/medblocks";
import { PATIENT_COOKIE } from "@/lib/patient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/use-demo
 * Switch to the pre-connected sandbox patient and open the dashboard in demo
 * mode — a one-click way to explore without connecting a real portal.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const res = NextResponse.redirect(`${origin}/connected?demo=1`, 302);
  res.cookies.set(PATIENT_COOKIE, DEFAULT_PATIENT_ID, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
