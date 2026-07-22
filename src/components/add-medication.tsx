"use client";

import { Plus, Check, PlusCircle } from "lucide-react";
import { OTC_OPTIONS, type OtcOption } from "@/data/otc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Quick-add over-the-counter meds & supplements. These live in NO health
 * record, so the patient is the only source — and they drive the most common
 * real interactions.
 */
export function AddMedication({
  addedIngredients,
  onToggle,
}: {
  addedIngredients: Set<string>;
  onToggle: (opt: OtcOption) => void;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <PlusCircle className="size-4 text-sky-600" />
        Add what you actually take
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Over-the-counter drugs and supplements aren&apos;t in any health record —
        but they cause many interactions. Add yours to check.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {OTC_OPTIONS.map((opt) => {
          const added = addedIngredients.has(opt.ingredient);
          return (
            <Button
              key={opt.ingredient}
              size="sm"
              variant={added ? "default" : "outline"}
              className={cn("h-8 rounded-full", added && "pr-2.5")}
              onClick={() => onToggle(opt)}
            >
              {added ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
