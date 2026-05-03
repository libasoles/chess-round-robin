import type { PropsWithChildren } from "react";

export function MatchResultStatus({ children }: PropsWithChildren) {
  return (
    <div className="mt-1 w-full text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
