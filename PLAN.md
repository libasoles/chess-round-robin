# Plan de construcción — PWA Torneos de Ajedrez

## 0. Resumen del producto

App mobile-first para árbitros de torneos de ajedrez por sistema round robin. El árbitro ingresa participantes, el sistema arma grupos y rondas, se cargan resultados partido a partido, se calculan posiciones con desempates, se pueden encadenar fases adicionales y finalmente cerrar el torneo para que pase al historial.

Stack: React + TypeScript + Vite + Tailwind CSS + shadcn/ui  
Testing: Vitest + React Testing Library + Playwright  
Persistencia MVP: localStorage / IndexedDB  
Compartir: Jazz para sincronización de lectura  
PWA: instalable y usable offline en datos ya sincronizados

---

## 1. Arquitectura y estructura del proyecto

src/
  domain/
    participants.ts
    groupSizes.ts
    roundRobin.ts
    scoring.ts
    standings.ts
    tiebreaks.ts
  store/
    tournamentStore.ts
    settingsStore.ts
    historyStore.ts
  hooks/
  components/
    ui/
    tournament/
    group/
    match/
    settings/
    history/
  pages/
    Home.tsx
    Settings.tsx
    TournamentView.tsx
  lib/
    berger.ts
    jazz.ts
    seededShuffle.ts

Regla clave: toda la lógica de negocio va en domain como funciones puras, sin dependencias de React.

---

## 2. Modelo de datos

### AppSettings (nivel aplicación)

type AppSettings = {
  arbitratorName: string | null
  forfeitPoints: 0 | 0.5 | 1
  byePoints: 0 | 0.5 | 1
  tiebreakOrder: TiebreakMethod[]
  knownParticipants: string[]
  theme: 'light' | 'dark'
}

Nota: useGroups no vive en AppSettings. Se define en la creación de cada torneo.

### TournamentSettings (snapshot por torneo)

type TournamentSettings = {
  arbitratorName: string
  forfeitPoints: 0 | 0.5 | 1
  byePoints: 0 | 0.5 | 1
  tiebreakOrder: TiebreakMethod[]
  useGroups: boolean
}

type TiebreakMethod = 'DE' | 'SB' | 'Buchholz' | 'PN'

type MatchResult =
  | 'white_win'
  | 'black_win'
  | 'draw'
  | 'forfeit_white'
  | 'forfeit_black'
  | 'auto_bye'

type StandingEntry = {
  participantId: string
  points: number
  tiebreakScores: Partial<Record<TiebreakMethod, number>>
  rank: number
  tiebreakUsed: TiebreakMethod | null
}

Principios:
- Se guarda resultado bruto por partida y los puntos se derivan por cálculo.
- TournamentSettings es inmutable dentro del torneo.
- Torneo finalizado es de solo lectura.

---

## 3. Reglas de negocio (domain)

### 3.1 groupSizes.ts

Con useGroups=false se arma un único grupo. Con useGroups=true se usa distribución por tabla (3 a 12 participantes) con excepción explícita para n=5 -> [6] con Libre.

### 3.2 participants.ts

- Normalización de nombre por palabra.
- Sin duplicados dentro del torneo.
- Typeahead desde historial/configuración.
- Libre no aparece en sugerencias.

### 3.3 roundRobin.ts

- Método Berger para grupos de 3, 4 y 6.
- Blancas siempre a la izquierda en UI.
- Partidos contra Libre se resuelven al crear fixture como auto_bye.

### 3.4 scoring.ts

- white_win: 1/0
- black_win: 0/1
- draw: 0.5/0.5
- forfeit_white: 0 / settings.forfeitPoints
- forfeit_black: settings.forfeitPoints / 0
- auto_bye: settings.byePoints al jugador real

### 3.5 tiebreaks.ts

Orden configurable por torneo.

DE (Encuentro Directo):
- Solo aplica en empate exacto de 2.
- Si hay draw entre ellos, no rompe empate.

SB (Sonneborn-Berger):
- Suma puntos finales de rivales vencidos + mitad de puntos finales de rivales empatados.
- Excluye Libre.

