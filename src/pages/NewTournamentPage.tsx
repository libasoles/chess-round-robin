import { AppShell } from "@/components/layout/AppShell";
import { BottomAction } from "@/components/layout/BottomAction";
import { TopBar } from "@/components/layout/TopBar";
import { ParticipantInput } from "@/components/tournament/ParticipantInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { buildGroupSizes } from "@/domain/groupSizes";
import { GROUP_NAMES, normalizeName, validateParticipants } from "@/domain/participants";
import { useSettingsStore } from "@/store/settingsStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { GripVertical, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type ValidationToast = {
  id: number;
  message: string;
};

type ParticipantRow = { id: string; name: string };

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface SortableParticipantRowProps {
  participant: ParticipantRow;
  onChange: (v: string) => void;
  onRemove: () => void;
  suggestions: string[];
  canRemove: boolean;
  autoFocus: boolean;
  onAutoFocusHandled: () => void;
  static?: boolean;
  submitMode?: boolean;
  onSubmit?: (nextValue?: string) => void;
  submitDisabled?: boolean;
  handleDisabled?: boolean;
}

function SortableParticipantRow({
  participant,
  onChange,
  onRemove,
  suggestions,
  canRemove,
  autoFocus,
  onAutoFocusHandled,
  static: isStatic,
  submitMode = false,
  onSubmit,
  submitDisabled = false,
  handleDisabled = false,
}: SortableParticipantRowProps) {
  // For submit row with disabled handle: still allow dropping (disabled: false)
  // but visually disable the handle button
  const sortable = useSortable({ id: participant.id, disabled: !!isStatic });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    isStatic
      ? {
          attributes: {},
          listeners: {},
          setNodeRef: undefined as unknown as (node: HTMLElement | null) => void,
          transform: null,
          transition: undefined,
          isDragging: false,
        }
      : sortable;

  const style = {
    transform: CSS.Transform.toString(transform ?? null),
    transition,
  };

  return (
    <div
      ref={isStatic ? undefined : setNodeRef}
      style={style}
      className={isDragging ? "opacity-0" : ""}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...(isStatic || handleDisabled ? {} : { ...attributes, ...listeners })}
          aria-label={`Reordenar ${participant.name || "participante"}`}
          className={`shrink-0 touch-none select-none p-1 rounded ${
            handleDisabled || isStatic
              ? "cursor-not-allowed text-muted-foreground/40"
              : "cursor-grab text-muted-foreground active:cursor-grabbing"
          }`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <ParticipantInput
            value={participant.name}
            onChange={onChange}
            onRemove={onRemove}
            suggestions={suggestions}
            canRemove={canRemove}
            submitMode={submitMode}
            onSubmit={onSubmit}
            submitDisabled={submitDisabled}
            autoFocus={autoFocus}
            onAutoFocusHandled={onAutoFocusHandled}
          />
        </div>
      </div>
    </div>
  );
}

