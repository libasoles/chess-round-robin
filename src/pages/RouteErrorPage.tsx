import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

type ErrorViewModel = {
  title: string;
  description: string;
  debugText: string;
  statusCode?: number;
};

function mapErrorToViewModel(error: unknown): ErrorViewModel {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: "No encontramos esta página",
        description:
          "Puede que el enlace esté roto o que la página haya sido movida.",
        debugText: `RouteErrorResponse { status: 404, statusText: ${error.statusText}, data: ${String(error.data)} }`,
        statusCode: 404,
      };
    }

    return {
      title: "No pudimos cargar este contenido",
      description: "Intenta recargar. Si el problema sigue, vuelve al inicio.",
      debugText: `RouteErrorResponse { status: ${error.status}, statusText: ${error.statusText}, data: ${String(error.data)} }`,
      statusCode: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      title: "Algo salió mal",
      description:
        "No nos lo esperábamos. Puedes reintentar la carga de página, o volver al inicio.",
      debugText: `${error.name}: ${error.message}\n${error.stack ?? "No stack trace available."}`,
    };
  }

  return {
    title: "Algo salió mal",
    description:
      "No nos lo esperábamos. Puedes reintentar la carga de página, o volver al inicio.",
    debugText: `Unknown error type: ${String(error)}`,
  };
}

export function RouteErrorPage() {
  const error = useRouteError();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const viewModel = useMemo(() => mapErrorToViewModel(error), [error]);

  useEffect(() => {
    console.error("[router:error-boundary]", {
      error,
      statusCode: viewModel.statusCode,
      path: window.location.pathname,
      search: window.location.search,
      timestamp: new Date().toISOString(),
    });
  }, [error, viewModel.statusCode]);

  return (
    <div className="min-h-svh flex flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 px-4 py-8 flex items-center justify-center">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <p className="text-sm text-muted-foreground">
            {viewModel.statusCode ? `Error ${viewModel.statusCode}` : "Ups!"}
          </p>
          <h1 className="mt-1 text-xl font-semibold">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {viewModel.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
            <Button variant="outline" render={<Link to="/" />}>
              Ir al inicio
            </Button>
            <Button variant="ghost" onClick={() => setDetailsOpen(true)}>
              Ver detalle técnico
            </Button>
          </div>
        </section>
      </main>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle técnico</DialogTitle>
            <DialogDescription>
              Este detalle puede ayudarte a reportar el problema. La información
              completa ya se registró en consola.
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-left text-xs whitespace-pre-wrap break-words">
            {viewModel.debugText}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
