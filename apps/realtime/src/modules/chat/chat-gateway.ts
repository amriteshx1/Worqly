import type { ChatStore } from "./chat-store.js";
import { type ChatMessage, type EventEnvelope, parseEventEnvelope } from "@worqly/shared";
import type { Server, Socket } from "socket.io";

type RegisterChatGatewayOptions = {
  io: Server;
  socket: Socket;
  chatStore: ChatStore;
};

export function registerChatGateway({ io, socket, chatStore }: RegisterChatGatewayOptions) {
  socket.on("message:send", (payload) => {
    const event = parseEventEnvelope("message.sent", {
      ...payload,
      sentAt: new Date().toISOString()
    });

    const message: ChatMessage = {
      id: event.payload.messageId,
      workspaceId: event.payload.workspaceId,
      channelId: event.payload.channelId,
      authorId: event.payload.actorId,
      authorName: event.payload.authorName,
      body: event.payload.body,
      sentAt: event.payload.sentAt
    };

    chatStore.appendMessage(message);
    io.to(event.payload.workspaceId).emit(event.type, event);
  });

  socket.on("typing:start", (payload) => {
    const event: EventEnvelope<"message.typing.started"> = parseEventEnvelope(
      "message.typing.started",
      {
        ...payload,
        sentAt: new Date().toISOString()
      }
    );

    socket.to(event.payload.workspaceId).emit(event.type, event);
  });

  socket.on("typing:stop", (payload) => {
    const event = parseEventEnvelope("message.typing.stopped", {
      ...payload,
      sentAt: new Date().toISOString()
    });

    socket.to(event.payload.workspaceId).emit(event.type, event);
  });
}