export function NewTournamentPage() {
  const navigate = useNavigate();
  const {
    arbitratorName,
    organizerName,
    lastTournamentSettings,
    participantsPool,
    setOrganizerName,
  } = useSettingsStore();
  const { createTournament } = useTournamentStore();
  const currentArbitratorName = (
    arbitratorName ??
    lastTournamentSettings.arbitratorName ??
    ""
  ).trim();
  const currentOrganizerName = (
    organizerName ??
    lastTournamentSettings.organizerName ??
    ""
  ).trim();

  const [arbitrator, setArbitrator] = useState(currentArbitratorName);
  const [organizer, setOrganizer] = useState(currentOrganizerName);
  const [participants, setParticipants] = useState<ParticipantRow[]>([
    { id: genId(), name: "" },
  ]);
  const [useGroups, setUseGroups] = useState(false);
  const groupSize = 4;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [removeIdx, setRemoveIdx] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ValidationToast[]>([]);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(
    null,
  );
  const toastTimeoutsRef = useRef<number[]>([]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    return () => {
      for (const timeoutId of toastTimeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
      toastTimeoutsRef.current = [];
    };
  }, []);

  // Suggestions = pool minus already-entered names
  const enteredNames = new Set(
    participants.map((p) => p.name.trim().toLowerCase()).filter(Boolean),
  );
  const suggestions = participantsPool.filter(
    (n) => !enteredNames.has(n.toLowerCase()),
  );
  const enrolledCount = participants.filter((p) => p.name.trim().length > 0).length;
  const groupsDisabled = enrolledCount < 6;

  // Drag-and-drop and group preview setup
  const submitRow = participants[participants.length - 1];
  const nonSubmitParticipants = participants.slice(0, participants.length - 1);
  // Submit row is draggable if there are other participants and it has content
  const isSubmitRowDraggable =
    participants.length > 1 && submitRow && submitRow.name.trim().length > 0;

  // Compute group preview
  const groupStartIds = new Map<string, number>();
  if (useGroups && !groupsDisabled) {
    const groupSizes = buildGroupSizes(enrolledCount, true, groupSize);
    const groupStartPositions: number[] = [];
    let cumulative = 0;
    for (const size of groupSizes) {
      groupStartPositions.push(cumulative);
      cumulative += size;
    }
    let enrolledIdx = 0;
    let nextGroupCheck = 0;
    for (const p of nonSubmitParticipants) {
      if (!p.name.trim()) continue;
      if (
        nextGroupCheck < groupStartPositions.length &&
        enrolledIdx === groupStartPositions[nextGroupCheck]
      ) {
        groupStartIds.set(p.id, nextGroupCheck);
        nextGroupCheck++;
      }
      enrolledIdx++;
    }
  }

  const activeParticipant = activeParticipantId
    ? participants.find((p) => p.id === activeParticipantId) ?? null
    : null;

  function updateParticipant(index: number, value: string) {
    setParticipants((prev) => {
      const next = [...prev];
      const row = next[index];
      if (!row) return prev;
      next[index] = { ...row, name: value };
      return next;
    });
  }

  function addParticipantRow(nextValue?: string) {
    const lastRow = participants[participants.length - 1];
    if (!lastRow) return;
    const normalized = normalizeName(nextValue ?? lastRow.name ?? "");
    if (!normalized) return;

    const newId = genId();
    setParticipants((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (!last) return prev;
      next[next.length - 1] = { ...last, name: normalized };
      next.push({ id: newId, name: "" });
      return next;
    });
    setPendingFocusId(newId);
  }

  function localizeValidationErrors(validationErrors: string[]) {
    return validationErrors.map((error) => {
      if (error === "At least 3 participants are required") {
        return "Se requieren al menos 3 participantes";
      }
      if (error.startsWith("Duplicate participant names:")) {
        const names = error.replace("Duplicate participant names:", "").trim();
        return `Nombres de participantes duplicados: ${names}`;
      }
      return error;
    });
  }

  function removeParticipant(index: number) {
    if (participants.length <= 1) return;
    setParticipants(participants.filter((_, i) => i !== index));
    setRemoveIdx(null);
  }

  function showValidationToasts(messages: string[]) {
    const uniqueMessages = [...new Set(messages)];
    const nextToasts = uniqueMessages.map((message, idx) => ({
      id: Date.now() + idx,
      message,
    }));
    setToasts((current) => [...current, ...nextToasts]);

    for (const toast of nextToasts) {
      const timeoutId = window.setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id));
      }, 5000);
      toastTimeoutsRef.current.push(timeoutId);
    }
  }

  function dismissToast(id: number) {
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveParticipantId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveParticipantId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const submitRow = participants[participants.length - 1];
    if (active.id === submitRow?.id || over.id === submitRow?.id) return;
    const oldIdx = participants.findIndex((p) => p.id === active.id);
    const newIdx = participants.findIndex((p) => p.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    setParticipants((prev) => arrayMove(prev, oldIdx, newIdx));
  }

  function handleStart() {
    const cleanNames = participants
      .map((p) => normalizeName(p.name))
      .filter((n) => n.length > 0);
    const validation = validateParticipants(cleanNames);
    if (!validation.valid) {
      showValidationToasts(localizeValidationErrors(validation.errors));
      return;
    }
    const normalizedArbitrator = normalizeName(arbitrator);
    const effectiveArbitrator = normalizedArbitrator || currentArbitratorName;
    const normalizedOrganizer = normalizeName(organizer);
    const effectiveOrganizer = normalizedOrganizer || currentOrganizerName;

    const canUseGroups = cleanNames.length >= groupSize + 2;
    const settings = {
      ...lastTournamentSettings,
      arbitratorName: effectiveArbitrator,
      organizerName: effectiveOrganizer,
      useGroups: useGroups && canUseGroups,
      groupSize,
    };

    if (effectiveOrganizer) setOrganizerName(effectiveOrganizer);
    const id = createTournament(cleanNames, settings);
    navigate(`/tournament/${id}/round/1`);
  }

  function handleCancel() {
    navigate("/");
  }

  return (
    <>
      <AppShell
        topBar={
          <TopBar
            right={
              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Cancelar"
              >
                <X className="h-5 w-5" />
              </button>
            }
          />
        }
        hasBottomAction
      >
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="arbitrator">
                  Árbitro{" "}
                  <span className="text-muted-foreground/65">(opcional)</span>
                </Label>
                <Input
                  id="arbitrator"
                  value={arbitrator}
                  onChange={(e) => setArbitrator(e.target.value)}
                  placeholder="José Raúl"
                  className="text-base h-12"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organizer">
                  Organizador{" "}
                  <span className="text-muted-foreground/65">(opcional)</span>
                </Label>
                <Input
                  id="organizer"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Club de Ajedrez"
                  className="text-base h-12"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Participantes
                {enrolledCount > 0 && (
                  <>
                    {" "}
                    <span className="font-normal text-muted-foreground/65">
                      ({enrolledCount})
                    </span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={participants.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {participants.map((p, idx) => {
                    const isSubmitRow = idx === participants.length - 1;
                    const groupIdx = groupStartIds.get(p.id);

                    return (
                      <div key={p.id}>
                        {!isSubmitRow && groupIdx !== undefined && (
                          <div className="text-xs font-semibold text-muted-foreground pt-2 pb-2 px-1 uppercase tracking-wide">
                            Grupo {GROUP_NAMES[groupIdx]}
                          </div>
                        )}
                        <SortableParticipantRow
                          participant={p}
                          onChange={(v) => updateParticipant(idx, v)}
                          onRemove={() => {
                            if (participants.length > 1) setRemoveIdx(idx);
                          }}
                          suggestions={suggestions}
                          canRemove={participants.length > 1 && !isSubmitRow}
                          autoFocus={p.id === pendingFocusId}
                          onAutoFocusHandled={() => setPendingFocusId(null)}
                          submitMode={isSubmitRow}
                          onSubmit={isSubmitRow ? addParticipantRow : undefined}
                          submitDisabled={!p.name.trim()}
                          handleDisabled={isSubmitRow && !isSubmitRowDraggable}
                        />
                      </div>
                    );
                  })}
                </SortableContext>

                <DragOverlay dropAnimation={null}>
                  {activeParticipant ? (
                    <div className="rounded-md border border-primary/40 bg-card shadow-xl ring-2 ring-primary/30 scale-[1.02]">
                      <SortableParticipantRow
                        participant={activeParticipant}
                        onChange={() => {}}
                        onRemove={() => {}}
                        suggestions={[]}
                        canRemove={false}
                        autoFocus={false}
                        onAutoFocusHandled={() => {}}
                        static
                        submitMode={
                          activeParticipant.id === submitRow?.id
                        }
                        submitDisabled={!activeParticipant.name.trim()}
                        handleDisabled={false}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-4">
              <div
                className={`flex items-center gap-3 ${groupsDisabled ? "opacity-65" : ""}`}
              >
                <Checkbox
                  id="use-groups"
                  checked={useGroups}
                  disabled={groupsDisabled}
                  className="disabled:opacity-35"
                  onCheckedChange={(checked) => setUseGroups(checked === true)}
                />
                <Label
                  htmlFor="use-groups"
                  className={`cursor-pointer text-base ${groupsDisabled ? "text-muted-foreground/55" : "text-foreground"}`}
                >
                  Separar participantes en grupos de 4
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>

      <div className="fixed top-0 left-0 right-0 z-70 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center justify-between gap-3 bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground pointer-events-auto"
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <BottomAction>
        <div className="mx-auto w-full max-w-lg">
          <Button className="w-full h-12 text-base" onClick={handleStart}>
            Comenzar
          </Button>
        </div>
      </BottomAction>

      {/* Cancel confirmation */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmas?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se descartarán todos los datos ingresados.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Continuar editando
            </Button>
            <Button
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleCancel}
            >
              Cancelar torneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove participant confirmation */}
      <Dialog open={removeIdx !== null} onOpenChange={() => setRemoveIdx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar participante?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará{" "}
            <strong>
              {removeIdx !== null
                ? participants[removeIdx]?.name || "este participante"
                : ""}
            </strong>{" "}
            de la lista.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveIdx(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeIdx !== null && removeParticipant(removeIdx)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
