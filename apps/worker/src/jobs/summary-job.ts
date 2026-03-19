import { EventEnvelope } from "@worqly/shared";
import OpenAI from "openai";
import { workerConfig } from "../config.js";

export const summaryQueueName = "ai-summary";

type SummaryJobData = {
  workspaceId: string;
  sourceType: "channel" | "document";
  sourceId: string;
  transcript: string[];
};

export async function processSummaryJob(data: SummaryJobData) {
  if (!workerConfig.openAiApiKey) {
    return {
      type: "ai.summary.generated",
      payload: {
        workspaceId: data.workspaceId,
        actorId: "system",
        sentAt: new Date().toISOString(),
        summaryId: "demo-summary",
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        text: "Local fallback summary: connect an OpenAI API key to replace this placeholder."
      }
    } satisfies EventEnvelope<"ai.summary.generated">;
  }

  const openai = new OpenAI({
    apiKey: workerConfig.openAiApiKey
  });

  const completion = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: "Summarize workspace activity in a crisp update for the team."
      },
      {
        role: "user",
        content: data.transcript.join("\n")
      }
    ]
  });

  return {
    type: "ai.summary.generated",
    payload: {
      workspaceId: data.workspaceId,
      actorId: "system",
      sentAt: new Date().toISOString(),
      summaryId: crypto.randomUUID(),
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      text: completion.output_text
    }
  } satisfies EventEnvelope<"ai.summary.generated">;
}

export type { SummaryJobData };