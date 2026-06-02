import { Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDateDayMonth } from "@/lib/formatters";

type BirthdayDateBadgeProps = {
  data: string;
  hoje?: boolean;
};

export function BirthdayDateBadge({ data, hoje = false }: BirthdayDateBadgeProps) {
  return (
    <Badge variant={hoje ? "default" : "secondary"} className="gap-1 text-xs font-normal">
      <Calendar className="h-3 w-3 shrink-0" aria-hidden />
      {formatDateDayMonth(data)}
    </Badge>
  );
}
