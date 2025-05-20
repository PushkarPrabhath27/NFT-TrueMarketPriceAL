/**
 * NFT TrustScore API Asynchronous Processing
 * 
 * This module implements asynchronous processing patterns for the NFT TrustScore API
 * to handle long-running operations, batch processing, and resource-intensive computations.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { config } from '../config';

// Job status types
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Job priority levels
export enum JobPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

// Job interface
export interface Job {
  id: string;
  type: string;
  data: any;
  status: JobStatus;
  priority: JobPriority;
  progress: number;
  result?: any;
  error?: any;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  callbackUrl?: string;
}

/**
 * Job Queue Manager for asynchronous processing
 * 
 * Implements a job queue system for handling:
 * - Long-running operations
 * - Batch processing requests
 * - Resource-intensive computations
 * - Notification delivery
 * - Data exports and reports
 */
export class JobQueueManager extends EventEmitter {
  private static instance: JobQueueManager;
  private jobs: Map<string, Job>;
  private processingJobs: Map<string, NodeJS.Timeout>;
  private jobHandlers: Map<string, (job: Job) => Promise<any>>;
  private isProcessing: boolean;
  private maxConcurrentJobs: number;
  
  private constructor() {
    super();
    this.jobs = new Map();
    this.processingJobs = new Map();
    this.jobHandlers = new Map();
    this.isProcessing = false;
    this.maxConcurrentJobs = (config as any).async?.maxConcurrentJobs ?? 5;
    
    // Start processing loop
    this.startProcessing();
  }
  
  /**
   * Get the singleton instance of JobQueueManager
   */
  public static getInstance(): JobQueueManager {
    if (!JobQueueManager.instance) {
      JobQueueManager.instance = new JobQueueManager();
    }
    return JobQueueManager.instance;
  }
  
  /**
   * Register a job handler for a specific job type
   * 
   * @param jobType Type of job
   * @param handler Handler function for the job
   */
  public registerHandler(jobType: string, handler: (job: Job) => Promise<any>): void {
    this.jobHandlers.set(jobType, handler);
  }
  
  /**
   * Create and enqueue a new job
   * 
   * @param jobType Type of job
   * @param data Job data
   * @param options Job options
   * @returns Job object
   */
  public createJob(jobType: string, data: any, options?: {
    priority?: JobPriority,
    callbackUrl?: string
  }): Job {
    // Check if handler exists for this job type
    if (!this.jobHandlers.has(jobType)) {
      throw new Error(`No handler registered for job type: ${jobType}`);
    }
    
    const jobId = uuidv4();
    const now = new Date();
    
    const job: Job = {
      id: jobId,
      type: jobType,
      data,
      status: JobStatus.PENDING,
      priority: options?.priority || JobPriority.NORMAL,
      progress: 0,
      createdAt: now,
      updatedAt: now,
      callbackUrl: options?.callbackUrl
    };
    
    // Add job to queue
    this.jobs.set(jobId, job);
    
    // Emit event
    this.emit('job:created', job);
    
    // Trigger processing
    this.processNextJobs();
    
    return job;
  }
  
  /**
   * Get a job by ID
   * 
   * @param jobId Job ID
   * @returns Job object or null if not found
   */
  public getJob(jobId: string): Job | null {
    return this.jobs.get(jobId) || null;
  }
  
  /**
   * Update job progress
   * 
   * @param jobId Job ID
   * @param progress Progress percentage (0-100)
   * @param result Optional partial result
   */
  public updateJobProgress(jobId: string, progress: number, result?: any): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    job.progress = Math.min(Math.max(progress, 0), 100);
    job.updatedAt = new Date();
    
    if (result) {
      job.result = result;
    }
    
    // Update job in map
    this.jobs.set(jobId, job);
    
