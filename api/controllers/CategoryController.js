const express = require("express");
const app = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const exceljs = require("exceljs");

dotenv.config();

app.use(fileUpload());

// Middleware for JWT Authentication (Optional)
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).send({ error: "Access Denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send({ error: "Invalid Token" });
    req.user = user;
    next();
  });
};

// GET All Categories
app.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.send(categories);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch categories" });
  }
});

// GET Category by ID
app.get("/categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        Products: true, // ดึงข้อมูลความสัมพันธ์ Products มาด้วย
      },
    });

    if (!category) {
      return res.status(404).send({ error: "Category not found" });
    }

    res.send(category);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch category" });
  }
});

// POST Create New Category
app.post("/categories", async (req, res) => {
  const { name } = req.body;

  try {
    const newCategory = await prisma.category.create({
      data: {
        name, // Prisma จะสร้างค่า id อัตโนมัติ
      },
    });
    res.status(201).send(newCategory);
  } catch (error) {
    if (error.code === "P2002") {
      res.status(400).send({ error: "Category name must be unique" });
    } else {
      console.error(error);
      res.status(500).send({ error: "Failed to create category" });
    }
  }
});

// PUT Update Category
app.put("/categories/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const { status } = req.body;

  try {
    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        status,
      },
    });
    res.send(updatedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to update category" });
  }
});

// DELETE Category
app.delete("/categories/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.category.update({
      where: { id: parseInt(id) },
      data: { status: "inactive" }, // เปลี่ยนสถานะเป็น "deleted"
    });
    res.send({ message: "success" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Endpoint สำหรับอัปโหลดไฟล์ Excel และเพิ่มข้อมูล Category
app.post("/categories/uploadFromExcel", (req, res) => {
  try {
    const fileExcel = req.files?.fileExcel;

    if (!fileExcel) {
      return res.status(400).send({ error: "กรุณาอัปโหลดไฟล์" });
    }

    const filePath = "./uploads/" + fileExcel.name;

    fileExcel.mv(filePath, async (err) => {
      if (err) {
        return res.status(500).send({ error: "ไม่สามารถบันทึกไฟล์ได้" });
      }

      try {
        // อ่านข้อมูลจากไฟล์ Excel
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1); // ใช้ sheet แรก

        for (let i = 2; i <= worksheet.rowCount; i++) {
          const name = worksheet.getRow(i).getCell(1).value ?? "";

          if (name !== "") {
            // ตรวจสอบว่าชื่อ Category ซ้ำหรือไม่
            const existingCategory = await prisma.category.findFirst({
              where: { name },
            });

            if (!existingCategory) {
              await prisma.category.create({ data: { name } });
            }
          }
        }

        // ลบไฟล์ Excel หลังการประมวลผล
        const fs = require("fs");
        fs.unlinkSync(filePath);

        res.send({ message: "เพิ่มหมวดหมู่สำเร็จ" });
      } catch (error) {
        res.status(500).send({
          error: "เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel",
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: "เกิดข้อผิดพลาดที่ไม่คาดคิด: " + error.message,
    });
  }
});

module.exports = app;
