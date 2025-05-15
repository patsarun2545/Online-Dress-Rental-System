/*
  Warnings:

  - You are about to drop the column `hasShipping` on the `RentalDays` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCost` on the `RentalDays` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RentalDays" DROP COLUMN "hasShipping",
DROP COLUMN "shippingCost";
