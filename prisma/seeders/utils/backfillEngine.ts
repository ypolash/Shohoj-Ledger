import { PrismaClient } from '@prisma/client';

export interface BackfillContext {
  prisma: PrismaClient;
  dryRun: boolean;
  batchSize: number;
}

export interface BatchProcessingResult {
  totalProcessed: number;
  totalFailed: number;
  failedRecords: any[];
}

/**
 * Creates a progress logger instance for a given model.
 * Provides ETA and tracking metrics.
 */
export function createProgressLogger(modelName: string, totalRecords: number) {
  let processed = 0;
  const startTime = Date.now();

  return {
    logProgress(currentBatchSize: number) {
      processed += currentBatchSize;
      const remaining = totalRecords - processed;
      
      const elapsedMs = Date.now() - startTime;
      const timePerRecord = processed > 0 ? elapsedMs / processed : 0;
      const estimatedRemainingMs = remaining * timePerRecord;
      const estimatedRemainingSecs = Math.round(estimatedRemainingMs / 1000);

      console.log(
        `[${modelName}] Progress: ${processed}/${totalRecords} | ` +
        `Remaining: ${remaining} | ` +
        `ETA: ${estimatedRemainingSecs}s`
      );
    },
    logComplete() {
      const totalSecs = Math.round((Date.now() - startTime) / 1000);
      console.log(`[${modelName}] Finished processing ${processed} records in ${totalSecs}s.`);
    }
  };
}

/**
 * Validates the input before attempting updates.
 */
export const validationHelpers = {
  isValidId: (id: any): boolean => typeof id === 'string' && id.trim().length > 0,
  hasRequiredFields: (record: any, fields: string[]): boolean => {
    if (!record) return false;
    return fields.every(f => record[f] !== undefined && record[f] !== null);
  }
};

/**
 * Wraps operations in a Prisma transaction.
 * Accommodates standard timeout increases for bulk operations.
 */
export async function executeInTransaction<T>(
  ctx: BackfillContext,
  operation: (tx: any) => Promise<T>
): Promise<T> {
  if (ctx.dryRun) {
    console.log('[DRY RUN] Bypassing transaction wrap. Database mutations are simulated.');
    return operation(ctx.prisma);
  }

  return ctx.prisma.$transaction(
    async (tx) => {
      return operation(tx);
    },
    {
      maxWait: 15000,
      timeout: 60000,
    }
  );
}

/**
 * Evaluates whether to execute an operation or log it based on dryRun status.
 */
export function dryRunSupport(
  ctx: BackfillContext, 
  operationDesc: string, 
  actualOperation: () => Promise<any>
) {
  if (ctx.dryRun) {
    console.log(`[DRY RUN] ${operationDesc}`);
    return Promise.resolve();
  }
  return actualOperation();
}

/**
 * Retries a specific operation with exponential backoff.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts. Last error: ${error}`);
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error("Unreachable");
}

/**
 * Safely updates a single record or logs the intended data if in dryRun.
 */
export async function safeUpdate(
  ctx: BackfillContext,
  modelDelegate: any, // e.g., tx.user, tx.project
  id: string,
  data: any
) {
  return dryRunSupport(
    ctx, 
    `Would update record ID ${id} with: ${JSON.stringify(data)}`, 
    () => modelDelegate.update({
      where: { id },
      data
    })
  );
}

/**
 * Processes records in batches.
 * Orchestrates transactions, retry logic, error aggregation, and logging.
 */
export async function processInBatches<T extends { id: string }>(
  ctx: BackfillContext,
  records: T[],
  modelName: string,
  processRecord: (record: T, tx: any) => Promise<void>
): Promise<BatchProcessingResult> {
  
  const result: BatchProcessingResult = {
    totalProcessed: 0,
    totalFailed: 0,
    failedRecords: []
  };

  if (records.length === 0) {
    console.log(`[${modelName}] No records to process.`);
    return result;
  }

  const logger = createProgressLogger(modelName, records.length);

  for (let i = 0; i < records.length; i += ctx.batchSize) {
    const batch = records.slice(i, i + ctx.batchSize);
    const batchIndex = Math.floor(i / ctx.batchSize) + 1;
    
    console.log(`[${modelName}] Processing batch ${batchIndex} (Size: ${batch.length})`);

    try {
      await withRetry(async () => {
        await executeInTransaction(ctx, async (tx) => {
          const promises = batch.map(async (record) => {
            try {
              await processRecord(record, tx);
            } catch (err) {
              // Re-throw to trigger transaction rollback and retry
              throw { record, error: err };
            }
          });

          await Promise.all(promises);
        });
      }, 3, 500); // 3 retries max, starting at 500ms

      result.totalProcessed += batch.length;
      logger.logProgress(batch.length);

    } catch (batchError: any) {
      console.error(`[${modelName}] Batch ${batchIndex} failed permanently. Aborting.`, batchError);
      
      result.totalFailed += batch.length;
      result.failedRecords.push({
        batchIndex: batchIndex,
        error: batchError?.error?.message || batchError?.message || 'Unknown batch error',
        recordId: batchError?.record?.id || 'Unknown'
      });
      
      // NO SILENT FAILURES: We throw to abort the whole script if a batch fails after retries.
      throw new Error(`Batch processing failed for ${modelName}. Error: ${batchError}`);
    }
  }

  logger.logComplete();
  return result;
}
