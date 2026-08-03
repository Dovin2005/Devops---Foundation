-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeCustomerId" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
