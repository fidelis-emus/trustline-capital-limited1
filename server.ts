import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database
const db = new Database("trustline.db");

// --- Initialize Database Tables ---
db.exec(`
CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  min_investment REAL,
  expected_return REAL,
  duration_months INTEGER,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS team (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,
  image_url TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

// --- Seed Admin ---
const adminExists = db.prepare("SELECT * FROM admin WHERE email = ?").get("admin@trustline.com");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO admin (email, password) VALUES (?, ?)").run("admin@trustline.com", hashedPassword);
}

// --- Express Server ---
async function startServer() {
  const app = express();
  app.use(express.json());

  // Upload folder
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  app.use("/uploads", express.static(uploadsDir));

  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) =>
      cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
  });
  const upload = multer({ storage });

  // --- API ROUTES (Users/Admin/Products/Team) ---
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: "Missing fields" });
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)").run(
        name, email, phone, hashedPassword
      );
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (err: any) {
      let errorMsg = err.message.includes("UNIQUE constraint failed: users.email") ? "Email already exists" : "Registration failed";
      res.status(400).json({ success: false, error: errorMsg });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, error: "Invalid credentials" });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  });

  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    const admin = db.prepare("SELECT * FROM admin WHERE email = ?").get(email);
    if (!admin || !(await bcrypt.compare(password, admin.password))) return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    res.json({ success: true, admin: { id: admin.id, email: admin.email } });
  });

  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    res.json({ success: true, products });
  });

  app.get("/api/team", (req, res) => {
    const team = db.prepare("SELECT * FROM team ORDER BY category DESC, name ASC").all();
    res.json({ success: true, team });
  });

  // --- Serve React Frontend ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();