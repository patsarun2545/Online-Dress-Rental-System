const express = require("express");
const app = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");

app.use(fileUpload());
app.use(express.json());

app.post("/save", async (req, res) => {
  try {
    const {
      customerId,
      payDate,
      payTime,
      carts,
      transferInfo,
      totalDeposit,
      shippingFee,
      deliveryMethod,
    } = req.body;

    // จำนวนวันเช่า
    const rentalDays = transferInfo.rentalDays || 1;

    // สร้างใบเสร็จใหม่
    const rowBillSale = await prisma.billSale.create({
      data: {
        customerId,
        Date: new Date(payDate),
        Time: payTime,
        status: "wait",
        transferDate: transferInfo?.transferDate
          ? new Date(transferInfo.transferDate)
          : null,
        transferTime: transferInfo?.transferTime || null,
        transferAccountName: transferInfo?.transferAccountName || null,
        transferBankName: transferInfo?.transferBankName || null,
        returnDate: transferInfo?.returnDate
          ? new Date(transferInfo.returnDate)
          : null,
        totalDeposit: totalDeposit, // Add total deposit to bill
        deliveryMethod: deliveryMethod || "pickup", // Save delivery method
        shippingFee: shippingFee || 0, // Save shipping fee
      },
    });

    let totalPrice = 0;

    // เพิ่มรายการสินค้าในใบเสร็จและคำนวณราคารวม
    for (const cartItem of carts) {
      const rowProduct = await prisma.product.findFirst({
        where: { id: cartItem.id },
      });

      if (rowProduct.status !== "use") {
        return res.status(400).send({
          error: `Product with ID ${cartItem.id} is not available for rent.`,
        });
      }

      const discount = cartItem.discount || 0;
      const itemTotalPrice = Math.ceil(
        rowProduct.price *
          (cartItem.quantity || 1) *
          rentalDays *
          (1 - discount)
      );

      await prisma.billSaleDetail.create({
        data: {
          billSaleId: rowBillSale.id,
          productId: rowProduct.id,
          cost: rowProduct.cost,
          price: itemTotalPrice,
          deposit: rowProduct.deposit, // Add deposit to bill detail
        },
      });

      await prisma.product.update({
        where: { id: rowProduct.id },
        data: { status: "reserved" },
      });

      totalPrice += itemTotalPrice;
    }

    // อัปเดตราคารวมใน BillSale
    await prisma.billSale.update({
      where: { id: rowBillSale.id },
      data: {
        totalPrice,
        grandTotal: totalPrice + totalDeposit + (shippingFee || 0), // Include shipping fee in grand total
      },
    });

    res.send({ message: "success", billId: rowBillSale.id });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.post("/uploadPaymentImg/:billSaleId", async (req, res) => {
  try {
    const billSaleId = parseInt(req.params.billSaleId);

    // Check if the file is provided
    if (!req.files || !req.files.paymentImg) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    const paymentImg = req.files.paymentImg;

    // Check file type and size (optional, for security)
    if (!paymentImg.mimetype.startsWith("image/")) {
      return res.status(400).send({ error: "Only image files are allowed" });
    }

    // Define the upload path for the new file
    const uploadPath = `payments/${Date.now()}_${paymentImg.name}`;

    // Fetch the existing billSale record
    const billSale = await prisma.billSale.findUnique({
      where: { id: billSaleId },
    });

    if (!billSale) {
      return res.status(404).send({ error: "Bill sale not found" });
    }

    // Check if there is an existing image and delete it
    if (billSale.Paymentimg) {
      const oldFilePath = path.resolve(billSale.Paymentimg);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save the new file to the server
    await paymentImg.mv(uploadPath);

    // Update the Paymentimg field in the database
    await prisma.billSale.update({
      where: { id: billSaleId },
      data: { Paymentimg: uploadPath },
    });

    res.send({ message: "Payment image uploaded successfully", uploadPath });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.post("/uploadShippingImg/:billSaleId", async (req, res) => {
  try {
    const billSaleId = parseInt(req.params.billSaleId);

    // Check if the file is provided
    if (!req.files || !req.files.shippingImg) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    const shippingImg = req.files.shippingImg;

    // Check file type and size (optional, for security)
    if (!shippingImg.mimetype.startsWith("image/")) {
      return res.status(400).send({ error: "Only image files are allowed" });
    }

    // Define the upload path for the new file
    const uploadPath = `shipping/${Date.now()}_${shippingImg.name}`;

    // Fetch the existing billSale record
    const billSale = await prisma.billSale.findUnique({
      where: { id: billSaleId },
    });

    if (!billSale) {
      return res.status(404).send({ error: "Bill sale not found" });
    }

    // Check if there is an existing image and delete it
    if (billSale.shippingimg) {
      const oldFilePath = path.resolve(billSale.shippingimg);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save the new file to the server
    await shippingImg.mv(uploadPath);

    // Update the shippingimg field in the database
    await prisma.billSale.update({
      where: { id: billSaleId },
      data: { shippingimg: uploadPath },
    });

    res.send({ message: "Shipping image uploaded successfully", uploadPath });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.post("/uploadReturnImg/:billSaleId", async (req, res) => {
  try {
    const billSaleId = parseInt(req.params.billSaleId);

    // Check if the file is provided
    if (!req.files || !req.files.returnImg) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    const returnImg = req.files.returnImg;

    // Check file type and size (optional, for security)
    if (!returnImg.mimetype.startsWith("image/")) {
      return res.status(400).send({ error: "Only image files are allowed" });
    }

    // Define the upload path for the new file
    const uploadPath = `returns/${Date.now()}_${returnImg.name}`;

    // Fetch the existing billSale record
    const billSale = await prisma.billSale.findUnique({
      where: { id: billSaleId },
    });

    if (!billSale) {
      return res.status(404).send({ error: "Bill sale not found" });
    }

    // Check if there is an existing image and delete it
    if (billSale.Returnimg) {
      const oldFilePath = path.resolve(billSale.Returnimg);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save the new file to the server
    await returnImg.mv(uploadPath);

    // Update the Returnimg field in the database
    await prisma.billSale.update({
      where: { id: billSaleId },
      data: { Returnimg: uploadPath },
    });

    res.send({ message: "Return image uploaded successfully", uploadPath });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/list", async (req, res) => {
  try {
    const { customerId } = req.query;

    const whereClause = customerId ? { customerId: parseInt(customerId) } : {};

    const results = await prisma.billSale.findMany({
      where: whereClause,
      include: { Customer: true },
      orderBy: { id: "desc" },
    });

    res.send({ results });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/billInfo/:billSaleId", async (req, res) => {
  try {
    const results = await prisma.billSaleDetail.findMany({
      include: {
        Product: {
          include: {
            images: true, // เพิ่มการดึงข้อมูลรูปภาพของสินค้า
          },
        },
        BillSale: {
          include: {
            Customer: true, // ดึงข้อมูลลูกค้าตามที่ต้องการ
          },
        },
      },
      where: { billSaleId: parseInt(req.params.billSaleId) },
      orderBy: { id: "desc" },
    });

    // ส่งข้อมูลในรูปแบบที่จัดการง่าย
    res.send({ results });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.patch("/updateStatus/:billSaleId", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["wait", "pay", "send", "cancel"].includes(status)) {
      return res.status(400).send({ error: "Invalid status" });
    }

    await prisma.billSale.update({
      where: { id: parseInt(req.params.billSaleId) },
      data: { status },
    });

    res.send({ message: "success" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.patch("/updateReturnStatus/:billSaleId", async (req, res) => {
  try {
    const { returnStatus } = req.body;

    if (
      ![
        "pending",
        "Waitingtocheck",
        "approved",
        "rejected",
        "overdue",
        "pendingConfirmation",
      ].includes(returnStatus)
    ) {
      return res.status(400).send({ error: "Invalid returnStatus" });
    }

    // อัปเดตสถานะ returnStatus ของ BillSale
    await prisma.billSale.update({
      where: { id: parseInt(req.params.billSaleId) },
      data: { returnStatus },
    });

    // หาก returnStatus เป็น approved
    if (returnStatus === "approved") {
      // ดึงสินค้าที่เกี่ยวข้องกับ BillSale นี้
      const billDetails = await prisma.billSaleDetail.findMany({
        where: { billSaleId: parseInt(req.params.billSaleId) },
        select: { productId: true },
      });

      // อัปเดตสถานะของสินค้าจาก reserved เป็น use
      const productIds = billDetails.map((detail) => detail.productId);
      await prisma.product.updateMany({
        where: { id: { in: productIds }, status: "reserved" },
        data: { status: "use" },
      });
    }

    res.send({ message: "success" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    const arr = [];
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    for (let i = 1; i <= 12; i++) {
      // Define the start and end dates for the month
      const startDate = new Date(year, i - 1, 1);
      const endDate = new Date(year, i, 0); // Last day of the month

      // Query all bill sales within the month where status is "pay" or "send"
      const billSales = await prisma.billSale.findMany({
        where: {
          Date: {
            gte: startDate,
            lte: endDate,
          },
          status: { in: ["pay", "send"] },
        },
        include: {
          BillSaleDetail: true, // Include related bill sale details
        },
      });

      // Calculate the total price for the month
      let totalPrice = 0;
      billSales.forEach((bill) => {
        bill.BillSaleDetail.forEach((detail) => {
          totalPrice += detail.price;
        });
      });

      arr.push({ month: i, totalPrice });
    }

    res.send({ results: arr });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/orderCountDashboard", async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    // Query all bill sales within the year where status is "pay" or "send"
    const totalOrderCount = await prisma.billSale.count({
      where: {
        Date: {
          gte: new Date(year, 0, 1), // Start of the year
          lte: new Date(year, 11, 31), // End of the year
        },
      },
    });

    res.send({ year, totalOrderCount });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/orderpayDashboard", async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    // Query all bill sales within the year where status is "pay" or "send"
    const totalOrdersPay = await prisma.billSale.count({
      where: {
        Date: {
          gte: new Date(year, 0, 1), // Start of the year
          lte: new Date(year, 11, 31), // End of the year
        },
        status: { in: ["pay", "send"] },
      },
    });

    res.send({ year, totalOrdersPay });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/ordersendDashboard", async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    // Query all bill sales within the year where status is "pay" or "send"
    const totalOrdersSend = await prisma.billSale.count({
      where: {
        Date: {
          gte: new Date(year, 0, 1), // Start of the year
          lte: new Date(year, 11, 31), // End of the year
        },
        status: { in: ["send"] },
      },
    });

    res.send({ year, totalOrdersSend });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/orderreturnDashboard", async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    // Query all bill sales within the year where status is "pay" or "send"
    const totalOrdersReturn = await prisma.billSale.count({
      where: {
        Date: {
          gte: new Date(year, 0, 1), // Start of the year
          lte: new Date(year, 11, 31), // End of the year
        },
        returnStatus: { in: ["approved"] },
      },
    });

    res.send({ year, totalOrdersReturn });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/todayTotal", async (req, res) => {
  try {
    const currentDate = new Date();

    // Start and end of the current day
    const startDate = new Date(currentDate.setHours(0, 0, 0, 0)); // Midnight of today
    const endDate = new Date(currentDate.setHours(23, 59, 59, 999)); // End of today

    // Query to sum the totalPrice for today
    const totalDayPrice = await prisma.billSale.aggregate({
      _sum: {
        grandTotal: true,
      },
      where: {
        Date: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ["pay", "send"] }, // Only include paid or sent orders
      },
    });

    res.send({
      date: startDate.toISOString().split("T")[0], // Send date in YYYY-MM-DD format
      totalPrice: totalDayPrice._sum.grandTotal || 0, // Default to 0 if no data
    });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/currentMonthTotal", async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Start and end of the current month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of the month

    // Query to sum the totalPrice for the current month
    const totalMonthPrice = await prisma.billSale.aggregate({
      _sum: {
        grandTotal: true,
      },
      where: {
        Date: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ["pay", "send"] },
      },
    });

    res.send({
      month: month + 1, // Add 1 to month to make it human-readable
      year,
      totalPrice: totalMonthPrice._sum.grandTotal || 0, // Default to 0 if no data
    });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.get("/currentYearTotal", async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    // Start and end of the current year
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31); // December 31st

    // Query to sum the totalPrice for the current year
    const totalYearPrice = await prisma.billSale.aggregate({
      _sum: {
        grandTotal: true,
      },
      where: {
        Date: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ["pay", "send"] }, // Only include paid or sent orders
      },
    });

    res.send({
      year,
      totalPrice: totalYearPrice._sum.grandTotal || 0, // Default to 0 if no data
    });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

module.exports = app;
