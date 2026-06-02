import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MobileTableWrapProps = {
  children: ReactNode;
  className?: string;
  minWidthClass?: string;
};

/** Envolve tabelas largas com scroll horizontal em telas estreitas. */
export function MobileTableWrap({
  children,
  className,
  minWidthClass = "min-w-[32rem]",
}: MobileTableWrapProps) {
  return (
    <div className={cn("-mx-1 overflow-x-auto sm:mx-0", className)}>
      <div className={cn("w-full", minWidthClass)}>{children}</div>
    </div>
  );
}
