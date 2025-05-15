// เรียกใช้งาน Express.js และสร้าง Router สำหรับแยกเส้นทางของ API
const express = require("express");
const app = express.Router();

// เรียกใช้ Prisma Client สำหรับการเชื่อมต่อฐานข้อมูล
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// เรียกใช้ JWT สำหรับการสร้างและตรวจสอบโทเค็น
const jwt = require("jsonwebtoken");

// เรียกใช้ dotenv สำหรับโหลดค่าตัวแปรจากไฟล์ .env
const dotenv = require("dotenv");
dotenv.config();

// Middleware สำหรับตรวจสอบการเข้าสู่ระบบ (Authorization)
// ตรวจสอบว่าโทเค็นที่ส่งมาถูกต้องหรือไม่
function checkSingIn(req, res, next) {
  try {
    const secret = process.env.TOKEN_SECRET;
    const token = req.headers["authorization"];

    if (!token) {
      return res
        .status(401)
        .send({ message: "Unauthorized: Token not provided" });
    }

    const result = jwt.verify(token, secret);
    if (result) {
      next();
    }
  } catch (e) {
    res
      .status(401)
      .send({ message: "Unauthorized: Invalid Token", error: e.message });
  }
}

// ฟังก์ชันสำหรับดึง userId จากโทเค็น
function getUserId(req, res) {
  try {
    const secret = process.env.TOKEN_SECRET; // อ่าน SECRET จาก .env
    const token = req.headers["authorization"]; // ดึงโทเค็นจาก Headers
    const result = jwt.verify(token, secret); // ตรวจสอบความถูกต้องของโทเค็น

    if (result != undefined) {
      return result.id; // คืนค่า userId จากโทเค็น
    }
  } catch (e) {
    res.status(500).send({ error: e.message }); // ส่งข้อผิดพลาดกลับไป
  }
}

// เส้นทาง POST /signIn สำหรับเข้าสู่ระบบ
app.post("/signIn", async (req, res) => {
  try {
    // ตรวจสอบว่าผู้ใช้กรอกข้อมูลครบหรือไม่
    if (req.body.user == undefined || req.body.pass == undefined) {
      return res.status(401).send("unauthorized"); // หากไม่ครบ ส่งสถานะ unauthorized
    }

    // ค้นหาผู้ใช้จากฐานข้อมูลโดยใช้ Prisma
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
      },
      where: {
        user: req.body.user, // เงื่อนไข: ชื่อผู้ใช้ตรงกับที่กรอกมา
        pass: req.body.pass, // รหัสผ่านตรงกับที่กรอกมา
        status: { in: ["use", "owner"] }, // และสถานะต้องเป็น 'use'
      },
    });

    // หากพบผู้ใช้
    if (user != null) {
      const secret = process.env.TOKEN_SECRET; // อ่าน SECRET จาก .env
      // สร้างโทเค็นด้วยข้อมูลผู้ใช้ และกำหนดให้หมดอายุใน 30 วัน
      const token = jwt.sign(user, secret, { expiresIn: "8h" });

      return res.send({ token: token }); // ส่งโทเค็นกลับไป
    }

    // หากไม่พบผู้ใช้หรือข้อมูลไม่ตรง ส่งสถานะ unauthorized
    res.status(401).send({ message: "unauthorized" });
  } catch (e) {
    // ส่งข้อผิดพลาดกลับไป
    res.status(500).send({ error: e.message });
  }
});

// เส้นทาง GET /info สำหรับดึงข้อมูลผู้ใช้ (ต้องเข้าสู่ระบบก่อน)
app.get("/info", checkSingIn, async (req, res, next) => {
  try {
    const userId = getUserId(req, res);
    const user = await prisma.user.findFirst({
      select: {
        name: true,
        status: true, // เพิ่ม status เข้าไปใน select
      },
      where: {
        id: userId,
      },
    });

    res.send({ result: user });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// API: สร้าง User ใหม่
app.post("/users", async (req, res) => {
  try {
    const { name, user, pass } = req.body;
    const newUser = await prisma.user.create({
      data: { name, user, pass },
    });
    res.status(201).json(newUser);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// API: ดึงข้อมูล User ทั้งหมดที่มีสถานะเป็น "use"
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany(); // ดึงข้อมูลทั้งหมด ไม่กรอง status
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// API: อัปเดตข้อมูล User
app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, user, pass, status } = req.body;

    const updateData = { name, user, status };
    if (pass) {
      updateData.pass = pass;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(updatedUser);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// API: เปลี่ยนสถานะ User เป็น "inactive" แทนการลบจริง
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: "delete" },
    });

    res.status(200).json({ message: "User status set to inactive", updatedUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: ลบ User ออกจากฐานข้อมูลจริง (ถ้าจำเป็น)
app.delete("/users/hard-delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ส่งโมดูลนี้ออกไปเพื่อให้ไฟล์อื่นใช้งานได้
module.exports = app;
