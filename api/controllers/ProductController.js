const express = require("express");
const app = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const exceljs = require("exceljs");
const fs = require("fs");

dotenv.config();

app.use(fileUpload());

app.post("/create", async (req, res) => {
  try {
    const { name, detail, cost, price, deposit, img, status, categoryId, images } =
      req.body;

    await prisma.product.create({
      data: {
        name,
        detail,
        cost: parseInt(cost),
        price: parseInt(price),
        deposit: parseInt(deposit), // Add deposit field
        img,
        status,
        categoryId: categoryId ? parseInt(categoryId) : null,
        images: {
          create: images?.map((url) => ({ url })),
        },
      },
    });

    res.send({ message: "success" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
app.get("/list", async (req, res) => {
  try {
    const { categoryId, search, sort } = req.query;

    const filters = {};//ดึงไปแสดงทุกสถานะ

    if (categoryId) {
      filters.categoryId = parseInt(categoryId);
    }

    if (search) {
      filters.name = { contains: search, mode: "insensitive" };
    }

    let orderBy = { id: "desc" }; // เรียงสินค้าล่าสุดเป็นค่าเริ่มต้น

    if (sort === "price_low_to_high") {
      orderBy = { price: "asc" }; // ราคาต่ำไปสูง
    } else if (sort === "price_high_to_low") {
      orderBy = { price: "desc" }; // ราคาสูงไปต่ำ
    }

    const data = await prisma.product.findMany({
      where: filters,
      orderBy,
      include: {
        images: true, // รวมข้อมูลรูปภาพ
      },
    });

    res.send({ results: data });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
app.get("/detail/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id: parseInt(id),
      },
      include: {
        images: true, // รวมข้อมูลรูปภาพ
      },
    });

    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }

    res.send(product);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
app.put("/update", async (req, res) => {
  try {
    const { id, name, detail, cost, price, deposit, img, status, categoryId, images } =
      req.body;

    const oldProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { images: true },
    });

    if (!oldProduct) {
      return res.status(404).send({ error: "Product not found" });
    }

    if (images && images.length > 0) {
      oldProduct.images.forEach((image) => {
        const filePath = `./uploads/${image.url}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        detail,
        cost: parseInt(cost),
        price: parseInt(price),
        deposit: parseInt(deposit), // Add deposit field
        img,
        status,
        categoryId: categoryId ? parseInt(categoryId) : null,
        images:
          images && images.length > 0
            ? {
                deleteMany: {},
                create: images.map((url) => ({ url })),
              }
            : undefined,
      },
    });

    res.send({ message: "success" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
app.delete("/remove/:id", async (req, res) => {
  try {
    await prisma.product.update({
      data: {
        status: "delete",
      },
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.send({ message: "success" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
app.post("/upload", async (req, res) => {
  try {
    if (req.files != undefined) {
      if (req.files.img != undefined) {
        const img = req.files.img;
        const fs = require("fs");
        const myDate = new Date();
        const y = myDate.getFullYear();
        const m = myDate.getMonth() + 1;
        const d = myDate.getDate();
        const h = myDate.getHours();
        const mi = myDate.getMinutes();
        const s = myDate.getSeconds();
        const ms = myDate.getMilliseconds();

        const arrFileName = img.name.split(".");
        const ext = arrFileName[arrFileName.length - 1];

        const newName = `${y}${m}${d}${h}${mi}${s}${ms}.${ext}`;

        img.mv("./uploads/" + newName, (err) => {
          if (err) throw err;

          res.send({ newName: newName });
        });
      }
    } else {
      res.status(501).send("notimplemented");
    }
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
app.post("/uploadFromExcel", (req, res) => {
  try {
    const fileExcel = req.files?.fileExcel;

    if (!fileExcel) {
      return res.status(400).send({ message: "ไม่พบไฟล์ที่อัปโหลด" });
    }

    fileExcel.mv("./uploads/" + fileExcel.name, async (err) => {
      if (err) {
        return res.status(500).send({ message: "ไม่สามารถบันทึกไฟล์ได้" });
      }

      try {
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.readFile("./uploads/" + fileExcel.name);

        const ws = workbook.getWorksheet(1);
        if (!ws) {
          return res.status(400).send({ message: "ไฟล์ Excel ไม่ถูกต้อง" });
        }

        // เก็บข้อมูลทั้งหมดที่จะบันทึกไว้ในอาร์เรย์
        const productsToCreate = [];
        const errors = [];
        
        // ตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อน
        for (let i = 2; i <= ws.rowCount; i++) {
          // ตรวจสอบว่าแถวนั้นมีข้อมูลหรือไม่
          const row = ws.getRow(i);
          const allEmpty = row.values.slice(1).every(val => !val);
          if (allEmpty) continue; // ข้ามแถวที่ว่าง

          // อ่านค่าและแปลงเป็น string ก่อน trim
          const name = String(row.getCell(1).value || "").trim();
          const detail = String(row.getCell(2).value || "").trim();
          
          // แปลงค่าตัวเลขและตรวจสอบความถูกต้อง
          const cost = Number(row.getCell(3).value);
          const price = Number(row.getCell(4).value);
          const deposit = Number(row.getCell(5).value);
          const categoryId = row.getCell(6).value ? Number(row.getCell(6).value) : null;

          console.log(`Row ${i}:`, { name, detail, cost, price, deposit, categoryId });

          // ตรวจสอบความถูกต้องของข้อมูล
          if (!name) {
            errors.push(`แถวที่ ${i}: กรุณากรอกชื่อสินค้า`);
            continue;
          }
          if (isNaN(cost) || cost < 0) {
            errors.push(`แถวที่ ${i}: ราคาทุนไม่ถูกต้อง`);
            continue;
          }
          if (isNaN(price) || price < 0) {
            errors.push(`แถวที่ ${i}: ราคาเช่าไม่ถูกต้อง`);
            continue;
          }
          if (isNaN(deposit) || deposit < 0) {
            errors.push(`แถวที่ ${i}: ค่ามัดจำไม่ถูกต้อง`);
            continue;
          }

          productsToCreate.push({
            name,
            detail,
            cost,
            price,
            deposit,
            categoryId,
            status: "use"
          });
        }

        // ถ้ามีข้อผิดพลาด ให้ส่งกลับทั้งหมด
        if (errors.length > 0) {
          throw new Error(errors.join('\n'));
        }

        // ถ้าไม่มีข้อมูลที่จะบันทึก
        if (productsToCreate.length === 0) {
          throw new Error('ไม่พบข้อมูลที่จะนำเข้า');
        }

        // ใช้ transaction เพื่อให้แน่ใจว่าข้อมูลจะถูกบันทึกทั้งหมดหรือไม่ถูกบันทึกเลย
        await prisma.$transaction(async (prisma) => {
          for (const product of productsToCreate) {
            await prisma.product.create({
              data: product
            });
          }
        });

        // ลบไฟล์ Excel หลังจากบันทึกข้อมูลเสร็จ
        fs.unlinkSync("./uploads/" + fileExcel.name);

        res.send({ 
          message: "อัปโหลดและประมวลผลไฟล์สำเร็จ",
          totalRecords: productsToCreate.length
        });

      } catch (err) {
        // ลบไฟล์ Excel ในกรณีที่เกิดข้อผิดพลาด
        if (fs.existsSync("./uploads/" + fileExcel.name)) {
          fs.unlinkSync("./uploads/" + fileExcel.name);
        }
        
        res.status(400).send({ 
          message: err.message || "เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel"
        });
      }
    });
  } catch (e) {
    res.status(500).send({ 
      message: e.message || "เกิดข้อผิดพลาดที่ไม่คาดคิดในเซิร์ฟเวอร์" 
    });
  }
});
app.get("/search/suggestions", async (req, res) => {
  try {
    const { query } = req.query; // รับคำค้นหาจาก query string

    if (!query) {
      return res.send([]);
    }

    const suggestions = await prisma.product.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive", // ค้นหาแบบไม่สนตัวพิมพ์เล็กใหญ่
        },
        status: "use",
      },
      select: {
        id: true,
        name: true,
      },
      take: 5, // จำกัดจำนวนผลลัพธ์
    });

    res.send(suggestions);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
app.get("/dashboard/total-products", async (req, res) => {
  try {
    const totalProducts = await prisma.product.count({
      where: {
        status: "use", // นับเฉพาะสินค้าที่สถานะยังใช้งานอยู่
      },
    });

    res.send({ totalProducts });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
app.get("/dashboard/Includes-rental-products", async (req, res) => {
  try {
    const totalProducts = await prisma.product.count({
      where: {
        status: "reserved", // นับเฉพาะสินค้าที่สถานะยังใช้งานอยู่
      },
    });

    res.send({ totalProducts });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
module.exports = app;
