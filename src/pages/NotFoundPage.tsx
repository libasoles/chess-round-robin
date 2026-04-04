import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="flex min-h-[70svh] flex-col items-center justify-center gap-3 text-center">
        <img
          src="/empty.png"
          alt="Página no encontrada"
          className="h-44 w-auto select-none md:h-52"
          loading="lazy"
        />
        <p className="empty-history-text text-muted-foreground text-base md:text-lg">
          No encontramos el torneo.
          <br />
          Quizás fue borrado.
        </p>
        <Button className="mt-2 h-11 px-6" onClick={() => navigate("/")}>
          Volver al inicio
        </Button>
      </div>
    </AppShell>
  );
}
