import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TIEBREAK_INFO } from "@/domain/tiebreakInfo";
import { Info } from "lucide-react";
import { useState } from "react";

export function TiebreakInfo() {
  const [tiebreakInfoOpen, setTiebreakInfoOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setTiebreakInfoOpen(true)}
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Ver explicación de desempates"
      >
        <Info className="h-4 w-4" />
      </button>

      <Dialog open={tiebreakInfoOpen} onOpenChange={setTiebreakInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-chart-2">Desempates</DialogTitle>
            <DialogDescription>
              Cuando dos o más participantes terminan con los mismos puntos,
              estos criterios se prueban en el orden configurado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {Object.values(TIEBREAK_INFO).map((info) => (
              <section key={info.shortLabel} className="space-y-1">
                <h3 className="font-medium text-chart-1">
                  {info.shortLabel} - {info.name}
                </h3>
                <p className="text-muted-foreground">{info.description}</p>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