Buchholz:
- Suma de puntos finales de todos los rivales enfrentados.
- Excluye Libre.

PN (Partidas Ganadas con Negras):
- Cuenta victorias con piezas negras.
- Cuenta black_win y forfeit_white.

Ranking provisional:
- Mientras haya partidas sin resultado en el grupo, la UI muestra banner de ranking provisional.

---

## 4. Pantallas y UX

### 4.1 Home

- Sin login, entra directo.
- Historial de torneos finalizados.
- Placeholder si no hay historial.
- Botón Nuevo Torneo.
- Botón de configuración con ícono de engranaje.

### 4.2 Settings

- Flecha volver.
- Toggle de tema.
- Auto-save, sin botón confirmar.
- Nombre de árbitro.
- Puntos por abandono y por Libre.
- Desempates reordenables con checkboxes: ED, SB, Buchholz, PN.
- Gestión de participantes conocidos con confirmación al eliminar.

### 4.3 Nuevo Torneo

- Campo árbitro prellenado desde AppSettings.
- Lista dinámica de participantes.
- Typeahead con participantes conocidos.
- Se permite escribir nuevos nombres.
- Eliminación con diálogo de confirmación.
- Checkbox Por grupos marcado por default.

### 4.4 Vista de Rondas

- Partidos agrupados por grupo si useGroups=true.
- Botones mutuamente excluyentes por partido:
  - white_win
  - black_win
  - draw
  - forfeit_white
  - forfeit_black
- En auto_bye no hay edición manual.
- Navegación por swipe y flechas.
- Botón compartir URL arriba.

### 4.5 Resultados

- Tabla por grupo con Nombre, Pts, columnas de desempate usadas y Posición.
- Abreviatura correcta en español: ED.
- Checkboxes de clasificados visibles solo cuando useGroups=true y preseleccionados.
- Botón Nueva Fase visible solo cuando useGroups=true.
- Botón Terminar torneo.

---

## 5. Nueva Fase

Al crear nueva fase:
- Usa solo participantes seleccionados.
- Crea grupos con nombres no repetidos dentro del torneo.
- Continúa numeración de rondas (no reinicia en 1).
- Algoritmo intenta cruzar jugadores de distintos grupos previos para minimizar repetición.

---

## 6. Compartir y permisos de edición

- URL de torneo con patrón /t/{id}.
- Compartir es solo lectura para visitantes.
- Solo el creador del torneo puede editar resultados.
- El creador solo puede editar mientras el torneo esté activo.
- Al terminar torneo, queda bloqueado para todos.

---

## 7. Historial

Al terminar torneo se guarda snapshot inmutable con:
- ID, fechas de creación/cierre
- árbitro
- settings aplicados
- participantes por fase
- grupos y resultados
- posiciones finales

Los nombres históricos alimentan typeahead (excepto Libre).

---

## 8. Plan de tests

Unit:
- buildGroupSizes (incluyendo useGroups true/false)
- participants (normalización/duplicados)
- roundRobin (sin duplicados, color, bye)
- scoring (todos los MatchResult)
- standings
- tiebreaks: DE, SB, Buchholz, PN
- ranking con tiebreakUsed y ranks compartidos cuando empate persiste

Integración:
- crear torneo
- cargar resultados
- pasar a nueva fase
- terminar torneo e historial
- recalcular cambios permitidos en torneo activo

E2E:
- flujo mobile y desktop
- persistencia recarga
- botón compartir solo mobile
- permisos de edición (creador vs visitante)
- torneo terminado bloquea edición

---

## 9. Fases de desarrollo sugeridas

Fase 1: core domain y tests (completa).  
Fase 2: desempates extendidos y standings enriquecido (en progreso).  
Fase 3: stores y persistencia AppSettings ampliada.  
Fase 4: UI principal (Home, Settings, Nuevo Torneo, Rondas, Resultados).  
Fase 5: nueva fase con antirepetición.  
Fase 6: compartir, permisos, historial.  
Fase 7: PWA, accesibilidad, performance, E2E final.
