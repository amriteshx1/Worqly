import cors from "@fastify/cors";
import { documentJoinSchema, documentSurfaceId, documentUpdateSchema, parseEventEnvelope } from "@worqly/shared";
import Fastify from "fastify";
import { Server } from "socket.io";
import { z } from "zod";
import { realtimeConfig } from "./config.js";
import { registerChatGateway } from "./modules/chat/chat-gateway.js";
import { ChatStore } from "./modules/chat/chat-store.js";
import { DocumentStore } from "./modules/docs/document-store.js";
import { PresenceStore } from "./modules/presence/presence-store.js";

const joinWorkspaceSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  activeSurface: z.string().min(1)
});

const joinChannelSchema = z.object({
  workspaceId: z.string().min(1),
  channelId: z.string().min(1),
  userId: z.string().min(1)
});

const app = Fastify({
  logger: true
});

const io = new Server(app.server, {
  cors: {
    origin: realtimeConfig.corsOrigin,
    credentials: true
  }
});

const presenceStore = new PresenceStore();
const chatStore = new ChatStore();
const documentStore = new DocumentStore();

function getDocumentRoomId(workspaceId: string, documentId: string) {
  return `${workspaceId}:document:${documentId}`;
}

await app.register(cors, {
  origin: realtimeConfig.corsOrigin,
  credentials: true
});

app.get("/health", async () => {
  return {
    ok: true,
    service: "realtime",
    redisUrl: realtimeConfig.redisUrl
  };
});

io.on("connection", (socket) => {
  socket.on("workspace:join", (payload) => {
    const input = joinWorkspaceSchema.parse(payload);
    const workspaceState = chatStore.bootstrap(input.workspaceId);

    socket.join(input.workspaceId);
    presenceStore.set({
      workspaceId: input.workspaceId,
      userId: input.userId,
      userName: input.userName,
      activeSurface: input.activeSurface,
      socketId: socket.id,
      connectedAt: new Date().toISOString()
    });

    socket.emit("workspace.bootstrap", {
      workspaceId: input.workspaceId,
      channels: workspaceState.channels,
      messagesByChannel: workspaceState.messagesByChannel,
      presence: presenceStore.listByWorkspace(input.workspaceId)
    });

    io.to(input.workspaceId).emit("presence.updated", presenceStore.listByWorkspace(input.workspaceId));
  });

  socket.on("channel:join", (payload) => {
    const input = joinChannelSchema.parse(payload);
    const state = presenceStore.getBySocketId(socket.id);

    if (!state || state.userId !== input.userId) {
      return;
    }

    presenceStore.setActiveSurface(socket.id, input.channelId);
    io.to(input.workspaceId).emit("presence.updated", presenceStore.listByWorkspace(input.workspaceId));
  });

  socket.on("document:join", (payload) => {
    const input = documentJoinSchema.parse(payload);
    const state = presenceStore.getBySocketId(socket.id);

    socket.join(getDocumentRoomId(input.workspaceId, input.documentId));

    if (state && state.userId === input.userId) {
      presenceStore.setActiveSurface(socket.id, documentSurfaceId(input.documentId));
      io.to(input.workspaceId).emit("presence.updated", presenceStore.listByWorkspace(input.workspaceId));
    }

    socket.emit("document.bootstrap", documentStore.bootstrap(input.workspaceId, input.documentId));
  });

  socket.on("document:update", (payload) => {
    const update = documentStore.applyUpdate(documentUpdateSchema.parse(payload));

    socket
      .to(getDocumentRoomId(update.workspaceId, update.documentId))
      .emit("document.updated", update);
  });

  registerChatGateway({ io, socket, chatStore });

  socket.on("disconnect", () => {
    const staleEntry = presenceStore.getBySocketId(socket.id);
    presenceStore.delete(socket.id);

    if (staleEntry) {
      if (staleEntry.activeSurface.startsWith("channel-")) {
        socket.to(staleEntry.workspaceId).emit(
          "message.typing.stopped",
          parseEventEnvelope("message.typing.stopped", {
            workspaceId: staleEntry.workspaceId,
            channelId: staleEntry.activeSurface,
            actorId: staleEntry.userId,
            userName: staleEntry.userName,
            sentAt: new Date().toISOString()
          })
        );
      }

      io.to(staleEntry.workspaceId).emit(
        "presence.updated",
        presenceStore.listByWorkspace(staleEntry.workspaceId)
      );
    }
  });
});

async function start() {
  await app.listen({
    host: "0.0.0.0",
    port: realtimeConfig.port
  });
}

start().catch((error) => {
  app.log.error(error);
  process.exit(1);
});