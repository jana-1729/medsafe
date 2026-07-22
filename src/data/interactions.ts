/**
 * Curated, INGREDIENT-LEVEL interaction rules.
 *
 * SCOPE (be honest): this is a hand-built list of well-known, high-risk
 * combinations for demonstration — it is NOT an exhaustive medical interaction
 * database. Production use would license a source like DrugBank / First Databank.
 * The app always frames findings as "discuss with your doctor/pharmacist".
 *
 * Matching is done on the normalized `ingredient` token (see lib/normalize.ts),
 * order-independent.
 */
export interface InteractionRule {
  a: string;
  b: string;
  severity: "danger" | "warning";
  /** what can happen, plain language */
  risk: string;
  /** action framing */
  advice: string;
}

export const INTERACTIONS: InteractionRule[] = [
  {
    a: "warfarin",
    b: "aspirin",
    severity: "danger",
    risk: "Both thin the blood. Together they sharply raise the risk of serious bleeding.",
    advice: "This combination is often prescribed on purpose — but only under supervision. Confirm both of your doctors know you take both.",
  },
  {
    a: "warfarin",
    b: "ibuprofen",
    severity: "danger",
    risk: "Ibuprofen (an NSAID) adds bleeding risk on top of warfarin and can irritate the stomach.",
    advice: "Ask your doctor before taking ibuprofen while on warfarin; acetaminophen is often preferred for pain.",
  },
  {
    a: "warfarin",
    b: "naproxen",
    severity: "danger",
    risk: "Naproxen (an NSAID) increases bleeding risk when combined with warfarin.",
    advice: "Check with your doctor or pharmacist before using naproxen on warfarin.",
  },
  {
    a: "warfarin",
    b: "clopidogrel",
    severity: "danger",
    risk: "Two blood thinners together greatly increase bleeding risk.",
    advice: "Make sure a single doctor is coordinating both of these.",
  },
  {
    a: "aspirin",
    b: "clopidogrel",
    severity: "warning",
    risk: "Two antiplatelet drugs together raise bleeding risk (sometimes intended after a stent).",
    advice: "Confirm this dual therapy is intentional and for how long.",
  },
  {
    a: "aspirin",
    b: "ibuprofen",
    severity: "warning",
    risk: "Ibuprofen can block aspirin's heart-protective effect and adds stomach/bleeding risk.",
    advice: "If you take aspirin for your heart, ask about timing/spacing from ibuprofen.",
  },
  {
    a: "drospirenone",
    b: "ibuprofen",
    severity: "warning",
    risk: "Your birth control (drospirenone) can raise blood potassium; NSAIDs like ibuprofen do too. Together potassium can climb too high.",
    advice: "Occasional use is usually fine — mention regular NSAID use to your doctor, who may check your potassium.",
  },
  {
    a: "drospirenone",
    b: "naproxen",
    severity: "warning",
    risk: "Drospirenone plus regular naproxen (an NSAID) can push blood potassium higher than is safe.",
    advice: "Tell your doctor if you use naproxen regularly; a potassium check may be advised.",
  },
  {
    a: "lisinopril",
    b: "spironolactone",
    severity: "danger",
    risk: "Both raise blood potassium. Together they can cause dangerously high potassium (heart rhythm risk).",
    advice: "This needs blood-potassium monitoring — confirm your doctor is tracking it.",
  },
  {
    a: "lisinopril",
    b: "ibuprofen",
    severity: "warning",
    risk: "NSAIDs like ibuprofen can reduce how well lisinopril works and strain the kidneys.",
    advice: "Limit regular NSAID use on lisinopril; ask your doctor about alternatives.",
  },
  {
    a: "lisinopril",
    b: "potassium",
    severity: "danger",
    risk: "Lisinopril raises potassium; a potassium supplement adds more — risk of dangerously high levels.",
    advice: "Don't take potassium supplements on lisinopril unless your doctor specifically told you to.",
  },
  {
    a: "simvastatin",
    b: "clarithromycin",
    severity: "danger",
    risk: "This antibiotic spikes simvastatin levels, raising the risk of severe muscle damage (rhabdomyolysis).",
    advice: "Doctors usually pause the statin during this antibiotic — confirm with your pharmacist.",
  },
  {
    a: "simvastatin",
    b: "amiodarone",
    severity: "danger",
    risk: "Amiodarone raises simvastatin levels and the risk of muscle injury.",
    advice: "A lower statin dose or a different statin is often needed — ask your doctor.",
  },
  {
    a: "sildenafil",
    b: "nitroglycerin",
    severity: "danger",
    risk: "Together they can cause a sudden, dangerous drop in blood pressure.",
    advice: "Never combine without explicit medical guidance.",
  },
  {
    a: "tramadol",
    b: "sertraline",
    severity: "warning",
    risk: "Both raise serotonin; together there is a risk of serotonin syndrome (agitation, high heart rate, tremor).",
    advice: "Watch for symptoms and make sure both prescribers know about the other drug.",
  },
  {
    a: "sertraline",
    b: "ibuprofen",
    severity: "warning",
    risk: "SSRIs like sertraline plus NSAIDs like ibuprofen increase stomach-bleeding risk.",
    advice: "Ask about stomach protection or an alternative pain reliever if used often.",
  },
  {
    a: "sertraline",
    b: "fluoxetine",
    severity: "danger",
    risk: "Two SSRIs together significantly raise the risk of serotonin syndrome.",
    advice: "Rarely intended — confirm you're not accidentally taking two antidepressants.",
  },
  {
    a: "digoxin",
    b: "amiodarone",
    severity: "danger",
    risk: "Amiodarone raises digoxin levels, which can cause toxicity (nausea, rhythm problems).",
    advice: "Digoxin dose is usually reduced and levels checked — confirm with your doctor.",
  },
  {
    a: "metformin",
    b: "contrast",
    severity: "warning",
    risk: "Metformin with imaging contrast dye can rarely stress the kidneys.",
    advice: "Metformin is often held around contrast imaging — follow your care team's instructions.",
  },
];
