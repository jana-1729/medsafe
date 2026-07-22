import type {
  CareGap,
  ImmunizationItem,
  LabSeries,
  Medication,
  PatientInfo,
  ProblemItem,
} from "@/lib/types";

/**
 * Preventive-care engine. Pure function: evaluates the patient's record against
 * a curated set of common screening / vaccine / monitoring guidelines and
 * returns the gaps.
 *
 * SCOPE (honest): a demonstration subset of USPSTF/CDC-style recommendations,
 * not a complete or personalized guideline set. Always framed as "discuss with
 * your doctor" — it flags what may be worth asking about, not clinical orders.
 */

interface Dated {
  date?: string;
}

function monthsSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return (
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth())
  );
}

function latestDate(items: Dated[]): string | undefined {
  return items
    .map((i) => i.date)
    .filter((d): d is string => !!d)
    .sort()
    .pop();
}

export function evaluateCareGaps(
  patient: PatientInfo,
  data: {
    conditions: ProblemItem[];
    immunizations: ImmunizationItem[];
    labs: LabSeries[];
    meds: Medication[];
  },
): CareGap[] {
  const { conditions, immunizations, labs, meds } = data;
  const age = patient.age;
  const sex = (patient.sex || "").toLowerCase();

  const imm = (re: RegExp) =>
    immunizations.filter((i) => re.test(i.name.toLowerCase()));
  const lab = (re: RegExp) => labs.filter((s) => re.test(s.name.toLowerCase()));
  const cond = (re: RegExp) =>
    conditions.filter((c) => re.test(c.name.toLowerCase()));
  const med = (re: RegExp) =>
    meds.filter((m) => re.test(`${m.name} ${m.ingredient}`.toLowerCase()));

  // The Patient resource isn't always in the pull. If sex is missing, infer it
  // softly from unambiguous record signals so sex-specific guidance can apply.
  let isFemale = sex.startsWith("f");
  if (!sex) {
    const femaleSignal =
      cond(/ovar|cervical|uterus|uterine|pregnan|menopaus|pcos|polycystic|breast/)
        .length > 0 ||
      med(/drospirenone|ethinyl|estradiol|contracept|levonorgestrel/).length > 0;
    if (femaleSignal) isFemale = true;
  }

  const gaps: CareGap[] = [];
  const add = (g: CareGap) => gaps.push(g);

  // ---- Vaccines ---------------------------------------------------------
  {
    const last = latestDate(imm(/influenza|flu/));
    const ok = last != null && (monthsSince(last) ?? 999) < 12;
    add({
      id: "flu",
      title: "Influenza (flu) vaccine",
      category: "Vaccine",
      status: ok ? "up-to-date" : "overdue",
      reason: "Recommended every year for all adults.",
      detail: ok
        ? `Last given ${last}.`
        : "No flu vaccine found in the last 12 months.",
      advice: "Ask your pharmacy or clinic about this season's flu shot.",
      lastDone: last,
    });
  }
  {
    const last = latestDate(imm(/tdap|tetanus|td /));
    const ok = last != null && (monthsSince(last) ?? 999) < 120;
    add({
      id: "tdap",
      title: "Tetanus booster (Td/Tdap)",
      category: "Vaccine",
      status: ok ? "up-to-date" : "overdue",
      reason: "Recommended every 10 years.",
      detail: ok
        ? `Last given ${last}.`
        : "No tetanus booster found in the last 10 years.",
      advice: "Confirm your tetanus booster is current with your provider.",
      lastDone: last,
    });
  }
  {
    const last = latestDate(imm(/covid|sars-cov-2/));
    const ok = last != null && (monthsSince(last) ?? 999) < 12;
    add({
      id: "covid",
      title: "COVID-19 vaccine",
      category: "Vaccine",
      status: ok ? "up-to-date" : "overdue",
      reason: "An updated dose is recommended for most adults.",
      detail: ok
        ? `Last given ${last}.`
        : "No recent COVID-19 vaccination found.",
      advice: "Ask whether an updated COVID-19 dose is recommended for you.",
      lastDone: last,
    });
  }

  // ---- Monitoring -------------------------------------------------------
  {
    const last = latestDate(
      lab(/blood pressure|systolic|diastolic|\bbp\b/).map((s) => ({
        date: s.latestDate,
      })),
    );
    const ok = last != null && (monthsSince(last) ?? 999) < 12;
    add({
      id: "bp",
      title: "Blood pressure check",
      category: "Monitoring",
      status: ok ? "up-to-date" : "overdue",
      reason: "Adults should have blood pressure checked at least yearly.",
      detail: ok
        ? `Last recorded ${last}.`
        : "No blood-pressure reading found in the last year.",
      advice: "A quick BP check at any visit or pharmacy covers this.",
      lastDone: last,
    });
  }
  {
    const last = latestDate(
      lab(/cholesterol|ldl|hdl|lipid/).map((s) => ({ date: s.latestDate })),
    );
    const ok = last != null && (monthsSince(last) ?? 999) < 60;
    add({
      id: "lipids",
      title: "Cholesterol (lipid) screening",
      category: "Monitoring",
      status: ok ? "up-to-date" : "overdue",
      reason: "Recommended for adults roughly every 4–6 years.",
      detail: ok
        ? `Last panel ${last}.`
        : "No cholesterol/lipid panel found on record.",
      advice: "A simple blood test — ask your doctor to include a lipid panel.",
      lastDone: last,
    });
  }
  if (cond(/obesity|overweight|\bbmi\b|body mass/).length > 0) {
    const last = latestDate(
      lab(/weight|bmi|body mass/).map((s) => ({ date: s.latestDate })),
    );
    const ok = last != null && (monthsSince(last) ?? 999) < 12;
    add({
      id: "weight",
      title: "Weight & BMI monitoring",
      category: "Monitoring",
      status: ok ? "up-to-date" : "overdue",
      reason: "Your record lists an overweight/obesity diagnosis.",
      detail: ok
        ? `Weight last recorded ${last}.`
        : "No recent weight or BMI measurement found on record.",
      advice:
        "Ask for a weight/BMI check and whether lifestyle or other support could help.",
      lastDone: last,
    });
  }
  if (cond(/diabetes|diabetic|type 2|type ii/).length > 0) {
    const last = latestDate(
      lab(/a1c|hemoglobin a1c|hba1c/).map((s) => ({ date: s.latestDate })),
    );
    const ok = last != null && (monthsSince(last) ?? 999) < 6;
    add({
      id: "a1c",
      title: "Diabetes A1c monitoring",
      category: "Monitoring",
      status: ok ? "up-to-date" : "overdue",
      reason: "You have a diabetes diagnosis; A1c is checked every 3–6 months.",
      detail: ok ? `Last A1c ${last}.` : "No recent A1c result found.",
      advice: "Ask your doctor to recheck your A1c.",
      lastDone: last,
    });
  }
  // estrogen-containing contraceptive → periodic BP review
  if (med(/drospirenone|ethinyl|estradiol|contracept/).length > 0) {
    add({
      id: "contraceptive-bp",
      title: "Blood pressure review on hormonal contraception",
      category: "Monitoring",
      status: "up-to-date",
      reason: "You're on a hormonal contraceptive, which can raise blood pressure.",
      detail: "Your clinician should recheck blood pressure periodically.",
      advice: "Mention any headaches or leg swelling; keep BP checks routine.",
    });
  }

  // ---- Screenings (age / sex gated) ------------------------------------
  if (typeof age === "number" && age >= 45 && age <= 75) {
    const done = lab(/colon|colorectal|cologuard|fit test/).length > 0;
    add({
      id: "colorectal",
      title: "Colorectal cancer screening",
      category: "Screening",
      status: done ? "up-to-date" : "overdue",
      reason: `Recommended for adults 45–75 (you're ${age}).`,
      detail: done
        ? "A colorectal screening is on record."
        : "No colonoscopy or stool-based test found on record.",
      advice: "Ask your doctor which screening option fits you (colonoscopy or stool test).",
    });
  }
  if (isFemale && typeof age === "number" && age >= 21 && age <= 65) {
    const done = lab(/pap|cervical|hpv/).length > 0;
    add({
      id: "cervical",
      title: "Cervical cancer screening (Pap/HPV)",
      category: "Screening",
      status: done ? "up-to-date" : "overdue",
      reason: `Recommended for women 21–65 (you're ${age}).`,
      detail: done
        ? "A cervical screening is on record."
        : "No Pap/HPV screening found on record.",
      advice: "Ask your gynecologist when your next Pap/HPV test is due.",
    });
  }
  if (isFemale && typeof age === "number" && age >= 40 && age <= 74) {
    const done = lab(/mammogram|breast/).length > 0;
    add({
      id: "mammogram",
      title: "Breast cancer screening (mammogram)",
      category: "Screening",
      status: done ? "up-to-date" : "overdue",
      reason: `Recommended for women 40–74 (you're ${age}).`,
      detail: done
        ? "A mammogram is on record."
        : "No mammogram found on record.",
      advice: "Ask your doctor about scheduling a screening mammogram.",
    });
  }

  // overdue first, then by category
  const order = { overdue: 0, "up-to-date": 1 } as const;
  return gaps.sort((a, b) => order[a.status] - order[b.status]);
}

/** Summary counts for the header. */
export function summarizeCare(gaps: CareGap[]) {
  return {
    overdue: gaps.filter((g) => g.status === "overdue").length,
    upToDate: gaps.filter((g) => g.status === "up-to-date").length,
    total: gaps.length,
  };
}
