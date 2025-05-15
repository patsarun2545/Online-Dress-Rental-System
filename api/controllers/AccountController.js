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

// Create Account
app.post("/account/create", async (req, res) => {
  try {
    await prisma.account.create({
      data: req.body,
    });

    res.send({ message: "success" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// List Accounts
app.get("/account/list", async (req, res) => {
  try {
    const { search, sort } = req.query;

    const filters = {
      status: "use",
    };

    if (search) {
      filters.accountName = { contains: search, mode: "insensitive" };
    }

    let orderBy = { id: "desc" }; // Default sorting by newest

    if (sort === "name_asc") {
      orderBy = { accountName: "asc" };
    } else if (sort === "name_desc") {
      orderBy = { accountName: "desc" };
    }

    const data = await prisma.account.findMany({
      where: filters,
      orderBy,
    });

    res.send({ results: data });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Account Details
app.get("/account/detail/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        id: parseInt(id),
        status: "use",
      },
    });

    if (!account) {
      return res.status(404).send({ error: "Account not found" });
    }

    res.send(account);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Remove Account
app.delete("/account/remove/:id", async (req, res) => {
  try {
    await prisma.account.update({
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

// Update Account
app.put("/account/update", async (req, res) => {
  try {
    const fs = require("fs");

    // Fetch old account data
    const oldData = await prisma.account.findFirst({
      where: {
        id: parseInt(req.body.id),
      },
    });

    await prisma.account.update({
      data: req.body,
      where: {
        id: parseInt(req.body.id),
      },
    });

    res.send({ message: "success" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});


module.exports = app;
