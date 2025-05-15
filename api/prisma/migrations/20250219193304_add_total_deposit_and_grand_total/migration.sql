-- AlterTable
ALTER TABLE "BillSale" ADD COLUMN     "grandTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDeposit" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "BillSaleDetail" ADD COLUMN     "deposit" INTEGER NOT NULL DEFAULT 0;
