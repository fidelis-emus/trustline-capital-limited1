import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";
import multer from "multer";

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

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM admin WHERE email = ?").get("admin@trustline.com");
if (!adminExists) {
  db.prepare("INSERT INTO admin (email, password) VALUES (?, ?)").run("admin@trustline.com", "admin123");
}

// Seed initial settings
const logoSetting = db.prepare("SELECT * FROM settings WHERE key = ?").get("logo_url");
if (!logoSetting) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("logo_url", "/logo.png");
}
const siteNameSetting = db.prepare("SELECT * FROM settings WHERE key = ?").get("site_name");
if (!siteNameSetting) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("site_name", "TRUSTLINE");
}
const siteSubtextSetting = db.prepare("SELECT * FROM settings WHERE key = ?").get("site_subtext");
if (!siteSubtextSetting) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("site_subtext", "Capital Limited");
}

// Seed some initial products if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
const initialProducts = [
  { title: "Fixed Income Fund", description: "Stable returns with low risk. Ideal for conservative investors.", min_investment: 1000, expected_return: 8.5, duration_months: 12, image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800" },
  { title: "Equity Growth Fund", description: "High growth potential by investing in top-performing stocks.", min_investment: 5000, expected_return: 15.0, duration_months: 36, image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800" },
  { title: "Real Estate REIT", description: "Diversified portfolio of commercial and residential properties.", min_investment: 10000, expected_return: 12.0, duration_months: 24, image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800" }
];

if (productCount.count === 0) {
  const insertProduct = db.prepare("INSERT INTO products (title, description, min_investment, expected_return, duration_months, image_url) VALUES (?, ?, ?, ?, ?, ?)");
  initialProducts.forEach(p => insertProduct.run(p.title, p.description, p.min_investment, p.expected_return, p.duration_months, p.image_url));
} else {
  // Update existing products with better images if they are using the old ones
  const updateProduct = db.prepare("UPDATE products SET image_url = ? WHERE title = ?");
  initialProducts.forEach(p => updateProduct.run(p.image_url, p.title));
}

// Seed initial team members if empty
const teamCount = db.prepare("SELECT COUNT(*) as count FROM team").get() as { count: number };
if (teamCount.count === 0) {
  const initialTeam = [
    { name: "Dr. Samuel Adeyemi", role: "Chief Executive Officer", image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400", category: "management" },
    { name: "Sarah Johnson", role: "Chief Operating Officer", image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400", category: "management" },
    { name: "Michael Chen", role: "Chief Financial Officer", image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400", category: "management" },
    { name: "Elena Rodriguez", role: "Head of Investments", image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400", category: "management" },
    { name: "David Smith", role: "Senior Portfolio Manager", image_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400", category: "staff" },
    { name: "Jessica Lee", role: "Investment Analyst", image_url: "https://images.unsplash.com/photo-1567532939847-8a5556c1fe3c?q=80&w=400", category: "staff" },
    { name: "Robert Taylor", role: "Client Relations Manager", image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400", category: "staff" },
    { name: "Amara Okafor", role: "Compliance Officer", image_url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400", category: "staff" },
  ];
  const insertTeam = db.prepare("INSERT INTO team (name, role, image_url, category) VALUES (?, ?, ?, ?)");
  initialTeam.forEach(m => insertTeam.run(m.name, m.role, m.image_url, m.category));
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
  app.post("/api/auth/register", (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)").run(name, email, phone, password);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Auth: User Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } else {
      res.status(401).json({ success: false, error: "Invalid credentials" });
    }
  });

  // Auth: Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    const admin = db.prepare("SELECT * FROM admin WHERE email = ? AND password = ?").get(email, password) as any;
    if (admin) {
      res.json({ success: true, admin: { id: admin.id, email: admin.email } });
    } else {
      res.status(401).json({ success: false, error: "Invalid admin credentials" });
    }
  });

  // Products: Get All
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    res.json(products);
  });

  // Products: Add (Admin)
  app.post("/api/admin/products", (req, res) => {
    const { title, description, min_investment, expected_return, duration_months, image_url } = req.body;
    try {
      const result = db.prepare("INSERT INTO products (title, description, min_investment, expected_return, duration_months, image_url) VALUES (?, ?, ?, ?, ?, ?)").run(title, description, min_investment, expected_return, duration_months, image_url);
      res.json({ success: true, productId: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Products: Update (Admin)
  app.put("/api/admin/products/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, min_investment, expected_return, duration_months, image_url } = req.body;
    try {
      db.prepare(`
        UPDATE products 
        SET title = ?, description = ?, min_investment = ?, expected_return = ?, duration_months = ?, image_url = ?
        WHERE id = ?
      `).run(title, description, min_investment, expected_return, duration_months, image_url, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Products: Delete (Admin)
  app.delete("/api/admin/products/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Team: Get All
  app.get("/api/team", (req, res) => {
    const team = db.prepare("SELECT * FROM team ORDER BY category DESC, name ASC").all();
    res.json(team);
  });

  // Team: Add (Admin)
  app.post("/api/admin/team", (req, res) => {
    const { name, role, image_url, category } = req.body;
    try {
      const result = db.prepare("INSERT INTO team (name, role, image_url, category) VALUES (?, ?, ?, ?)").run(name, role, image_url, category);
      res.json({ success: true, memberId: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Team: Update (Admin)
  app.put("/api/admin/team/:id", (req, res) => {
    const { id } = req.params;
    const { name, role, image_url, category } = req.body;
    try {
      db.prepare(`
        UPDATE team 
        SET name = ?, role = ?, image_url = ?, category = ?
        WHERE id = ?
      `).run(name, role, image_url, category, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Team: Delete (Admin)
  app.delete("/api/admin/team/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM team WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Users: Get All (Admin)
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC").all();
    res.json(users);
  });

  // Upload: Generic Image Upload
  app.post("/api/admin/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
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

  // Settings: Update (Admin)
  app.post("/api/admin/settings", (req, res) => {
    const settings = req.body; // Expecting { key: value, ... }
    try {
      const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
      const transaction = db.transaction((data) => {
        for (const [key, value] of Object.entries(data)) {
          upsert.run(key, value);
        }
      });
      transaction(settings);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
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
