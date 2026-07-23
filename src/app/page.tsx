import Link from "next/link";
import type { ReactNode } from "react";
import {
  ShieldCheck,
  Link2,
  ListChecks,
  TriangleAlert,
  Lock,
  Sparkles,
  TrendingDown,
  Syringe,
  HeartPulse,
  Pill,
  Activity,
  ClipboardList,
  RadioTower,
  Stethoscope,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: Link2,
    title: "Connect once",
    body: "Securely link your hospital and clinic portals. We never see your passwords — the login happens on the health system's own page.",
  },
  {
    icon: ListChecks,
    title: "See one honest list",
    body: "Every medication from every source, merged into a single list — including the pills different doctors don't know about.",
  },
  {
    icon: TriangleAlert,
    title: "Catch the danger",
    body: "We flag risky combinations, duplicates, and gaps in plain language — so you can bring them to your doctor.",
  },
];

const FEATURES: {
  icon: LucideIcon;
  title: string;
  body: string;
  who: "Patient" | "Clinician";
}[] = [
  {
    icon: Pill,
    title: "One honest medication list",
    body: "Every med from every source, merged and de-duplicated — with interaction and duplicate checks.",
    who: "Patient",
  },
  {
    icon: Sparkles,
    title: "Ask your records (AI)",
    body: "Chat with your health history — answers grounded only in your data, with sources cited.",
    who: "Patient",
  },
  {
    icon: Activity,
    title: "Lab & vital trends",
    body: "Your results charted over time, with out-of-range flags.",
    who: "Patient",
  },
  {
    icon: HeartPulse,
    title: "Preventive care",
    body: "Overdue screenings and vaccines, checked against common guidelines.",
    who: "Patient",
  },
  {
    icon: ClipboardList,
    title: "Recovery companion",
    body: "After a hospital visit: what to take, what changed, and when to get help.",
    who: "Patient",
  },
  {
    icon: RadioTower,
    title: "Watchtower alerts",
    body: "Real-time monitoring — flagged the moment any source adds a risky prescription.",
    who: "Patient",
  },
  {
    icon: Stethoscope,
    title: "Point-of-care safety",
    body: "Cross-source interaction checks delivered to the prescriber via CDS Hooks, at order time.",
    who: "Clinician",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex-1">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-gradient-to-b from-emerald-50 via-emerald-50/40 to-transparent dark:from-emerald-950/25 dark:via-emerald-950/10"
      />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-16 pb-12 text-center sm:px-6 sm:pt-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          Powered by connected health records
        </div>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          One honest list of every medication you take.
        </h1>

        <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
          Your prescriptions are scattered across hospitals, clinics, and
          pharmacies — and no single doctor sees the whole picture. MedSafe
          brings them together and checks for dangerous combinations.
        </p>

        {error ? (
          <Alert variant="destructive" className="mt-8 text-left">
            <TriangleAlert className="size-4" />
            <AlertTitle>Couldn&apos;t start the connection</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-8 w-full max-w-md">
          <form
            action="/api/connect"
            method="POST"
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              name="id"
              required
              autoComplete="off"
              placeholder="Choose your MedSafe ID (name or email)"
              className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 sm:flex-1"
            />
            <Button type="submit" size="lg" className="h-12 px-6 text-base">
              Connect
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3" />
              Read-only, revocable — we never see your password
            </span>
            <span aria-hidden>·</span>
            <Link
              href="/api/use-demo"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Explore the demo →
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Catches</span>
            <Badge variant="outline" className="font-normal">warfarin + aspirin</Badge>
            <Badge variant="outline" className="font-normal">duplicate prescriptions</Badge>
            <Badge variant="outline" className="font-normal">drug + supplement clashes</Badge>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything from one connection
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-pretty text-sm text-muted-foreground">
            Connect once, and your records become an assistant, a safety net,
            and a health dashboard — all grounded in real data.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Ask AI */}
          <div>
            <Caption
              icon={Sparkles}
              tint="text-violet-600 dark:text-violet-400"
              title="Ask your records"
              body="Chat with your health history — answers grounded in your data, with sources cited."
            />
            <Frame label="MedSafe · Ask AI">
              <div className="space-y-2.5">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-primary px-3 py-2 text-xs text-primary-foreground">
                    What medications am I on?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl bg-muted px-3 py-2 text-xs leading-relaxed">
                    You&apos;re currently taking two medications:
                    <div className="mt-1 flex gap-1.5">
                      <span className="text-muted-foreground">•</span>
                      <span>
                        <strong>Warfarin 5 MG</strong> — Dr. Reyes{" "}
                        <span className="text-muted-foreground">
                          (from your medications)
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-muted-foreground">•</span>
                      <span>
                        <strong>Aspirin 81 MG</strong> — Dr. Ortiz
                      </span>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      Please discuss any changes with your doctor.
                    </div>
                  </div>
                </div>
              </div>
            </Frame>
          </div>

          {/* Medication safety */}
          <div>
            <Caption
              icon={TriangleAlert}
              tint="text-red-600 dark:text-red-400"
              title="Catch dangerous combinations"
              body="Flags risky drug pairs, duplicates, and OTC clashes no single doctor sees."
            />
            <Frame label="MedSafe · Medications">
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 dark:border-red-900/60 dark:bg-red-950/25">
                <div className="flex flex-wrap items-center gap-2">
                  <TriangleAlert className="size-4 text-red-600 dark:text-red-400" />
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    High risk
                  </span>
                  <span className="text-sm font-semibold">Warfarin + Aspirin</span>
                </div>
                <p className="mt-2 text-xs text-foreground/80">
                  Both thin the blood. Together they sharply raise the risk of
                  serious bleeding.
                </p>
                <div className="mt-2 flex gap-1.5">
                  <span className="rounded-md bg-background px-2 py-0.5 text-[11px]">
                    Warfarin 5 MG
                  </span>
                  <span className="rounded-md bg-background px-2 py-0.5 text-[11px]">
                    Aspirin 81 MG
                  </span>
                </div>
              </div>
            </Frame>
          </div>

          {/* Lab trends */}
          <div>
            <Caption
              icon={TrendingDown}
              tint="text-emerald-600 dark:text-emerald-400"
              title="See your trends"
              body="Lab and vital results charted over time, with out-of-range flags."
            />
            <Frame label="MedSafe · Labs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">Hemoglobin A1c</div>
                  <div className="text-xs text-muted-foreground">
                    5 readings · latest 2026-06-18
                  </div>
                </div>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                  Above range
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  6.7
                </span>
                <span className="text-xs text-muted-foreground">%</span>
                <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  <TrendingDown className="size-3" />
                  -1.4 since first
                </span>
              </div>
              <svg viewBox="0 0 300 84" className="mt-2 h-20 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="a1cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="34" x2="300" y2="34" stroke="#10b981" strokeDasharray="5 5" strokeOpacity="0.4" />
                <path d="M0,12 L75,26 L150,40 L225,52 L300,58 L300,84 L0,84 Z" fill="url(#a1cGrad)" />
                <path d="M0,12 L75,26 L150,40 L225,52 L300,58" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </Frame>
          </div>

          {/* Prevention */}
          <div>
            <Caption
              icon={HeartPulse}
              tint="text-amber-600 dark:text-amber-400"
              title="Never miss preventive care"
              body="Overdue screenings and vaccines, checked against guidelines."
            />
            <Frame label="MedSafe · Prevention">
              <div className="space-y-2">
                <PreventionRow label="Influenza (flu) vaccine" status="Overdue" />
                <PreventionRow label="Cholesterol screening" status="Overdue" />
                <PreventionRow label="Tetanus booster (Tdap)" status="Up to date" />
              </div>
            </Frame>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything in one place
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-pretty text-sm text-muted-foreground">
            One connection powers a full companion for patients — and a safety
            net for the clinicians who treat them.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-background p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <f.icon className="size-[18px] text-foreground" />
                </span>
                <Badge
                  variant={f.who === "Clinician" ? "secondary" : "outline"}
                  className="font-normal"
                >
                  {f.who === "Clinician" ? "For clinicians" : "For patients"}
                </Badge>
              </div>
              <h3 className="mt-3 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-background p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <HeartHandshake className="size-5 text-emerald-600" />
              For patients
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect once and understand your whole record — medications, labs,
              conditions, and history — plus plain-language answers and real-time
              safety alerts. It&apos;s decision support, never a replacement for
              your doctor.
            </p>
            <Link
              href="/api/use-demo"
              className="mt-3 inline-block text-sm font-medium underline underline-offset-2"
            >
              Explore the patient app →
            </Link>
          </div>
          <div className="rounded-2xl border bg-background p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <Stethoscope className="size-5 text-sky-600" />
              For clinicians
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              See the medications your EHR can&apos;t — assembled across every
              connected source — surfaced as a CDS Hooks card at the moment you
              prescribe, so cross-source interactions are caught before the order
              is signed.
            </p>
            <Link
              href="/clinician?demo=1"
              className="mt-3 inline-block text-sm font-medium underline underline-offset-2"
            >
              Open the clinician view →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-20 sm:px-6 sm:pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="rounded-xl border bg-background p-5 text-left"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted">
                <s.icon className="size-[18px] text-foreground" />
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Step {i + 1}
              </div>
              <h3 className="mt-0.5 font-medium">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          MedSafe is a decision-support demo, not medical advice. Interaction
          checks cover common high-risk combinations only. Always confirm with
          your doctor or pharmacist before changing any medication.
        </p>
        <p className="mt-4 text-center text-xs">
          <Link
            href="/clinician?demo=1"
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            For clinicians — see the point-of-care CDS Hooks view →
          </Link>
        </p>
      </section>
    </main>
  );
}

/** A macOS-style window frame used to present feature previews as "screenshots". */
function Frame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 truncate text-[11px] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Caption({
  icon: Icon,
  tint,
  title,
  body,
}: {
  icon: LucideIcon;
  tint: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className={cn("size-4", tint)} />
      </span>
      <div>
        <h3 className="font-semibold leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function PreventionRow({ label, status }: { label: string; status: string }) {
  const overdue = status === "Overdue";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2",
        overdue
          ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/25"
          : "bg-background",
      )}
    >
      <Syringe
        className={cn(
          "size-4",
          overdue
            ? "text-amber-600 dark:text-amber-400"
            : "text-emerald-600 dark:text-emerald-400",
        )}
      />
      <span className="flex-1 text-xs font-medium">{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
          overdue
            ? "bg-amber-500 text-white"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
        )}
      >
        {status}
      </span>
    </div>
  );
}
