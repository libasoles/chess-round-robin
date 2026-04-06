import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { useState } from "react";

function B({ children }: { children: React.ReactNode }) {
  return <span className="text-chart-2 font-medium">{children}</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-chart-1">{children}</h3>;
}

const TIEBREAK_ARTICLE =
  "https://thezugzwangblog.com/reglas-de-desempate-en-ajedrez/";

function TiebreakLink({
  hash,
  children,
}: {
  hash: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`${TIEBREAK_ARTICLE}${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-chart-4 font-medium underline underline-offset-2"
    >
      {children}
    </a>
  );
}

export function InfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden p-1 text-muted-foreground hover:text-foreground"
        aria-label="¿Cómo funciona?"
      >
        <Info className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={true}
          className="inset-0 translate-x-0 translate-y-0 top-0 left-0 h-dvh max-h-none w-screen max-w-none rounded-none overflow-y-auto flex flex-col"
        >
          <DialogHeader>
            <DialogTitle>¿Cómo funciona?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <section className="space-y-1">
              <SectionTitle>Emparejamientos</SectionTitle>
              <p>
                Las <B>partidas</B> se asignan automáticamente usando el método
                de la{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Round-robin_tournament#Berger_tables"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-chart-4 font-medium underline underline-offset-2"
                >
                  rueda de Berger
                </a>
                . Cada <B>participante</B> se enfrenta a todos los demás
                exactamente una vez, y los <B>colores</B> (blancas/negras)
                quedan equilibrados.
              </p>
            </section>
            <section className="space-y-1">
              <SectionTitle>Grupos</SectionTitle>
              <p>
                Puedes dividir el <B>torneo</B> en <B>grupos</B> más pequeños.
                El sistema distribuye automáticamente los participantes para que
                los
                <B> grupos</B> queden equilibrados.
              </p>
              <p>Por ejemplo, con una configuración de grupos de máximo 4:</p>
              <ul className="mt-2 space-y-1 list-none text-sm">
                <li>
                  <span className="text-foreground">
                    7 <B>participantes</B>:
                  </span>{" "}
                  se crean 2 grupos (uno de 4, otro de 3)
                </li>
                <li>
                  <span className="text-foreground">
                    10 <B>participantes</B>:
                  </span>{" "}
                  se crean 3 grupos (uno de 4, dos de 3)
                </li>
              </ul>
              <p>Excepción:</p>
              <ul className="mt-2 space-y-1 list-none text-sm">
                <li>
                  <span className="text-foreground">
                    5 <B>participantes</B>:
                  </span>{" "}
                  1 grupo (porque no se aceptan grupos de 2)
                </li>
              </ul>
              <p className="pt-2">
                Los <B>emparejamientos</B> dentro de cada grupo tienen un orden
                aleatorio, así cada <B>torneo</B> es distinto.
              </p>
            </section>
            <section className="space-y-1">
              <SectionTitle>Fases</SectionTitle>
              <p>
                En torneos <B>por grupo</B>, al terminar todas las <B>rondas</B>{" "}
                tienes la opción de seleccionar quién avanza a una nueva{" "}
                <B>fase</B>, para enfrentar participantes de diferentes grupos.
              </p>
            </section>
            <section className="space-y-1">
              <SectionTitle>Desempates</SectionTitle>
              <p>
                Puedes configurar los <B>criterios de desempate</B> y su orden
                de aplicación. Cuando un criterio no decide, se intenta con el
                siguiente. Los métodos son:
              </p>
              <ul className="mt-2 space-y-1 list-none text-sm">
                <li>
                  <TiebreakLink hash="#Resultado_particular_o_confrontacion_directa">
                    DE
                  </TiebreakLink>
                  : si dos participantes tienen los mismos puntos, rankea quien
                  haya ganado la <B>partida</B> jugada entre ellos. Pero si
                  empataron su partida, o si hay más de dos participantes
                  empatados, se pasa al siguiente criterio.
                </li>
                <li>
                  <B>TN</B>: igual que DE, pero si los participantes empataron
                  su partida, quien haya jugado con <B>piezas negras</B> gana el
                  desempate.
                </li>
                <li>
                  <TiebreakLink hash="#Sonneborn_Berger">SB</TiebreakLink>:
                  puntos de rivales vencidos + medio de los empatados
                </li>
                <li>
                  <TiebreakLink hash="#Sistema_Buchholz">Buchholz</TiebreakLink>
                  : suma de puntos de todos los rivales enfrentados
                </li>
                <li>
                  <TiebreakLink hash="#Sistema_Koya">Koya</TiebreakLink>: puntos
                  logrados contra rivales que terminaron con al menos el 50% de
                  los puntos posibles
                </li>
                <li>
                  <TiebreakLink hash="#Numero_de_partidas_con_las_piezas_negras">
                    PN
                  </TiebreakLink>
                  : se cuentan las victorias ganadas con <B>piezas negras</B>
                </li>
              </ul>
              <p>Por defecto se usan DE y PN.</p>
            </section>
            <section className="space-y-1">
              <SectionTitle>Historial local</SectionTitle>
              <p>
                Todos tus <B>torneos</B> se guardan en tu dispositivo. No
                necesitas cuenta ni conexión a internet. Los <B>torneos</B>{" "}
                compartidos por enlace también quedan en tu <B>historial</B>.
              </p>
            </section>
          </div>
          <DialogFooter>
            <DialogClose render={<Button />}>Entendido</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
