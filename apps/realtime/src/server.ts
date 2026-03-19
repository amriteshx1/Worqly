import cors from "@fastify/cors";
import Fastify from "fastify";
import { Server } from "socket.io";
import { z } from "zod";
import { realtimeConfig } from "./config.js";
import { registerChatGateway } from "./modules/chat/chat-gateway.js";
import { PresenceStore } from "./modules/presence/presence-store.js";

const joinWorkspaceSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  activeSurface: z.string().min(1)
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

    socket.join(input.workspaceId);
    presenceStore.set({
      workspaceId: input.workspaceId,
      userId: input.userId,
      activeSurface: input.activeSurface,
      socketId: socket.id,
      connectedAt: new Date().toISOString()
    });

    io.to(input.workspaceId).emit("presence.updated", presenceStore.listByWorkspace(input.workspaceId));
  });

  registerChatGateway(io, socket);

  socket.on("disconnect", () => {
    const staleEntry = presenceStore.getBySocketId(socket.id);
    presenceStore.delete(socket.id);

    if (staleEntry) {
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