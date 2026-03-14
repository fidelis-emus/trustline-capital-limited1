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

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    min_investment REAL,
    expected_return REAL,
    duration_months INTEGER,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
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

// Seed Admin if not exists
const adminEmail = "admin@trustline.com";
const adminPassword = "admin123";
const adminExists = db.prepare("SELECT * FROM admin WHERE email = ?").get(adminEmail) as any;

if (!adminExists) {
  console.log("Seeding admin user...");
  const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
  db.prepare("INSERT INTO admin (email, password) VALUES (?, ?)").run(adminEmail, hashedAdminPassword);
  console.log("Admin user seeded successfully");
} else {
  // Ensure the password is reset to admin123 to resolve login issues
  const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
  db.prepare("UPDATE admin SET password = ? WHERE email = ?").run(hashedAdminPassword, adminEmail);
  console.log("Admin password synchronized");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  app.use("/uploads", express.static(uploadsDir));

  // Multer configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // --- API ROUTES ---

  // Auth: Admin Login
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin = db.prepare("SELECT * FROM admin WHERE email = ?").get(email) as any;
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
          res.json({ success: true, admin: { id: admin.id, email: admin.email } });
        } else {
          res.status(401).json({ success: false, error: "Invalid admin credentials" });
        }
      } else {
        res.status(401).json({ success: false, error: "Invalid admin credentials" });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Admin login failed" });
    }
  });

  // Auth: User Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
        } else {
          res.status(401).json({ success: false, error: "Invalid credentials" });
        }
      } else {
        res.status(401).json({ success: false, error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Login failed" });
    }
  });

  // ... (Other API routes for products, team, settings, etc.)

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();