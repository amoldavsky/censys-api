import PQueue from 'p-queue';
import logger from "@/utils/logger";

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: string;
  payload: any;
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface JobHandler {
  (payload: any): Promise<void>;
}

// Module state
const queue = new PQueue({
  concurrency: 3,
  interval: 1000,
  intervalCap: 5,
  timeout: 300000, // 5 minutes
});

const jobs = new Map<string, Job>();
const handlers = new Map<string, JobHandler>();
let jobCounter = 0;

// Queue event handlers
queue.on('active', () => {
  logger.debug({ queueSize: queue.size, pending: queue.pending }, "Jobs queue active");
});

queue.on('error', (error) => {
  logger.error({ error }, "Jobs queue error");
});

/**
 * Register a job handler for a specific job type
 */
export function registerHandler(jobType: string, handler: JobHandler): void {
  handlers.set(jobType, handler);
}

/**
 * Submit a new job to the queue
 */
export function submitJob(jobType: string, payload: any): string {
  const jobId = `job_${++jobCounter}_${Date.now()}`;

  const job: Job = {
    id: jobId,
    type: jobType,
    payload,
    status: 'pending',
    createdAt: new Date(),
  };

  jobs.set(jobId, job);

  // Add to queue
  queue.add(() => processJob(jobId), {
    priority: 1,
  });

  logger.info({ jobId, jobType, queueSize: queue.size + 1 }, "Job submitted");
  return jobId;
}

/**
 * Get job status by ID
 */
export function getJobStatus(jobId: string): Job | null {
  return jobs.get(jobId) || null;
}

/**
 * Get all jobs (for monitoring)
 */
export function getAllJobs(): Job[] {
  return Array.from(jobs.values());
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
  return {
    size: queue.size,
    pending: queue.pending,
    isPaused: queue.isPaused,
    totalJobs: jobs.size,
    completedJobs: Array.from(jobs.values()).filter(j => j.status === 'completed').length,
    failedJobs: Array.from(jobs.values()).filter(j => j.status === 'failed').length,
  };
}

/**
 * Process a job
 */
async function processJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) {
    logger.error({ jobId }, "Job not found");
    return;
  }

  const handler = handlers.get(job.type);
  if (!handler) {
    logger.error({ jobId, jobType: job.type }, "No handler registered for job type");
    job.status = 'failed';
    job.error = `No handler for job type: ${job.type}`;
    job.completedAt = new Date();
    return;
  }

  const startTime = Date.now();

  try {
    logger.info({ jobId, jobType: job.type }, "Job started");

    job.status = 'processing';
    job.startedAt = new Date();

    await handler(job.payload);

    const duration = Date.now() - startTime;
    job.status = 'completed';
    job.completedAt = new Date();

    logger.info({ jobId, jobType: job.type, duration }, "Job completed");
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error({ jobId, jobType: job.type, duration, error: errorMessage }, "Job failed");

    job.status = 'failed';
    job.error = errorMessage;
    job.completedAt = new Date();
  }
}

/**
 * Graceful shutdown - wait for all jobs to complete
 */
export async function shutdown(): Promise<void> {
  logger.info("Shutting down jobs service");
  queue.pause();
  await queue.onIdle();
  logger.info("Jobs service shutdown complete");
}
