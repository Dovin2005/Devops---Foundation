-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpCodeHash" VARCHAR(128),
ADD COLUMN     "otpExpiresAt" TIMESTAMPTZ,
ADD COLUMN     "otpLastSentAt" TIMESTAMPTZ,
ADD COLUMN     "otpPurpose" VARCHAR(20),
ADD COLUMN     "otpSentVia" VARCHAR(10);

-- CreateTable
CREATE TABLE "integration_credentials" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "valueEncrypted" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_credentials_provider_key_key" ON "integration_credentials"("provider", "key");

