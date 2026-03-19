import { z } from "zod";

const configSchema = z.object({
  redisUrl: z.string().default("redis://localhost:6379"),
  openAiApiKey: z.string().optional()
});

export const workerConfig = configSchema.parse({
  redisUrl: process.env.REDIS_URL,
  openAiApiKey: process.env.OPENAI_API_KEY
});

