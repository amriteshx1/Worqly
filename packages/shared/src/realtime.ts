import { z } from "zod";

export const workspaceChannelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1)
});

export type WorkspaceChannel = z.infer<typeof workspaceChannelSchema>;

export const defaultWorkspaceChannels: WorkspaceChannel[] = [
  {
    id: "channel-general",
    name: "general",
    description: "Main workspace conversation lane"
  },
  {
    id: "channel-phase-2",
    name: "phase-2-build",
    description: "Live build thread for chat and presence"
  },
  {
    id: "channel-feedback",
    name: "feedback",
    description: "Quick product and UX loops"
  }
];

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  channelId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  body: z.string().min(1),
  sentAt: z.string().datetime()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const presenceStateSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  activeSurface: z.string().min(1),
  connectedAt: z.string().datetime()
});

export type PresenceState = z.infer<typeof presenceStateSchema>;

export const workspaceBootstrapSchema = z.object({
  workspaceId: z.string().min(1),
  channels: z.array(workspaceChannelSchema),
  messagesByChannel: z.record(z.string(), z.array(chatMessageSchema)),
  presence: z.array(presenceStateSchema)
});

export type WorkspaceBootstrap = z.infer<typeof workspaceBootstrapSchema>;