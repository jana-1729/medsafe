import { Loader2, ShieldPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the server pulls records — no dead air during the live demo. */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <ShieldPlus className="size-6" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="size-4 animate-spin" />
          Pulling your records from connected sources…
        </div>
        <p className="max-w-sm text-xs text-muted-foreground">
          Merging every medication into one list and checking for interactions.
          This takes a few seconds.
        </p>
      </div>

      <Skeleton className="h-24 rounded-3xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
