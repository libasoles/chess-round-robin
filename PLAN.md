# Plan de construcción — PWA Torneos de Ajedrez

## 0. Resumen del producto

App mobile-first para árbitros de torneos de ajedrez por grupos (round robin). El árbitro ingresa jugadores, el sistema los distribuye en grupos, genera los fixtures, permite cargar resultados ronda a ronda, calcula posiciones con desempates automáticos, y encadena fases sucesivas hasta finalizar el torneo.

**Stack:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui  
**Testing:** Vitest + React Testing Library + Playwright  
**Persistencia MVP:** localStorage / IndexedDB  
**Compartir:** Jazz (sincronización en tiempo real, sin backend propio)  
**PWA:** instalable, funciona offline para consulta de torneo ya cargado

---

## 1. Arquitectura y estructura del proyecto

```
src/
  domain/          # Lógica pura, sin React
    participants.ts
    groupSizes.ts
    roundRobin.ts
    scoring.ts
    tiebreaks.ts
    standings.ts
  store/           # Estado global (Zustand o similar)
    tournamentStore.ts
    settingsStore.ts
    historyStore.ts
  hooks/           # Hooks de React que consumen store y domain
  components/
    ui/            # shadcn/ui wrappers
    tournament/
    group/
    match/
    settings/
    history/
  pages/
    Home.tsx
    TournamentView.tsx
    GroupView.tsx
    HistoryView.tsx
    Settings.tsx
  lib/
    berger.ts      # Tablas Berger / circle method
    jazz.ts        # Integración Jazz para compartir
    seededShuffle.ts
```

**Regla clave:** toda la lógica de negocio vive en `domain/` como funciones puras, testeable sin React. Los componentes solo consumen hooks.

---

## 2. Modelo de datos

### Settings (persistidos globalmente, usados como default para nuevos torneos)

```typescript
type AppSettings = {
  arbitratorName: string | null       // nombre propio del árbitro; null hasta que se ingrese
  lastTournamentSettings: TournamentSettings
}
```

### Torneo

```typescript
type TournamentSettings = {
  arbitratorName: string              // copia en el momento de crear; no depende de AppSettings
  forfeitPoints: 0 | 0.5 | 1         // puntos al rival por abandono
  byePoints: 0 | 0.5 | 1             // puntos por jugar vs Libre (default: 1)
  tiebreakOrder: TiebreakMethod[]     // ordenable, seleccionable
  useGroups: boolean                  // true = distribuir en grupos; false = todos en un único grupo sin nombre visible
}

type TiebreakMethod = 'DE' | 'SB'    // más métodos en versiones futuras

type Tournament = {
  id: string
  createdAt: string
  finishedAt?: string
  settings: TournamentSettings        // snapshot inmutable al momento de creación
  phases: Phase[]
  status: 'active' | 'finished'
}

type Phase = {
  index: number
  groups: Group[]
}

type Group = {
  name: string               // ALFA, BETA, GAMMA… — no se muestra en pantalla si useGroups = false
  participants: Participant[]
  matches: Match[]
}

type Participant = {
  id: string
  name: string
  isBye: boolean             // true = Libre
}

type Match = {
  id: string
  white: string              // participant id
  black: string
  round: number
  result: MatchResult | null
}

type MatchResult =
  | 'white_win'
  | 'black_win'
  | 'draw'
  | 'forfeit_white'          // blancas abandonan
  | 'forfeit_black'          // negras abandonan
  | 'auto_bye'               // resultado automático vs Libre
```

**Principio de fuente de verdad:** se guarda el resultado bruto de cada partida. Los puntos se derivan siempre por cálculo, nunca se guardan como valor final. Esto permite recalcular cuando cambia la configuración de abandono o de bye.

**Principio de inmutabilidad del historial:** `TournamentSettings` es una copia snapshot dentro del torneo. Cambiar `AppSettings` (incluyendo el nombre del árbitro) no altera torneos pasados ni activos. Los torneos finalizados son de solo lectura.

---

## 3. Reglas de negocio — módulo `domain/`

### 3.1 `groupSizes.ts` — distribución de grupos

Cuando `useGroups = false`, todos los jugadores van a un único grupo. Las reglas de tamaño mínimo y máximo siguen aplicando (no se puede tener un grupo de 2), y se agrega Libre si el número es impar y el algoritmo lo requiere. El nombre del grupo existe internamente pero no se muestra en pantalla.

Cuando `useGroups = true`, se aplica la tabla de distribución:

| n reales | grupos | nota |
|----------|--------|------|
| < 3 | error | |
| 3 | [4] | agrega Libre |
| 4 | [4] | |
| 5 | [6] | agrega Libre — excepción explícita |
| 6 | [3, 3] | |
| 7 | [4, 3] | |
| 8 | [4, 4] | |
| 9 | [3, 3, 3] | |
| 10 | [4, 3, 3] | |
| 11 | [4, 4, 3] | |
| 12 | [4, 4, 4] | |

