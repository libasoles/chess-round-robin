import { brand } from "@/lib/brand";

interface SharedTournamentStateProps {
  alt: string;
  children: React.ReactNode;
}

export function SharedTournamentState({
  alt,
  children,
}: SharedTournamentStateProps) {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center gap-3 text-center">
      <img
        src={brand.logoPath}
        alt={alt}
        className="h-28 w-auto select-none md:h-36"
      />
      <p className="empty-history-text text-muted-foreground text-base md:text-lg">
        {children}
      </p>
    </div>
  );
}
