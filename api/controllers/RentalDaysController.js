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

app.get("/rental-days", async (req, res) => {
  try {
    const rentalDays = await prisma.rentalDays.findMany({
      where: { status: "active" },
      orderBy: { days: "asc" },
    });
    res.json({ results: rentalDays });
  } catch (error) {
    console.error("Error fetching rental days:", error);
    res.status(500).json({ error: "Failed to fetch rental days" });
  }
});

app.post("/rental-days/save", async (req, res) => {
  try {
    const { id, days, discount, shippingFee, description, status } = req.body;

    if (!days || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (id) {
      // Update existing rental day
      await prisma.rentalDays.update({
        where: { id },
        data: { days, discount, shippingFee, description, status },
      });
    } else {
      // Create new rental day
      await prisma.rentalDays.create({
        data: { days, discount, shippingFee, description, status },
      });
    }

    res.json({ message: "Rental day saved successfully" });
  } catch (error) {
    console.error("Error saving rental day:", error);
    res.status(500).json({ error: "Failed to save rental day" });
  }
});

module.exports = app;
