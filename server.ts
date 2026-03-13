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


// ---------------- DATABASE ----------------

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

const adminExists = db.prepare(
  "SELECT * FROM admin WHERE email = ?"
).get("admin@trustline.com");

if (!adminExists) {
  db.prepare(
    "INSERT INTO admin (email, password) VALUES (?, ?)"
  ).run("admin@trustline.com", "admin123");
}


// ---------------- SEED SETTINGS ----------------

const settingsToSeed = [
  { key: "logo_url", value: "/logo.png" },
  { key: "site_name", value: "TRUSTLINE" },
  { key: "site_subtext", value: "Capital Limited" }
];

settingsToSeed.forEach(setting => {
  const exists = db.prepare(
    "SELECT * FROM settings WHERE key = ?"
  ).get(setting.key);

  if (!exists) {
    db.prepare(
      "INSERT INTO settings (key,value) VALUES (?,?)"
    ).run(setting.key, setting.value);
  }
});


// ---------------- SEED PRODUCTS ----------------

const initialProducts = [
{
title:"Fixed Income Fund",
description:"Stable returns with low risk. Ideal for conservative investors.",
min_investment:1000,
expected_return:8.5,
duration_months:12,
image_url:"https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800"
},
{
title:"Equity Growth Fund",
description:"High growth potential by investing in top-performing stocks.",
min_investment:5000,
expected_return:15.0,
duration_months:36,
image_url:"https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800"
},
{
title:"Real Estate REIT",
description:"Diversified portfolio of commercial and residential properties.",
min_investment:10000,
expected_return:12.0,
duration_months:24,
image_url:"https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800"
}
];

const productCount = db.prepare(
"SELECT COUNT(*) as count FROM products"
).get() as {count:number};

if(productCount.count===0){
const insert = db.prepare(`
INSERT INTO products
(title,description,min_investment,expected_return,duration_months,image_url)
VALUES (?,?,?,?,?,?)
`);

initialProducts.forEach(p=>{
insert.run(
p.title,
p.description,
p.min_investment,
p.expected_return,
p.duration_months,
p.image_url
);
});
}


// ---------------- SEED TEAM ----------------

const initialTeam = [
{
name:"Dr. Samuel Adeyemi",
role:"CEO",
image_url:"https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
category:"management"
},
{
name:"Sarah Johnson",
role:"COO",
image_url:"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
category:"management"
},
{
name:"Michael Chen",
role:"CFO",
image_url:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400",
category:"management"
}
];

const teamCount = db.prepare(
"SELECT COUNT(*) as count FROM team"
).get() as {count:number};

if(teamCount.count===0){
const insertTeam = db.prepare(`
INSERT INTO team (name,role,image_url,category)
VALUES (?,?,?,?)
`);

initialTeam.forEach(m=>{
insertTeam.run(m.name,m.role,m.image_url,m.category);
});
}


// ---------------- SERVER ----------------

async function startServer(){

const app = express();

app.use(express.json());


// ---------------- UPLOADS ----------------

const uploadsDir = path.join(__dirname,"uploads");

if(!fs.existsSync(uploadsDir)){
fs.mkdirSync(uploadsDir);
}

app.use("/uploads",express.static(uploadsDir));


const storage = multer.diskStorage({
destination:(req,file,cb)=>{
cb(null,uploadsDir);
},
filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+Math.round(Math.random()*1e9)+path.extname(file.originalname));
}
});

const upload = multer({storage});


// ---------------- API ROUTES ----------------


// PRODUCTS

app.get("/api/products",(req,res)=>{

const products = db.prepare(
"SELECT * FROM products ORDER BY created_at DESC"
).all();

res.json(products);

});


// TEAM

app.get("/api/team",(req,res)=>{

const team = db.prepare(
"SELECT * FROM team ORDER BY created_at DESC"
).all();

res.json(team);

});


// ADMIN LOGIN

app.post("/api/admin/login",(req,res)=>{

const {email,password} = req.body;

const admin = db.prepare(
"SELECT * FROM admin WHERE email=? AND password=?"
).get(email,password);

if(!admin){

return res.status(401).json({
success:false,
message:"Invalid email or password"
});

}

res.json({
success:true,
admin:{
id:admin.id,
email:admin.email
}
});

});


// IMAGE UPLOAD

app.post("/api/admin/upload",upload.single("image"),(req,res)=>{

if(!req.file){

return res.status(400).json({
success:false,
error:"No file uploaded"
});

}

res.json({
success:true,
imageUrl:`/uploads/${req.file.filename}`
});

});


// ---------------- REACT / VITE ----------------

if(process.env.NODE_ENV!=="production"){

const vite = await createViteServer({
server:{middlewareMode:true},
appType:"spa"
});

app.use(vite.middlewares);

}else{

const distPath = path.join(process.cwd(),"dist");

app.use(express.static(distPath));

app.get("*",(req,res)=>{

res.sendFile(path.join(distPath,"index.html"));

});

}


// ---------------- START SERVER ----------------

const PORT = process.env.PORT || 3000;

app.listen(PORT,"0.0.0.0",()=>{

console.log(`Server running on port ${PORT}`);

});

}

startServer();