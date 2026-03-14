import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

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
    currency TEXT DEFAULT '₦',
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

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add currency column if it doesn't exist (for existing databases)
try {
  db.prepare("ALTER TABLE products ADD COLUMN currency TEXT DEFAULT '₦'").run();
} catch (e) {
  // Column already exists or other error
}

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
  console.log("Admin user already exists. Updating password to ensure it is admin123.");
  const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);
  db.prepare("UPDATE admin SET password = ? WHERE email = ?").run(hashedAdminPassword, adminEmail);
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
  { title: "Fixed Income Fund", description: "Stable returns with low risk. Ideal for conservative investors.", min_investment: 1000, expected_return: 8.5, duration_months: 12, image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800", currency: "₦" },
  { title: "Equity Growth Fund", description: "High growth potential by investing in top-performing stocks.", min_investment: 5000, expected_return: 15.0, duration_months: 36, image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800", currency: "₦" },
  { title: "Real Estate REIT", description: "Diversified portfolio of commercial and residential properties.", min_investment: 10000, expected_return: 12.0, duration_months: 24, image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800", currency: "₦" }
];

if (productCount.count === 0) {
  const insertProduct = db.prepare("INSERT INTO products (title, description, min_investment, expected_return, duration_months, image_url, currency) VALUES (?, ?, ?, ?, ?, ?, ?)");
  initialProducts.forEach(p => insertProduct.run(p.title, p.description, p.min_investment, p.expected_return, p.duration_months, p.image_url, p.currency));
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
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)").run(name, email, phone, hashedPassword);
      
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
      console.error("Login error:", error);
      res.status(500).json({ success: false, error: "Login failed" });
    }
  });

  // Auth: Admin Login
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`Admin login attempt for: ${email}`);
    try {
      const admin = db.prepare("SELECT * FROM admin WHERE email = ?").get(email) as any;
      if (admin) {
        console.log("Admin found, comparing passwords...");
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
          console.log("Admin login successful");
          res.json({ success: true, admin: { id: admin.id, email: admin.email } });
        } else {
          console.log("Admin login failed: Invalid password");
          res.status(401).json({ success: false, error: "Invalid admin credentials" });
        }
      } else {
        console.log("Admin login failed: Email not found");
        res.status(401).json({ success: false, error: "Invalid admin credentials" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ success: false, error: "Admin login failed" });
    }
  });

  // Products: Get All
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    res.json(products);
  });

  // Products: Add (Admin)
  app.post("/api/admin/products", (req, res) => {
    const { title, description, min_investment, expected_return, duration_months, image_url, currency } = req.body;
    try {
      const result = db.prepare("INSERT INTO products (title, description, min_investment, expected_return, duration_months, image_url, currency) VALUES (?, ?, ?, ?, ?, ?, ?)").run(title, description, min_investment, expected_return, duration_months, image_url, currency || "₦");
      res.json({ success: true, productId: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Products: Update (Admin)
  app.put("/api/admin/products/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, min_investment, expected_return, duration_months, image_url, currency } = req.body;
    try {
      db.prepare(`
        UPDATE products 
        SET title = ?, description = ?, min_investment = ?, expected_return = ?, duration_months = ?, image_url = ?, currency = ?
        WHERE id = ?
      `).run(title, description, min_investment, expected_return, duration_months, image_url, currency, id);
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

  // Contact: Submit Form
  app.post("/api/contact", async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    
    try {
      // 1. Save to database
      db.prepare("INSERT INTO contacts (first_name, last_name, email, message) VALUES (?, ?, ?, ?)").run(firstName, lastName, email, message);

      // 2. Send Email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"${firstName} ${lastName}" <${process.env.SMTP_USER || email}>`,
        to: process.env.CONTACT_RECEIVER_EMAIL || "info@trustlinecapitallimited.com",
        replyTo: email,
        subject: `New Contact Message from ${firstName} ${lastName}`,
        text: `
          Name: ${firstName} ${lastName}
          Email: ${email}
          
          Message:
          ${message}
        `,
        html: `
          <h3>New Contact Message</h3>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      };

      // Only attempt to send if SMTP is configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Message sent successfully via email" });
      } else {
        console.warn("SMTP not configured. Message saved to database only.");
        res.json({ success: true, message: "Message saved to database (SMTP not configured)" });
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      res.status(500).json({ success: false, error: "Failed to process message" });
    }
  });

  // Contact: Get All (Admin)
  app.get("/api/admin/contacts", (req, res) => {
    const contacts = db.prepare("SELECT * FROM contacts ORDER BY created_at DESC").all();
    res.json(contacts);
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

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
