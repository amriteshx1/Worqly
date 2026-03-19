import { z } from "zod";

const configSchema = z.object({
  port: z.coerce.number().default(4001),
  corsOrigin: z.string().default("http://localhost:3000"),
  redisUrl: z.string().default("redis://localhost:6379")
});

export const realtimeConfig = configSchema.parse({
  port: process.env.REALTIME_PORT,
  corsOrigin: process.env.REALTIME_CORS_ORIGIN,
  redisUrl: process.env.REDIS_URL
});

