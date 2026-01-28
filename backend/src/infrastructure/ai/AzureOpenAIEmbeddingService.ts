/**
 * Azure OpenAI Embedding Service
 *
 * Generates embeddings using Azure OpenAI Service (text-embedding-ada-002 model).
 * This service provides 720 RPM (7x more than Gemini free tier) and uses
 * university Azure credits.
 */

import { AzureOpenAI } from 'openai';

export class AzureOpenAIEmbeddingService {
  private client: AzureOpenAI;
  private deploymentName: string;
  private readonly dimensions = 1536; // text-embedding-ada-002 dimensions

  constructor() {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'text-embedding-ada-002';

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

    console.log('✅ Azure OpenAI Embedding Service initialized');
    console.log(`   - Endpoint: ${endpoint}`);
    console.log(`   - Deployment: ${this.deploymentName}`);
    console.log(`   - Dimensions: ${this.dimensions}`);
  }

  /**
   * Generate embeddings for an array of texts
   *
   * @param texts - Array of strings to generate embeddings for
   * @returns Array of embedding vectors (each vector has 1536 dimensions)
   * @throws Error if API call fails or rate limit is exceeded
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    try {
      console.log(`[Azure OpenAI] Generating embeddings for ${texts.length} texts...`);

      const response = await this.client.embeddings.create({
        model: this.deploymentName,
        input: texts,
      });

      const embeddings = response.data.map((item) => item.embedding);

      console.log(`[Azure OpenAI] ✅ Generated ${embeddings.length} embeddings successfully`);

      return embeddings;
    } catch (error: any) {
      // Handle rate limit errors
      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        const errorMessage = `Azure OpenAI rate limit exceeded: ${error.message}`;
        console.error(`[Azure OpenAI] ⚠️  ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Handle other errors
      const errorMessage = `Failed to generate embeddings: ${error.message || 'Unknown error'}`;
      console.error(`[Azure OpenAI] ❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
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
