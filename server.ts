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

// --- Initialize Database ---
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

// --- Seed Products ---
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get().count;
if (productCount === 0) {
  const initialProducts = [
    { title: "Fixed Income Fund", description: "Stable returns with low risk.", min_investment: 1000, expected_return: 8.5, duration_months: 12, image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800" },
    { title: "Equity Growth Fund", description: "High growth potential investing in top stocks.", min_investment: 5000, expected_return: 15, duration_months: 36, image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800" },
    { title: "Real Estate REIT", description: "Diversified portfolio of commercial and residential properties.", min_investment: 10000, expected_return: 12, duration_months: 24, image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800" },
  ];
  const insertProduct = db.prepare("INSERT INTO products (title, description, min_investment, expected_return, duration_months, image_url) VALUES (?, ?, ?, ?, ?, ?)");
  initialProducts.forEach(p => insertProduct.run(p.title, p.description, p.min_investment, p.expected_return, p.duration_months, p.image_url));
}

// --- Seed Team ---
const teamCount = db.prepare("SELECT COUNT(*) as count FROM team").get().count;
if (teamCount === 0) {
  const initialTeam = [
    { name: "Dr. Samuel Adeyemi", role: "CEO", image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400", category: "management" },
    { name: "Sarah Johnson", role: "COO", image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400", category: "management" },
    { name: "Michael Chen", role: "CFO", image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400", category: "management" },
    { name: "Elena Rodriguez", role: "Head of Investments", image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400", category: "management" },
    { name: "David Smith", role: "Senior Portfolio Manager", image_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400", category: "staff" },
    { name: "Jessica Lee", role: "Investment Analyst", image_url: "https://images.unsplash.com/photo-1567532939847-8a5556c1fe3c?q=80&w=400", category: "staff" },
  ];
  const insertTeam = db.prepare("INSERT INTO team (name, role, image_url, category) VALUES (?, ?, ?, ?)");
  initialTeam.forEach(m => insertTeam.run(m.name, m.role, m.image_url, m.category));
}

// --- Express Server ---
async function startServer() {
  const app = express();
  app.use(express.json());

  // Uploads folder (only used for local uploads)
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  app.use("/uploads", express.static(uploadsDir));

  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
  });
  const upload = multer({ storage });

  // --- Routes ---

  // Register user
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: "Missing fields" });
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)").run(name, email, phone, hashedPassword);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (err: any) {
      let errorMsg = err.message.includes("UNIQUE constraint failed: users.email") ? "Email already exists" : "Registration failed";
      res.status(400).json({ success: false, error: errorMsg });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, error: "Invalid credentials" });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    const admin = db.prepare("SELECT * FROM admin WHERE email = ?").get(email);
    if (!admin || !(await bcrypt.compare(password, admin.password))) return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    res.json({ success: true, admin: { id: admin.id, email: admin.email } });
  });

  // Get products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    res.json({ success: true, products });
  });

  // Get team
  app.get("/api/team", (req, res) => {
    const team = db.prepare("SELECT * FROM team ORDER BY category DESC, name ASC").all();
    res.json({ success: true, team });
  });

  // --- Serve React frontend ---
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