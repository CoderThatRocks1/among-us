import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";

vi.mock("peerjs", () => {
  const registry = new Map();
  let sequence = 0;
  class Emitter {
    listeners = new Map();
    on(event, handler) {
      this.listeners.set(event, [
        ...(this.listeners.get(event) || []),
        handler,
      ]);
      return this;
    }
    emit(event, data) {
      this.listeners.get(event)?.forEach((handler) => handler(data));
    }
  }
  class Connection extends Emitter {
    open = false;
    send(data) {
      queueMicrotask(() => {
        if (this.open) this.partner.emit("data", data);
      });
    }
    close() {
      if (!this.open) return;
      this.open = false;
      this.partner.open = false;
      this.emit("close");
      this.partner.emit("close");
    }
  }
  class Peer extends Emitter {
    constructor(id) {
      super();
      this.id = id || `guest-${++sequence}`;
      registry.set(this.id, this);
      queueMicrotask(() => this.emit("open", this.id));
    }
    connect(id) {
      const remote = registry.get(id);
      const localConnection = new Connection();
      const remoteConnection = new Connection();
      localConnection.peer = id;
      remoteConnection.peer = this.id;
      localConnection.partner = remoteConnection;
      remoteConnection.partner = localConnection;
      if (remote) {
        queueMicrotask(() => {
          remote.emit("connection", remoteConnection);
          localConnection.open = remoteConnection.open = true;
          localConnection.emit("open");
          remoteConnection.emit("open");
        });
      } else
        queueMicrotask(() =>
          this.emit("error", {
            type: "peer-unavailable",
            message: "not found",
          }),
        );
      return localConnection;
    }
    destroy() {
      registry.delete(this.id);
    }
  }
  return { default: Peer };
});

import { createHost, joinHost } from "../src/network/peerManager";

beforeAll(() => vi.stubGlobal("window", globalThis));
afterEach(() => vi.restoreAllMocks());

describe("PeerJS room protocol", () => {
  it("creates a six-character code and synchronizes the lobby, start and movement", async () => {
    const hostState = vi.fn(),
      guestState = vi.fn(),
      hostStart = vi.fn(),
      guestStart = vi.fn(),
      snapshots = vi.fn();
    const host = await createHost("Captain", {
      onLobby: hostState,
      onStart: hostStart,
      onSnapshot: snapshots,
    });
    expect(host.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(hostState).toHaveBeenCalledWith(
      expect.objectContaining({ code: host.code }),
    );
    expect(host.start()).toBe(false);
    const guest = await joinHost(host.code.toLowerCase(), "Crewmate", {
      onLobby: guestState,
      onStart: guestStart,
    });
    expect(guestState).toHaveBeenCalledWith(
      expect.objectContaining({
        players: expect.arrayContaining([
          expect.objectContaining({ name: "Crewmate" }),
        ]),
      }),
    );
    expect(host.players).toHaveLength(2);
    expect(host.start()).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(guestStart).toHaveBeenCalledTimes(1);
    expect(hostStart).toHaveBeenCalledTimes(1);
    guest.move(222, 333);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(snapshots).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: guest.id, x: 222, y: 333 }),
      ]),
    );
    guest.close();
    host.close();
  });
  it("rejects invalid or missing rooms with helpful messages", async () => {
    await expect(joinHost("bad!", "Crewmate")).rejects.toThrow(
      "valid 6-character",
    );
    await expect(joinHost("AAAAAA", "Crewmate")).rejects.toThrow(
      "Room not found",
    );
  });
});
