/*
  Warnings:

  - You are about to drop the column `embedding` on the `VectorEmbedding` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[source,sourceId]` on the table `VectorEmbedding` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."VectorEmbedding" DROP COLUMN "embedding";

-- CreateIndex
CREATE UNIQUE INDEX "VectorEmbedding_source_sourceId_key" ON "public"."VectorEmbedding"("source", "sourceId");
