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
db.exec(`...`); // Same as your table creation code

// Seed admin with hashed password
const adminExists = db.prepare("SELECT * FROM admin WHERE email = ?").get("admin@trustline.com");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO admin (email, password) VALUES (?, ?)").run("admin@trustline.com", hashedPassword);
}

// Seed initial products, team, settings (same as your current code)
// ...

async function startServer() {
  const app = express();
  app.use(express.json());

  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  app.use("/uploads", express.static(uploadsDir));

  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
  });
  const upload = multer({ storage });

  // --- API Routes ---
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

  // All your other endpoints (products, team, settings, uploads) remain the same
  // ...

  // Vite middleware
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