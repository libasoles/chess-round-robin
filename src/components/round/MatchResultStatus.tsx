import type { PropsWithChildren } from "react";

export function MatchResultStatus({ children }: PropsWithChildren) {
  return (
    <p className="text-sm text-muted-foreground mt-1 text-center">{children}</p>
  );
}
