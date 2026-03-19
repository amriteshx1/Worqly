import { Queue, Worker } from "bullmq";
import { processSummaryJob, summaryQueueName, type SummaryJobData } from "./jobs/summary-job.js";
import { workerConfig } from "./config.js";

const connection = {
  url: workerConfig.redisUrl
};

export const summaryQueue = new Queue<SummaryJobData>(summaryQueueName, {
  connection
});

const worker = new Worker<SummaryJobData>(
  summaryQueueName,
  async (job) => {
    const result = await processSummaryJob(job.data);
    console.log("Summary job complete", result);
    return result;
  },
  {
    connection
  }
);

worker.on("completed", (job) => {
  console.log(`Completed ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Failed ${job?.id ?? "unknown"}`, error);
});

console.log("Worqly worker online");