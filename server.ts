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

// ---------------- DATABASE INITIALIZATION ----------------

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

  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    path TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// ---------------- SEED ADMIN ----------------

const adminExists = db.prepare("SELECT * FROM admin WHERE email = ?").get("admin@trustline.com");
if (!adminExists) {
  console.log("Seeding admin user...");
  // Use sync hasher for seeding
  const hasherSync = (bcrypt as any).hashSync || (bcrypt as any).default?.hashSync;
  const hashedAdminPassword = hasherSync("admin123", 10);
  db.prepare("INSERT INTO admin (email, password) VALUES (?, ?)").run("admin@trustline.com", hashedAdminPassword);
  console.log("Admin user seeded successfully");
}

// ---------------- SEED SETTINGS ----------------

const settingsToSeed = [
  { key: "logo_url", value: "/logo.png" },
  { key: "site_name", value: "TRUSTLINE" },
  { key: "site_subtext", value: "Capital Limited" }
];

settingsToSeed.forEach(setting => {
  const exists = db.prepare("SELECT * FROM settings WHERE key = ?").get(setting.key);
  if (!exists) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(setting.key, setting.value);
  }
});

// ---------------- SEED PRODUCTS ----------------

const initialProducts = [
  { 
    title: "Fixed Income Fund", 
    description: "Stable returns with low risk. Ideal for conservative investors.", 
    min_investment: 1000, 
    expected_return: 8.5, 
    duration_months: 12, 
    image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800" 
  },
  { 
    title: "Equity Growth Fund", 
    description: "High growth potential by investing in top-performing stocks.", 
    min_investment: 5000, 
    expected_return: 15.0, 
    duration_months: 36, 
    image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800" 
  },
  { 
    title: "Real Estate REIT", 
    description: "Diversified portfolio of commercial and residential properties.", 
    min_investment: 10000, 
    expected_return: 12.0, 
    duration_months: 24, 
    image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800" 
  }
];

const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare("INSERT INTO products (title, description, min_investment, expected_return, duration_months, image_url) VALUES (?, ?, ?, ?, ?, ?)");
  initialProducts.forEach(p => insertProduct.run(p.title, p.description, p.min_investment, p.expected_return, p.duration_months, p.image_url));
}

// ---------------- SERVER SETUP ----------------

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  app.use("/uploads", express.static(uploadsDir));

  // Multer configuration for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // --- API ROUTES ---

  // Auth: User Register
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password } = req.body;
    console.log("Registration attempt for:", email);
    try {
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }
      
      // Robust hashing logic
      let finalHashedPassword;
      const hasher = (bcrypt as any).hash || (bcrypt as any).default?.hash;
      if (typeof hasher !== "function") {
        throw new Error("Bcrypt hashing function not found");
      }
      finalHashedPassword = await hasher(password, 10);

      const result = db.prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)")
        .run(name, email, phone, finalHashedPassword);
      
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed";
      if (error.message && error.message.includes("UNIQUE constraint failed: users.email")) {
        errorMessage = "Email already exists";
      }
      res.status(400).json({ success: false, error: errorMessage });
    }
  });

  // Auth: User Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (user) {
        const comparer = (bcrypt as any).compare || (bcrypt as any).default?.compare;
        if (await comparer(password, user.password)) {
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

  // Auth: Admin Login
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin = db.prepare("SELECT * FROM admin WHERE email = ?").get(email) as any;
      if (admin) {
        const comparer = (bcrypt as any).compare || (bcrypt as any).default?.compare;
        if (await comparer(password, admin.password)) {
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

  // Products: Get All
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    res.json(products);
  });

  // Team: Get All
  app.get("/api/team", (req, res) => {
    const team = db.prepare("SELECT * FROM team ORDER BY category DESC, name ASC").all();
    res.json(team);
  });

  // Settings: Get All
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsMap = (settings as any[]).reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  // Image Upload (Admin)
  app.post("/api/admin/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    res.json({ success: true, imageUrl: `/uploads/${req.file.filename}` });
  });

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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();