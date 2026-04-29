# DOMAIN.md

## Terminología del Dominio — Chess Round Robin

Este documento define los términos clave y conceptos del dominio utilizados en el proyecto de gestión de torneos round-robin de ajedrez.

---

### Participante

- **Participant**: Persona o entidad que compite en el torneo. Identificada por un `id` y un `name`.
- **BYE**: Participante especial (`id: 'bye'`, `isBye: true`) que representa un turno libre cuando el número de participantes es impar.

### Grupo

- **Group**: Subconjunto de participantes. Los torneos pueden dividirse en varios grupos para gestionar grandes cantidades de jugadores.
- **GROUP_NAMES**: Lista de nombres estándar para grupos (A, B, C, ...).

### Ronda y Emparejamientos

- **Round**: Conjunto de partidas que se juegan simultáneamente. Un torneo round-robin tiene `n-1` rondas para `n` participantes.
- **Match**: Enfrentamiento entre dos participantes en una ronda. Incluye resultado y referencias a los jugadores.
- **Pairing**: Emparejamiento de jugadores para una ronda específica, generado por el método Berger.
- **Berger Table**: Algoritmo estándar para generar emparejamientos round-robin.

### Resultados y Puntuación

- **MatchResult**: Resultado de una partida (`white_win`, `draw`, `forfeit_white`, `auto_bye`, etc.).
- **Points**: Puntos asignados según el resultado de la partida y la configuración del torneo.
- **Forfeit**: Partida perdida por incomparecencia o abandono.
- **Auto Bye**: Resultado automático asignado al participante BYE.

### Clasificación y Desempates

- **Standings**: Tabla de posiciones acumulando puntos por participante (excluyendo BYE).
- **Tiebreaks**: Métodos para desempatar jugadores con igual puntaje (Direct Encounter, Sonneborn-Berger, etc.).
- **Direct Encounter**: Desempate por resultado directo entre jugadores empatados.
- **Sonneborn-Berger**: Desempate sumando los puntos de los rivales vencidos y la mitad de los empatados.

### Configuración y Estado del Torneo

- **Tournament**: Estructura principal que agrupa participantes, rondas, resultados y configuración.
- **TournamentSettings**: Configuración inmutable del torneo (puntos por victoria, empate, bye, orden de desempates, etc.).
- **AppSettings**: Configuración global de la aplicación, no afecta torneos ya creados.
- **Snapshot Settings**: Los torneos guardan una copia de la configuración al momento de su creación.
- **Status**: Estado del torneo (`active`, `finished`).

### Invariantes y Reglas de Negocio

- **Raw Results Only**: Solo se almacenan resultados crudos; los puntos se calculan dinámicamente.
- **Bye Excluido**: El participante BYE no aparece en la tabla de posiciones.
- **Group Sizes**: Los tamaños de grupo se calculan para balancear la cantidad de participantes y byes.

### Otros

- **PWA**: Aplicación web progresiva, optimizada para dispositivos móviles.
- **Branding**: Sistema de marcas y assets personalizables.

---

Para detalles técnicos y ejemplos de uso, consultar los archivos en `src/domain/` y la documentación en `CLAUDE.md`.
