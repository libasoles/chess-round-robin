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
import { normalizeName, validateParticipants } from "@/domain/participants";
import { useSettingsStore } from "@/store/settingsStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type ValidationToast = {
  id: number;
  message: string;
};

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
  const [participants, setParticipants] = useState<string[]>([""]);
  const [useGroups, setUseGroups] = useState(false);
  const groupSize = 4;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [removeIdx, setRemoveIdx] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ValidationToast[]>([]);
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(
    null,
  );
  const toastTimeoutsRef = useRef<number[]>([]);

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
    participants.map((p) => p.trim().toLowerCase()).filter(Boolean),
  );
  const suggestions = participantsPool.filter(
    (n) => !enteredNames.has(n.toLowerCase()),
  );
  const enrolledCount = participants.filter((p) => p.trim().length > 0).length;
  const groupsDisabled = enrolledCount < 6;

  function updateParticipant(index: number, value: string) {
    const next = [...participants];
    next[index] = value;
    setParticipants(next);
  }

  function addParticipantRow(nextValue?: string) {
    const lastIdx = participants.length - 1;
    if (lastIdx < 0) return;
    const normalized = normalizeName(nextValue ?? participants[lastIdx] ?? "");
    if (!normalized) return;

    const next = [...participants];
    next[lastIdx] = normalized;
    next.push("");
    setParticipants(next);
    setPendingFocusIndex(next.length - 1);
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

  function handleStart() {
    const cleanNames = participants
      .map(normalizeName)
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
              {participants.map((name, idx) => (
                <div key={idx}>
                  <ParticipantInput
                    value={name}
                    onChange={(v) => updateParticipant(idx, v)}
                    onRemove={() => {
                      if (participants.length > 1) setRemoveIdx(idx);
                    }}
                    suggestions={suggestions}
                    canRemove={
                      participants.length > 1 && idx !== participants.length - 1
                    }
                    submitMode={idx === participants.length - 1}
                    onSubmit={addParticipantRow}
                    submitDisabled={!name.trim()}
                    autoFocus={idx === pendingFocusIndex}
                    onAutoFocusHandled={() => setPendingFocusIndex(null)}
                  />
                </div>
              ))}
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
                ? participants[removeIdx] || "este participante"
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
