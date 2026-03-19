type PresenceState = {
  workspaceId: string;
  userId: string;
  socketId: string;
  activeSurface: string;
  connectedAt: string;
};

export class PresenceStore {
  private readonly entries = new Map<string, PresenceState>();

  set(state: PresenceState) {
    this.entries.set(state.socketId, state);
  }

  delete(socketId: string) {
    this.entries.delete(socketId);
  }

  getBySocketId(socketId: string) {
    return this.entries.get(socketId);
  }

  listByWorkspace(workspaceId: string) {
    return [...this.entries.values()].filter((entry) => entry.workspaceId === workspaceId);
  }
}