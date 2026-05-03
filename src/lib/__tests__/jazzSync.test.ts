import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Phase } from "@/domain/types";

const loadMock = vi.fn();
const setMock = vi.fn();
const phaseListCreateMock = vi.fn((items, options) => ({
  type: "phase-list",
  items,
  owner: options.owner,
}));

vi.mock("../jazzAgent", () => ({
  getJazzMe: () => ({ id: "me" }),
}));

vi.mock("../jazz", () => ({
  JazzTournament: {
    load: loadMock,
  },
  JazzTournamentSettings: {
    create: vi.fn((value) => value),
  },
  JazzPhase: {
    create: vi.fn((value, options) => ({ type: "phase", value, owner: options.owner })),
  },
  JazzPhaseList: {
    create: phaseListCreateMock,
  },
  JazzChessGroup: {
    create: vi.fn((value, options) => ({ type: "group", value, owner: options.owner })),
  },
  JazzChessGroupList: {
    create: vi.fn((items, options) => ({ type: "group-list", items, owner: options.owner })),
  },
  JazzParticipant: {
    create: vi.fn((value, options) => ({ type: "participant", value, owner: options.owner })),
  },
  JazzParticipantList: {
    create: vi.fn((items, options) => ({ type: "participant-list", items, owner: options.owner })),
  },
  JazzMatch: {
    create: vi.fn((value, options) => ({ type: "match", value, owner: options.owner })),
  },
  JazzMatchList: {
    create: vi.fn((items, options) => ({ type: "match-list", items, owner: options.owner })),
  },
}));

const phases: Phase[] = [
  {
    index: 0,
    groups: [
      {
        name: "ALFA",
        participants: [{ id: "p1", name: "Ana", isBye: false }],
        matches: [],
      },
    ],
  },
];

describe("replaceJazzTournamentPhases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces the phases list using the tournament Jazz owner", async () => {
    const owner = { id: "group" };
    loadMock.mockResolvedValue({
      $jazz: {
        id: "co_zshared",
        owner,
        set: setMock,
      },
    });

    const { replaceJazzTournamentPhases } = await import("../jazzSync");

    await replaceJazzTournamentPhases("co_zshared", phases);

    expect(phaseListCreateMock).toHaveBeenCalledWith(expect.any(Array), { owner });
    expect(setMock).toHaveBeenCalledWith("phases", {
      type: "phase-list",
      items: expect.any(Array),
      owner,
    });
  });

  it("does not write when the loaded tournament has no Jazz owner", async () => {
    loadMock.mockResolvedValue({
      $jazz: {
        id: "co_zshared",
        set: setMock,
      },
    });

    const { replaceJazzTournamentPhases } = await import("../jazzSync");

    await replaceJazzTournamentPhases("co_zshared", phases);

    expect(setMock).not.toHaveBeenCalled();
    expect(phaseListCreateMock).not.toHaveBeenCalled();
  });
});
