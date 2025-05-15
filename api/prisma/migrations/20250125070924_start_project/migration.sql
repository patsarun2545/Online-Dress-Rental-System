-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "pass" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'use',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pass" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT,
    "cost" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'use',
    "categoryId" INTEGER,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillSale" (
    "id" SERIAL NOT NULL,
    "Date" TIMESTAMP(3) NOT NULL,
    "Time" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'wait',
    "customerId" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL DEFAULT 0,
    "transferDate" TIMESTAMP(3),
    "transferTime" TEXT,
    "transferAccountName" TEXT,
    "transferBankName" TEXT,
    "returnStatus" TEXT NOT NULL DEFAULT 'pending',
    "returnDate" TIMESTAMP(3),
    "Paymentimg" TEXT,
    "Returnimg" TEXT,
    "shippingimg" TEXT,

    CONSTRAINT "BillSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillSaleDetail" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "billSaleId" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "BillSaleDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalDays" (
    "id" SERIAL NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "RentalDays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'use',

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_key" ON "User"("user");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillSale" ADD CONSTRAINT "BillSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillSaleDetail" ADD CONSTRAINT "BillSaleDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillSaleDetail" ADD CONSTRAINT "BillSaleDetail_billSaleId_fkey" FOREIGN KEY ("billSaleId") REFERENCES "BillSale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
