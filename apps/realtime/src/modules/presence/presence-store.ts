import type { PresenceState } from "@worqly/shared";

export class PresenceStore {
  private readonly entries = new Map<string, PresenceState & { socketId: string }>();

  set(state: PresenceState & { socketId: string }) {
    this.entries.set(state.socketId, state);
  }

  delete(socketId: string) {
    this.entries.delete(socketId);
  }

  getBySocketId(socketId: string) {
    return this.entries.get(socketId);
  }

  setActiveSurface(socketId: string, activeSurface: string) {
    const state = this.entries.get(socketId);

    if (!state) {
      return;
    }

    this.entries.set(socketId, {
      ...state,
      activeSurface
    });
  }

  listByWorkspace(workspaceId: string) {
    const workspaceEntries = [...this.entries.values()].filter((entry) => entry.workspaceId === workspaceId);
    const deduped = new Map<string, PresenceState>();

    for (const entry of workspaceEntries) {
      deduped.set(entry.userId, {
        workspaceId: entry.workspaceId,
        userId: entry.userId,
        userName: entry.userName,
        activeSurface: entry.activeSurface,
        connectedAt: entry.connectedAt
      });
    }

    return [...deduped.values()];
  }
}