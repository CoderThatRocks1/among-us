import { describe, it, expect } from "vitest";
import { createBots, stepBots, botVotes, TASKS } from "../src/network/botLogic";

describe("solo bot simulation", () => {
  it("creates four uniquely identified roaming crewmates", () => {
    const bots = createBots();
    expect(bots).toHaveLength(4);
    expect(new Set(bots.map((bot) => bot.id)).size).toBe(4);
    expect(stepBots(bots, 0.05)).not.toEqual(bots);
    expect(TASKS).toHaveLength(5);
  });
  it("casts a vote for each bot without choosing an unknown crewmate", () => {
    const players = [{ id: "you" }, ...createBots()];
    const votes = botVotes(players);
    expect(votes).toHaveLength(4);
    votes.forEach(({ voter, target }) => {
      expect(voter).toMatch(/^bot-/);
      expect(["skip", ...players.map((player) => player.id)]).toContain(target);
    });
  });
});
