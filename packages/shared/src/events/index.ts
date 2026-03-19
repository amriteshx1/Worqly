import { z } from "zod";

export const workspaceRoleSchema = z.enum(["owner", "member"]);

export const eventNameSchema = z.enum([
  "workspace.joined",
  "channel.joined",
  "message.sent",
  "message.typing.started",
  "message.typing.stopped",
  "doc.updated",
  "doc.presence.updated",
  "room.joined",
  "room.left",
  "webrtc.signal.sent",
  "ai.command.requested",
  "ai.summary.generated"
]);

const baseEventSchema = z.object({
  workspaceId: z.string().min(1),
  actorId: z.string().min(1),
  sentAt: z.string().datetime()
});

export const eventPayloadSchemas = {
  "workspace.joined": baseEventSchema.extend({
    role: workspaceRoleSchema
  }),
  "channel.joined": baseEventSchema.extend({
    channelId: z.string().min(1)
  }),
  "message.sent": baseEventSchema.extend({
    channelId: z.string().min(1),
    messageId: z.string().min(1),
    body: z.string().min(1)
  }),
  "message.typing.started": baseEventSchema.extend({
    channelId: z.string().min(1)
  }),
  "message.typing.stopped": baseEventSchema.extend({
    channelId: z.string().min(1)
  }),
  "doc.updated": baseEventSchema.extend({
    documentId: z.string().min(1),
    revisionId: z.string().min(1)
  }),
  "doc.presence.updated": baseEventSchema.extend({
    documentId: z.string().min(1),
    cursorState: z.record(z.string(), z.string())
  }),
  "room.joined": baseEventSchema.extend({
    roomId: z.string().min(1)
  }),
  "room.left": baseEventSchema.extend({
    roomId: z.string().min(1)
  }),
  "webrtc.signal.sent": baseEventSchema.extend({
    roomId: z.string().min(1),
    signalType: z.enum(["offer", "answer", "ice-candidate"]),
    targetUserId: z.string().min(1)
  }),
  "ai.command.requested": baseEventSchema.extend({
    command: z.literal("/summary"),
    sourceType: z.enum(["channel", "document"]),
    sourceId: z.string().min(1)
  }),
  "ai.summary.generated": baseEventSchema.extend({
    summaryId: z.string().min(1),
    sourceType: z.enum(["channel", "document"]),
    sourceId: z.string().min(1),
    text: z.string().min(1)
  })
} satisfies Record<string, z.ZodTypeAny>;

export type EventName = z.infer<typeof eventNameSchema>;

type EventPayloadMap = {
  [K in EventName]: z.infer<(typeof eventPayloadSchemas)[K]>;
};

export type EventEnvelope<K extends EventName = EventName> = {
  type: K;
  payload: EventPayloadMap[K];
};

export function parseEventEnvelope<K extends EventName>(
  type: K,
  payload: unknown
): EventEnvelope<K> {
  return {
    type,
    payload: eventPayloadSchemas[type].parse(payload) as EventPayloadMap[K]
  };
}