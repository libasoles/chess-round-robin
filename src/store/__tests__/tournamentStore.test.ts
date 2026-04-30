import { beforeEach, describe, expect, it } from "vitest";
import type { TournamentSettings } from "@/domain/types";
import { useTournamentStore } from "@/store/tournamentStore";

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
});
