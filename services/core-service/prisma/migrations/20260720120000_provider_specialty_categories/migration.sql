-- DropIndex
DROP INDEX IF EXISTS "providers_specialty_idx";

-- AlterTable
ALTER TABLE "providers" DROP COLUMN "specialty",
ADD COLUMN     "specialtyIds" UUID[] DEFAULT ARRAY[]::UUID[],
ADD COLUMN     "specialtyNames" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "providers_specialtyIds_idx" ON "providers" USING GIN ("specialtyIds");
