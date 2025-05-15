-- AlterTable
ALTER TABLE "BillSale" ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'pickup',
ADD COLUMN     "shippingFee" INTEGER NOT NULL DEFAULT 0;
