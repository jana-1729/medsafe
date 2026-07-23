"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  RadioTower,
  TriangleAlert,
  Info,
  Loader2,
  ShieldCheck,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Alert = {
  id: string;
  severity: "danger" | "warning" | "info";
  title: string;
  detail: string;
  source: string;
  createdAt: string;
  kind: string;
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEV = {
  danger: {
    dot: "bg-red-500",
    wrap: "border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/25",
    icon: TriangleAlert,
    iconTint: "text-red-600 dark:text-red-400",
  },
  warning: {
    dot: "bg-amber-500",
    wrap: "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/25",
    icon: TriangleAlert,
    iconTint: "text-amber-600 dark:text-amber-400",
  },
  info: {
    dot: "bg-muted-foreground/40",
    wrap: "border-border bg-background",
    icon: Info,
    iconTint: "text-muted-foreground",
  },
} as const;

/** Watchtower alerts bell — polls for webhook-driven alerts, with a demo trigger. */
export function WatchtowerBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const seen = useRef<Set<string>>(new Set());
  const [unread, setUnread] = useState(0);

  const recompute = useCallback((list: Alert[]) => {
    setUnread(list.filter((a) => !seen.current.has(a.id)).length);
  }, []);

  const merge = useCallback(
    (incoming: Alert[]) => {
      setAlerts((prev) => {
        const byId = new Map(prev.map((a) => [a.id, a]));
        for (const a of incoming) byId.set(a.id, a);
        const next = [...byId.values()].sort((x, y) =>
          y.createdAt.localeCompare(x.createdAt),
        );
        recompute(next);
        return next;
      });
    },
    [recompute],
  );

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data?.alerts)) merge(data.alerts);
    } catch {
      /* ignore poll errors */
    }
  }, [merge]);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 8000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  useEffect(() => {
    if (open) {
      alerts.forEach((a) => seen.current.add(a.id));
      setUnread(0);
    }
  }, [open, alerts]);

  async function simulate() {
    setBusy(true);
    try {
      const res = await fetch("/api/alerts/simulate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      const created: Alert[] = data.alerts || [];
      merge(created);
      const top = created[0];
      if (top) {
        const fn =
          top.severity === "danger"
            ? toast.error
            : top.severity === "warning"
              ? toast.warning
              : toast.success;
        fn(top.title, { description: top.detail });
      }
    } catch (e: unknown) {
      toast.error("Simulation failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    setBusy(true);
    try {
      await fetch("/api/alerts", { method: "DELETE" });
      seen.current.clear();
      setAlerts([]);
      setUnread(0);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="icon" aria-label="Watchtower alerts" />}
      >
        <span className="relative inline-flex">
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unread}
            </span>
          ) : null}
        </span>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="flex items-center gap-2">
            <RadioTower className="size-4 text-emerald-600" />
            Watchtower
          </DialogTitle>
          <DialogDescription>
            Real-time monitoring — we re-check your record for new risks whenever
            any connected source syncs.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[52vh] space-y-2.5 overflow-y-auto p-4">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <ShieldCheck className="size-6" />
              </span>
              <p className="mt-3 font-medium">All clear</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                Watchtower is monitoring your connected records. You&apos;ll be
                alerted the moment a new prescription or result looks risky.
              </p>
            </div>
          ) : (
            alerts.map((a) => {
              const s = SEV[a.severity];
              const Icon = s.icon;
              return (
                <div
                  key={a.id}
                  className={cn(
                    "animate-in fade-in slide-in-from-top-1 rounded-xl border p-3 duration-300",
                    s.wrap,
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", s.iconTint)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-tight">
                          {a.title}
                        </h3>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {timeAgo(a.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground/80">{a.detail}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.source}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/40 p-3">
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={busy}>
            <Trash2 className="size-4" />
            Clear
          </Button>
          <Button size="sm" onClick={simulate} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Simulate new prescription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
