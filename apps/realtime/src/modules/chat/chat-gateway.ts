import { EventEnvelope, parseEventEnvelope } from "@worqly/shared";
import type { Server, Socket } from "socket.io";

export function registerChatGateway(io: Server, socket: Socket) {
  socket.on("message:send", (payload) => {
    const event = parseEventEnvelope("message.sent", {
      ...payload,
      actorId: payload.actorId,
      sentAt: new Date().toISOString()
    });

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

