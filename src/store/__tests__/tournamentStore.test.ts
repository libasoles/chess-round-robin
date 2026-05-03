import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TournamentSettings } from "@/domain/types";
import { useTournamentStore } from "@/store/tournamentStore";
import { replaceJazzTournamentPhases } from "@/lib/jazzSync";

vi.mock("@/lib/jazzSync", () => ({
  replaceJazzTournamentPhases: vi.fn().mockResolvedValue(undefined),
}));

const settings: TournamentSettings = {
  arbitratorName: "",
  organizerName: "",
  forfeitPoints: 1,
  byePoints: 1,
  tiebreakOrder: ["DE", "SB", "PN"],
  useGroups: false,
  groupSize: 4,
};

describe("useTournamentStore draft participants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTournamentStore.setState({
      activeTournament: null,
      currentRound: 1,
      draftParticipants: [""],
    });
  });

  it("resets draft participants to a single empty row", () => {
    useTournamentStore.getState().setDraftParticipants(["Ana", "Bruno"]);

    useTournamentStore.getState().resetDraftParticipants();

    expect(useTournamentStore.getState().draftParticipants).toEqual([""]);
  });

  it("keeps explicit draft names for the restart-with-same-participants flow", () => {
    useTournamentStore.getState().setDraftParticipants(["Ana", "Bruno", "Carla"]);

    expect(useTournamentStore.getState().draftParticipants).toEqual([
      "Ana",
      "Bruno",
      "Carla",
    ]);
  });

  it("clears draft participants after creating a tournament", () => {
    useTournamentStore.getState().setDraftParticipants(["Ana", "Bruno", "Carla"]);

    useTournamentStore
      .getState()
      .createTournament(["Ana", "Bruno", "Carla"], settings);

    expect(useTournamentStore.getState().draftParticipants).toEqual([""]);
  });

  it("syncs edited phases through Jazz when adding a participant to a shared tournament", async () => {
    const tournamentId = useTournamentStore
      .getState()
      .createTournament(["Ana", "Bruno", "Carla"], settings);
    useTournamentStore.getState().setJazzId(tournamentId, "co_zshared");

    const result = useTournamentStore
      .getState()
      .addParticipantToActiveTournament("Diego");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const activeTournament = useTournamentStore.getState().activeTournament;
    expect(
      activeTournament?.phases[0]?.groups[0]?.participants.some(
        (participant) => participant.name === "Diego",
      ),
    ).toBe(true);

    await vi.waitFor(() => {
      expect(replaceJazzTournamentPhases).toHaveBeenCalledWith(
        "co_zshared",
        result.tournament.phases,
      );
    });
  });
});
