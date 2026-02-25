/**
 * Azure OpenAI Embedding Service
 *
 * Generates embeddings using Azure OpenAI Service.
 * Supports batching to minimize API calls and stay within rate limits.
 *
 * Rate Limit Strategy:
 * - Batch multiple texts into single API calls (max 16 per call)
 * - Add delays between batches to avoid rate limits
 * - Retry on transient failures with exponential backoff
 */

import { AzureOpenAI } from 'openai';

export class AzureOpenAIEmbeddingService {
  private client: AzureOpenAI;
  private deploymentName: string;
  private readonly dimensions = 1536; // text-embedding-ada-002 / text-embedding-3-small

  // Rate limiting configuration
  private readonly batchSize: number;
  private readonly batchDelayMs: number;
  private readonly maxRetries: number = 3;
  private readonly initialRetryDelayMs: number = 1000;

  constructor(options?: { batchSize?: number; batchDelayMs?: number }) {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
    this.deploymentName = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small';

    if (!apiKey || !endpoint) {
      throw new Error(
        'Missing Azure OpenAI configuration. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in .env'
      );
    }

    this.client = new AzureOpenAI({
      apiKey,
      endpoint,
      apiVersion,
    });

    // Rate limiting config (can be overridden via constructor)
    this.batchSize = options?.batchSize ?? 16; // Default: 16 texts per batch
    this.batchDelayMs = options?.batchDelayMs ?? 500; // Default: 500ms between batches

    console.log('✅ Azure OpenAI Embedding Service initialized');
    console.log(`   - Endpoint: ${endpoint}`);
    console.log(`   - Deployment: ${this.deploymentName}`);
    console.log(`   - Dimensions: ${this.dimensions}`);
    console.log(`   - Batch size: ${this.batchSize}`);
    console.log(`   - Batch delay: ${this.batchDelayMs}ms`);
  }

  /**
   * Generate embeddings for an array of texts
   * Automatically batches requests to stay within rate limits
   *
   * @param texts - Array of strings to generate embeddings for
   * @returns Array of embedding vectors (each vector has 1536 dimensions)
   * @throws Error if API call fails after retries
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // If single text or small batch, process directly
    if (texts.length <= this.batchSize) {
      return this.generateEmbeddingsBatch(texts);
    }

    // Process in batches with delays
    console.log(
      `[Azure OpenAI] Processing ${texts.length} texts in ${Math.ceil(texts.length / this.batchSize)} batches...`
    );

    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(texts.length / this.batchSize);
      const batch = texts.slice(i, i + this.batchSize);

      console.log(
        `[Azure OpenAI] Processing batch ${batchNumber}/${totalBatches} (${batch.length} texts)`
      );

      const batchEmbeddings = await this.generateEmbeddingsBatch(batch);
      allEmbeddings.push(...batchEmbeddings);

      // Add delay between batches (except for the last one)
      if (i + this.batchSize < texts.length) {
        await this.delay(this.batchDelayMs);
      }
    }

    console.log(`[Azure OpenAI] ✅ Generated ${allEmbeddings.length} embeddings in total`);
    return allEmbeddings;
  }

  /**
   * Generate embeddings for a single batch with retry logic
   */
  private async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.embeddings.create({
          model: this.deploymentName,
          input: texts,
        });

        const embeddings = response.data.map((item) => item.embedding);

        if (attempt > 1) {
          console.log(`[Azure OpenAI] ✅ Retry attempt ${attempt} succeeded`);
        }

        return embeddings;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Extract error properties for retry logic
        const errorStatus = (error as { status?: number }).status;
        const errorCode = (error as { code?: string }).code;

        // Check if it's a rate limit error (429)
        if (errorStatus === 429 || errorCode === 'rate_limit_exceeded') {
          const retryAfterMs = this.getRetryAfterMs(
            error as { headers?: { 'retry-after'?: string } }
          );

          if (attempt < this.maxRetries) {
            const delayMs = retryAfterMs || this.initialRetryDelayMs * Math.pow(2, attempt - 1);
            console.warn(
              `[Azure OpenAI] ⚠️ Rate limit hit (attempt ${attempt}/${this.maxRetries}). Waiting ${delayMs}ms before retry...`
            );
            await this.delay(delayMs);
            continue;
          }
        }

        // Check if it's a transient error (5xx)
        if (errorStatus !== undefined && errorStatus >= 500 && attempt < this.maxRetries) {
          const delayMs = this.initialRetryDelayMs * Math.pow(2, attempt - 1);
          console.warn(
            `[Azure OpenAI] ⚠️ Server error (attempt ${attempt}/${this.maxRetries}). Waiting ${delayMs}ms before retry...`
          );
          await this.delay(delayMs);
          continue;
        }

        // For other errors or max retries exceeded, throw immediately
        break;
      }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'Unknown error';
    console.error(`[Azure OpenAI] ❌ Failed after ${this.maxRetries} attempts: ${errorMessage}`);
    throw new Error(
      `Failed to generate embeddings after ${this.maxRetries} retries: ${errorMessage}`
    );
  }

  /**
   * Extract retry-after value from error headers
   */
  private getRetryAfterMs(error: any): number | null {
    const retryAfter = error?.headers?.['retry-after'];
    if (retryAfter) {
      // Parse seconds or date format
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
    return null;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the dimension size of embeddings produced by this service
   */
  getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Get the deployment name
   */
  getDeploymentName(): string {
    return this.deploymentName;
  }
}
