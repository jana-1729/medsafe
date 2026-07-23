import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_PATIENT_ID } from "@/lib/medblocks";

export const PATIENT_COOKIE = "mb_patient_id";

/**
 * Resolve the current patient id: the per-user id stored in a cookie when they
 * chose one, otherwise the env fallback (`demo-patient`). This is what makes
 * MedSafe multi-user without breaking any existing demo flow.
 */
export async function getPatientId(): Promise<string> {
  try {
    const store = await cookies();
    return store.get(PATIENT_COOKIE)?.value || DEFAULT_PATIENT_ID;
  } catch {
    return DEFAULT_PATIENT_ID;
  }
}

/** Turn free-form user input into a safe Medblocks patient id. */
export function slugifyId(raw: string): string {
  return (
    raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || DEFAULT_PATIENT_ID
  );
}
