/**
 * IEmbeddingService Interface (Port)
 *
 * Abstraction for text embedding generation.
 * Implementation is in the infrastructure layer (e.g., Azure OpenAI).
 */
export interface IEmbeddingService {
  /**
   * Generate embeddings for an array of texts
   * @param texts - Array of strings to generate embeddings for
   * @returns Array of embedding vectors
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}