    // Emit event
    this.emit('job:progress', job);
  }
  
  /**
   * Complete a job
   * 
   * @param jobId Job ID
   * @param result Job result
   */
  public completeJob(jobId: string, result: any): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    job.status = JobStatus.COMPLETED;
    job.progress = 100;
    job.result = result;
    job.updatedAt = new Date();
    job.completedAt = new Date();
    
    // Update job in map
    this.jobs.set(jobId, job);
    
    // Clear timeout if exists
    const timeout = this.processingJobs.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.processingJobs.delete(jobId);
    }
    
    // Emit event
    this.emit('job:completed', job);
    
    // Send webhook callback if configured
    if (job.callbackUrl) {
      this.sendCallback(job);
    }
    
    // Process next job
    this.processNextJobs();
  }
  
  /**
   * Fail a job
   * 
   * @param jobId Job ID
   * @param error Error object or message
   */
  public failJob(jobId: string, error: any): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    job.status = JobStatus.FAILED;
    job.error = error;
    job.updatedAt = new Date();
    
    // Update job in map
    this.jobs.set(jobId, job);
    
    // Clear timeout if exists
    const timeout = this.processingJobs.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.processingJobs.delete(jobId);
    }
    
    // Emit event
    this.emit('job:failed', job);
    
    // Send webhook callback if configured
    if (job.callbackUrl) {
      this.sendCallback(job);
    }
    
    // Process next job
    this.processNextJobs();
  }
  
  /**
   * Cancel a job
   * 
   * @param jobId Job ID
   */
  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    // Can only cancel pending jobs
    if (job.status !== JobStatus.PENDING) {
      return false;
    }
    
    job.status = JobStatus.CANCELLED;
    job.updatedAt = new Date();
    
    // Update job in map
    this.jobs.set(jobId, job);
    
    // Emit event
    this.emit('job:cancelled', job);
    
    // Send webhook callback if configured
    if (job.callbackUrl) {
      this.sendCallback(job);
    }
    
    return true;
  }
  
  /**
   * Get all jobs with optional filtering
   * 
   * @param filter Filter options
   * @returns Array of jobs
   */
  public getJobs(filter?: {
    status?: JobStatus,
    type?: string,
    limit?: number,
    offset?: number
  }): Job[] {
    let jobs = Array.from(this.jobs.values());
    
    // Apply filters
    if (filter?.status) {
      jobs = jobs.filter(job => job.status === filter.status);
    }
    
    if (filter?.type) {
      jobs = jobs.filter(job => job.type === filter.type);
    }
    
    // Sort by priority (high to low) and creation time
    jobs.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    // Apply pagination
    if (filter?.offset || filter?.limit) {
      const offset = filter.offset || 0;
      const limit = filter.limit || jobs.length;
      jobs = jobs.slice(offset, offset + limit);
    }
    
    return jobs;
  }
  
  /**
   * Get job counts by status
   * 
   * @returns Object with counts by status
   */
  public getJobCounts(): Record<JobStatus, number> {
    const counts = {
      [JobStatus.PENDING]: 0,
      [JobStatus.PROCESSING]: 0,
      [JobStatus.COMPLETED]: 0,
      [JobStatus.FAILED]: 0,
      [JobStatus.CANCELLED]: 0
    };
    
    for (const job of this.jobs.values()) {
      counts[job.status]++;
    }
    
    return counts;
  }
  
  /**
   * Clean up completed and failed jobs older than specified time
   * 
   * @param maxAge Maximum age in milliseconds
   */
  public cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = new Date().getTime();
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED || job.status === JobStatus.CANCELLED) {
        const jobAge = now - job.updatedAt.getTime();
        
        if (jobAge > maxAge) {
          this.jobs.delete(jobId);
        }
      }
    }
  }
  
  /**
   * Start the job processing loop
   */
  private startProcessing(): void {
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupOldJobs();
    }, (config as any).async?.cleanupInterval ?? 3600000); // Default: 1 hour
    
    // Process initial jobs
    this.processNextJobs();
  }
  
  /**
   * Process next jobs in queue
   */
  private processNextJobs(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Get all pending jobs
      const pendingJobs = this.getJobs({ status: JobStatus.PENDING });
      
      // Calculate how many more jobs we can process
      const availableSlots = this.maxConcurrentJobs - this.processingJobs.size;
      
      if (availableSlots > 0 && pendingJobs.length > 0) {
        // Take the next jobs based on priority and creation time
        const jobsToProcess = pendingJobs.slice(0, availableSlots);
        
        // Process each job
        for (const job of jobsToProcess) {
          this.processJob(job);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Process a single job
   * 
   * @param job Job to process
   */
  private processJob(job: Job): void {
    // Update job status
    job.status = JobStatus.PROCESSING;
    job.startedAt = new Date();
    job.updatedAt = new Date();
    
    // Update job in map
    this.jobs.set(job.id, job);
    
    // Emit event
    this.emit('job:processing', job);
    
    // Get handler for this job type
    const handler = this.jobHandlers.get(job.type);
    
    if (!handler) {
      this.failJob(job.id, new Error(`No handler found for job type: ${job.type}`));
      return;
    }
    
    // Set timeout for job execution
    const timeout = setTimeout(() => {
      this.failJob(job.id, new Error('Job execution timed out'));
    }, config.async.jobTimeout || 300000); // Default: 5 minutes
    
    // Store timeout reference
    this.processingJobs.set(job.id, timeout);
    
    // Execute handler
    handler(job)
      .then(result => {
        this.completeJob(job.id, result);
      })
      .catch(error => {
        this.failJob(job.id, error);
      });
  }
  
  /**
   * Send webhook callback for a job
   * 
   * @param job Job to send callback for
   */
  private async sendCallback(job: Job): Promise<void> {
    if (!job.callbackUrl) return;
    
    try {
      // Send webhook callback
      const response = await fetch(job.callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Job-ID': job.id
        },
        body: JSON.stringify({
          jobId: job.id,
          status: job.status,
          result: job.result,
          error: job.error,
          progress: job.progress,
          completedAt: job.completedAt
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to send callback for job ${job.id}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error sending callback for job ${job.id}:`, error);
    }
  }
}

// Export singleton instance
export const jobQueueManager = JobQueueManager.getInstance();

/**
 * Batch Processor for handling multiple items efficiently
 * 
 * Implements batch processing capabilities for:
 * - Processing multiple NFTs
 * - Bulk data operations
 * - Aggregated analytics
 */
export class BatchProcessor {
  private static instance: BatchProcessor;
  private batchSize: number;
  private batchInterval: number;
  
  private constructor() {
    this.batchSize = (config as any).async?.batchSize ?? 100;
    this.batchInterval = (config as any).async?.batchInterval ?? 1000;
  }
  
  /**
   * Get the singleton instance of BatchProcessor
   */
  public static getInstance(): BatchProcessor {
    if (!BatchProcessor.instance) {
      BatchProcessor.instance = new BatchProcessor();
    }
    return BatchProcessor.instance;
  }
  
  /**
   * Process items in batches
   * 
   * @param items Array of items to process
   * @param processFn Function to process each item
   * @param options Batch processing options
   * @returns Processing results
   */
  public async processBatch<T, R>(
    items: T[],
    processFn: (item: T) => Promise<R>,
    options?: {
      batchSize?: number,
      concurrency?: number,
      onProgress?: (processed: number, total: number) => void
    }
  ): Promise<R[]> {
    const batchSize = options?.batchSize || this.batchSize;
    const concurrency = options?.concurrency || 1;
    const onProgress = options?.onProgress;
    
    const results: R[] = [];
    let processed = 0;
    
    // Split items into batches
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    // Process batches with concurrency limit
    for (let i = 0; i < batches.length; i += concurrency) {
      const batchPromises = batches.slice(i, i + concurrency).map(async (batch) => {
        const batchResults: R[] = [];
        
        for (const item of batch) {
          try {
            const result = await processFn(item);
            batchResults.push(result);
          } catch (error) {
            console.error('Error processing batch item:', error);
            // Push null for failed items to maintain index alignment
            batchResults.push(null as unknown as R);
          }
        }
        
        return batchResults;
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Flatten results and update progress
      for (const batchResult of batchResults) {
        results.push(...batchResult);
        processed += batchResult.length;
        
        if (onProgress) {
          onProgress(processed, items.length);
        }
      }
      
      // Add delay between batch groups to prevent overwhelming the system
      if (i + concurrency < batches.length) {
        await new Promise(resolve => setTimeout(resolve, this.batchInterval));
      }
    }
    
    return results;
  }
  
  /**
   * Process a stream of items
   * 
   * @param stream Async iterable stream of items
   * @param processFn Function to process each item
   * @param options Stream processing options
   */
  public async processStream<T, R>(
    stream: AsyncIterable<T>,
    processFn: (item: T) => Promise<R>,
    options?: {
      batchSize?: number,
      onProgress?: (processed: number) => void
    }
  ): Promise<R[]> {
    const batchSize = options?.batchSize || this.batchSize;
    const onProgress = options?.onProgress;
    
    const results: R[] = [];
    let batch: T[] = [];
    let processed = 0;
    
    for await (const item of stream) {
      batch.push(item);
      
      // Process batch when it reaches the batch size
      if (batch.length >= batchSize) {
        const batchResults = await this.processBatchItems(batch, processFn);
        results.push(...batchResults);
        
        processed += batch.length;
        if (onProgress) {
          onProgress(processed);
        }
        
        // Reset batch
        batch = [];
        
        // Add delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, this.batchInterval));
      }
    }
    
    // Process remaining items
    if (batch.length > 0) {
      const batchResults = await this.processBatchItems(batch, processFn);
      results.push(...batchResults);
      
      processed += batch.length;
      if (onProgress) {
        onProgress(processed);
      }
    }
    
    return results;
  }
  
  /**
   * Process a batch of items
   * 
   * @param items Batch of items to process
   * @param processFn Function to process each item
   * @returns Processing results
   */
  private async processBatchItems<T, R>(
    items: T[],
    processFn: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (const item of items) {
      try {
        const result = await processFn(item);
        results.push(result);
      } catch (error) {
        console.error('Error processing batch item:', error);
        // Push null for failed items to maintain index alignment
        results.push(null as unknown as R);
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const batchProcessor = BatchProcessor.getInstance();