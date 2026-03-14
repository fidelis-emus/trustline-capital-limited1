import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database("trustline.db");

// Initialize database (tables + initial data)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    image TEXT
  );
  
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT
  );
`);

// Seed admin with hashed password
const adminExists = db.prepare("SELECT * FROM admin WHERE email = ?").get("admin@trustline.com");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO admin (email, password) VALUES (?, ?)").run("admin@trustline.com", hashedPassword);
}

async function startServer() {

  const app = express();
  app.use(express.json());

  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

  app.use("/uploads", express.static(uploadsDir));

  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) =>
      cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
  });

  const upload = multer({ storage });

  // ---------------- AUTH ----------------

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = db
        .prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)")
        .run(name, email, phone, hashedPassword);

      res.json({ success: true, userId: result.lastInsertRowid });

    } catch (err: any) {

      let errorMsg = err.message.includes("UNIQUE constraint failed: users.email")
        ? "Email already exists"
        : "Registration failed";

      res.status(400).json({ success: false, error: errorMsg });
    }
  });

  app.post("/api/auth/login", async (req, res) => {

    const { email, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    });
  });

  app.post("/api/admin/login", async (req, res) => {

    const { email, password } = req.body;

    const admin = db.prepare("SELECT * FROM admin WHERE email = ?").get(email);

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    }

    res.json({
      success: true,
      admin: { id: admin.id, email: admin.email }
    });
  });

  // ---------------- PRODUCTS ----------------

  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json({ success: true, products });
  });

  app.get("/api/products/:id", (req, res) => {

    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, product });
  });

  app.post("/api/products", upload.single("image"), (req, res) => {

    const { name, description, price } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    try {

      const result = db
        .prepare("INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)")
        .run(name, description, price, image);

      res.json({ success: true, productId: result.lastInsertRowid });

    } catch {

      res.status(400).json({ success: false, error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", upload.single("image"), (req, res) => {

    const { name, description, price } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {

      if (image) {

        db.prepare(
          "UPDATE products SET name = ?, description = ?, price = ?, image = ? WHERE id = ?"
        ).run(name, description, price, image, req.params.id);

      } else {

        db.prepare(
          "UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?"
        ).run(name, description, price, req.params.id);
      }

      res.json({ success: true });

    } catch {

      res.status(400).json({ success: false, error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", (req, res) => {

    try {

      db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);

      res.json({ success: true });

    } catch {

      res.status(400).json({ success: false, error: "Failed to delete product" });
    }
  });

  // ---------------- TEAM ----------------

  app.get("/api/team", (req, res) => {

    const team = db.prepare("SELECT * FROM team").all();

    res.json({ success: true, team });
  });

  app.post("/api/team", upload.single("image"), (req, res) => {

    const { name, role } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    try {

      const result = db
        .prepare("INSERT INTO team (name, role, image) VALUES (?, ?, ?)")
        .run(name, role, image);

      res.json({ success: true, teamId: result.lastInsertRowid });

    } catch {

      res.status(400).json({ success: false, error: "Failed to add team member" });
    }
  });

  app.delete("/api/team/:id", (req, res) => {

    try {

      db.prepare("DELETE FROM team WHERE id = ?").run(req.params.id);

      res.json({ success: true });

    } catch {

      res.status(400).json({ success: false, error: "Failed to delete team member" });
    }
  });

  // ---------------- SETTINGS ----------------

  app.get("/api/settings", (req, res) => {

    const settings = db.prepare("SELECT * FROM settings").all();

    res.json({ success: true, settings });
  });

  app.post("/api/settings", (req, res) => {

    const { key, value } = req.body;

    try {

      db.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
      ).run(key, value);

      res.json({ success: true });

    } catch {

      res.status(400).json({ success: false, error: "Failed to update settings" });
    }
  });

  // ---------------- VITE ----------------

  if (process.env.NODE_ENV !== "production") {

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });

    app.use(vite.middlewares);

  } else {

    const distPath = path.join(__dirname, "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ---------------- SERVER ----------------

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();