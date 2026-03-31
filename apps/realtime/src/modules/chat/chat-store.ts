import { defaultWorkspaceChannels, type ChatMessage, type WorkspaceChannel } from "@worqly/shared";

type WorkspaceChatState = {
  channels: WorkspaceChannel[];
  messagesByChannel: Record<string, ChatMessage[]>;
};

function createWelcomeMessages(workspaceId: string): Record<string, ChatMessage[]> {
  const now = new Date();

  return {
    "channel-general": [
      {
        id: crypto.randomUUID(),
        workspaceId,
        channelId: "channel-general",
        authorId: "system",
        authorName: "Worqly Bot",
        body: "Welcome to Worqly. Phase 2 is now focused on live chat and presence.",
        sentAt: new Date(now.getTime() - 1000 * 60 * 4).toISOString()
      }
    ],
    "channel-phase-2": [
      {
        id: crypto.randomUUID(),
        workspaceId,
        channelId: "channel-phase-2",
        authorId: "system",
        authorName: "Worqly Bot",
        body: "Use this channel to verify realtime fan-out, typing, and presence across two browser tabs.",
        sentAt: new Date(now.getTime() - 1000 * 60 * 2).toISOString()
      }
    ],
    "channel-feedback": []
  };
}

export class ChatStore {
  private readonly workspaces = new Map<string, WorkspaceChatState>();

  ensureWorkspace(workspaceId: string) {
    if (!this.workspaces.has(workspaceId)) {
      this.workspaces.set(workspaceId, {
        channels: defaultWorkspaceChannels.map((channel) => ({ ...channel })),
        messagesByChannel: createWelcomeMessages(workspaceId)
      });
    }

    return this.workspaces.get(workspaceId)!;
  }

  bootstrap(workspaceId: string) {
    return this.ensureWorkspace(workspaceId);
  }

  appendMessage(message: ChatMessage) {
    const workspace = this.ensureWorkspace(message.workspaceId);
    const nextMessages = workspace.messagesByChannel[message.channelId] ?? [];

    workspace.messagesByChannel[message.channelId] = [...nextMessages, message];
  }
}