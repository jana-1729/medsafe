import { Hospital } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Row of connected-source chips. */
export function SourceBadges({ sources }: { sources: string[] }) {
  if (sources.length === 0) {
    return <span className="text-sm text-muted-foreground">No sources connected</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sources.map((s, i) => (
        <Badge key={`${s}-${i}`} variant="outline" className="gap-1 font-normal">
          <Hospital className="size-3" />
          {s}
        </Badge>
      ))}
    </div>
  );
}