Regla general: priorizar grupos de 4, usar grupos de 3 para balancear, nunca grupos de 2 ni de 5, y el grupo de 6 solo en el caso especial de 5 + Libre.

El caso `n = 5` debe estar codificado como excepción explícita de negocio, no como resultado del algoritmo general.

### 3.2 `participants.ts` — normalización y validación

- Normalización de nombres: primera letra en mayúscula, y también la primera letra después de cada espacio.
- No se permiten duplicados exactos dentro del mismo torneo.
- Typeahead con nombres del historial; `Libre` nunca aparece en ese set.

### 3.3 `roundRobin.ts` — fixtures con tablas Berger

- Método: circle method / tablas Berger para grupos de 3, 4 y 6.
- Colores deterministas: se usan directamente los colores que produce el calendario Berger para cada tamaño de grupo.
- Las partidas contra `Libre` se resuelven automáticamente al crear el fixture (`auto_bye`).
- El algoritmo acepta una semilla opcional para reproducibilidad en debugging.

### 3.4 `scoring.ts` — cálculo de puntos

| Resultado | Blancas | Negras |
|-----------|---------|--------|
| white_win | 1 | 0 |
| black_win | 0 | 1 |
| draw | 0.5 | 0.5 |
| forfeit_white | 0 | `settings.forfeitPoints` |
| forfeit_black | `settings.forfeitPoints` | 0 |
| auto_bye | `settings.byePoints` (default 1) | — |

Al cambiar `forfeitPoints` durante un torneo activo, se recalculan todos los abandonos de ese torneo. Los torneos finalizados no se modifican.

### 3.5 `tiebreaks.ts` — desempates

El orden de aplicación es configurable por torneo (seleccionable y reordenable en Settings).

**DE — Encuentro directo**
- Solo se aplica a empates de exactamente 2 jugadores.
- Si uno le ganó al otro: queda arriba el ganador.
- Si hicieron tablas: DE no rompe el empate, se pasa al siguiente criterio.
- Empates de 3 o más: se saltea DE y se pasa directamente a SB.

**SB — Sonneborn-Berger**
- Se calcula al cierre del grupo (depende de puntos finales de oponentes).
- Fórmula: suma de puntos finales de rivales a los que venció + mitad de puntos finales de rivales con los que empató.

---

## 4. Settings

Los settings tienen dos niveles:

1. **`AppSettings`** — persisten globalmente entre torneos. Incluyen el nombre del árbitro y los últimos valores usados, que sirven como default para nuevos torneos.
2. **`TournamentSettings`** — snapshot copiado al crear cada torneo. Inmutable una vez creado el torneo. No depende de `AppSettings` para su lectura posterior.

### Pantalla de Settings

**Árbitro**
- Campo de texto: nombre del árbitro
- Si está vacío, se muestra advertencia: "Se te pedirá al crear el próximo torneo"
- Editar este campo no modifica ningún torneo pasado ni activo

**Torneo**
- **Usar grupos:** toggle / checkbox
  - Activado: los jugadores se distribuyen en múltiples grupos con nombres visibles (ALFA, BETA…)
  - Desactivado: todos los jugadores en un único grupo; el nombre del grupo no se muestra en pantalla
- **Puntos por abandono:** selector (0 / 0.5 / 1)
- **Puntos por jugar vs Libre:** selector (0 / 0.5 / 1, default 1)

**Desempates**
- Lista reordenable con checkboxes:
  - `[ ] DE — Encuentro directo`
  - `[ ] SB — Sonneborn-Berger`
  - (extensible en versiones futuras)
- Drag-and-drop o botones arriba/abajo para reordenar

---

## 5. Flujo de creación de torneo

1. El árbitro abre la app y va a "Crear torneo".
2. Se pre-rellena el campo **nombre del árbitro** desde `AppSettings.arbitratorName`.
   - Si `arbitratorName` es null, el campo aparece vacío y marcado como requerido.
   - Al confirmar, el nombre se guarda en `AppSettings` si no estaba guardado.
3. El árbitro ingresa los participantes.
4. Se pre-rellenan los settings con `AppSettings.lastTournamentSettings`.
5. Al presionar "Crear torneo":
   - Se valida que haya nombre de árbitro (bloquea si falta).
   - Se valida cantidad mínima de participantes.
   - Se crea un snapshot de `TournamentSettings` dentro del torneo.
   - Se distribuyen jugadores, se generan fixtures.
   - Se genera URL única del torneo.

---

## 6. Visualización de grupos

Cuando `useGroups = true`, cada grupo muestra en una card o accordion:
- Nombre del grupo (ALFA, BETA…)
- Lista de jugadores
- Tabla de posiciones en vivo
- Rondas con sus partidas
- Indicadores: partidas pendientes / finalizadas

Cuando `useGroups = false`, se muestra directamente la tabla y las rondas sin encabezado de grupo.

---

## 7. UX mobile-first

