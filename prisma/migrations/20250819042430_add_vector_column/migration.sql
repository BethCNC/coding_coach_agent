-- Add embedding column to VectorEmbedding table (without pgvector for local testing)
ALTER TABLE "public"."VectorEmbedding" ADD COLUMN "embedding" TEXT;

-- Create index for basic text search (we'll add vector index later)
CREATE INDEX "VectorEmbedding_embedding_text_idx" ON "public"."VectorEmbedding" USING gin(to_tsvector('english', chunk));
