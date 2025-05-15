// ดึง router และ prisma มาจากโค้ดเดิม
const app = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// Middleware ตรวจสอบการเข้าสู่ระบบ
function checkSignIn(req, res, next) {
  try {
    const secret = process.env.TOKEN_SECRET;
    const token = req.headers["authorization"];
    const result = jwt.verify(token, secret);

    if (result) {
      req.user = result; // เก็บข้อมูลผู้ใช้ใน req.user
      next();
    }
  } catch (e) {
    res.status(401).send({ error: "Unauthorized" });
  }
}

// ดึงข้อมูล userId จากโทเค็น
function getUserId(req) {
  const secret = process.env.TOKEN_SECRET;
  const token = req.headers["authorization"];
  const result = jwt.verify(token, secret);
  return result?.id;
}

// API: Sign In
app.post("/signin", async (req, res) => {
  try {
    const { email, pass } = req.body;

    // ตรวจสอบ email และ password ในฐานข้อมูล
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer || customer.pass !== pass) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.TOKEN_SECRET,
      { expiresIn: "4h" } // กำหนดให้โทเค็นหมดอายุ
    );

    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: ข้อมูลส่วนตัว (Protected Route)
app.get("/info", checkSignIn, async (req, res) => {
  try {
    const userId = getUserId(req);

    const customer = await prisma.customer.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        bankName: true,
        bankAccountName: true,
        bankAccountNo: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(customer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: ออกจากระบบ
app.post("/logout", (req, res) => {
  try {
    // ลบโทเค็นที่ฝั่งไคลเอนต์
    res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: สร้าง Customer ใหม่
app.post("/customers", async (req, res) => {
  try {
    const { name, email, pass, phone, address, bankName, bankAccountName, bankAccountNo } = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้ไปแล้ว" });
    }

    const customer = await prisma.customer.create({
      data: { 
        name, 
        email, 
        pass, 
        phone, 
        address,
        bankName,
        bankAccountName,
        bankAccountNo 
      },
    });

    res.status(201).json(customer);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


// API: ดึงข้อมูล Customer ทั้งหมด
app.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        status: "active", // เพิ่มเงื่อนไขสถานะเป็น active
      },
    });
    res.json(customers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: ดึงข้อมูล Customer ตาม id
app.delete("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // อัปเดต status ของลูกค้าให้เป็น inactive แทนการลบ
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { status: "inactive" },
    });

    res
      .status(200)
      .json({ message: "Customer status set to inactive", customer });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: อัปเดตข้อมูล Customer
app.put("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, pass, phone, address, status, bankName, bankAccountName, bankAccountNo } = req.body;

    const updateData = {
      name,
      email,
      phone,
      address,
      status,
      bankName,
      bankAccountName,
      bankAccountNo
    };

    if (pass) {
      updateData.pass = pass;
    }

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(customer);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// API: ลบ Customer
app.delete("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: ดัชนีการแสดงจำนวนลูกค้าทั้งหมด
app.get("/dashboard/customers/count", async (req, res) => {
  try {
    const customerCount = await prisma.customer.count(); // ใช้ Prisma เพื่อหาจำนวนลูกค้าทั้งหมด
    res.json({ count: customerCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