- Inputs grandes, fáciles de tocar.
- Botones de acción primarios fijos al fondo de la pantalla.
- Tablas compactas con scroll horizontal si el contenido lo requiere.
- Sin modales complejos; preferir cards y accordions.
- El botón "Compartir torneo" (Web Share API) se muestra solo en mobile; en desktop no aparece.

---

## 8. Compartir torneo

Se usa **Jazz** para sincronización en tiempo real sin backend propio. Esto permite que la URL generada sea consultable por otros dispositivos.

La URL sigue el patrón `/t/{id}` o `?t={hash}` (no solo `#hash`) para mejor deep-linking y compatibilidad futura.

---

## 9. Historial

Al finalizar un torneo se guarda un registro inmutable con:

- ID y fechas (creación y cierre)
- Nombre del árbitro (copiado del snapshot del torneo)
- Settings aplicados (snapshot; no cambian si se edita AppSettings)
- Participantes por fase
- Grupos con resultados de todas las partidas
- Posiciones finales por grupo
- Clasificados / ganadores

El historial es consultable pero no editable. Los nombres de jugadores del historial alimentan el typeahead de futuros torneos (excluyendo `Libre`).

---

## 10. Plan de tests

### Unit tests (Vitest)

**`buildGroupSizes`**
- 0, 1, 2 → error
- 3 → [4] con Libre
- 4 → [4]
- 5 → [6] con Libre
- 6 → [3,3]
- 7 → [4,3]
- 8 → [4,4]
- 10 → [4,3,3]
- Con `useGroups = false`: n jugadores → [n] o [n+1] con Libre si aplica

**`assignParticipantsToGroups`**
- No repite jugadores
- Libre aparece solo cuando corresponde
- Tamaños de grupos correctos
- Nombres de grupos: ALFA, BETA, GAMMA…
- Con `useGroups = false`: un único grupo, nombre interno no expuesto en UI

**`generateRoundRobinPairings`**
- Grupo de 3: todos contra todos (3 partidas)
- Grupo de 4: 6 partidas totales
- Grupo de 6: 15 partidas totales
- Sin emparejamientos duplicados
- Colores deterministas

**`resolveMatchPoints`**
- white_win, black_win, draw
- auto_bye con byePoints 0, 0.5 y 1
- abandono con forfeitPoints 0, 0.5 y 1

**`computeStandings`**
- Suma correcta de puntos
- Recalcula al modificar una partida
- Recalcula al cambiar forfeitPoints (solo torneo activo)

**`applyDirectEncounter`**
- Empate de 2 con victoria clara → resuelve
- Empate de 2 con tablas → no resuelve
- Empate múltiple → no aplica DE

**`computeSonnebornBerger`**
- Caso con victorias
- Caso con tablas
- Caso con empate final real entre jugadores

**`arbitratorName` (settings)**
- Nuevo torneo hereda nombre de AppSettings
- Editar nombre en Settings no modifica torneos ya creados
- No se puede crear torneo sin nombre de árbitro

### Integration tests (Vitest + React Testing Library)
- Crear torneo con 3 jugadores
- Crear torneo con 5 jugadores
- Crear torneo sin `useGroups`: todos en un grupo, sin nombre visible
- Crear torneo sin nombre de árbitro: bloquea y pide el dato
- Cargar todos los resultados de un grupo y ver ranking actualizado
- Pasar a nueva fase
- Finalizar torneo y verificar historial
- Cambiar forfeitPoints durante torneo activo: recalcula; historial no cambia

### E2E (Playwright)
- Flujo completo en mobile
- Flujo completo en desktop
- Persistencia al recargar la página
- Botón compartir visible solo en mobile
- Typeahead con nombres del historial
- Primer uso sin nombre de árbitro: se pide al crear torneo y se guarda

---

## 11. Fases de desarrollo sugeridas

### Fase 1 — Core domain (sin UI)
Implementar y testear todas las funciones de `domain/`: `groupSizes` (con y sin `useGroups`), `roundRobin` (Berger), `scoring`, `tiebreaks`, `standings`. Con todos los unit tests pasando.

### Fase 2 — Estado y persistencia
Store global con Zustand (o similar), persistencia en localStorage/IndexedDB, modelo de datos completo, `AppSettings` con `arbitratorName` y defaults persistidos para nuevos torneos.

### Fase 3 — UI principal
- Pantalla de Settings completa (nombre árbitro, useGroups, forfeitPoints, byePoints, desempates reordenables).
- Pantalla de creación de torneo con validación de nombre de árbitro.
- Vista de grupo/torneo con tabla en vivo.
- Carga de resultados.

### Fase 4 — Fases y finalización
Podio al cerrar grupos, selección de clasificados, creación de siguiente fase, finalización y guardado en historial.

### Fase 5 — Compartir e historial
Integración Jazz, URL única por torneo, pantalla de historial, typeahead con nombres históricos.

### Fase 6 — PWA y polish
Service worker, instalabilidad, comportamiento offline, botón de compartir mobile-only, pruebas E2E completas, ajustes de accesibilidad y rendimiento.
